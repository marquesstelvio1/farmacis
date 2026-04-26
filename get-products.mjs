async function getProducts() {
    try {
        const res = await fetch("http://localhost:5000/api/products");
        const products = await res.json();
        console.log(JSON.stringify(products, null, 2));
    } catch (e) {
        console.error(e);
    }
}
getProducts();
