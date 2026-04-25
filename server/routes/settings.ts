import express, { type Request, Response } from "express";
import { db } from "../db";
import { systemSettings } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export function registerSettingsRoutes(app: express.Application) {
  // Get all system settings
  app.get("/api/admin/settings", async (req: Request, res: Response) => {
    try {
      console.log("[Settings] Fetching all settings...");
      const settings = await db.select().from(systemSettings);
      console.log("[Settings] Found settings:", settings);
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      res.json(settingsMap);
    } catch (error) {
      console.error("[Settings] Error fetching settings:", error);
      if (error instanceof Error) {
        console.error("[Settings] Error stack:", error.stack);
      }
      res.status(500).json({ message: "Erro ao buscar configurações", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get a specific setting
  app.get("/api/admin/settings/:key", async (req: Request, res: Response) => {
    try {
      const key = String(req.params.key);
      const result = await db
        .select()
        .from(systemSettings)
        .where(sql`key = ${key}`)
        .limit(1);
      
      if (result.length === 0) {
        return res.status(404).json({ message: "Configuração não encontrada" });
      }

      const setting = result[0];
      
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

      const result = await db
        .update(systemSettings)
        .set({ value: String(value), updatedAt: new Date() })
        .where(sql`key = ${key}`)
        .returning();

      let setting = result[0];
      if (!setting) {
        const inserted = await db
          .insert(systemSettings)
          .values({
            key,
            value: String(value),
            description: `Configuração ${key}`,
          })
          .returning();
        setting = inserted[0];
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
      const result = await db
        .select()
        .from(systemSettings)
        .where(sql`key = 'platform_fee_percent'`)
        .limit(1);
      
      const setting = result.length > 0 ? result[0] : null;
      const feePercent = setting ? parseFloat(setting.value) : 10;
      res.json({ feePercent });
    } catch (error) {
      console.error("Error fetching platform fee:", error);
      res.json({ feePercent: 10 });
    }
  });

  console.log("[Settings] Settings routes registered");
}
