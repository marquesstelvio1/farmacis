import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const { db } = await import('./server/db');
    const { products } = await import('@shared/schema');
    const { sql } = await import('drizzle-orm');

    const [p] = (await db.execute(sql`SELECT * FROM products WHERE name = 'Paracetamol ' LIMIT 1`)).rows as any[];
    if (p) {
        const newVal = {
            name: p.name,
            description: p.description,
            price: '1250',
            precoBase: '1000',
            origin: 'portugues',
            dosage: p.dosage,
            category: p.category,
            imageUrl: p.imageUrl,
            stock: 50,
            pharmacyId: p.pharmacy_id || p.pharmacyId,
            status: 'active'
        };
        await db.insert(products).values(newVal as any);
        console.log('✅ Variante portuguesa criada para Paracetamol');

        // Create Indian variant too
        await db.insert(products).values({
            ...newVal,
            origin: 'indiano',
            price: '1100'
        } as any);
        console.log('✅ Variante indiana criada para Paracetamol');
    } else {
        console.log('❌ Paracetamol não encontrado');
    }
    process.exit(0);
}
run();
