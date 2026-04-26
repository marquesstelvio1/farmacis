async function test() {
    const url = 'https://api.vanessa.ao/v1/inference';
    console.log('Testing connection to:', url);
    try {
        const res = await fetch(url, { method: 'HEAD' });
        console.log('Status:', res.status);
    } catch (err) {
        console.error('Fetch failed:', err.message);
    }
}
test();
