import "dotenv/config";
import { pool } from "./server/db";

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log("Running migration: add_payment_proof");
    
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof TEXT
    `);
    console.log("✓ Added payment_proof column to orders");

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
