import { db } from "../db";
import { sql } from "drizzle-orm";

export async function ensureOrderColumns() {
  try {
    // Add is_locked column for payment immutability
    await db.execute(sql`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false NOT NULL
    `);
    console.log('Column is_locked ensured in orders table');

    // Create index for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_is_locked ON orders(is_locked)
    `);
    console.log('Index idx_orders_is_locked created/verified');

    // Add client payment details columns
    await db.execute(sql`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS client_iban TEXT
    `);
    console.log('Column client_iban ensured in orders table');

    await db.execute(sql`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS client_multicaixa_express TEXT
    `);
    console.log('Column client_multicaixa_express ensured in orders table');

    await db.execute(sql`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS client_account_name TEXT
    `);
    console.log('Column client_account_name ensured in orders table');

    await db.execute(sql`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS review_rating INTEGER
    `);
    console.log('Column review_rating ensured in orders table');

    await db.execute(sql`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS review_comment TEXT
    `);
    console.log('Column review_comment ensured in orders table');

    await db.execute(sql`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP
    `);
    console.log('Column reviewed_at ensured in orders table');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_orders_review_rating ON orders(review_rating)
    `);
    console.log('Index idx_orders_review_rating created/verified');

    console.log('Order columns and indexes ensured successfully');
  } catch (error) {
    console.error('Error ensuring order columns:', error);
    // Don't throw - allow app to continue even if column exists
  }
}

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
      { name: 'preco_base', type: 'NUMERIC' },
      { name: 'preco_portugues', type: 'NUMERIC' },
      { name: 'preco_indiano', type: 'NUMERIC' },
      { name: 'origin', type: 'TEXT' },
      { name: 'parent_product_id', type: 'INTEGER' },
      { name: 'is_main_variant', type: 'BOOLEAN DEFAULT false' },
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

export async function ensurePharmacyColumns() {
  try {
    // Add pharmacy bank details columns
    await db.execute(sql`
      ALTER TABLE pharmacies 
      ADD COLUMN IF NOT EXISTS iban TEXT
    `);
    console.log('Column iban ensured in pharmacies table');

    await db.execute(sql`
      ALTER TABLE pharmacies 
      ADD COLUMN IF NOT EXISTS multicaixa_express TEXT
    `);
    console.log('Column multicaixa_express ensured in pharmacies table');

    await db.execute(sql`
      ALTER TABLE pharmacies 
      ADD COLUMN IF NOT EXISTS account_name TEXT
    `);
    console.log('Column account_name ensured in pharmacies table');

    console.log('Pharmacy columns ensured successfully');
  } catch (error) {
    console.error('Error ensuring pharmacy columns:', error);
  }
}

export async function ensureUserColumns() {
  try {
    // Add role column for user type management
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'CLIENTE' NOT NULL
    `);
    console.log('Column role ensured in users table');

    // Create index for better performance on role queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)
    `);
    console.log('Index idx_users_role created/verified');

    console.log('User columns and indexes ensured successfully');
  } catch (error) {
    console.error('Error ensuring user columns:', error);
    // Don't throw - allow app to continue even if column exists
  }
}
