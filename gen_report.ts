
import "dotenv/config";
import { db } from "./server/db";
import { pharmacies, pharmacyAdmins } from "./shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";

async function check() {
    let output = "PHARMACIES REPORT\n=================\n";
    try {
        const ph = await db.select().from(pharmacies);
        for (const p of ph) {
            const admins = await db.select().from(pharmacyAdmins).where(eq(pharmacyAdmins.pharmacyId, p.id));
            output += `- [ID ${p.id}] ${p.name}: ${admins.length} admin(s)\n`;
            admins.forEach(a => {
                output += `  * Admin ID ${a.id}: ${a.email} (${a.name})\n`;
            });
        }
        fs.writeFileSync("/tmp/db_report.txt", output);
        console.log("Report written to /tmp/db_report.txt");
    } catch (err: any) {
        console.error(err);
        fs.writeFileSync("/tmp/db_report.txt", "ERROR: " + err.message);
    }
    process.exit(0);
}

check();
