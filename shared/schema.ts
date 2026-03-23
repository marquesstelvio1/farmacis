import { pgTable, text, serial, numeric, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  password: text("password").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  emailVerified: true,
  verificationToken: true,
  resetToken: true,
  resetTokenExpiry: true,
  createdAt: true
});

export const loginSchema = z.object({
  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Formato de email inválido. Exemplo: nome@exemplo.com"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const registerSchema = insertUserSchema.extend({
  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Formato de email inválido. Exemplo: nome@exemplo.com"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  orderId: integer("order_id").notNull(),
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull().default("AOA"),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  paymentMethod: text("payment_method").notNull(), // mpesa, stripe, bank_transfer
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  transactionId: true
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  imageUrl: text("image_url").notNull(),
  diseases: text("diseases").array().notNull(),
  activeIngredient: text("active_ingredient").notNull(),
  category: text("category").notNull().default("medicamento"),
  brand: text("brand"),
  dosage: text("dosage"),
  prescriptionRequired: boolean("prescription_required").default(false).notNull(),
  stock: integer("stock").default(0).notNull(),
  pharmacyId: integer("pharmacy_id").references(() => pharmacies.id),
  status: text("status").notNull().default("active"), // active, inactive, discontinued
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const updateProductSchema = createInsertSchema(products).partial().omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const productCategoryEnum = z.enum([
  "medicamento", 
  "vitamina", 
  "suplemento", 
  "cosmetico", 
  "higiene", 
  "equipamento"
]);

export const productStatusEnum = z.enum(["active", "inactive", "discontinued"]);
export type ProductCategory = z.infer<typeof productCategoryEnum>;
export type ProductStatus = z.infer<typeof productStatusEnum>;

export const pharmacyStatusEnum = z.enum(["pending", "active", "suspended", "rejected"]);
export type PharmacyStatus = z.infer<typeof pharmacyStatusEnum>;

export const pharmacies = pgTable("pharmacies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  lat: numeric("lat").notNull(),
  lng: numeric("lng").notNull(),
  status: text("status").notNull().default("pending"), // pending, active, suspended, rejected
  documentUrl: text("document_url"), // Pharmacy registration document
  logoUrl: text("logo_url"),
  description: text("description"),
  openingHours: text("opening_hours"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderStatusEnum = z.enum(["pending", "accepted", "rejected", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmacies.id),
  userId: integer("user_id").references(() => users.id), // null for guest orders
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address").notNull(),
  customerLat: numeric("customer_lat"),
  customerLng: numeric("customer_lng"),
  total: numeric("total").notNull(),
  deliveryFee: numeric("delivery_fee").default("0"),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Order Items - individual items in an order
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(), // snapshot at time of order
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  totalPrice: numeric("total_price").notNull(),
});

export const insertPharmacySchema = createInsertSchema(pharmacies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Pharmacy = typeof pharmacies.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Pharmacy Registration Request (for admin approval)
export const pharmacyRegistrationSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(9, "Telefone inválido"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  lat: z.number(),
  lng: z.number(),
  description: z.string().optional(),
  openingHours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean().default(false)
  })).optional(),
});

export type PharmacyRegistration = z.infer<typeof pharmacyRegistrationSchema>;

// Admin User Type
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("moderator"), // super_admin, admin, moderator
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;

// User Payment Methods - for storing user's saved payment methods
export const userPaymentMethods = pgTable("user_payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // multicaixa, mpesa, unitel_money, bank_transfer, stripe
  name: text("name").notNull(), // e.g., "Meu Multicaixa", "M-Pesa"
  phoneNumber: text("phone_number"), // for mobile payments
  cardNumber: text("card_number"), // last 4 digits for Multicaixa
  bankName: text("bank_name"), // for bank transfer
  accountNumber: text("account_number"), // for bank transfer
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserPaymentMethodSchema = createInsertSchema(userPaymentMethods).omit({
  id: true,
  createdAt: true
});

export type UserPaymentMethod = typeof userPaymentMethods.$inferSelect;
export type InsertUserPaymentMethod = z.infer<typeof insertUserPaymentMethodSchema>;

// Order Status History - track order status changes
export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  status: text("status").notNull(), // pending, accepted, rejected, paid, processing, shipped, delivered
  notes: text("notes"), // rejection reason or notes
  createdBy: text("created_by").notNull(), // pharmacy admin or system
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;

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

// Pharmacy Admin Users
export const pharmacyAdmins = pgTable("pharmacy_admins", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmacies.id),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"), // admin, manager
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PharmacyAdmin = typeof pharmacyAdmins.$inferSelect;

// Legacy Chat tables for Replit Integrations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
