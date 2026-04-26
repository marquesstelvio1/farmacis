import "dotenv/config";
import { pool } from "./server/db";

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log("Running migration: add_order_payment_info");
    
    // Add pharmacy IBAN column
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS pharmacy_iban TEXT;
    `);
    console.log("✓ Added pharmacy_iban column");

    // Add pharmacy Multicaixa Express column
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS pharmacy_multicaixa_express TEXT;
    `);
    console.log("✓ Added pharmacy_multicaixa_express column");

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
