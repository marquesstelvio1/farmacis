import { Express, Request, Response } from "express";
import { db } from "../db";
import { medicalRecords, medicationReminders } from "@shared/schema";
import { eq } from "drizzle-orm";

export function registerMedicalRoutes(app: Express) {
  // Get medical info for a user
  app.get("/api/user/:userId/medical-info", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(String(req.params.userId));
      const [record] = await db
        .select()
        .from(medicalRecords)
        .where(eq(medicalRecords.userId, userId))
        .limit(1);
      
      res.json(record || {});
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar dados médicos" });
    }
  });

  // Update or Create medical info
  app.post("/api/user/:userId/medical-info", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(String(req.params.userId));
      const data = req.body;

      const [existing] = await db
        .select()
        .from(medicalRecords)
        .where(eq(medicalRecords.userId, userId))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(medicalRecords)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(medicalRecords.userId, userId))
          .returning();
        return res.json(updated);
      }

      const [newRecord] = await db
        .insert(medicalRecords)
        .values({ ...data, userId })
        .returning();
      res.status(201).json(newRecord);
    } catch (error) {
      res.status(500).json({ message: "Erro ao salvar dados médicos" });
    }
  });

  // Get medication reminders
  app.get("/api/user/:userId/medications", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(String(req.params.userId));
      const reminders = await db
        .select()
        .from(medicationReminders)
        .where(eq(medicationReminders.userId, userId));
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar receitas" });
    }
  });

  // Add new medication reminder
  app.post("/api/user/:userId/medications", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(String(req.params.userId));
      const data = req.body;
      const [newReminder] = await db
        .insert(medicationReminders)
        .values({ ...data, userId })
        .returning();
      res.status(201).json(newReminder);
    } catch (error) {
      res.status(500).json({ message: "Erro ao adicionar medicamento" });
    }
  });
}