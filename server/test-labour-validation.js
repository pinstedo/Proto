const BASE_URL = 'http://localhost:5006/api';

async function verifyLabourValidation() {
    console.log('--- Starting Labour Validation Verification ---');

    // 1. Setup: Create a unique phone number and aadhaar for testing
    const timestamp = Date.now();
    const uniquePhone = "9876543210";
    const uniqueAadhaar = `123456789123`;
    const invalidPhone = '12345';
    const invalidAadhaar = '123';

    let token = '';
    const adminPhone = timestamp.toString().slice(-10);
    const adminPassword = 'password123';

    try {
        // Create Admin
        await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Temp Admin', phone: adminPhone, password: adminPassword })
        });

        // Wait a bit
        await new Promise(r => setTimeout(r, 500));

        // Signin
        const signinRes = await fetch(`${BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: adminPhone, password: adminPassword })
        });
        const signinData = await signinRes.json();

        if (signinData.accessToken) {
            token = signinData.accessToken;
            console.log('Admin signed in successfully.');
        } else {
            console.log('Admin signin failed.');
            console.log('Signin response:', signinData);
        }
    } catch (e) {
        console.log('Signin error labour:', e.message);
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Test: Add Valid Labour
    console.log('\nTest 1: Add Valid Labour');
    const validLabour = {
        name: `Test Labour ${timestamp}`,
        phone: uniquePhone,
        aadhaar: uniqueAadhaar,
        site: 'Validation Site',
        rate: 15.0,
        trade: 'Tester'
    };

    try {
        const res = await fetch(`${BASE_URL}/labours`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(validLabour)
        });
        const data = await res.json();
        if (res.status === 201) {
            console.log('PASS: Valid labour added.');
        } else {
            console.log(`FAIL: Could not add valid labour. Status: ${res.status}, Error: ${data.error}`);
        }
    } catch (err) {
        console.log('FAIL: Network error on valid add', err.message);
    }

    // 3. Test: Duplicate Phone
    console.log('\nTest 2: Duplicate Phone');
    const duplicatePhoneLabour = {
        ...validLabour,
        name: 'Duplicate Phone User',
        aadhaar: (parseInt(uniqueAadhaar) + 1).toString() // Different aadhaar
    };

    try {
        const res = await fetch(`${BASE_URL}/labours`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(duplicatePhoneLabour)
        });
        const data = await res.json();
        if (res.status === 400 && data.error.includes('phone number already exists')) {
            console.log('PASS: Duplicate phone rejected.');
        } else {
            console.log(`FAIL: Duplicate phone not rejected correctly. Status: ${res.status}, Error: ${data.error}`);
        }
    } catch (err) {
        console.log('FAIL: Network error on duplicate phone', err.message);
    }

    // 4. Test: Duplicate Aadhaar
    console.log('\nTest 3: Duplicate Aadhaar');
    const duplicateAadhaarLabour = {
        ...validLabour,
        name: 'Duplicate Aadhaar User',
        phone: (parseInt(uniquePhone) + 1).toString().slice(-10) // Different phone
        // Same aadhaar as validLabour
    };

    try {
        const res = await fetch(`${BASE_URL}/labours`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(duplicateAadhaarLabour)
        });
        const data = await res.json();
        if (res.status === 400 && data.error.includes('Aadhaar number already exists')) {
            console.log('PASS: Duplicate Aadhaar rejected.');
        } else {
            console.log(`FAIL: Duplicate Aadhaar not rejected correctly. Status: ${res.status}, Error: ${data.error}`);
        }
    } catch (err) {
        console.log('FAIL: Network error on duplicate aadhaar', err.message);
    }

    // 5. Test: Invalid Phone Length
    console.log('\nTest 4: Invalid Phone Length');
    const invalidPhoneLabour = {
        ...validLabour,
        phone: invalidPhone,
        aadhaar: (parseInt(uniqueAadhaar) + 2).toString()
    };

    try {
        const res = await fetch(`${BASE_URL}/labours`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(invalidPhoneLabour)
        });
        const data = await res.json();
        if (res.status === 400 && data.error.includes('10-digit phone number')) {
            console.log('PASS: Invalid phone length rejected.');
        } else {
            console.log(`FAIL: Invalid phone length not rejected correctly. Status: ${res.status}, Error: ${data.error}`);
        }
    } catch (err) {
        console.log('FAIL: Network error on invalid phone', err.message);
    }

    // 6. Test: Invalid Aadhaar Length
    console.log('\nTest 5: Invalid Aadhaar Length');
    const invalidAadhaarLabour = {
        ...validLabour,
        phone: (parseInt(uniquePhone) + 3).toString().slice(-10),
        aadhaar: invalidAadhaar
    };

    try {
        const res = await fetch(`${BASE_URL}/labours`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(invalidAadhaarLabour)
        });
        const data = await res.json();
        if (res.status === 400 && data.error.includes('Aadhaar number must be 12 digits')) {
            console.log('PASS: Invalid Aadhaar length rejected.');
        } else {
            console.log(`FAIL: Invalid Aadhaar length not rejected correctly. Status: ${res.status}, Error: ${data.error}`);
        }
    } catch (err) {
        console.log('FAIL: Network error on invalid aadhaar', err.message);
    }
}

verifyLabourValidation();
