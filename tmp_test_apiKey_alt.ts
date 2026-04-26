
async function test() {
    const apiKey = "vkg_live_yuu6UlOeoeGFXW1IjZ2OnTra5tvADJLn";
    const url = 'https://api.vanessa.ao/v1/inference';

    console.log('Testing connection to:', url);
    console.log('Using API key:', apiKey.substring(0, 8) + '...');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service: 'text',
                input: { text: 'Olá' },
                request_prompt: 'Responde olá',
                conversation: []
            }),
        });

        console.log('Status:', response.status);
        const data = await response.json().catch(() => ({}));
        console.log('Response body:', JSON.stringify(data, null, 2));
    } catch (err: any) {
        console.error('Fetch failed:', err.message);
    }
}

test();
