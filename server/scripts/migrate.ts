import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionString = process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/farmacis";

async function runMigration() {
  console.log('Starting migration...');
  
  try {
    const client = postgres(connectionString);
    
    // Read and execute the migration file
    const migrationPath = join(__dirname, '../migrations/001_add_product_columns.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('Executing migration...');
    await client.unsafe(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    await client.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
