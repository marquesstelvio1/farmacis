async function run() {
    try {
        // Fetch valid pharmacies first to avoid foreign key errors
        const pharmaciesRes = await fetch("http://localhost:5000/api/pharmacies");
        const pharmacies = await pharmaciesRes.json();

        if (!pharmacies || pharmacies.length === 0) {
            console.error("No active pharmacies found!");
            return;
        }

        const validPharmacyId = pharmacies[0].id;
        console.log(`Using pharmacyId: ${validPharmacyId}`);

        const res = await fetch("http://localhost:5000/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pharmacyId: validPharmacyId,
                userId: null,
                customerName: "Cliente Teste",
                customerPhone: "+2449XXXXXXXX",
                customerAddress: "Algum Lugar",
                customerLat: "-8.83833",
                customerLng: "13.23444",
                total: 1500,
                deliveryFee: 500,
                status: "pending",
                paymentMethod: "mpesa",
                paymentStatus: "pending",
                notes: "Teste de encomenda com coordenadas e itens",
                items: [
                    { productId: 1, name: "Paracetamol 500mg", quantity: 1, price: 1500 }
                ]
            })
        });
        console.log("Status:", res.status);
        const json = await res.text();
        console.log("Response:", json);
    } catch (e) {
        console.error(e);
    }
}
run();
