const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function testBulkOvertime() {
    try {
        console.log('Testing Bulk Overtime Submission...');

        // 0. Authenticate
        console.log('Authenticating...');
        let token;
        const testUser = { name: 'Test User', phone: '9999999999', password: 'password123' };

        try {
            const signinResponse = await axios.post(`${API_URL}/auth/signin`, {
                phone: testUser.phone,
                password: testUser.password
            });
            token = signinResponse.data.accessToken;
            console.log('Signin successful.');
        } catch (error) {
            if (error.response && (error.response.status === 400 || error.response.status === 401 || error.response.status === 404)) {
                console.log('Signin failed, trying signup...');
                try {
                    await axios.post(`${API_URL}/auth/signup`, testUser);
                    const signinResponse = await axios.post(`${API_URL}/auth/signin`, {
                        phone: testUser.phone,
                        password: testUser.password
                    });
                    token = signinResponse.data.accessToken;
                    console.log('Signup and Signin successful.');
                } catch (signupError) {
                    console.error('Signup failed:', signupError.response ? signupError.response.data : signupError.message);
                    return;
                }
            } else {
                throw error;
            }
        }

        if (!token) {
            throw new Error('Authentication failed (no token).');
        }

        const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

        // 1. Fetch Labours
        console.log('Fetching labours...');
        const laboursResponse = await axios.get(`${API_URL}/labours`, authHeaders);
        const labours = laboursResponse.data;

        if (!labours || labours.length === 0) {
            console.error('No labours found. Cannot test overtime.');
            return;
        }

        const labour1 = labours[0];
        const labour2 = labours.length > 1 ? labours[1] : labours[0];

        console.log(`Using labour IDs: ${labour1.id}, ${labour2.id}`);

        // 2. Fetch Sites (or assume site_id from labour or 1)
        console.log('Fetching sites...');
        const sitesResponse = await axios.get(`${API_URL}/sites`, authHeaders);
        const sites = sitesResponse.data;

        let siteId = 1;
        if (sites && sites.length > 0) {
            siteId = sites[0].id;
        }
        console.log(`Using site ID: ${siteId}`);

        // 3. Create dummy data
        const date = new Date().toISOString().split('T')[0];
        const bulkData = [
            {
                labour_id: labour1.id,
                site_id: siteId,
                date: date,
                hours: 2,
                amount: 100,
                notes: 'Test bulk 1',
                created_by: 1
            },
            {
                labour_id: labour2.id,
                site_id: siteId,
                date: date,
                hours: 3.5,
                amount: 175,
                notes: 'Test bulk 2',
                created_by: 1
            }
        ];

        // 4. Send POST request
        console.log('Sending bulk data:', JSON.stringify(bulkData, null, 2));
        const response = await axios.post(`${API_URL}/overtime`, bulkData, authHeaders);

        console.log('Response status:', response.status);
        console.log('Response data:', response.data);

        if (response.status === 200 && (response.data.count === 2 || response.data.message)) {
            console.log('SUCCESS: Bulk submission successful.');
        } else {
            console.error('FAILURE: Unexpected response.');
        }

    } catch (error) {
        console.error('Error during test:', error.message);
        if (error.code) console.error('Code:', error.code);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testBulkOvertime();
