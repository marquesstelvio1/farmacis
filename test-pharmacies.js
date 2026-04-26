import fetch from 'node-fetch';

async function testPharmacies() {
    try {
        console.log('Buscando farmácias...');
        const pharmaciesResponse = await fetch('http://localhost:5001/api/pharmacy/list');
        const pharmacies = await pharmaciesResponse.json();
        console.log('Farmácias:', JSON.stringify(pharmacies, null, 2));
        
        console.log('\nBuscando admins...');
        const adminsResponse = await fetch('http://localhost:5001/api/pharmacy/admins');
        const admins = await adminsResponse.json();
        console.log('Admins:', JSON.stringify(admins, null, 2));
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testPharmacies();
