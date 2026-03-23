async function run() {
    try {
        const pharmaciesResponse = await fetch("http://localhost:5000/api/pharmacies");
        if (!pharmaciesResponse.ok) {
            console.log("Failed to fetch pharmacies:", await pharmaciesResponse.text());
            return;
        }
        const pharmacies = await pharmaciesResponse.json();
        const pharmacyId = pharmacies[0]?.id || 1;

        console.log("Using pharmacy:", pharmacyId, pharmacies);

        const orderResponse = await fetch("http://localhost:5000/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pharmacyId,
                userId: null,
                customerName: "Cliente",
                customerPhone: "+2449XXXXXXXX",
                customerAddress: "Endereço não fornecido",
                total: "1500",
                deliveryFee: "0",
                status: "pending",
                paymentMethod: "mpesa",
                paymentStatus: "pending",
                notes: `Pagamento via mpesa`,
            }),
        });

        console.log("Order response status:", orderResponse.status);
        const orderData = await orderResponse.json();
        console.log("Order response data:", orderData);

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
