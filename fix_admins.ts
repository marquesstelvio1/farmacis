
import "dotenv/config";
import { db } from "./server/db";
import { pharmacies, pharmacyAdmins } from "./shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function fix() {
    try {
        const allPharmacies = await db.select().from(pharmacies);
        console.log(`Found ${allPharmacies.length} pharmacies.`);

        for (const pharmacy of allPharmacies) {
            const admins = await db
                .select()
                .from(pharmacyAdmins)
                .where(eq(pharmacyAdmins.pharmacyId, pharmacy.id));

            if (admins.length === 0) {
                console.log(`Creating default admin for ${pharmacy.name}...`);
                const hashedPassword = await bcrypt.hash("farm123", 10);
                await db.insert(pharmacyAdmins).values({
                    pharmacyId: pharmacy.id,
                    email: pharmacy.email,
                    password: hashedPassword,
                    name: `Admin ${pharmacy.name}`,
                    role: 'admin',
                });
                console.log(`✓ Admin created for ${pharmacy.name}`);
            } else {
                console.log(`- ${pharmacy.name} already has ${admins.length} admin(s).`);
            }
        }
    } catch (err) {
        console.error("Error fixing admins:", err);
    }
    process.exit(0);
}

fix();
