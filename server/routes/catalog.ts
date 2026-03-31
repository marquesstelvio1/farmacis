import express, { type Request, Response } from "express";
import { storage } from "../storage";
import { insertProductSchema, updateProductSchema, productCategoryEnum, productStatusEnum } from "@shared/schema";
import { z } from "zod";

export function registerCatalogRoutes(app: express.Application) {
  // Get all products (with optional search and pharmacy filter)
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string;
      const pharmacyId = req.query.pharmacyId ? parseInt(req.query.pharmacyId as string) : undefined;
      const category = req.query.category as string;
      const status = req.query.status as string;

      console.log('🔍 GET /api/products - Query params:', { search, pharmacyId, category, status });

      let products = await storage.getProducts(search, pharmacyId);
      console.log('🔍 Products fetched from storage:', products.length, 'items');
      
      if (category) {
        products = products.filter((product) => product.category === category);
      }
      if (status) {
        products = products.filter((product) => product.status === status);
      }

      res.json(products);
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

      let products = await storage.getProducts(search, pharmacyId);
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
