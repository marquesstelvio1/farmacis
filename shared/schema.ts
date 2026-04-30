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
  role: text("role").notNull().default("CLIENTE"), // CLIENTE, ADMIN, FARMACIA, ESPECIALISTA
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  emailVerified: true,
  verificationToken: true,
  resetToken: true,
  resetTokenExpiry: true,
  createdAt: true,
  role: true
});

export const loginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .min(1, "Email é obrigatório")
    .email("Formato de email inválido. Exemplo: nome@exemplo.com"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const registerSchema = insertUserSchema.extend({
  email: z.string()
    .trim()
    .toLowerCase()
    .email("Formato de email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  phone: z.string().optional().transform(v => v ? v.replace(/\s/g, "") : v),
  address: z.string().min(5, "Endereço muito curto").optional(),
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
  price: numeric("price"),
  precoBase: numeric("preco_base"),
  precoPortugues: numeric("preco_portugues"), // Price for Portuguese origin variant
  precoIndiano: numeric("preco_indiano"),   // Price for Indian origin variant
  imageUrl: text("image_url").default("").notNull(),
  diseases: text("diseases").array().default([]).notNull(),
  activeIngredient: text("active_ingredient").default("").notNull(),
  category: text("category").notNull().default("medicamento"),
  brand: text("brand"),
  dosage: text("dosage"),
  prescriptionRequired: boolean("prescription_required").default(false).notNull(),
  stock: integer("stock").default(0).notNull(),
  pharmacyId: integer("pharmacy_id").references(() => pharmacies.id),
  status: text("status").notNull().default("active"), // active, inactive, discontinued
  // Origin variant support - for grouping Portuguese vs Indian medications
  origin: text("origin"), // "portugues", "indiano", or null for default
  precoLamina: numeric("preco_lamina"),
  precoLaminaPortugues: numeric("preco_lamina_portugues"),
  precoLaminaIndiano: numeric("preco_lamina_indiano"),
  comprimidosPorLamina: integer("comprimidos_por_lamina"),
  parentProductId: integer("parent_product_id").references((): any => products.id), // link to main product variant
  isMainVariant: boolean("is_main_variant").default(false).notNull(), // indicates if this is the primary product card
  // Discount fields - percentage based discount per pharmacy
  discountPercentage: integer("discount_percentage").default(0).notNull(), // 0-100% discount
  discountActive: boolean("discount_active").default(false).notNull(), // toggle discount on/off
  discountStartDate: timestamp("discount_start_date"), // optional: when discount starts
  discountEndDate: timestamp("discount_end_date"), // optional: when discount ends
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}) as any;

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).refine(
  (data) => {
    const hasPrice = data.price && parseFloat(String(data.price)) > 0;
    const hasPortuguese = data.precoPortugues && parseFloat(String(data.precoPortugues)) > 0;
    const hasIndian = data.precoIndiano && parseFloat(String(data.precoIndiano)) > 0;
    return !!(hasPrice || hasPortuguese || hasIndian);
  },
  { message: "Pelo menos um preço (Base, Português ou Indiano) deve ser fornecido." }
);

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

export const productOriginEnum = z.enum(["portugues", "indiano", "default"]);
export type ProductCategory = z.infer<typeof productCategoryEnum>;
export type ProductStatus = z.infer<typeof productStatusEnum>;
export type ProductOrigin = z.infer<typeof productOriginEnum>;

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
  iban: text("iban"), // IBAN for bank transfer
  multicaixaExpress: text("multicaixa_express"), // Multicaixa Express number
  accountName: text("account_name"), // Account name for bank transfer
  paymentMethods: text("payment_methods").array().default([]).notNull(), // e.g., ['cash', 'multicaixa_express', 'transferencia']
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderStatusEnum = z.enum(["pending", "accepted", "awaiting_proof", "proof_submitted", "rejected", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]);
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
  paymentProof: text("payment_proof"), // base64 image of payment proof
  isLocked: boolean("is_locked").default(false).notNull(), // Prevents modifications after digital payment acceptance
  notes: text("notes"),
  bookingType: text("booking_type").default("delivery").notNull(), // delivery, pickup
  scheduledTime: timestamp("scheduled_time"),
  pharmacyIban: text("pharmacy_iban"), // IBAN for payment
  pharmacyMulticaixaExpress: text("pharmacy_multicaixa_express"), // Multicaixa Express number
  pharmacyAccountName: text("pharmacy_account_name"), // Account name
  // Client payment details (for verification)
  clientIban: text("client_iban"), // Client's IBAN used for transfer
  clientMulticaixaExpress: text("client_multicaixa_express"), // Client's MCX number used
  clientAccountName: text("client_account_name"), // Client's account name
  reviewRating: integer("review_rating"), // 0-5 stars
  reviewComment: text("review_comment"),
  reviewedAt: timestamp("reviewed_at"),
  settlementId: integer("settlement_id"), // link to pharmacy_settlements
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pharmacy Settlements - track payments made to pharmacies
export const pharmacySettlements = pgTable("pharmacy_settlements", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmacies.id),
  amount: numeric("amount").notNull(), // amount paid to pharmacy
  platformProfit: numeric("platform_profit").notNull(), // commission kept by platform
  totalRevenue: numeric("total_revenue").notNull(), // gross total
  proofUrl: text("proof_url"), // URL/path to payment proof image
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPharmacySettlementSchema = createInsertSchema(pharmacySettlements).omit({
  id: true,
  createdAt: true,
});

export type PharmacySettlement = typeof pharmacySettlements.$inferSelect;
export type InsertPharmacySettlement = z.infer<typeof insertPharmacySettlementSchema>;


// Order Items - individual items in an order
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(), // snapshot at time of order
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  totalPrice: numeric("total_price").notNull(),
  prescriptionRequired: boolean("prescription_required").default(false).notNull(),
  prescriptionId: integer("prescription_id").references(() => prescriptions.id),
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
  isSystemOwner: boolean("is_system_owner").default(false).notNull(),
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

// System Settings table
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;

// Prescriptions table for storing uploaded medical prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  userId: integer("user_id").references(() => users.id),
  imageUrl: text("image_url").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  reviewedAt: true
});

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

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

