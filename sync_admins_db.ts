
import "dotenv/config";
import { db } from "./server/db";
import { pharmacies, pharmacyAdmins } from "./shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function fixAdmins() {
    console.log("Starting admin synchronization...");
    try {
        const ph = await db.select().from(pharmacies);

        for (const pharmacy of ph) {
            console.log(`Checking [ID ${pharmacy.id}] ${pharmacy.name}...`);

            // Check for existing admins by pharmacyId
            const existingAdmins = await db.select().from(pharmacyAdmins).where(eq(pharmacyAdmins.pharmacyId, pharmacy.id));

            const defaultEmail = pharmacy.email;
            const hashedPassword = await bcrypt.hash("farm123", 10);

            if (existingAdmins.length === 0) {
                console.log(`- Creating new admin for ${pharmacy.name} with email ${defaultEmail}`);
                await db.insert(pharmacyAdmins).values({
                    pharmacyId: pharmacy.id,
                    email: defaultEmail,
                    password: hashedPassword,
                    name: `Admin ${pharmacy.name}`,
                    role: 'admin'
                });
            } else {
                console.log(`- Pharmacy ${pharmacy.name} already has ${existingAdmins.length} admin(s).`);
                // Optionally update the existing admin to use the pharmacy email if that's what's expected
                const admin = existingAdmins[0];
                if (admin.email !== defaultEmail) {
                    console.log(`- Note: Admin email (${admin.email}) differs from pharmacy email (${defaultEmail}).`);
                    // If you want to force change it to the pharmacy email:
                    /*
                    await db.update(pharmacyAdmins)
                      .set({ email: defaultEmail })
                      .where(eq(pharmacyAdmins.id, admin.id));
                    console.log(`  * Updated admin email to ${defaultEmail}`);
                    */
                }
            }
        }
        console.log("Sync complete!");
    } catch (err) {
        console.error("Critical sync error:", err);
    }
    process.exit(0);
}

fixAdmins();
