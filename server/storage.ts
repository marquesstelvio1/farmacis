import { db } from "./db";
import {
  products,
  pharmacies,
  orders,
  orderItems,
  adminUsers,
  pharmacyAdmins,
  type Product,
  type InsertProduct,
  type Pharmacy,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type AdminUser,
  type PharmacyAdmin
} from "@shared/schema";
import { eq, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // Product methods
  getProducts(search?: string, pharmacyId?: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  getProductsByCategory(category: string, pharmacyId?: number): Promise<Product[]>;
  seedProducts(products: InsertProduct[]): Promise<void>;

  // Pharmacy methods
  getPharmacies(): Promise<Pharmacy[]>;
  createPharmacy(pharmacy: any): Promise<Pharmacy>;

  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  getUserOrders(userId: number): Promise<Order[]>;

  // Admin methods
  getAdminUsers(): Promise<AdminUser[]>;
  createAdminUser(admin: any): Promise<AdminUser>;

  // Pharmacy Admin methods
  getPharmacyAdmins(): Promise<PharmacyAdmin[]>;
  createPharmacyAdmin(pharmacyAdmin: any): Promise<PharmacyAdmin>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(search?: string, pharmacyId?: number): Promise<Product[]> {
    try {
      // Try to use the full query first
      let query = db.select().from(products);
      
      if (pharmacyId) {
        query = query.where(eq(products.pharmacyId, pharmacyId));
      }
      
      if (search) {
        query = query.where(
          sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.diseases}::text ILIKE ${`%${search}%`} OR COALESCE(${products.brand}, '') ILIKE ${`%${search}%`})`
        );
      }
      
      return await query.orderBy(products.name);
    } catch (error: any) {
      // If columns don't exist, use a basic query
      if (error.message?.includes('does not exist')) {
        console.log('Using fallback query for products without new columns');
        let query = db.select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          imageUrl: products.imageUrl,
          diseases: products.diseases,
          activeIngredient: products.activeIngredient
        }).from(products);
        
        if (search) {
          query = query.where(
            sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.diseases}::text ILIKE ${`%${search}%`})`
          );
        }
        
        const basicProducts = await query.orderBy(products.name);
        
        // Add default values for missing columns
        return basicProducts.map(product => ({
          ...product,
          category: 'medicamento',
          brand: null,
          dosage: null,
          prescriptionRequired: false,
          stock: 0,
          pharmacyId: pharmacyId || null,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }));
      }
      throw error;
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...product,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    
    if (!updatedProduct) {
      throw new Error("Product not found");
    }
    
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getProductsByCategory(category: string, pharmacyId?: number): Promise<Product[]> {
    try {
      let query = db.select().from(products).where(eq(products.category, category));
      
      if (pharmacyId) {
        query = query.where(eq(products.pharmacyId, pharmacyId));
      }
      
      return await query.orderBy(products.name);
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

  async createPharmacy(pharmacy: any): Promise<Pharmacy> {
    const [newPharmacy] = await db.insert(pharmacies).values(pharmacy).returning();
    return newPharmacy;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]> {
    if (items.length === 0) return [];
    return await db.insert(orderItems).values(items).returning();
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updated] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(sql`${orders.createdAt} DESC`);
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers);
  }

  async createAdminUser(admin: any): Promise<AdminUser> {
    const [newAdmin] = await db.insert(adminUsers).values(admin).returning();
    return newAdmin;
  }

  async getPharmacyAdmins(): Promise<PharmacyAdmin[]> {
    return await db.select().from(pharmacyAdmins);
  }

  async createPharmacyAdmin(pharmacyAdmin: any): Promise<PharmacyAdmin> {
    const [newPharmacyAdmin] = await db.insert(pharmacyAdmins).values(pharmacyAdmin).returning();
    return newPharmacyAdmin;
  }
}

export const storage = new DatabaseStorage();
