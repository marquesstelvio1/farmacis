import express, { type Request, Response } from "express";
import { db } from "../db";
import { systemSettings } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export function registerSettingsRoutes(app: express.Application) {
  // Get all system settings
  app.get("/api/admin/settings", async (req: Request, res: Response) => {
    try {
      const settings = await db.select().from(systemSettings);
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      res.json(settingsMap);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Erro ao buscar configurações" });
    }
  });

  // Get a specific setting
  app.get("/api/admin/settings/:key", async (req: Request, res: Response) => {
    try {
      const key = String(req.params.key);
      const [setting] = await db
        .select()
        .from(systemSettings)
        .where(sql`key = ${key}`)
        .limit(1);
      
      if (!setting) {
        return res.status(404).json({ message: "Configuração não encontrada" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Erro ao buscar configuração" });
    }
  });

  // Update a setting
  app.patch("/api/admin/settings/:key", async (req: Request, res: Response) => {
    try {
      const key = String(req.params.key);
      const { value } = req.body;

      if (value === undefined) {
        return res.status(400).json({ message: "Valor é obrigatório" });
      }

      const [setting] = await db
        .update(systemSettings)
        .set({ value: String(value), updatedAt: new Date() })
        .where(sql`key = ${key}`)
        .returning();

      if (!setting) {
        return res.status(404).json({ message: "Configuração não encontrada" });
      }

      res.json({ message: "Configuração atualizada", setting });
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Erro ao atualizar configuração" });
    }
  });

  // Get platform fee
  app.get("/api/platform-fee", async (req: Request, res: Response) => {
    try {
      const [setting] = await db
        .select()
        .from(systemSettings)
        .where(sql`key = 'platform_fee_percent'`)
        .limit(1);
      
      const feePercent = setting ? parseFloat(setting.value) : 15;
      res.json({ feePercent });
    } catch (error) {
      console.error("Error fetching platform fee:", error);
      res.json({ feePercent: 15 });
    }
  });

  console.log("[Settings] Settings routes registered");
}
