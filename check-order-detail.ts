import "dotenv/config";
import { storage } from "./server/storage.ts";

async function check() {
    const orderId = 40; // Change this to the ID from the previous output if it changes
    const order = await storage.getOrder(orderId);
    const items = await storage.getOrderItems(orderId);
    console.log("Order:", JSON.stringify(order, null, 2));
    console.log("Items:", JSON.stringify(items, null, 2));
    process.exit(0);
}

check();
