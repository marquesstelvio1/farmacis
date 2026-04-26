import "dotenv/config";
import { pool } from "./server/db";

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log("Running migration: add_proof_submitted_status");
    
    // Verify the column exists and has data
    const result = await client.query(`
      SELECT DISTINCT status FROM orders;
    `);
    console.log("Current order statuses:", result.rows.map(r => r.status));

    console.log("\n✅ No schema changes needed - proof_submitted is just a new status value");
    console.log("Status values: pending, accepted, awaiting_proof, proof_submitted, rejected, preparing, ready, out_for_delivery, delivered, cancelled");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
