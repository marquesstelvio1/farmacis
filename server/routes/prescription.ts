import { Express, Request, Response } from "express";
import { db } from "../db";
import { pharmacies, products } from "@shared/schema";
import { eq, and, sql, or, desc } from "drizzle-orm";

// Helper function to calculate distance between two lat/lng points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function registerPrescriptionRoutes(app: Express) {
  app.post("/api/prescription/search", async (req: Request, res: Response) => {
    try {
      const { medications, userLat, userLng, sortBy, maxDistance, paymentMethod } = req.body;

      if (!Array.isArray(medications) || medications.length === 0) {
        return res.status(400).json({ message: "Medications array is required" });
      }

      // 1. Find all products matching the medication names/dosages/brands
      const productSearchConditions = medications.map((med: any) => {
        const conditions = [
          sql`${products.name} ILIKE ${`%${med.nome}%`}`
        ];
        if (med.dosagem) {
          conditions.push(sql`${products.dosage} ILIKE ${`%${med.dosagem}%`}`);
        }
        if (med.marca) {
          conditions.push(sql`${products.brand} ILIKE ${`%${med.marca}%`}`);
        }
        return and(...conditions);
      });

      const matchingProducts = await db
        .select({
          id: products.id,
          name: products.name,
          dosage: products.dosage,
          brand: products.brand,
          price: products.price,
          precoPortugues: products.precoPortugues,
          precoIndiano: products.precoIndiano,
          stock: products.stock,
          pharmacyId: products.pharmacyId,
          origin: products.origin,
        })
        .from(products)
        .where(productSearchConditions.length > 0 
          ? or(...productSearchConditions) 
          : sql`false`);

      // Group products by pharmacy
      const pharmaciesMap = new Map<number, any>();

      for (const product of matchingProducts) {
        if (!product.pharmacyId) continue;

        if (!pharmaciesMap.has(product.pharmacyId)) {
          const pharmacyInfo = await db.query.pharmacies.findFirst({
            where: eq(pharmacies.id, product.pharmacyId),
            columns: {
              id: true,
              name: true,
              address: true,
              phone: true,
              lat: true,
              lng: true,
              logoUrl: true,
              paymentMethods: true, 
            }
          });

          if (pharmacyInfo) {
            // Filter by payment method if specified
            if (paymentMethod && (!pharmacyInfo.paymentMethods || !pharmacyInfo.paymentMethods.includes(paymentMethod))) {
                continue; // Skip this pharmacy if it doesn't support the payment method
            }

            pharmaciesMap.set(product.pharmacyId, {
              pharmacyId: pharmacyInfo.id,
              pharmacyName: pharmacyInfo.name,
              pharmacyAddress: pharmacyInfo.address,
              pharmacyPhone: pharmacyInfo.phone,
              pharmacyLat: parseFloat(pharmacyInfo.lat),
              pharmacyLng: parseFloat(pharmacyInfo.lng),
              pharmacyLogo: pharmacyInfo.logoUrl,
              paymentMethods: pharmacyInfo.paymentMethods || [],
              products: [],
              totalPrice: 0,
              hasAllProducts: false,
              missingProducts: [],
              distance: userLat && userLng ? calculateDistance(userLat, userLng, parseFloat(pharmacyInfo.lat), parseFloat(pharmacyInfo.lng)) : undefined,
            });
          }
        }

        const pharmacyEntry = pharmaciesMap.get(product.pharmacyId);
        if (pharmacyEntry) {
          let productPrice = parseFloat(product.price || '0');
          if (product.origin === 'portugues' && product.precoPortugues) {
            productPrice = parseFloat(product.precoPortugues);
          } else if (product.origin === 'indiano' && product.precoIndiano) {
            productPrice = parseFloat(product.precoIndiano);
          }

          pharmacyEntry.products.push({
            productId: product.id,
            productName: product.name,
            dosage: product.dosage,
            price: productPrice,
            stock: product.stock,
            quantity: 1, 
            totalPrice: productPrice,
            precoPortugues: product.precoPortugues ? parseFloat(product.precoPortugues) : undefined,
            precoIndiano: product.precoIndiano ? parseFloat(product.precoIndiano) : undefined,
            origin: product.origin,
          });
          pharmacyEntry.totalPrice += productPrice;
        }
      }

      let results = Array.from(pharmaciesMap.values());

      if (maxDistance && userLat && userLng) {
        results = results.filter(p => p.distance !== undefined && p.distance <= maxDistance);
      }

      results.forEach(pharmacy => {
        const foundMedicationNames = new Set(pharmacy.products.map((p: any) => p.productName.toLowerCase()));
        const requiredMedicationNames = new Set(medications.map((m: any) => m.nome.toLowerCase()));

        const missing = Array.from(requiredMedicationNames).filter(
          (medName) => !Array.from(foundMedicationNames).some(foundName => foundName.includes(medName) || medName.includes(foundName))
        );

        pharmacy.missingProducts = missing;
        pharmacy.hasAllProducts = missing.length === 0;
      });

      if (sortBy === 'distance' && userLat && userLng) {
        results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      } else if (sortBy === 'price') {
        results.sort((a, b) => a.totalPrice - b.totalPrice);
      }
      // TODO: Implement rating sorting if you have rating data for pharmacies

      res.json({ pharmacies: results });

    } catch (error) {
      console.error("Prescription search error:", error);
      res.status(500).json({ message: "Failed to search for pharmacies", error: (error as Error).message });
    }
  });
}