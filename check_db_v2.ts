
import "dotenv/config";
import { db } from "./server/db";
import { pharmacies, pharmacyAdmins } from "./shared/schema";

async function check() {
    try {
        const allPharmacies = await db.select().from(pharmacies);
        console.log("PHARMACIES IN DB:");
        allPharmacies.forEach(p => console.log(`- ID: ${p.id}, Name: ${p.name}, Email: ${p.email}`));

        const allAdmins = await db.select().from(pharmacyAdmins);
        console.log("\nADMINS IN DB:");
        allAdmins.forEach(a => console.log(`- ID: ${a.id}, PharmacyID: ${a.pharmacyId}, Email: ${a.email}, Name: ${a.name}`));

    } catch (err) {
        console.error("DB Error:", err);
    }
    process.exit(0);
}

check();
