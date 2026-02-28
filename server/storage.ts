import { db } from "./db";
import {
  products,
  pharmacies,
  orders,
  type Product,
  type InsertProduct,
  type Pharmacy,
  type Order,
  type InsertOrder
} from "@shared/schema";
import { eq, ilike, sql } from "drizzle-orm";

export interface IStorage {
  getProducts(search?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  seedProducts(products: InsertProduct[]): Promise<void>;
  
  // Pharmacy methods
  getPharmacies(): Promise<Pharmacy[]>;
  createPharmacy(pharmacy: any): Promise<Pharmacy>;
  
  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(search?: string): Promise<Product[]> {
    if (search) {
      return await db.select().from(products).where(
        sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.diseases}::text ILIKE ${`%${search}%`})`
      );
    }
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async seedProducts(seedData: InsertProduct[]): Promise<void> {
    const existing = await this.getProducts();
    if (existing.length === 0) {
      await db.insert(products).values(seedData);
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

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updated] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
