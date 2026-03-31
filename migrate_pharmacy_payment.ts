import "dotenv/config";
import { pool } from "./server/db";

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log("Running migration: add_pharmacy_payment_info");
    
    // Add IBAN column
    await client.query(`
      ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS iban TEXT;
    `);
    console.log("✓ Added iban column");

    // Add Multicaixa Express column
    await client.query(`
      ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS multicaixa_express TEXT;
    `);
    console.log("✓ Added multicaixa_express column");

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
