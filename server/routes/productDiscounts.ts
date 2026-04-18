import { Express, Request, Response } from "express";
import { db } from "../db";
import { productDiscounts, products, pharmacies } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Middleware to check if user is pharmacy admin
async function requirePharmacyAdmin(req: Request, res: Response, next: Function) {
  const pharmacyToken = req.headers['x-pharmacy-token'];
  if (!pharmacyToken || Array.isArray(pharmacyToken)) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export function registerProductDiscountRoutes(app: Express) {
  // Get all discounts for a pharmacy
  app.get("/api/pharmacy/discounts", async (req: Request, res: Response) => {
    try {
      const pharmacyIdParam = req.query.pharmacyId;
      const pharmacyId = typeof pharmacyIdParam === 'string' ? parseInt(pharmacyIdParam) : NaN;

      if (!pharmacyId) {
        return res.status(400).json({ message: "Pharmacy ID required" });
      }

      const discounts = await db
        .select({
          id: productDiscounts.id,
          pharmacyId: productDiscounts.pharmacyId,
          productId: productDiscounts.productId,
          discountPercentage: productDiscounts.discountPercentage,
          isActive: productDiscounts.isActive,
          createdAt: productDiscounts.createdAt,
          updatedAt: productDiscounts.updatedAt,
          productName: products.name,
          productPrice: products.price,
          productImage: products.imageUrl,
        })
        .from(productDiscounts)
        .innerJoin(products, eq(productDiscounts.productId, products.id))
        .where(eq(productDiscounts.pharmacyId, pharmacyId))
        .orderBy(desc(productDiscounts.createdAt));

      res.json(discounts);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      res.status(500).json({ message: "Failed to fetch discounts" });
    }
  });

  // Get active discount for a specific product in a pharmacy (for clients)
  app.get("/api/pharmacy/:pharmacyId/products/:productId/discount", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId);
      const productId = parseInt(req.params.productId);

      if (isNaN(pharmacyId) || isNaN(productId)) {
        return res.status(400).json({ message: "Invalid pharmacy or product ID" });
      }

      const discount = await db
        .select()
        .from(productDiscounts)
        .where(
          and(
            eq(productDiscounts.pharmacyId, pharmacyId),
            eq(productDiscounts.productId, productId),
            eq(productDiscounts.isActive, true)
          )
        )
        .limit(1);

      if (discount.length === 0) {
        return res.json(null);
      }

      res.json(discount[0]);
    } catch (error) {
      console.error("Error fetching product discount:", error);
      res.status(500).json({ message: "Failed to fetch discount" });
    }
  });

  // Get all active discounts for a pharmacy (for clients viewing products)
  app.get("/api/pharmacy/:pharmacyId/discounts/active", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId);

      if (isNaN(pharmacyId)) {
        return res.status(400).json({ message: "Invalid pharmacy ID" });
      }

      const discounts = await db
        .select({
          productId: productDiscounts.productId,
          discountPercentage: productDiscounts.discountPercentage,
        })
        .from(productDiscounts)
        .where(
          and(
            eq(productDiscounts.pharmacyId, pharmacyId),
            eq(productDiscounts.isActive, true)
          )
        );

      // Return as object with productId as key for easy lookup
      const discountMap: Record<number, number> = {};
      discounts.forEach(d => {
        discountMap[d.productId] = parseFloat(d.discountPercentage);
      });

      res.json(discountMap);
    } catch (error) {
      console.error("Error fetching active discounts:", error);
      res.status(500).json({ message: "Failed to fetch discounts" });
    }
  });

  // Create or update discount
  app.post("/api/pharmacy/discounts", async (req: Request, res: Response) => {
    try {
      const { pharmacyId, productId, discountPercentage, isActive = true } = req.body;

      if (!pharmacyId || !productId || !discountPercentage) {
        return res.status(400).json({ message: "Pharmacy ID, Product ID, and Discount Percentage are required" });
      }

      const percentage = parseFloat(discountPercentage);
      if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
        return res.status(400).json({ message: "Discount percentage must be between 0 and 100" });
      }

      // Check if product belongs to this pharmacy
      const product = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.id, productId),
            eq(products.pharmacyId, pharmacyId)
          )
        )
        .limit(1);

      if (product.length === 0) {
        return res.status(404).json({ message: "Product not found or does not belong to this pharmacy" });
      }

      // Check if discount already exists
      const existingDiscount = await db
        .select()
        .from(productDiscounts)
        .where(
          and(
            eq(productDiscounts.pharmacyId, pharmacyId),
            eq(productDiscounts.productId, productId)
          )
        )
        .limit(1);

      let result;
      if (existingDiscount.length > 0) {
        // Update existing discount
        result = await db
          .update(productDiscounts)
          .set({
            discountPercentage: percentage.toString(),
            isActive: isActive,
            updatedAt: new Date(),
          })
          .where(eq(productDiscounts.id, existingDiscount[0].id))
          .returning();
      } else {
        // Create new discount
        result = await db
          .insert(productDiscounts)
          .values({
            pharmacyId: pharmacyId,
            productId: productId,
            discountPercentage: percentage.toString(),
            isActive: isActive,
          })
          .returning();
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Error saving discount:", error);
      res.status(500).json({ message: "Failed to save discount" });
    }
  });

  // Toggle discount active status
  app.patch("/api/pharmacy/discounts/:id/toggle", async (req: Request, res: Response) => {
    try {
      const discountId = parseInt(req.params.id);
      const { isActive } = req.body;

      if (isNaN(discountId)) {
        return res.status(400).json({ message: "Invalid discount ID" });
      }

      const result = await db
        .update(productDiscounts)
        .set({
          isActive: isActive,
          updatedAt: new Date(),
        })
        .where(eq(productDiscounts.id, discountId))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "Discount not found" });
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Error toggling discount:", error);
      res.status(500).json({ message: "Failed to toggle discount" });
    }
  });

  // Delete discount
  app.delete("/api/pharmacy/discounts/:id", async (req: Request, res: Response) => {
    try {
      const discountId = parseInt(req.params.id);

      if (isNaN(discountId)) {
        return res.status(400).json({ message: "Invalid discount ID" });
      }

      await db
        .delete(productDiscounts)
        .where(eq(productDiscounts.id, discountId));

      res.json({ message: "Discount deleted successfully" });
    } catch (error) {
      console.error("Error deleting discount:", error);
      res.status(500).json({ message: "Failed to delete discount" });
    }
  });
}
