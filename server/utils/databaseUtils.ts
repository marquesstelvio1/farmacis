import { db } from "../db";
import { sql } from "drizzle-orm";

export async function ensureProductColumns() {
  try {
    // Check if columns exist and add them if they don't
    const columnsToAdd = [
      { name: 'category', type: 'TEXT DEFAULT \'medicamento\'' },
      { name: 'brand', type: 'TEXT' },
      { name: 'dosage', type: 'TEXT' },
      { name: 'prescription_required', type: 'BOOLEAN DEFAULT false' },
      { name: 'stock', type: 'INTEGER DEFAULT 0' },
      { name: 'pharmacy_id', type: 'INTEGER' },
      { name: 'status', type: 'TEXT DEFAULT \'active\'' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
      { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()' }
    ];

    for (const column of columnsToAdd) {
      try {
        await db.execute(sql`
          ALTER TABLE products 
          ADD COLUMN IF NOT EXISTS ${sql.identifier(column.name)} ${sql.raw(column.type)}
        `);
        console.log(`Column ${column.name} ensured in products table`);
      } catch (error) {
        console.log(`Column ${column.name} might already exist or there was an error:`, error);
      }
    }

    // Create indexes for better performance
    const indexesToCreate = [
      'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
      'CREATE INDEX IF NOT EXISTS idx_products_pharmacy_id ON products(pharmacy_id)',
      'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)',
      'CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at)'
    ];

    for (const indexSQL of indexesToCreate) {
      try {
        await db.execute(sql.raw(indexSQL));
        console.log('Index created/verified');
      } catch (error) {
        console.log('Index might already exist or there was an error:', error);
      }
    }

    console.log('Product columns and indexes ensured successfully');
  } catch (error) {
    console.error('Error ensuring product columns:', error);
    throw error;
  }
}
