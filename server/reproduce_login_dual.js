const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth/labour-signin';

async function testLogin(name, phone) {
    try {
        console.log(`Attempting login for ${name} (${phone})...`);
        const response = await axios.post(API_URL, {
            name: name,
            phone: phone
        });

        console.log(`Login Successful for ${name}!`);
        console.log('Status:', response.status);
    } catch (error) {
        if (error.response) {
            console.error(`Login Failed for ${name}!`);
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function run() {
    await testLogin('Anoop', '9072495878'); // Expect 401
    console.log('---');
    await testLogin('Fasal', '1122334455'); // Expect 200
}

run();
