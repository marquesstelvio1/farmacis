import express from "express";
import { db } from "../db";
import { products, pharmacies, orders } from "@shared/schema";
import { and, eq, or, ilike, sql, desc, inArray } from "drizzle-orm";

// Interface para medicação vinda do OCR
interface Medication {
  nome: string;
  dosagem: string;
  marca?: string;
  quantidade?: string;
  periodo_consumo?: string;
  frequencia?: string;
  preco_caixa?: string;
  preco_caixa_tipo?: 'individual' | 'por';
  preco_lamina?: string;
  preco_lamina_tipo?: 'individual' | 'por';
  quantidade_comprimidos?: string;
  quantidade_laminas?: string;
}

// Interface para resultado de busca
interface PharmacyProductResult {
  pharmacyId: number;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyPhone: string;
  pharmacyLat: number;
  pharmacyLng: number;
  pharmacyLogo?: string;
  rating: number;
  ratingCount: number;
  paymentMethods: string[];
  productId: number;
  productName: string;
  dosage: string;
  price: number;
  stock: number;
  quantity: number; // quantidade necessária da receita
  totalPrice: number; // preço * quantidade
  distance?: number;
  precoPortugues?: number;
  precoIndiano?: number;
  precoLamina?: number;
  precoLaminaPortugues?: number;
  precoLaminaIndiano?: number;
  comprimidosPorLamina?: number;
}

// Interface para agrupamento por farmácia
interface PharmacyGroup {
  pharmacyId: number;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyPhone: string;
  pharmacyLat: number;
  pharmacyLng: number;
  pharmacyLogo?: string;
  rating: number;
  ratingCount: number;
  paymentMethods: string[];
  distance?: number;
  products: PharmacyProductResult[];
  totalPrice: number;
  hasAllProducts: boolean;
  missingProducts: string[];
}

