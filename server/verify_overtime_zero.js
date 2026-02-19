const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function testOvertimeZero() {
    try {
        console.log('Testing Overtime Zero Submission...');

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
        } catch (error) {
            // Assume user exists from previous tests
            try {
                await axios.post(`${API_URL}/auth/signup`, testUser);
            } catch (e) { }
            const signinResponse = await axios.post(`${API_URL}/auth/signin`, {
                phone: testUser.phone,
                password: testUser.password
            });
            token = signinResponse.data.accessToken;
        }

        const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

        // 1. Fetch Labour
        const laboursResponse = await axios.get(`${API_URL}/labours`, authHeaders);
        const labour = laboursResponse.data[0];
        const siteResponse = await axios.get(`${API_URL}/sites`, authHeaders);
        const siteId = siteResponse.data[0].id;

        const date = new Date().toISOString().split('T')[0];

        // 2. Submit 2 hours
        console.log(`Setting 2 hours for labour ${labour.id}...`);
        await axios.post(`${API_URL}/overtime`, [{
            labour_id: labour.id,
            site_id: siteId,
            date: date,
            hours: 2,
            amount: 100,
            created_by: 1
        }], authHeaders);

        // Verify
        let check = await axios.get(`${API_URL}/overtime?date=${date}&site_id=${siteId}`, authHeaders);
        let record = check.data.find(r => r.labour_id === labour.id);
        console.log('Record after 2 hours:', record.hours);

        if (record.hours !== 2) throw new Error('Failed to set 2 hours');

        // 3. Submit 0 hours
        console.log(`Setting 0 hours for labour ${labour.id}...`);
        await axios.post(`${API_URL}/overtime`, [{
            labour_id: labour.id,
            site_id: siteId,
            date: date,
            hours: 0,
            amount: 0,
            created_by: 1
        }], authHeaders);

        // Verify
        check = await axios.get(`${API_URL}/overtime?date=${date}&site_id=${siteId}`, authHeaders);
        record = check.data.find(r => r.labour_id === labour.id);

        // Backend updates to 0 (it doesn't delete currently)
        console.log('Record after 0 hours:', record ? record.hours : 'Deleted');

        if (record && record.hours === 0) {
            console.log('SUCCESS: Updated to 0 hours.');
        } else if (!record) {
            console.log('SUCCESS: Record deleted (also valid).');
        } else {
            console.error('FAILURE: Record is', record);
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error(error.response.data);
    }
}

testOvertimeZero();
