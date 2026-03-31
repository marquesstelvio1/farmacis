import express, { type Request, Response } from "express";
import { db } from "../db";
import { prescriptions, orders, pharmacyAdmins } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export function registerPrescriptionRoutes(app: express.Application) {
  // Upload prescription for an order
  app.post("/api/prescriptions", async (req: Request, res: Response) => {
    try {
      const { orderId, productId, userId, imageUrl } = req.body;

      if (!orderId || !productId || !imageUrl) {
        return res.status(400).json({ message: "orderId, productId e imageUrl são obrigatórios" });
      }

      const [prescription] = await db
        .insert(prescriptions)
        .values({
          orderId,
          productId,
          userId: userId || null,
          imageUrl,
          status: "pending",
        })
        .returning();

      res.status(201).json(prescription);
    } catch (error) {
      console.error("Error uploading prescription:", error);
      res.status(500).json({ message: "Erro ao carregar receita" });
    }
  });

  // Get prescriptions for an order
  app.get("/api/orders/:orderId/prescriptions", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId as string);

      const orderPrescriptions = await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.orderId, orderId))
        .orderBy(desc(prescriptions.createdAt));

      res.json(orderPrescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      res.status(500).json({ message: "Erro ao buscar receitas" });
    }
  });

  // Get prescriptions for a pharmacy (all orders from this pharmacy)
  app.get("/api/pharmacy/:pharmacyId/prescriptions", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId as string);
      const status = req.query.status as string | undefined;

      // Get orders for this pharmacy
      const pharmacyOrders = await db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.pharmacyId, pharmacyId));

      const orderIds = pharmacyOrders.map(o => o.id);

      if (orderIds.length === 0) {
        return res.json([]);
      }

      // Get prescriptions for these orders
      let query = db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.orderId, orderIds[0]));

      // For multiple order IDs, we need a different approach
      const allPrescriptions = await db
        .select()
        .from(prescriptions)
        .orderBy(desc(prescriptions.createdAt));

      // Filter by orderIds belonging to this pharmacy
      const filtered = allPrescriptions.filter(p => orderIds.includes(p.orderId));

      // Filter by status if provided
      const result = status
        ? filtered.filter(p => p.status === status)
        : filtered;

      res.json(result);
    } catch (error) {
      console.error("Error fetching pharmacy prescriptions:", error);
      res.status(500).json({ message: "Erro ao buscar receitas da farmácia" });
    }
  });

  // Get pending prescriptions count for a pharmacy
  app.get("/api/pharmacy/:pharmacyId/prescriptions/pending-count", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId as string);

      const pharmacyOrders = await db
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.pharmacyId, pharmacyId));

      const orderIds = pharmacyOrders.map(o => o.id);

      if (orderIds.length === 0) {
        return res.json({ count: 0 });
      }

      const allPrescriptions = await db
        .select()
        .from(prescriptions);

      const filtered = allPrescriptions.filter(p => orderIds.includes(p.orderId) && p.status === "pending");

      res.json({ count: filtered.length });
    } catch (error) {
      console.error("Error fetching pending prescriptions count:", error);
      res.status(500).json({ message: "Erro ao buscar contagem de receitas pendentes" });
    }
  });

  // Review prescription (approve or reject) - Pharmacy Admin
  app.patch("/api/prescriptions/:id/review", async (req: Request, res: Response) => {
    try {
      const prescriptionId = parseInt(req.params.id as string);
      const { status, rejectionReason, reviewedBy } = req.body;

      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status deve ser 'approved' ou 'rejected'" });
      }

      if (status === "rejected" && !rejectionReason) {
        return res.status(400).json({ message: "Motivo da recusa é obrigatório" });
      }

      const [prescription] = await db
        .update(prescriptions)
        .set({
          status,
          rejectionReason: status === "rejected" ? rejectionReason : null,
          reviewedBy: reviewedBy || null,
          reviewedAt: new Date(),
        })
        .where(eq(prescriptions.id, prescriptionId))
        .returning();

      if (!prescription) {
        return res.status(404).json({ message: "Receita não encontrada" });
      }

      res.json({
        message: status === "approved" ? "Receita aprovada" : "Receita recusada",
        prescription,
      });
    } catch (error) {
      console.error("Error reviewing prescription:", error);
      res.status(500).json({ message: "Erro ao analisar receita" });
    }
  });

  // Get prescription by ID
  app.get("/api/prescriptions/:id", async (req: Request, res: Response) => {
    try {
      const prescriptionId = parseInt(req.params.id as string);

      const [prescription] = await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.id, prescriptionId))
        .limit(1);

      if (!prescription) {
        return res.status(404).json({ message: "Receita não encontrada" });
      }

      res.json(prescription);
    } catch (error) {
      console.error("Error fetching prescription:", error);
      res.status(500).json({ message: "Erro ao buscar receita" });
    }
  });

  console.log("[Prescriptions] Prescription routes registered");
}