// Parse quantity from string (e.g., "30 comprimidos" -> 30)
function parseQuantity(quantidadeStr?: string): number {
  if (!quantidadeStr) return 1;
  const match = quantidadeStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toNumberOrUndefined(value: unknown): number | undefined {
  const parsed = toNumber(value, NaN);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
}

// Search for products in pharmacies
async function searchProductsInPharmacies(
  medications: Medication[],
  userLat?: number,
  userLng?: number,
  filters?: {
    sortBy?: 'price' | 'distance' | 'rating';
    maxDistance?: number;
    paymentMethod?: string;
  }
): Promise<PharmacyGroup[]> {
  const results: PharmacyProductResult[] = [];

  // Search for each medication
  for (const med of medications) {
    const searchTerms = [`%${med.nome}%`];
    if (med.dosagem) {
      searchTerms.push(`%${med.dosagem}%`);
    }

    const quantityNeeded = parseQuantity(med.quantidade);

    // Build search query - busca por nome, dosagem e marca
    const nameConditions: any[] = [ilike(products.name, `%${med.nome || ""}%`)];
    if (med.marca && med.marca.trim() !== "") {
      nameConditions.push(ilike(products.brand, `%${med.marca}%`));
    }

    // Ensure we don't pass an empty array or undefined to or()
    const brandNameFilter = nameConditions.length > 1 
      ? or(...nameConditions) 
      : nameConditions[0];

    const dosageFilter = or(
      ilike(products.dosage, `%${med.dosagem || ""}%`),
      sql`COALESCE(${products.dosage}, '') = ''`
    );

    const searchConditions = [
      brandNameFilter,
      dosageFilter
    ];

    const productResults = await db
      .select({
        productId: products.id,
        productName: products.name,
        dosage: products.dosage,
        price: products.price,
        stock: products.stock,
        pharmacyId: products.pharmacyId,
        pharmacyName: pharmacies.name,
        pharmacyAddress: pharmacies.address,
        pharmacyPhone: pharmacies.phone,
        pharmacyLat: pharmacies.lat,
        pharmacyLng: pharmacies.lng,
        pharmacyLogo: pharmacies.logoUrl,
        pharmacyIban: pharmacies.iban,
        pharmacyMulticaixa: pharmacies.multicaixaExpress,
        precoPortugues: products.precoPortugues,
        precoIndiano: products.precoIndiano,
        origin: products.origin,
        precoLamina: products.precoLamina,
        precoLaminaPortugues: products.precoLaminaPortugues,
        precoLaminaIndiano: products.precoLaminaIndiano,
        comprimidosPorLamina: products.comprimidosPorLamina,
      })
      .from(products)
      .innerJoin(pharmacies, eq(products.pharmacyId, pharmacies.id))
      .where(and(
        ...searchConditions
      ));

    // Get ratings for each pharmacy
    for (const prod of productResults) {
      const ratingResult = await db
        .select({
          averageRating: sql<number>`COALESCE(AVG(${orders.reviewRating}), 0)`,
          ratingCount: sql<number>`COUNT(${orders.reviewRating})`,
        })
        .from(orders)
        .where(and(
          eq(orders.pharmacyId, prod.pharmacyId),
          eq(orders.status, 'delivered'),
          sql`${orders.reviewRating} IS NOT NULL`
        ));

      const rating = Number(ratingResult[0]?.averageRating || 0);
      const ratingCount = Number(ratingResult[0]?.ratingCount || 0);

      const pharmacyLat = toNumberOrUndefined(prod.pharmacyLat);
      const pharmacyLng = toNumberOrUndefined(prod.pharmacyLng);

      // Calculate distance if user location provided
      let distance: number | undefined;
      if (
        userLat != null &&
        userLng != null &&
        pharmacyLat != null &&
        pharmacyLng != null
      ) {
        distance = calculateDistance(userLat, userLng, pharmacyLat, pharmacyLng);
      }

      // Build payment methods list
      const paymentMethods: string[] = [];
      if (prod.pharmacyIban) paymentMethods.push('transferencia');
      if (prod.pharmacyMulticaixa) paymentMethods.push('multicaixa_express');
      paymentMethods.push('cash'); // Always available

      const rawPrice = toNumber(prod.price, 0);
      const precoPortugues = toNumberOrUndefined(prod.precoPortugues);
      const precoIndiano = toNumberOrUndefined(prod.precoIndiano);
      const precoLamina = toNumberOrUndefined(prod.precoLamina);
      const precoLaminaPortugues = toNumberOrUndefined(prod.precoLaminaPortugues);
      const precoLaminaIndiano = toNumberOrUndefined(prod.precoLaminaIndiano);
      const comprimidosPorLamina = toNumber(prod.comprimidosPorLamina, 1);

      let productPrice = rawPrice;
      if (prod.origin === 'portugues' && precoPortugues != null) {
        productPrice = precoPortugues;
      } else if (prod.origin === 'indiano' && precoIndiano != null) {
        productPrice = precoIndiano;
      }

      results.push({
        pharmacyId: prod.pharmacyId!,
        pharmacyName: prod.pharmacyName!,
        pharmacyAddress: prod.pharmacyAddress!,
        pharmacyPhone: prod.pharmacyPhone!,
        pharmacyLat: pharmacyLat ?? 0,
        pharmacyLng: pharmacyLng ?? 0,
        pharmacyLogo: prod.pharmacyLogo || undefined,
        rating,
        ratingCount,
        paymentMethods,
        productId: prod.productId,
        productName: prod.productName,
        dosage: prod.dosage || med.dosagem,
        price: productPrice,
        stock: prod.stock || 0,
        quantity: quantityNeeded,
        totalPrice: productPrice * quantityNeeded,
        distance,
        precoPortugues,
        precoIndiano,
        precoLamina,
        precoLaminaPortugues,
        precoLaminaIndiano,
        comprimidosPorLamina,
      });
    }
  }

  // Group by pharmacy
  const pharmacyMap = new Map<number, PharmacyGroup>();

  for (const result of results) {
    if (!pharmacyMap.has(result.pharmacyId)) {
      pharmacyMap.set(result.pharmacyId, {
        pharmacyId: result.pharmacyId,
        pharmacyName: result.pharmacyName,
        pharmacyAddress: result.pharmacyAddress,
        pharmacyPhone: result.pharmacyPhone,
        pharmacyLat: result.pharmacyLat,
        pharmacyLng: result.pharmacyLng,
        pharmacyLogo: result.pharmacyLogo,
        rating: result.rating,
        ratingCount: result.ratingCount,
        paymentMethods: result.paymentMethods,
        distance: result.distance,
        products: [],
        totalPrice: 0,
        hasAllProducts: false,
        missingProducts: [],
      });
    }

    const group = pharmacyMap.get(result.pharmacyId)!;
    group.products.push(result);
  }

  // Check which pharmacies have all products and calculate totals
  const medicationNames = medications.map((m) => `${m.nome} ${m.dosagem}`.toLowerCase());
  const pharmacyGroupsArray = Array.from(pharmacyMap.values());

  for (const group of pharmacyGroupsArray) {
    const foundProductNames = group.products.map((p: PharmacyProductResult) =>
      `${p.productName} ${p.dosage}`.toLowerCase()
    );

    group.missingProducts = medicationNames.filter((medName: string) =>
      !foundProductNames.some((foundName: string) =>
        foundName.includes(medName.split(' ')[0].toLowerCase())
      )
    );

    group.hasAllProducts = group.missingProducts.length === 0;
    group.totalPrice = group.products.reduce((sum: number, p: PharmacyProductResult) => sum + p.totalPrice, 0);
  }

  // Convert to array and apply filters
  let pharmacyGroups = Array.from(pharmacyMap.values());

  // Filter by max distance
  if (filters?.maxDistance != null) {
    pharmacyGroups = pharmacyGroups.filter(p =>
      !p.distance || p.distance <= filters.maxDistance!
    );
  }

  // Filter by payment method
  if (filters?.paymentMethod) {
    pharmacyGroups = pharmacyGroups.filter(p =>
      p.paymentMethods.includes(filters.paymentMethod!)
    );
  }

  // Sort
  const sortBy = filters?.sortBy || 'distance';
  pharmacyGroups.sort((a, b) => {
    if (sortBy === 'price') {
      return a.totalPrice - b.totalPrice;
    } else if (sortBy === 'rating') {
      return b.rating - a.rating;
    } else { // distance
      return (a.distance || Infinity) - (b.distance || Infinity);
    }
  });

  return pharmacyGroups;
}

export function registerPrescriptionSearchRoutes(app: express.Application) {
  // Search for medications in pharmacies
  app.post("/api/prescription/search", async (req, res) => {
    try {
      const {
        medications,
        userLat,
        userLng,
        sortBy = 'distance',
        maxDistance,
        paymentMethod
      } = req.body;

      console.log("[Prescription Search] Request body:", JSON.stringify(req.body, null, 2));

      if (!medications || !Array.isArray(medications)) {
        return res.status(400).json({ error: "Lista de medicamentos necessária" });
      }

      const normalizedMedications = medications
        .filter((med: any) => med && typeof med.nome === "string" && med.nome.trim().length > 0)
        .map((med: any) => ({
          nome: med.nome.trim(),
          dosagem: typeof med.dosagem === "string" ? med.dosagem.trim() : "",
          marca: typeof med.marca === "string" ? med.marca.trim() : undefined,
          quantidade: typeof med.quantidade === "string" ? med.quantidade.trim() : undefined,
          periodo_consumo: typeof med.periodo_consumo === "string" ? med.periodo_consumo.trim() : undefined,
          frequencia: typeof med.frequencia === "string" ? med.frequencia.trim() : undefined,
          preco_caixa: typeof med.preco_caixa === "string" ? med.preco_caixa.trim() : undefined,
          preco_caixa_tipo: med.preco_caixa_tipo === "individual" || med.preco_caixa_tipo === "por" ? med.preco_caixa_tipo : undefined,
          preco_lamina: typeof med.preco_lamina === "string" ? med.preco_lamina.trim() : undefined,
          preco_lamina_tipo: med.preco_lamina_tipo === "individual" || med.preco_lamina_tipo === "por" ? med.preco_lamina_tipo : undefined,
          quantidade_comprimidos: typeof med.quantidade_comprimidos === "string" ? med.quantidade_comprimidos.trim() : undefined,
          quantidade_laminas: typeof med.quantidade_laminas === "string" ? med.quantidade_laminas.trim() : undefined,
        }));

      if (!normalizedMedications.length) {
        return res.status(400).json({ error: "Lista de medicamentos inválida ou vazia" });
      }

      const parsedUserLat = toNumber(userLat, NaN);
      const parsedUserLng = toNumber(userLng, NaN);
      const parsedMaxDistance = maxDistance !== undefined ? toNumber(maxDistance, NaN) : undefined;

      const results = await searchProductsInPharmacies(
        normalizedMedications,
        Number.isFinite(parsedUserLat) ? parsedUserLat : undefined,
        Number.isFinite(parsedUserLng) ? parsedUserLng : undefined,
        {
          sortBy,
          maxDistance: Number.isFinite(parsedMaxDistance ?? NaN) ? parsedMaxDistance : undefined,
          paymentMethod: typeof paymentMethod === "string" ? paymentMethod.trim() : undefined,
        }
      );

      res.json({
        success: true,
        medications,
        pharmacies: results,
        summary: {
          totalPharmacies: results.length,
          pharmaciesWithAllProducts: results.filter(p => p.hasAllProducts).length,
          bestPrice: results.length > 0 ? Math.min(...results.map(p => p.totalPrice || 0)) : null,
          bestRating: results.length > 0 ? Math.max(...results.map(p => p.rating || 0)) : null,
        }
      });
    } catch (error: any) {
      console.error("[Prescription Search] FULL ERROR STACK:", error.stack);
      res.status(500).json({ error: error.message || "Erro na busca" });
    }
  });

  // Get single pharmacy details with products
  app.get("/api/prescription/pharmacy/:pharmacyId", async (req, res) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId);
      const { productIds } = req.query;

      if (!pharmacyId) {
        return res.status(400).json({ error: "ID da farmácia necessário" });
      }

      // Get pharmacy info
      const pharmacyInfo = await db
        .select()
        .from(pharmacies)
        .where(eq(pharmacies.id, pharmacyId))
        .limit(1);

      if (pharmacyInfo.length === 0) {
        return res.status(404).json({ error: "Farmácia não encontrada" });
      }

      // Get products if IDs provided
      let productsList: any[] = [];
      if (productIds) {
        const ids = (productIds as string).split(',').map(Number);
        productsList = await db
          .select()
          .from(products)
          .where(and(
            eq(products.pharmacyId, pharmacyId),
            inArray(products.id, ids)
          ));
      }

      res.json({
        success: true,
        pharmacy: pharmacyInfo[0],
        products: productsList,
      });
    } catch (error: any) {
      console.error("[Prescription Pharmacy] Error:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar farmácia" });
    }
  });

  console.log("[Prescription Search] Routes registered");
}
