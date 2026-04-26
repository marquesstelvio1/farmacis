import 'dotenv/config';
import { db } from "./server/db";
import { adminUsers } from "./shared/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function setupSuperAdmin() {
    const email = "stelvio@farmacis.com";
    const password = "super_secure_password_123";
    const name = "Stelvio (Proprietário)";

    console.log(`Checking for super-super admin: ${email}`);

    try {
        const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);

        const hashedPassword = await bcrypt.hash(password, 10);

        if (existing.length > 0) {
            console.log("Super admin already exists. Updating to ensure System Owner status...");
            await db.update(adminUsers)
                .set({
                    isSystemOwner: true,
                    role: "super_admin",
                    name: name
                })
                .where(eq(adminUsers.email, email));
            console.log("Updated existing user to be System Owner.");
        } else {
            console.log("Creating new Super Admin...");
            await db.insert(adminUsers).values({
                email,
                password: hashedPassword,
                name,
                role: "super_admin",
                isSystemOwner: true
            });
            console.log("Created new System Owner.");
        }
    } catch (err: any) {
        if (err.message.includes("column \"is_system_owner\" does not exist")) {
            console.log("Column doesn't exist. Attempting to add it via SQL...");
            await db.execute(sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_system_owner BOOLEAN DEFAULT false NOT NULL;`);
            console.log("Column added. Re-running logic...");
            return setupSuperAdmin();
        }
        throw err;
    }
}

setupSuperAdmin().then(() => {
    console.log("Done.");
    process.exit(0);
}).catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
