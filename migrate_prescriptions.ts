import "dotenv/config";
import { pool } from "./server/db";

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log("Running migration: 0005_add_prescriptions");
    
    // Create prescriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        user_id INTEGER REFERENCES users(id),
        image_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        reviewed_by INTEGER,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ Created prescriptions table");

    // Add prescription_required column to order_items
    try {
      await client.query(`
        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS prescription_required BOOLEAN DEFAULT false NOT NULL
      `);
      console.log("✓ Added prescription_required column to order_items");
    } catch (e: any) {
      if (e.code === '42701') {
        console.log("✓ Column prescription_required already exists");
      } else {
        throw e;
      }
    }

    // Add prescription_id column to order_items
    try {
      await client.query(`
        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS prescription_id INTEGER REFERENCES prescriptions(id)
      `);
      console.log("✓ Added prescription_id column to order_items");
    } catch (e: any) {
      if (e.code === '42701') {
        console.log("✓ Column prescription_id already exists");
      } else {
        throw e;
      }
    }

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_prescriptions_order_id ON prescriptions(order_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status)
    `);
    console.log("✓ Created indexes");

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
