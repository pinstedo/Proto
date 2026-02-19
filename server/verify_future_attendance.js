const fetch = require('node-fetch');

const API_URL = 'http://127.0.0.1:5000/api';

async function testFutureDate() {
    console.log('Testing Future Date Restriction...');

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`Attempting to mark attendance for tomorrow: ${tomorrowStr}`);

    const payload = {
        records: [
            {
                labour_id: 1,
                site_id: 1,
                supervisor_id: 1,
                date: tomorrowStr,
                status: 'full'
            }
        ]
    };

    try {
        const response = await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.status === 400) {
            const data = await response.json();
            if (data.error === 'Cannot mark attendance for future dates.') {
                console.log('PASS: Correctly rejected future date.');
            } else {
                console.log('FAIL: Rejected but with unexpected error:', data.error);
            }
        } else {
            console.log(`FAIL: Expected 400 but got ${response.status}`);
            const data = await response.json();
            console.log('Response:', JSON.stringify(data));
        }
    } catch (error) {
        console.error('Error during testFutureDate:', error);
    }
}

async function testTodayDate() {
    console.log('\nTesting Today Date...');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    console.log(`Attempting to mark attendance for today: ${todayStr}`);

    const payload = {
        records: [
            {
                labour_id: 1,
                site_id: 1,
                supervisor_id: 1,
                date: todayStr,
                status: 'full'
            }
        ]
    };

    try {
        const response = await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.status === 200) {
            console.log('PASS: Accepted today date.');
        } else if (response.status === 400 || response.status === 403) {
            // Accept valid business logic rejections (like locked, etc), just ensure it's NOT "future date" error
            const data = await response.json();
            if (data.error === 'Cannot mark attendance for future dates.') {
                console.log('FAIL: Incorrectly rejected today as future date.');
            } else {
                console.log(`PASS: Logic check passed (Status ${response.status}: ${data.error})`);
            }
        } else {
            console.log(`FAIL: Unexpected status ${response.status}`);
        }

    } catch (error) {
        console.error('Error during test:', error);
    }
}

async function runTests() {
    await testFutureDate();
    await testTodayDate();
}

runTests();
