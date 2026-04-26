fetch('https://farmacis-1.onrender.com/api/pharmacy/admin/login', {
    method: 'OPTIONS',
    headers: { 'Origin': 'https://farmacis-faracia.onrender.com' }
}).then(res => {
    console.log("OPTIONS status:", res.status);
    res.headers.forEach((value, key) => console.log(key, ":", value));
});

fetch('https://farmacis-1.onrender.com/api/pharmacy/admin/login', {
    method: 'POST',
    headers: { 'Origin': 'https://farmacis-faracia.onrender.com', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: "test", password: "test" })
}).then(async res => {
    console.log("POST status:", res.status);
    console.log("POST text:", await res.text());
});
