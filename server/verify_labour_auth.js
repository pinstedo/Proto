const axios = require('axios');
const { openDb } = require('./database');

const BASE_URL = 'http://localhost:5000/api';

async function testLabourAuth() {
    try {
        console.log('1. Setup: Creating test labour...');
        const db = await openDb();

        // Cleanup previous test data
        await db.run("DELETE FROM labours WHERE phone = '9999999999'");

        // Create test labour
        const res = await db.run(
            `INSERT INTO labours (name, phone, status, rate, trade) VALUES (?, ?, ?, ?, ?)`,
            ['Test Labour', '9999999999', 'active', 500, 'Helper']
        );
        const labourId = res.lastID;
        console.log('   Labour created with ID:', labourId);

        console.log('\n2. Testing /labour-signin...');
        try {
            const loginRes = await axios.post(`${BASE_URL}/auth/labour-signin`, {
                name: 'Test Labour',
                phone: '9999999999'
            });
            console.log('   Login Successful!');
            console.log('   Access Token:', loginRes.data.accessToken ? 'Received' : 'Missing');
            console.log('   Refresh Token:', loginRes.data.refreshToken ? 'Received' : 'Missing');

            const { accessToken, refreshToken } = loginRes.data;

            console.log('\n3. Testing /labours/me...');
            console.log('\n3. Testing /labours/me...');
            try {
                // Call debug endpoint first
                try {
                    const debugRes = await axios.get(`${BASE_URL}/labours/debug-me`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });
                    console.log('   /debug-me Response:', debugRes.data);
                } catch (e) {
                    console.error('   /debug-me Failed:', e.message);
                }

                const meRes = await axios.get(`${BASE_URL}/labours/me`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                console.log('   /me Response:', meRes.data.name === 'Test Labour' ? 'Success' : 'Failed');
            } catch (err) {
                console.error('   /me Failed:', err.response ? err.response.data : err.message);
                // Decode token to see what ID is in it (simple base64 decode of payload)
                const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
                console.log('   Token Payload:', payload);
            }

            console.log('\n4. Testing /attendance/my-attendance...');
            const attRes = await axios.get(`${BASE_URL}/attendance/my-attendance`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            console.log('   /my-attendance Response:', Array.isArray(attRes.data) ? 'Success' : 'Failed');

            console.log('\n5. Testing Token Refresh...');
            const refreshRes = await axios.post(`${BASE_URL}/auth/refresh-token`, {
                refreshToken: refreshToken
            });
            console.log('   Refresh Response:', refreshRes.data.accessToken ? 'Success' : 'Failed');
            console.log('   New Access Token:', refreshRes.data.accessToken ? 'Received' : 'Missing');

            console.log('\n6. Testing Invalid Login...');
            try {
                await axios.post(`${BASE_URL}/auth/labour-signin`, {
                    name: 'Test Labour',
                    phone: '0000000000'
                });
                console.log('   Invalid Login: Failed (Expected error but got success)');
            } catch (err) {
                console.log('   Invalid Login: Success (Got expected 401/400)');
            }

        } catch (err) {
            console.error('   API Error:', err.response ? err.response.data : err.message);
        } finally {
            // Cleanup
            await db.run("DELETE FROM labours WHERE id = ?", [labourId]);
        }

    } catch (err) {
        console.error('Test Failed:', err);
    }
}

testLabourAuth();
