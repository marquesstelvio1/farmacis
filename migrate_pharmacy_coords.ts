import "dotenv/config";
import { pool } from "./server/db";

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log("Running migration: add_pharmacy_coordinates");
    
    // Luanda coordinates (approximate city center)
    const luandaFarms = [
      { name: "Farmácia Central", lat: -8.8139, lng: 13.2344 },
      { name: "Farmácia Luanda", lat: -8.8200, lng: 13.2300 },
      { name: "Farmácia Popular", lat: -8.8050, lng: 13.2400 },
      { name: "Farmácia LucioPeg", lat: -8.8300, lng: 13.2450 },
    ];

    // Update pharmacies with approximate coordinates
    for (const farm of luandaFarms) {
      try {
        const result = await client.query(`
          UPDATE pharmacies 
          SET lat = $1, lng = $2, address = COALESCE(address, 'Luanda, Angola')
          WHERE name ILIKE $3
          RETURNING id, name
        `, [farm.lat, farm.lng, `%${farm.name}%`]);
        
        if (result.rows.length > 0) {
          console.log(`✓ Updated coordinates for: ${result.rows[0].name}`);
        }
      } catch (e) {
        console.error(`Error updating ${farm.name}:`, e);
      }
    }

    // Update pharmacies that have NULL coordinates
    const nullCoordsResult = await client.query(`
      SELECT id, name FROM pharmacies WHERE lat IS NULL OR lng IS NULL
    `);
    
    if (nullCoordsResult.rows.length > 0) {
      console.log(`Found ${nullCoordsResult.rows.length} pharmacies with NULL coordinates`);
      
      // Set default Luanda coordinates for remaining
      await client.query(`
        UPDATE pharmacies 
        SET lat = -8.8387, lng = 13.2344
        WHERE lat IS NULL OR lng IS NULL
      `);
      console.log("✓ Set default coordinates for remaining pharmacies");
    }

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
