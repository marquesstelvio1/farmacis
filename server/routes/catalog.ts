import express, { type Request, Response } from "express";
import { storage } from "../storage";
import { insertProductSchema, updateProductSchema, productCategoryEnum, productStatusEnum } from "@shared/schema";
import { z } from "zod";

export function registerCatalogRoutes(app: express.Application) {
  // Get search suggestions (autocomplete)
  app.get("/api/products/suggestions", async (req: Request, res: Response) => {
    try {
      const query = (req.query.q as string || "").toLowerCase().trim();
      if (query.length < 2) return res.json([]);

      // Buscamos os produtos para extrair termos relevantes
      const products = await storage.getProducts();
      const suggestionSet = new Set<string>();

      for (const p of products) {
        if (p.name.toLowerCase().includes(query)) suggestionSet.add(p.name);
        if (p.activeIngredient && p.activeIngredient.toLowerCase().includes(query)) {
          suggestionSet.add(p.activeIngredient);
        }
        if (Array.isArray(p.diseases)) {
          p.diseases.forEach((d: string) => {
            if (d.toLowerCase().includes(query)) suggestionSet.add(d);
          });
        }
        if (suggestionSet.size > 15) break; // Limite para performance
      }

      res.json(Array.from(suggestionSet).slice(0, 8));
    } catch (error) {
      console.error("Suggestions error:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Get all products (with optional search and pharmacy filter)
  // Groups variants (Portuguese/Indian) under main product cards
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string;
      const pharmacyId = req.query.pharmacyId ? parseInt(String(req.query.pharmacyId)) : undefined;
      const category = req.query.category as string;
      const status = req.query.status as string;
      const origin = req.query.origin as string;

      console.log('🔍 GET /api/products - Query params:', { search, pharmacyId, category, status, origin });

      // Buscamos todos os produtos da farmácia (ou todos) e aplicamos o filtro manualmente
      // para garantir que a busca por doenças funcione corretamente.
      let products = await storage.getProducts(undefined, pharmacyId);
      console.log('🔍 Products fetched from storage:', products.length, 'items');

      // Buscar descontos ativos para anexar aos produtos
      console.log('🔍 Fetching active discounts...');
      const allDiscounts = await (storage as any).getActiveDiscounts?.() || [];
      console.log('🔍 Discounts fetched:', allDiscounts.length);

      const discountMap = new Map();
      allDiscounts.forEach((d: any) => {
        discountMap.set(`${d.productId}-${d.pharmacyId}`, d);
      });

      if (search) {
        // Check if search contains multiple terms separated by comma
        const searchTerms = search.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);

        if (searchTerms.length > 1) {
          // Multi-search: product must match ANY of the terms (name + optional dosage)
          products = products.filter(p => {
            const pName = p.name.toLowerCase();
            const pDosage = (p.dosage || '').toLowerCase();
            const pDesc = (p.description || '').toLowerCase();
            const pIngredient = (p.activeIngredient || '').toLowerCase();

            return searchTerms.some(term => {
              // Check if term includes dosage (e.g., "paracetamol 500mg")
              const termParts = term.split(/\s+(?=\d)/);
              const namePart = termParts[0];
              const dosagePart = termParts[1];

              const nameMatch = pName.includes(namePart) ||
                               pDesc.includes(namePart) ||
                               pIngredient.includes(namePart);

              if (dosagePart && nameMatch) {
                return pDosage.includes(dosagePart) ||
                       pName.includes(term) ||
                       pDesc.includes(term);
              }

              return nameMatch;
            });
          });
        } else {
          // Single search with optional dosage
          const query = search.toLowerCase().trim();
          const queryParts = query.split(/\s+(?=\d)/);
          const nameQuery = queryParts[0];
          const dosageQuery = queryParts[1];

          products = products.filter(p => {
            const pName = p.name.toLowerCase();
            const pDosage = (p.dosage || '').toLowerCase();
            const pDesc = (p.description || '').toLowerCase();
            const pIngredient = (p.activeIngredient || '').toLowerCase();
            const pDiseases = Array.isArray(p.diseases) ? p.diseases : [];

            const nameMatch = pName.includes(nameQuery) ||
                             pDesc.includes(nameQuery) ||
                             pIngredient.includes(nameQuery) ||
                             pDiseases.some((d: string) => d.toLowerCase().includes(nameQuery));

            if (dosageQuery && nameMatch) {
              return pDosage.includes(dosageQuery) ||
                     pName.includes(query) ||
                     pDesc.includes(query);
            }

            return nameMatch;
          });
        }
      }

      if (category) {
        products = products.filter((product) => product.category === category);
      }
      if (status) {
        products = products.filter((product) => product.status === status);
      }
      if (origin && origin !== 'all') {
        products = products.filter((p) => {
          if (origin === 'portugues') {
            return p.origin === 'portugues' || (p.precoPortugues && parseFloat(String(p.precoPortugues)) > 0);
          }
          if (origin === 'indiano') {
            return p.origin === 'indiano' || (p.precoIndiano && parseFloat(String(p.precoIndiano)) > 0);
          }
          if (origin === 'default') {
            return p.origin === 'default' || !p.origin || (p.price && parseFloat(String(p.price)) > 0);
          }
          return p.origin === origin;
        });
      }

      // Group products by name to combine variants (Portuguese/Indian)
      const groupedProducts = new Map();

      products.forEach(product => {
        const key = product.name.toLowerCase().trim();
        const discount = discountMap.get(`${product.id}-${product.pharmacyId}`);

        if (!groupedProducts.has(key)) {
          // Initialize main product entry
          groupedProducts.set(key, {
            ...product,
            activeDiscount: discount ? { percentage: discount.discountPercentage } : null,
            variants: [],
            precoPortugues: product.origin === 'portugues' ? product.price : (product.precoPortugues || null),
            precoIndiano: product.origin === 'indiano' ? product.price : (product.precoIndiano || null),
          });
        }

        const mainProduct = groupedProducts.get(key);

        // If this row is a variant (Portuguese/Indian)
        if (product.origin && product.origin !== 'default') {
          // Avoid adding the main product itself to variants if it happened to be the first row
          if (!mainProduct.variants.some((v: any) => v.id === product.id)) {
            mainProduct.variants.push({
              id: product.id,
              origin: product.origin,
              dosage: product.dosage,
              price: product.price,
              precoBase: product.precoBase,
              stock: product.stock,
              pharmacyId: product.pharmacyId,
              pharmacyName: product.pharmacyName,
              activeDiscount: discount ? { percentage: discount.discountPercentage } : null,
            });
          }

          // Ensure origin prices are set on main object
          if (product.origin === 'portugues') mainProduct.precoPortugues = product.price;
          if (product.origin === 'indiano') mainProduct.precoIndiano = product.price;

        } else if (product.isMainVariant || !product.origin || product.origin === 'default') {
          // This is the main variant, update main product details while preserving arrays
          const variants = mainProduct.variants;
          const pp = mainProduct.precoPortugues;
          const pi = mainProduct.precoIndiano;

          Object.assign(mainProduct, product);

          mainProduct.variants = variants;
          mainProduct.activeDiscount = discount ? { percentage: discount.discountPercentage } : null;
          mainProduct.precoPortugues = pp || product.precoPortugues;
          mainProduct.precoIndiano = pi || product.precoIndiano;
        }
      });

      // Convert map to array
      const result = Array.from(groupedProducts.values());
      console.log('🔍 Products after grouping:', result.length, 'cards with variants');

      res.json(result);
    } catch (error) {
      console.error("DETAILED Get products error:", error);
      res.status(500).json({
        message: "Failed to fetch products",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Get product by ID
  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const product = await storage.getProduct(id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Anexar desconto se existir e estiver ativo
      const discount = await (storage as any).getDiscountByProduct?.(id, product.pharmacyId);
      if (discount && discount.isActive) {
        (product as any).activeDiscount = {
          id: discount.id,
          percentage: discount.discountPercentage
        };
      }

      res.json(product);
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Create new product
  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      const data = { ...req.body };
      const isMed = data.category === 'medicamento';

      // O preço cadastrado é o preço de venda final (sem taxa adicional)
      // A comissão de 10% é calculada apenas na venda, não no cadastro
      if (data.precoBase && !data.price) {
        data.price = data.precoBase;
      }

      if (isMed) {
        // Se não enviou preço base mas enviou um de origem, o primeiro vira o padrão do card
        if (!data.price) data.price = data.precoPortugues || data.precoIndiano;
      }

      const productData = insertProductSchema.parse(data);
      const newProduct = await storage.createProduct(productData);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Create product error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid product data",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Update product
  app.put("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const raw = { ...req.body };

      // Normalize: convert empty strings to null for all numeric price fields
      const toNum = (v: any) => (v === '' || v === null || v === undefined) ? null : String(v);
      raw.price = toNum(raw.price);
      raw.precoBase = toNum(raw.precoBase);
      raw.precoPortugues = toNum(raw.precoPortugues);
      raw.precoIndiano = toNum(raw.precoIndiano);

      // Try to sync price and precoBase if they differ incorrectly
      if (!raw.price) raw.price = raw.precoBase || raw.precoPortugues || raw.precoIndiano;
      if (!raw.precoBase) raw.precoBase = raw.price;

      const updateData = updateProductSchema.parse(raw);
      const updatedProduct = await storage.updateProduct(id, updateData);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Update product error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid product data",
          errors: error.errors
        });
      }
      if (error instanceof Error && error.message === "Product not found") {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Get product categories
  app.get("/api/products/categories", async (req: Request, res: Response) => {
    try {
      const categories = productCategoryEnum.options;
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get product statuses
  app.get("/api/products/statuses", async (req: Request, res: Response) => {
    try {
      const statuses = productStatusEnum.options;
      res.json(statuses);
    } catch (error) {
      console.error("Get statuses error:", error);
      res.status(500).json({ message: "Failed to fetch statuses" });
    }
  });

  // Get products for specific pharmacy
  app.get("/api/pharmacy/:pharmacyId/products", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId as string);
      const search = req.query.search as string;
      const category = req.query.category as string;
      const status = req.query.status as string;

      let products = await storage.getProducts(undefined, pharmacyId);

      if (search) {
        const query = search.toLowerCase();
        products = products.filter(p =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.activeIngredient && p.activeIngredient.toLowerCase().includes(query)) ||
          (Array.isArray(p.diseases) && p.diseases.some((d: string) => d.toLowerCase().includes(query)))
        );
      }

      if (category) {
        products = products.filter((product) => product.category === category);
      }
      if (status) {
        products = products.filter((product) => product.status === status);
      }

      res.json(products);
    } catch (error) {
      console.error("Get pharmacy products error:", error);
      res.status(500).json({ message: "Failed to fetch pharmacy products" });
    }
  });

  // Create product for specific pharmacy
  app.post("/api/pharmacy/:pharmacyId/products", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId as string);
      const raw = { ...req.body, pharmacyId };

      // Normalize: convert empty strings to null for all numeric price fields
      const toNum = (v: any) => (v === '' || v === null || v === undefined) ? null : String(v);
      raw.price = toNum(raw.price);
      raw.precoBase = toNum(raw.precoBase);
      raw.precoPortugues = toNum(raw.precoPortugues);
      raw.precoIndiano = toNum(raw.precoIndiano);

      // Ensure at least one price exists
      const anyPrice = raw.price || raw.precoBase || raw.precoPortugues || raw.precoIndiano;
      if (!anyPrice) {
        return res.status(400).json({ message: "Pelo menos um preço (Base, Português ou Indiano) deve ser fornecido." });
      }

      // Sync price ↔ precoBase: both should have a value if possible
      if (!raw.price) raw.price = raw.precoBase || raw.precoPortugues || raw.precoIndiano;
      if (!raw.precoBase) raw.precoBase = raw.price;

      const productData = insertProductSchema.parse(raw);
      const newProduct = await storage.createProduct(productData);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Create pharmacy product error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Dados de produto inválidos",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // --- Rotas de Gerenciamento de Descontos (Política de Descontos) ---

  // Listar descontos de uma farmácia específica
  app.get("/api/pharmacy/discounts", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(String(req.query.pharmacyId ?? "0"));
      if (isNaN(pharmacyId)) return res.status(400).json({ message: "Farmácia inválida" });

      // O storage deve retornar o join do desconto com os dados do produto (nome, preço, imagem)
      const discounts = await (storage as any).getPharmacyDiscounts(pharmacyId);
      res.json(discounts);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      res.status(500).json({ message: "Erro ao buscar descontos" });
    }
  });

  // Criar novo desconto
  app.post("/api/pharmacy/discounts", async (req: Request, res: Response) => {
    try {
      const { pharmacyId, productIds, productId, discountPercentage, isActive, expirationDate } = req.body;

      const pId = pharmacyId ? parseInt(String(pharmacyId)) : 0;
      const dPct = String(discountPercentage);
      const isAct = isActive ?? true;
      const expDate = expirationDate ? new Date(expirationDate) : null;

      if (!pId || (!productId && (!productIds || productIds.length === 0)) || !discountPercentage) {
        return res.status(400).json({ message: "Dados incompletos para o desconto" });
      }

      const idsToProcess = productIds ? productIds : [productId];
      const createdDiscounts = [];

      for (const id of idsToProcess) {
        const discount = await (storage as any).createProductDiscount({
          pharmacyId: pId,
          productId: parseInt(String(id)),
          discountPercentage: dPct,
          isActive: isAct,
          expiresAt: expDate
        });
        createdDiscounts.push(discount);
      }

      res.status(201).json(createdDiscounts.length === 1 ? createdDiscounts[0] : createdDiscounts);
    } catch (error) {
      console.error("Error creating discount:", error);
      res.status(500).json({ message: "Erro ao criar desconto" });
    }
  });

  // Ativar/Desativar desconto
  app.patch("/api/pharmacy/discounts/:id/toggle", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const { isActive } = req.body;

      const updated = await (storage as any).updateDiscountStatus(id, isActive);
      res.json(updated);
    } catch (error) {
      console.error("Error toggling discount:", error);
      res.status(500).json({ message: "Erro ao alterar status do desconto" });
    }
  });

  // Remover desconto
  app.delete("/api/pharmacy/discounts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      await (storage as any).deleteDiscount(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting discount:", error);
      res.status(500).json({ message: "Erro ao remover desconto" });
    }
  });

  console.log("[Catalog] Catalog routes registered");
}
