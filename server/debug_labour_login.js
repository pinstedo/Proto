const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function testLabourLogin() {
    console.log('--- Testing Labour Login Flow with EXISTING User (Anoop) ---');

    try {
        // 2. Login as Labour
        console.log('Logging in as Labour Anoop...');
        const loginRes = await axios.post(`${API_URL}/auth/labour-signin`, {
            name: 'Anoop',
            phone: '9072495878'
        });

        const { accessToken } = loginRes.data;
        console.log('Login successful. Token obtained.');

        // 3. Access /me
        console.log('Accessing /labours/me...');
        const meRes = await axios.get(`${API_URL}/labours/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        console.log('GET /me result:', meRes.status, meRes.data);

        if (meRes.data.id === 1) {
            console.log('SUCCESS: /me returned correct labour details for Anoop.');
        } else {
            console.log('FAILURE: /me returned ID', meRes.data.id, 'expected 1');
        }

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
}

testLabourLogin();
