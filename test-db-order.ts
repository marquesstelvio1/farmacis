import "dotenv/config";
import { storage } from "./server/storage.ts";

async function runTest() {
    try {
        const pharmacies = await storage.getPharmacies();
        if (pharmacies.length === 0) {
            console.log("No pharmacies found. Cannot create order.");
            process.exit(1);
        }
        const pharmacyId = pharmacies[0].id;
        console.log("Using pharmacy ID:", pharmacyId);

        const orderData = {
            pharmacyId,
            userId: null,
            customerName: "Cliente Teste",
            customerPhone: "+2449XXXXXXXX",
            customerAddress: "Algum Lugar",
            total: "1500",
            deliveryFee: "0",
            status: "pending",
            paymentMethod: "mpesa",
            paymentStatus: "pending",
            notes: "Teste de encomenda"
        };

        console.log("Creating order:", orderData);
        const newOrder = await storage.createOrder(orderData as any);
        console.log("Order created:", newOrder);
    } catch (error) {
        console.error("DB Error:", error);
    }
    process.exit(0);
}

runTest();
