import { db } from "./db";
import {
  products,
  pharmacies,
  orders,
  orderItems,
  adminUsers,
  pharmacyAdmins,
  users,
  productDiscounts,
  type Product,
  type InsertProduct,
  type Pharmacy,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type AdminUser,
  type PharmacyAdmin,
  type User,
  type SystemSetting
} from "@shared/schema";
import { and, eq, ilike, or, sql, desc, isNull, gt } from "drizzle-orm";

export interface IStorage {
  // Product methods
  getProducts(search?: string, pharmacyId?: number, category?: string, status?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  getProductsByCategory(category: string, pharmacyId?: number): Promise<Product[]>;
  seedProducts(products: InsertProduct[]): Promise<void>;

  // Pharmacy methods
  getPharmacies(): Promise<Pharmacy[]>;
  getActivePharmacies(): Promise<Pharmacy[]>;
  createPharmacy(pharmacy: any): Promise<Pharmacy>;

  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  getUserOrders(userId: number): Promise<Order[]>;
  updateOrderReview(id: number, review: { rating: number, comment: string, reviewedAt: Date }): Promise<void>;

  // Admin methods
  getAdminUsers(): Promise<AdminUser[]>;
  createAdminUser(admin: any): Promise<AdminUser>;

  // User management with role filtering
  getUsersByRole(role: string): Promise<User[]>;
  getAdminAndPharmacyUsers(): Promise<User[]>;
  getClientUsers(): Promise<User[]>;

  // Pharmacy Admin methods
  getPharmacyAdmins(): Promise<PharmacyAdmin[]>;
  createPharmacyAdmin(pharmacyAdmin: any): Promise<PharmacyAdmin>;

  // Discount methods
  getPharmacyDiscounts(pharmacyId: number): Promise<any[]>;
  getActiveDiscounts(): Promise<any[]>;
  getDiscountByProduct(productId: number, pharmacyId: number): Promise<any>;
  createProductDiscount(discount: any): Promise<any>;
  updateDiscountStatus(id: number, isActive: boolean): Promise<any>;
  deleteDiscount(id: number): Promise<void>;

  // System Settings methods
  getSystemSettings(): Promise<SystemSetting[]>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(search?: string, pharmacyId?: number, category?: string, status?: string): Promise<any[]> {
    try {
      console.log('💾 Storage.getProducts called with:', { search, pharmacyId });
      const conditions = [];
      if (pharmacyId) {
        console.log('💾 Adding pharmacyId filter:', pharmacyId);
        conditions.push(eq(products.pharmacyId, pharmacyId));
      }
      if (search) {
        const searchTerms = search.split(',').map(s => s.trim()).filter(s => s.length > 0);

        if (searchTerms.length === 1) {
          conditions.push(
            sql`(${products.name} ILIKE ${`%${searchTerms[0]}%`} OR ${products.diseases}::text ILIKE ${`%${searchTerms[0]}%`} OR COALESCE(${products.brand}, '') ILIKE ${`%${searchTerms[0]}%`} OR COALESCE(${products.dosage}, '') ILIKE ${`%${searchTerms[0]}%`})`
          );
        } else if (searchTerms.length > 1) {
          const termConditions = searchTerms.flatMap(term => [
            ilike(products.name, `%${term}%`),
            ilike(products.diseases, `%${term}%`),
            ilike(products.brand, `%${term}%`),
            ilike(products.dosage, `%${term}%`)
          ]);
          conditions.push(or(...termConditions));
        }
      }

      if (category) {
        conditions.push(eq(products.category, category));
      }

      // Join with pharmacies to get pharmacy name and ensure pharmacy exists
      let query = db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          precoBase: products.precoBase,
          precoPortugues: products.precoPortugues,
          precoIndiano: products.precoIndiano,
          imageUrl: products.imageUrl,
          diseases: products.diseases,
          activeIngredient: products.activeIngredient,
          category: products.category,
          brand: products.brand,
          dosage: products.dosage,
          prescriptionRequired: products.prescriptionRequired,
          stock: products.stock,
          pharmacyId: products.pharmacyId,
          status: products.status,
          origin: products.origin,
          isMainVariant: products.isMainVariant,
          parentProductId: products.parentProductId,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          pharmacyName: pharmacies.name,
          pharmacyLogo: pharmacies.logoUrl,
        })
        .from(products)
        .leftJoin(pharmacies, eq(products.pharmacyId, pharmacies.id))
        .$dynamic();

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query.orderBy(products.name);
      console.log('💾 Result length:', result.length);
      return result;
    } catch (error: any) {
      console.error('💾 ERROR in getProducts:', error.message);
      // If columns don't exist, use a basic query
      if (error.message?.includes('does not exist')) {
        console.log('Using fallback query for products without new columns');
        const conditions = [];
        if (search) {
          const searchTerms = search.split(',').map(s => s.trim()).filter(s => s.length > 0);

          if (searchTerms.length === 1) {
            conditions.push(
              sql`(${products.name} ILIKE ${`%${searchTerms[0]}%`} OR ${products.diseases}::text ILIKE ${`%${searchTerms[0]}%`})`
            );
          } else if (searchTerms.length > 1) {
            const termConditions = searchTerms.flatMap(term => [
              ilike(products.name, `%${term}%`),
              ilike(products.diseases, `%${term}%`)
            ]);
            conditions.push(or(...termConditions));
          }
        }

        let query = db.select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          imageUrl: products.imageUrl,
          diseases: products.diseases,
          activeIngredient: products.activeIngredient
        }).from(products).$dynamic();

        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }

        const basicProducts = await query.orderBy(products.name);

        // Add default values for missing columns
        return basicProducts.map(product => ({
          ...product,
          category: 'medicamento',
          precoBase: null,
          brand: null,
          dosage: null,
          prescriptionRequired: false,
          stock: 0,
          pharmacyId: pharmacyId || null,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        })) as Product[];
      }
      throw error;
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result.length > 0 ? result[0] as Product : undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = (await db.insert(products).values({
      ...product,
      diseases: product.diseases || [],
      activeIngredient: product.activeIngredient || "",
      imageUrl: product.imageUrl || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()) as Product[];

    if (result.length === 0) {
      throw new Error("Failed to create product");
    }

    const newProduct = result[0];
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const result = (await db
      .update(products)
      .set({
        ...product,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning()) as Product[];

    if (result.length === 0) {
      throw new Error("Product not found");
    }

    const updatedProduct = result[0];
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getProductsByCategory(category: string, pharmacyId?: number): Promise<Product[]> {
    try {
      const conditions = [eq(products.category, category)];
      if (pharmacyId) {
        conditions.push(eq(products.pharmacyId, pharmacyId));
      }

      const result = await db.select().from(products)
        .where(and(...conditions))
        .orderBy(products.name);
      return result as Product[];
    } catch (error: any) {
      // If category column doesn't exist, return all products
      if (error.message?.includes('does not exist')) {
        console.log('Category column not found, returning all products');
        return this.getProducts('', pharmacyId);
      }
      throw error;
    }
  }

  async seedProducts(seedData: InsertProduct[]): Promise<void> {
    const existing = await this.getProducts();
    if (existing.length === 0) {
      await db.insert(products).values(seedData.map(product => ({
        ...product,
        createdAt: new Date(),
        updatedAt: new Date(),
      })));
    }
  }

  async getPharmacies(): Promise<Pharmacy[]> {
    return await db.select().from(pharmacies);
  }

  async getActivePharmacies(): Promise<Pharmacy[]> {
    return await db.select().from(pharmacies).where(eq(pharmacies.status, "active"));
  }

  async createPharmacy(pharmacy: any): Promise<Pharmacy> {
    const result = (await db.insert(pharmacies).values(pharmacy).returning()) as Pharmacy[];
    if (result.length === 0) throw new Error("Failed to create pharmacy");
    return result[0];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = (await db.insert(orders).values(order).returning()) as Order[];
    if (result.length === 0) throw new Error("Failed to create order");
    return result[0];
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const result = (await db.select().from(orders).where(eq(orders.id, id))) as Order[];
    return result.length > 0 ? result[0] : undefined;
  }

  async createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]> {
    if (items.length === 0) return [];
    return await db.insert(orderItems).values(items).returning();
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const order = await this.getOrder(id);
    if (!order) throw new Error("Pedido não encontrado");

    // Regra de Integridade One Health Care:
    // Se o pedido for ATM/Express e já foi aceite ou pago, o status é imutável para baixo.
    const isDigital = ["multicaixa_express", "transferencia"].includes(order.paymentMethod);
    const wasAcceptedOrPaid = order.status !== "pending" && order.status !== "rejected" || order.paymentStatus === "paid";

    if (isDigital && wasAcceptedOrPaid) {
      if (["pending", "rejected", "cancelled"].includes(status)) {
        throw new Error("Transação Garantida: Este pedido não pode ser cancelado ou revertido após aceitação do pagamento digital.");
      }
    }

    const result = (await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning()) as Order[];
    if (result.length === 0) throw new Error("Failed to update order status");
    return result[0];
  }

  async getUserOrders(userId: number): Promise<any[]> {
    console.log(`[Storage] getUserOrders called for userId: ${userId}`);
    try {
      const result = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          pharmacyId: orders.pharmacyId,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          paymentMethod: orders.paymentMethod,
          total: orders.total,
          deliveryFee: orders.deliveryFee,
          customerName: orders.customerName,
          customerPhone: orders.customerPhone,
          customerAddress: orders.customerAddress,
          customerLat: orders.customerLat,
          customerLng: orders.customerLng,
          paymentProof: orders.paymentProof,
          clientIban: orders.clientIban,
          clientMulticaixaExpress: orders.clientMulticaixaExpress,
          clientAccountName: orders.clientAccountName,
          reviewRating: orders.reviewRating,
          reviewComment: orders.reviewComment,
          reviewedAt: orders.reviewedAt,
          isLocked: orders.isLocked,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          pharmacyName: pharmacies.name,
          pharmacyPhone: pharmacies.phone,
          pharmacyAddress: pharmacies.address,
          pharmacyIban: pharmacies.iban,
          pharmacyMulticaixaExpress: pharmacies.multicaixaExpress,
          pharmacyAccountName: pharmacies.accountName,
        })
        .from(orders)
        .leftJoin(pharmacies, eq(orders.pharmacyId, pharmacies.id))
        .where(eq(orders.userId, userId))
        .orderBy(sql`${orders.createdAt} DESC`);
      console.log(`[Storage] getUserOrders success: ${result.length} orders found`);
      return result;
    } catch (error: any) {
      console.error('[Storage] getUserOrders error:', error.message);
      console.error('[Storage] Full error:', error);
      // Fallback for any database error (missing columns, connection issues, etc.)
      console.log('[Storage] Using fallback for getUserOrders due to error');
      try {
        const basicOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.userId, userId))
          .orderBy(sql`${orders.createdAt} DESC`);

        // Add default null values for missing columns
        return basicOrders.map(order => ({
          ...order,
          pharmacyName: null,
          pharmacyPhone: null,
          pharmacyAddress: null,
          pharmacyIban: null,
          pharmacyMulticaixaExpress: null,
          pharmacyAccountName: null,
          reviewRating: null,
          reviewComment: null,
          reviewedAt: null,
        }));
      } catch (fallbackError) {
        console.error('[Storage] Fallback also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  async updateOrderReview(id: number, review: { rating: number, comment: string, reviewedAt: Date }): Promise<void> {
    await db
      .update(orders)
      .set({
        reviewRating: review.rating,
        reviewComment: review.comment,
        reviewedAt: review.reviewedAt,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers);
  }

  async createAdminUser(admin: any): Promise<AdminUser> {
    const result = (await db.insert(adminUsers).values(admin).returning()) as AdminUser[];
    if (result.length === 0) throw new Error("Failed to create admin user");
    return result[0];
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getAdminAndPharmacyUsers(): Promise<User[]> {
    return await db.select().from(users).where(
      or(
        eq(users.role, 'ADMIN'),
        eq(users.role, 'FARMACIA')
      )
    );
  }

  async getClientUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'CLIENTE'));
  }

  async getPharmacyAdmins(): Promise<PharmacyAdmin[]> {
    return await db.select().from(pharmacyAdmins);
  }

  async createPharmacyAdmin(pharmacyAdmin: any): Promise<PharmacyAdmin> {
    const result = (await db.insert(pharmacyAdmins).values(pharmacyAdmin).returning()) as PharmacyAdmin[];
    if (result.length === 0) throw new Error("Failed to create pharmacy admin");
    return result[0];
  }

  async getPharmacyDiscounts(pharmacyId: number): Promise<any[]> {
    return await db
      .select({
        id: productDiscounts.id,
        pharmacyId: productDiscounts.pharmacyId,
        productId: productDiscounts.productId,
        discountPercentage: productDiscounts.discountPercentage,
        isActive: productDiscounts.isActive,
        expiresAt: productDiscounts.expiresAt,
        createdAt: productDiscounts.createdAt,
        updatedAt: productDiscounts.updatedAt,
        productName: products.name,
        productPrice: products.price,
        productImage: products.imageUrl,
      })
      .from(productDiscounts)
      .innerJoin(products, eq(productDiscounts.productId, products.id))
      .where(eq(productDiscounts.pharmacyId, pharmacyId))
      .orderBy(desc(productDiscounts.createdAt));
  }

  async getActiveDiscounts(): Promise<any[]> {
    return await db
      .select()
      .from(productDiscounts)
      .where(
        and(
          eq(productDiscounts.isActive, true),
          or(
            isNull(productDiscounts.expiresAt),
            gt(productDiscounts.expiresAt, new Date())
          )
        )
      );
  }

  async getDiscountByProduct(productId: number, pharmacyId: number): Promise<any> {
    const result = await db
      .select()
      .from(productDiscounts)
      .where(
        and(
          eq(productDiscounts.productId, productId),
          eq(productDiscounts.pharmacyId, pharmacyId)
        )
      )
      .limit(1);
    return result[0];
  }

  async createProductDiscount(discount: any): Promise<any> {
    const result = await db.insert(productDiscounts).values(discount).returning();
    return result[0];
  }

  async updateDiscountStatus(id: number, isActive: boolean): Promise<any> {
    const result = await db.update(productDiscounts).set({ isActive, updatedAt: new Date() }).where(eq(productDiscounts.id, id)).returning();
    return result[0];
  }

  async deleteDiscount(id: number): Promise<void> {
    await db.delete(productDiscounts).where(eq(productDiscounts.id, id));
  }

  async getSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }
}

export const storage = new DatabaseStorage();
