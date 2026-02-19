const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/attendance',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
};

function makeRequest(dateStr) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            records: [
                {
                    labour_id: 1,
                    site_id: 1,
                    supervisor_id: 1,
                    date: dateStr,
                    status: 'full'
                }
            ]
        });

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('Testing Future Date Restriction...');

    // Future Date Test
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`Attempting for tomorrow (${tomorrowStr})...`);
    try {
        const res = await makeRequest(tomorrowStr);
        if (res.status === 400 && res.data.error === 'Cannot mark attendance for future dates.') {
            console.log('PASS: Correctly rejected future date.');
        } else {
            console.log(`FAIL: Unexpected response: ${res.status}`, res.data);
        }
    } catch (e) {
        console.error('Error testing future date:', e.message);
    }

    // Today Date Test
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    console.log(`\nAttempting for today (${todayStr})...`);
    try {
        const res = await makeRequest(todayStr);
        if (res.status === 200) {
            console.log('PASS: Accepted today date.');
        } else if (res.status === 403 || res.data.error !== 'Cannot mark attendance for future dates.') {
            // Can be locked or other error, but shouldn't be "future dates" error
            console.log(`PASS: Logic check passed (Status ${res.status}: ${res.data.error})`);
        } else {
            console.log(`FAIL: Incorrectly rejected today as future date.`);
        }
    } catch (e) {
        console.error('Error testing today date:', e.message);
    }
}

runTests();
