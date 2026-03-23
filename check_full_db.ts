
import "dotenv/config";
import { db } from "./server/db";
import { pharmacies, pharmacyAdmins } from "./shared/schema";
import { eq } from "drizzle-orm";

async function check() {
    try {
        const ph = await db.select().from(pharmacies);
        console.log("PHARMACIES:");
        for (const p of ph) {
            const admins = await db.select().from(pharmacyAdmins).where(eq(pharmacyAdmins.pharmacyId, p.id));
            console.log(`- [ID ${p.id}] ${p.name}: ${admins.length} admin(s)`);
            admins.forEach(a => console.log(`  * Admin ID ${a.id}: ${a.email} (${a.name})`));
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

check();
