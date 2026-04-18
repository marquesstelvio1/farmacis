import { pool } from "./server/db";

async function main() {
  console.log("Adding/renaming columns for prices...");
  try {
    const client = await pool.connect();

    // First, let's try to rename the columns just in case the user created them as 'price_pt' and 'price_in'
    try {
      await client.query(`ALTER TABLE products RENAME COLUMN price_pt TO preco_portugues;`);
      console.log("Renamed price_pt to preco_portugues");
    } catch (e: any) {
      console.log("Could not rename price_pt (might not exist):", e.message);
    }

    try {
      await client.query(`ALTER TABLE products RENAME COLUMN price_in TO preco_indiano;`);
      console.log("Renamed price_in to preco_indiano");
    } catch (e: any) {
      console.log("Could not rename price_in (might not exist):", e.message);
    }

    // Now, we add the columns in case they still don't exist
    try {
      await client.query(`ALTER TABLE products ADD COLUMN preco_portugues NUMERIC(10,2) DEFAULT NULL;`);
      console.log("Added preco_portugues column");
    } catch (e: any) {
      console.log("Could not add preco_portugues (might already exist):", e.message);
    }

    try {
      await client.query(`ALTER TABLE products ADD COLUMN preco_indiano NUMERIC(10,2) DEFAULT NULL;`);
      console.log("Added preco_indiano column");
    } catch (e: any) {
      console.log("Could not add preco_indiano (might already exist):", e.message);
    }

    try {
      await client.query(`ALTER TABLE products ADD COLUMN preco_base NUMERIC(10,2) DEFAULT NULL;`);
      console.log("Added preco_base column");
    } catch (e: any) {
      console.log("Could not add preco_base (might already exist):", e.message);
    }

    client.release();
    console.log("Database updated successfully!");
  } catch (error) {
    console.error("Fatal error updating database:", error);
  } finally {
    process.exit(0);
  }
}

main();
