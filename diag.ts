import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const { db } = await import('./server/db');
    const { sql } = await import('drizzle-orm');
    const r = await db.execute(sql`
    SELECT name, count(*) 
    FROM products 
    GROUP BY name 
    HAVING count(*) > 1
  `);
    console.log('Duplicates by name:');
    console.log(JSON.stringify(r.rows, null, 2));

    const all = await db.execute(sql`SELECT id, name, origin FROM products`);
    console.log('All products:');
    console.log(JSON.stringify(all.rows, null, 2));

    process.exit(0);
}
run();
