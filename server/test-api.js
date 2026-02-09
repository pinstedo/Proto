const BASE_URL = 'http://localhost:5000/api';

async function testApi() {
    try {
        console.log('--- Testing Signup ---');
        const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', phone: '9999999999', password: 'password123' })
        });
        const signupData = await signupRes.json();
        console.log('Signup:', signupRes.status, signupData.error || 'User created');

        console.log('\n--- Testing Signin ---');
        const signinRes = await fetch(`${BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '9999999999', password: 'password123' })
        });
        const signinData = await signinRes.json();
        console.log('Signin:', signinRes.status, signinData.user?.role === 'admin' ? 'Token received with Admin role' : 'Signin failed or role mismatch');

        console.log('\n--- Testing Add Supervisor ---');
        const supPhone = `88${Date.now().toString().slice(-8)}`;
        const addSupRes = await fetch(`${BASE_URL}/auth/add-supervisor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Sup User', phone: supPhone, password: 'password123' })
        });
        const addSupData = await addSupRes.json();
        console.log('Add Supervisor:', addSupRes.status, addSupData);

        console.log('\n--- Testing Supervisor Signin ---');
        const supSigninRes = await fetch(`${BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: supPhone, password: 'password123' })
        });
        const supSigninData = await supSigninRes.json();
        console.log('Supervisor Signin:', supSigninRes.status, supSigninData.user?.role === 'supervisor' ? 'Token received with Supervisor role' : 'Signin failed or role mismatch');

        console.log('\n--- Testing Add Labour ---');
        const addLabourRes = await fetch(`${BASE_URL}/labours`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${signinData.token}` // If auth was enabled
            },
            body: JSON.stringify({
                name: 'Labour 1',
                phone: '1234567890',
                aadhaar: '123412341234',
                site: 'Site A',
                rate: 15.5,
                trade: 'Carpenter'
            })
        });
        const labourData = await addLabourRes.json();
        console.log('Add Labour:', addLabourRes.status, labourData);

        console.log('\n--- Testing List Labours ---');
        const listRes = await fetch(`${BASE_URL}/labours`);
        const listData = await listRes.json();
        console.log('List Labours:', listRes.status, 'Count:', listData.length);

        console.log('\n--- Testing Dashboard Stats ---');
        const statsRes = await fetch(`${BASE_URL}/dashboard/stats`);
        const statsData = await statsRes.json();
        console.log('Stats:', statsRes.status, statsData);

    } catch (err) {
        console.error('Test failed:', err);
    }
}

testApi();
