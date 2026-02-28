import { pgTable, text, serial, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  imageUrl: text("image_url").notNull(),
  diseases: text("diseases").array().notNull(), // e.g. ["headache", "fever"]
  activeIngredient: text("active_ingredient").notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Request for Pill Identification
export const pillIdentificationRequestSchema = z.object({
  imageBase64: z.string().describe("Base64 encoded image string (without data URI prefix)")
});
export type PillIdentificationRequest = z.infer<typeof pillIdentificationRequestSchema>;

export const pillIdentificationResponseSchema = z.object({
  identifiedPill: z.string(),
  description: z.string(),
  diseases: z.array(z.string()),
  recommendedProductIds: z.array(z.number())
});
export type PillIdentificationResponse = z.infer<typeof pillIdentificationResponseSchema>;
