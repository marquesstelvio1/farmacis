import { Express, Request, Response } from "express";
import { db } from "../db";
import { medicalRecords, medicationReminders } from "@shared/schema";
import { eq } from "drizzle-orm";

export function registerMedicalRoutes(app: Express) {
  // Get medical info for a user
  app.get("/api/user/:userId/medical-info", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(String(req.params.userId));
      const result = await db
        .select()
        .from(medicalRecords)
        .where(eq(medicalRecords.userId, userId))
        .limit(1);
      
      const record = result.length > 0 ? result[0] : null;
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

      const existingResult = await db
        .select()
        .from(medicalRecords)
        .where(eq(medicalRecords.userId, userId))
        .limit(1);

      const existing = existingResult.length > 0 ? existingResult[0] : null;
      if (existing) {
        const updatedResult = await db
          .update(medicalRecords)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(medicalRecords.userId, userId))
          .returning();
        
        if (updatedResult.length === 0) {
          return res.status(500).json({ message: "Erro ao atualizar dados médicos" });
        }
        
        const updated = updatedResult[0];
        return res.json(updated);
      }

      const newRecordResult = await db
        .insert(medicalRecords)
        .values({ ...data, userId })
        .returning();
      
      if (newRecordResult.length === 0) {
        return res.status(500).json({ message: "Erro ao salvar dados médicos" });
      }
      
      const newRecord = newRecordResult[0];
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
      const newReminderResult = await db
        .insert(medicationReminders)
        .values({ ...data, userId })
        .returning();
      
      if (newReminderResult.length === 0) {
        return res.status(500).json({ message: "Erro ao adicionar medicamento" });
      }
      
      const newReminder = newReminderResult[0];
      res.status(201).json(newReminder);
    } catch (error) {
      res.status(500).json({ message: "Erro ao adicionar medicamento" });
    }
  });
}