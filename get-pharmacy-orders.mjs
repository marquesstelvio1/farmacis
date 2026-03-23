async function checkPharmacyOrders() {
    try {
        const pharmacyId = 7;
        const res = await fetch(`http://localhost:5000/api/pharmacy/${pharmacyId}/orders`);
        const orders = await res.json();
        console.log("Latest Pharmacy Order:", JSON.stringify(orders[0], null, 2));
    } catch (e) {
        console.error(e);
    }
}
checkPharmacyOrders();
