const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth/labour-signin';

async function testLogin() {
    try {
        console.log(`Attempting login to ${API_URL}...`);
        const response = await axios.post(API_URL, {
            name: 'Anoop',
            phone: '9072495878'
        });

        console.log('Status:', response.status);
        console.log('Response:', response.data);
        console.log('Login Successful!');
    } catch (error) {
        if (error.response) {
            console.error('Login Failed!');
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testLogin();
