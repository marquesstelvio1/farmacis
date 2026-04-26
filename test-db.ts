import { db } from "./server/db.js";
import { users } from "./shared/schema.js";

async function run() {
    const allUsers = await db.select().from(users);
    console.log("Users in DB:", allUsers.map(u => u.id));
    process.exit();
}
run();
