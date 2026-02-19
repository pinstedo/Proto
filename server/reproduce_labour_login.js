const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function testLabourLogin() {
    console.log('--- Testing Labour Login ---');
    try {
        const body = {
            name: 'Muhammed',
            phone: '1122334455'
        };
        console.log('Attempting login with:', body);
        const res = await axios.post(`${API_URL}/auth/labour-signin`, body);
        console.log('Login Status:', res.status);
        console.log('Login Data:', res.data);

        const accessToken = res.data.accessToken;
        if (!accessToken) {
            console.error('No access token received');
            return;
        }

        console.log('\n--- Fetching Labour Details (/labours/me) ---');
        try {
            const meRes = await axios.get(`${API_URL}/labours/me`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            console.log('Me Status:', meRes.status);
            console.log('Me Data:', meRes.data);
        } catch (meErr) {
            console.error('Fetch Me Failed:', meErr.response ? meErr.response.status : meErr.message);
            if (meErr.response) {
                console.error('Error Data:', meErr.response.data);
            }
        }

    } catch (err) {
        console.error('Login Failed:', err.response ? err.response.status : err.message);
        if (err.response) {
            console.error('Error Data:', err.response.data);
        }
    }
}

testLabourLogin();
