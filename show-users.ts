import "dotenv/config";
import { db } from "./server/db";
import { pharmacyAdmins, users } from "./shared/schema";
import bcrypt from "bcryptjs";

async function showAndReset() {
    // Mostrar todos os admins de farmácia
    console.log("\n=== PHARMACY ADMINS ===");
    const admins = await db.select().from(pharmacyAdmins);

    for (const admin of admins) {
        console.log(`ID: ${admin.id} | Email: ${admin.email} | Name: ${admin.name} | Role: ${admin.role}`);
    }

    // Resetar senha de todos para "farm123"
    const hashedPassword = await bcrypt.hash("farm123", 10);
    for (const admin of admins) {
        await db.update(pharmacyAdmins)
            .set({ password: hashedPassword });
        console.log(`✓ Senha resetada: ${admin.email} → farm123`);
        break; // faz apenas uma vez pois o update é global
    }

    // Mostrar todos os utilizadores normais
    console.log("\n=== REGULAR USERS ===");
    const allUsers = await db.select().from(users);
    for (const u of allUsers) {
        console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | Role: ${u.role}`);
    }

    process.exit(0);
}

showAndReset().catch(console.error);
