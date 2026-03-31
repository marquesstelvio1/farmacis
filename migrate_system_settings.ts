import "dotenv/config";
import { pool } from "./server/db";

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log("Running migration: add_system_settings");
    
    // Create system_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ Created system_settings table");

    // Insert default settings
    const defaultSettings = [
      { key: 'platform_fee_percent', value: '15', description: 'Taxa da plataforma em percentagem (ex: 15 = 15%)' },
      { key: 'min_order_amount', value: '500', description: 'Valor mínimo para pedidos em AOA' },
      { key: 'delivery_fee', value: '0', description: 'Taxa de entrega padrão em AOA (0 = grátis)' },
    ];

    for (const setting of defaultSettings) {
      try {
        await client.query(`
          INSERT INTO system_settings (key, value, description)
          VALUES ($1, $2, $3)
          ON CONFLICT (key) DO NOTHING
        `, [setting.key, setting.value, setting.description]);
        console.log(`✓ Inserted setting: ${setting.key}`);
      } catch (e: any) {
        if (e.code === '23505') {
          console.log(`✓ Setting already exists: ${setting.key}`);
        } else {
          throw e;
        }
      }
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
