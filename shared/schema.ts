import { pgTable, text, serial, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  imageUrl: text("image_url").notNull(),
  diseases: text("diseases").array().notNull(),
  activeIngredient: text("active_ingredient").notNull(),
});

export const pharmacies = pgTable("pharmacies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  lat: numeric("lat").notNull(),
  lng: numeric("lng").notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmacies.id),
  customerName: text("customer_name").notNull(),
  total: numeric("total").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  items: text("items").notNull(), // JSON string of items
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPharmacySchema = createInsertSchema(pharmacies).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });

export type Pharmacy = typeof pharmacies.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

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
