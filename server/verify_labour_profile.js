const axios = require('axios');
const { openDb } = require('./database');

const API_URL = 'http://localhost:5000/api';

async function verifyLabourProfile() {
    try {
        const db = await openDb();
        console.log('1. Setting up test labour...');

        // Clean up
        await db.run("DELETE FROM labours WHERE phone = '8888888888'");

        // Create Labour
        const createRes = await axios.post(`${API_URL}/labours`, {
            name: 'Test Labour Profile',
            phone: '8888888888',
            rate: 500,
            trade: 'Helper',
            site: 'Test Site',
            site_id: 1
        }, {
            // Mock admin/supervisor role header if needed, but endpoint uses authorizeRole
            // We need a token. Let's just create directly in DB for simplicity or login as admin.
            // Let's use DB to create labour to skip auth for setup.
        });
        // Wait, axios post needs auth.
    } catch (e) {
        // Ignore checks above, let's just use DB directly for setup
    }

    try {
        const db = await openDb();
        await db.run("DELETE FROM labours WHERE phone = '8888888888'");

        const res = await db.run(
            `INSERT INTO labours (name, phone, status, rate) VALUES (?, ?, 'active', 500)`,
            ['Test Labour Profile', '8888888888']
        );
        const labourId = res.lastID;
        console.log(`   Created Labour ID: ${labourId}`);

        // Login as Labour
        console.log('2. Logging in as Labour...');
        const loginRes = await axios.post(`${API_URL}/auth/labour-signin`, {
            name: 'Test Labour Profile',
            phone: '8888888888'
        });
        const token = loginRes.data.accessToken;
        console.log('   Login Success.');

        // Update Profile
        console.log('3. Updating Profile (Image, DOB, Emergency Phone)...');
        const updateData = {
            profile_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            date_of_birth: '1995-05-15',
            emergency_phone: '100'
        };

        const updateRes = await axios.put(`${API_URL}/labours/me`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Update Success:', updateRes.status === 200);
        console.log('   Updated DOB:', updateRes.data.date_of_birth);

        // Verify persist
        console.log('4. Verifying persistence...');
        const labour = await db.get('SELECT * FROM labours WHERE id = ?', [labourId]);
        if (labour.date_of_birth === '1995-05-15' && labour.emergency_phone === '100' && labour.profile_image.startsWith('data:image')) {
            console.log('   Verification PASSED: Data persisted correctly.');
        } else {
            console.error('   Verification FAILED: Data mismatch.', labour);
        }

        console.log('VERIFICATION COMPLETE');

    } catch (err) {
        console.error('Verification Error:', err.message);
        if (err.response) console.error('Data:', err.response.data);
    }
}

verifyLabourProfile();
