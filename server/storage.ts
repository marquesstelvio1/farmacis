import { db } from "./db";
import {
  products,
  type Product,
  type InsertProduct
} from "@shared/schema";
import { eq, ilike, sql } from "drizzle-orm";

export interface IStorage {
  getProducts(search?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  seedProducts(products: InsertProduct[]): Promise<void>;
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
}

export const storage = new DatabaseStorage();
