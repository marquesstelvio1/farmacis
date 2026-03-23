import "dotenv/config";
import { db } from "./server/db";
import { users, orders, orderItems, orderStatusHistory, payments, pharmacyAdmins, userPaymentMethods, adminUsers } from "./shared/schema";
import { sql } from "drizzle-orm";

async function clearDB() {
    try {
        console.log("Cleaning up database...");
        // Order is important because of foreign keys
        await db.delete(orderStatusHistory);
        await db.delete(orderItems);
        await db.delete(payments);
        await db.delete(orders);
        await db.delete(pharmacyAdmins);
        await db.delete(userPaymentMethods);
        await db.delete(adminUsers);
        await db.delete(users);

        // Reset serial sequences
        const tables = ["users", "orders", "order_items", "order_status_history", "payments", "pharmacy_admins", "user_payment_methods", "admin_users"];
        for (const table of tables) {
            try {
                await db.execute(sql.raw(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1`));
            } catch (e) {
                // Ignore sequence error
            }
        }

        console.log("✓ Database cleared successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
}

clearDB();
