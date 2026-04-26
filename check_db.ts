import "dotenv/config";
import { db } from "./server/db";
import { pharmacies, pharmacyAdmins } from "./shared/schema";

async function check() {
    try {
        const allPharmacies = await db.select().from(pharmacies);
        console.log("Pharmacies:", JSON.stringify(allPharmacies.map(p => ({ id: p.id, name: p.name, email: p.email, phone: p.phone, address: p.address, status: p.status })), null, 2));

        const allAdmins = await db.select().from(pharmacyAdmins);
        console.log("Admins:", JSON.stringify(allAdmins.map(a => ({ id: a.id, pharmacyId: a.pharmacyId, email: a.email })), null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

check();
