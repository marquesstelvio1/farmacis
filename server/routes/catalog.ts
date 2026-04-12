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
      const pharmacyId = req.query.pharmacyId ? parseInt(req.query.pharmacyId as string) : undefined;
      const category = req.query.category as string;
      const status = req.query.status as string;
      const origin = req.query.origin as string;

      console.log('🔍 GET /api/products - Query params:', { search, pharmacyId, category, status, origin });

      // Buscamos todos os produtos da farmácia (ou todos) e aplicamos o filtro manualmente
      // para garantir que a busca por doenças funcione corretamente.
      let products = await storage.getProducts(undefined, pharmacyId);
      console.log('🔍 Products fetched from storage:', products.length, 'items');

      if (search) {
        const query = search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.activeIngredient && p.activeIngredient.toLowerCase().includes(query)) ||
          (Array.isArray(p.diseases) && p.diseases.some(d => d.toLowerCase().includes(query)))
        );
      }
      
      if (category) {
        products = products.filter((product) => product.category === category);
      }
      if (status) {
        products = products.filter((product) => product.status === status);
      }
      if (origin) {
        products = products.filter((product) => product.origin === origin);
      }

      // Group products by name to combine variants (Portuguese/Indian)
      const groupedProducts = new Map();
      
      products.forEach(product => {
        const key = product.name.toLowerCase().trim();
        
        if (!groupedProducts.has(key)) {
          // Create main product entry
          groupedProducts.set(key, {
            ...product,
            variants: []
          });
        }
        
        const mainProduct = groupedProducts.get(key);
        
        // If this product has an origin different from default, add as variant
        if (product.origin && product.origin !== 'default') {
          mainProduct.variants.push({
            id: product.id,
            origin: product.origin,
            dosage: product.dosage,
            price: product.price,
            precoBase: product.precoBase,
            stock: product.stock,
            pharmacyId: product.pharmacyId,
            pharmacyName: product.pharmacyName,
          });
        } else if (product.isMainVariant || !product.origin) {
          // This is the main variant, update main product details
          mainProduct.id = product.id;
          mainProduct.price = product.price;
          mainProduct.precoBase = product.precoBase;
          mainProduct.stock = product.stock;
          mainProduct.origin = product.origin;
          mainProduct.pharmacyId = product.pharmacyId;
          mainProduct.pharmacyName = product.pharmacyName;
        }
      });

      // Convert map to array
      const result = Array.from(groupedProducts.values());
      console.log('🔍 Products after grouping:', result.length, 'cards with variants');

      res.json(result);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
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

      // Função auxiliar para calcular preço com comissão
      const withCommission = (val: any) => {
        const base = parseFloat(String(val));
        return !isNaN(base) ? (base * 1.15).toFixed(2).toString() : null;
      };

      // Aplicar comissão em todos os campos de preço fornecidos
      if (data.precoBase) {
        data.price = withCommission(data.precoBase);
      }
      
      if (isMed) {
        if (data.precoPortugues) data.precoPortugues = withCommission(data.precoPortugues);
        if (data.precoIndiano) data.precoIndiano = withCommission(data.precoIndiano);
        
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
      const data = { ...req.body };

      // Calculate 15% commission if precoBase is being updated
      if (data.precoBase) {
        const base = parseFloat(String(data.precoBase));
        if (!isNaN(base)) {
          data.price = (base * 1.15).toFixed(2).toString();
        }
      } else if (data.price && !data.precoBase) {
        // If only price is provided, treat it as base and add commission
        const base = parseFloat(String(data.price));
        if (!isNaN(base)) {
          data.precoBase = base.toString();
          data.price = (base * 1.15).toFixed(2).toString();
        }
      }

      // Calculate 15% commission for Portuguese origin price if provided
      if (data.precoPortugues) {
        const basePt = parseFloat(String(data.precoPortugues));
        if (!isNaN(basePt)) {
          data.precoPortugues = basePt.toFixed(2).toString();
        }
      }

      // Calculate 15% commission for Indian origin price if provided
      if (data.precoIndiano) {
        const baseIn = parseFloat(String(data.precoIndiano));
        if (!isNaN(baseIn)) {
          data.precoIndiano = baseIn.toFixed(2).toString();
        }
      }

      const updateData = updateProductSchema.parse(data);
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
          (Array.isArray(p.diseases) && p.diseases.some(d => d.toLowerCase().includes(query)))
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
      const data = { ...req.body, pharmacyId };

      // Calculate 15% commission if precoBase is provided
      if (data.precoBase) {
        const base = parseFloat(String(data.precoBase));
        if (!isNaN(base)) {
          data.price = (base * 1.15).toFixed(2).toString();
        }
      } else if (data.price && !data.precoBase) {
        // If only price is provided, treat it as base and add commission
        const base = parseFloat(String(data.price));
        if (!isNaN(base)) {
          data.precoBase = base.toString();
          data.price = (base * 1.15).toFixed(2).toString();
        }
      }

      // Calculate 15% commission for Portuguese origin price if provided
      if (data.precoPortugues) {
        const basePt = parseFloat(String(data.precoPortugues));
        if (!isNaN(basePt)) {
          data.precoPortugues = basePt.toFixed(2).toString();
        }
      }

      // Calculate 15% commission for Indian origin price if provided
      if (data.precoIndiano) {
        const baseIn = parseFloat(String(data.precoIndiano));
        if (!isNaN(baseIn)) {
          data.precoIndiano = baseIn.toFixed(2).toString();
        }
      }

      const productData = insertProductSchema.parse(data);
      const newProduct = await storage.createProduct(productData);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Create pharmacy product error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid product data",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  console.log("[Catalog] Catalog routes registered");
}
