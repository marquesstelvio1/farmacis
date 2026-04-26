import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function migrate() {
    try {
        console.log("Adding is_system_owner column...");
        await db.execute(sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_system_owner BOOLEAN DEFAULT false NOT NULL;`);
        console.log("Column added successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
}

migrate().then(() => process.exit(0));
