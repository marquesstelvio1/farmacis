import { Express, Request, Response } from "express";
import { db } from "../db";
import { userPaymentMethods } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export function registerUserPaymentMethodRoutes(app: Express) {
  // Get user's payment methods
  app.get("/api/user/payment-methods", async (req: Request, res: Response) => {
    try {
      const userIdRaw = req.query.userId;
      const userIdStr = Array.isArray(userIdRaw) ? userIdRaw[0] : userIdRaw;
      const userId = parseInt(userIdStr as string);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const methods = await db
        .select()
        .from(userPaymentMethods)
        .where(eq(userPaymentMethods.userId, userId))
        .orderBy(userPaymentMethods.isDefault, userPaymentMethods.createdAt);

      res.json(methods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Erro ao buscar métodos de pagamento" });
    }
  });

  // Add new payment method
  app.post("/api/user/payment-methods", async (req: Request, res: Response) => {
    try {
      const { userId, type, name, phoneNumber, cardNumber, bankName, accountNumber, isDefault } = req.body;

      if (!userId || !type || !name) {
        return res.status(400).json({ message: "Dados incompletos" });
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await db
          .update(userPaymentMethods)
          .set({ isDefault: false })
          .where(eq(userPaymentMethods.userId, userId));
      }

      const result = await db
        .insert(userPaymentMethods)
        .values({
          userId,
          type,
          name,
          phoneNumber: phoneNumber || null,
          cardNumber: cardNumber || null,
          bankName: bankName || null,
          accountNumber: accountNumber || null,
          isDefault: isDefault || false,
        })
        .returning();

      if (result.length === 0) {
        return res.status(500).json({ message: "Erro ao adicionar método de pagamento" });
      }

      const method = result[0];
      res.status(201).json({
        message: "Método de pagamento adicionado com sucesso",
        method,
      });
    } catch (error) {
      console.error("Error adding payment method:", error);
      res.status(500).json({ message: "Erro ao adicionar método de pagamento" });
    }
  });

  // Update payment method
  app.put("/api/user/payment-methods/:id", async (req: Request, res: Response) => {
    try {
      const methodId = parseInt(req.params.id as string);
      const { userId, name, phoneNumber, cardNumber, bankName, accountNumber, isDefault } = req.body;

      // If setting as default, unset other defaults
      if (isDefault) {
        await db
          .update(userPaymentMethods)
          .set({ isDefault: false })
          .where(eq(userPaymentMethods.userId, userId));
      }

      const result = await db
        .update(userPaymentMethods)
        .set({
          name,
          phoneNumber: phoneNumber || null,
          cardNumber: cardNumber || null,
          bankName: bankName || null,
          accountNumber: accountNumber || null,
          isDefault: isDefault || false,
        })
        .where(and(
          eq(userPaymentMethods.id, methodId),
          eq(userPaymentMethods.userId, userId)
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "Método de pagamento não encontrado" });
      }

      const method = result[0];

      res.json({
        message: "Método de pagamento atualizado",
        method,
      });
    } catch (error) {
      console.error("Error updating payment method:", error);
      res.status(500).json({ message: "Erro ao atualizar método de pagamento" });
    }
  });

  // Delete payment method
  app.delete("/api/user/payment-methods/:id", async (req: Request, res: Response) => {
    try {
      const methodId = parseInt(req.params.id as string);
      const userIdRaw = req.query.userId;
      const userIdStr = Array.isArray(userIdRaw) ? userIdRaw[0] : userIdRaw;
      const userId = parseInt(userIdStr as string);

      const result = await db
        .delete(userPaymentMethods)
        .where(and(
          eq(userPaymentMethods.id, methodId),
          eq(userPaymentMethods.userId, userId)
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: "Método de pagamento não encontrado" });
      }

      const method = result[0];
      res.json({ message: "Método de pagamento removido" });
    } catch (error) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: "Erro ao remover método de pagamento" });
    }
  });
}
