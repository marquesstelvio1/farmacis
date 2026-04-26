import { storage } from "./server/storage.ts";

async function check() {
    const products = await storage.getProducts();
    console.log("Products:", JSON.stringify(products, null, 2));
    process.exit(0);
}

check();