// Medical Records Table
export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  idNumber: text("id_number"), // Número do Bilhete
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  chronicDiseases: text("chronic_diseases"),
  medications: text("medications"),
  emergencyContacts: text("emergency_contacts"), // Armazenado como JSON string (array de objectos)
  insuranceProvider: text("insurance_provider"),
  insuranceNumber: text("insurance_number"),
  isOrganDonor: boolean("is_organ_donor").default(false),
  observations: text("observations"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Medication Reminders (Modo Receita)
export const medicationReminders = pgTable("medication_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  medicineName: text("medicine_name").notNull(),
  durationDays: integer("duration_days").notNull(),
  hours: text("hours"), // Armazenado como JSON string (array de strings: ["08:00", "20:00"])
  startDate: timestamp("start_date").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
});

export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = typeof medicalRecords.$inferInsert;
export type MedicationReminder = typeof medicationReminders.$inferSelect;
export type InsertMedicationReminder = typeof medicationReminders.$inferInsert;

// Product Discounts - descontos por farmácia para produtos específicos
export const productDiscounts = pgTable("product_discounts", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmacies.id),
  productId: integer("product_id").notNull().references(() => products.id),
  discountPercentage: numeric("discount_percentage").notNull(), // ex: 10.00 = 10%
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductDiscountSchema = createInsertSchema(productDiscounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const updateProductDiscountSchema = createInsertSchema(productDiscounts).partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type ProductDiscount = typeof productDiscounts.$inferSelect;
export type InsertProductDiscount = z.infer<typeof insertProductDiscountSchema>;
export type UpdateProductDiscount = z.infer<typeof updateProductDiscountSchema>;
