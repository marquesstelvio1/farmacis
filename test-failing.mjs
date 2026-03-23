async function testFailing() {
    const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            pharmacyId: 5,
            customerName: 'Usuário Teste',
            total: '1500',
            items: '[{"product":{"id":3,"name":"Loratadina 400mg","description":"Anti-inflamatório, analgésico e antitérmico para o alívio das dores de cabeça, dores musculares e febre.","price":"1500","imageUrl":"https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500&auto=format&fit=crop&q=60","diseases":["alergia","rinite","urticária"],"activeIngredient":"Loratadina"},"quantity":1}]'
        })
    });
    console.log("Status:", res.status);
    console.log("Response:", await res.json());
}
testFailing();
