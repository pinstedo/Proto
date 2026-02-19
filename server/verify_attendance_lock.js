const { openDb } = require('./database');
const fetch = require('node-fetch'); // Assuming node-fetch is available or I'll use standard http
const http = require('http');

// Helper to make HTTP requests
function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5001, // Changed to 5001 to avoid conflicts
            path: '/api/attendance' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testLocking() {
    console.log('Starting Attendance Lock Test...');
    const db = await openDb();

    // 1. Setup Data: Create a site, supervisor, and labour if needed, or use existing.
    // For simplicity, I'll insert directly into DB to ensure clean state for a specific date.
    const siteId = 999;
    const date = '2025-01-01';
    const labourId = 1; // Assuming labour 1 exists
    const supervisorId = 1; // Assuming supervisor/admin 1 exists

    // Clean up
    await db.exec(`DELETE FROM attendance WHERE site_id = ${siteId} AND date = '${date}'`);
    await db.exec(`DELETE FROM daily_site_attendance_status WHERE site_id = ${siteId} AND date = '${date}'`);

    // 2. Initial Check: Lock status should be false
    const lockRes = await request('GET', `/lock-status?site_id=${siteId}&date=${date}`);
    console.log('Initial Lock Status:', lockRes.body);
    if (lockRes.body.is_locked !== false) console.error('FAIL: Should not be locked initially');

    // 3. Submit Attendance
    const records = [{
        labour_id: labourId,
        site_id: siteId,
        supervisor_id: supervisorId,
        date: date,
        status: 'full'
    }];

    console.log('Submitting attendance...');
    const submitRes = await request('POST', '/', { records });
    console.log('Submit Response:', submitRes.status, submitRes.body);
    if (submitRes.status !== 200) console.error('FAIL: Submission failed');

    // 4. Check Lock Status: Should be true
    const lockRes2 = await request('GET', `/lock-status?site_id=${siteId}&date=${date}`);
    console.log('Post-Submit Lock Status:', lockRes2.body);
    if (lockRes2.body.is_locked !== true) console.error('FAIL: Should be locked after submission');

    // 5. Try to Submit Again: Should fail
    console.log('Attempting re-submission...');
    const submitRes2 = await request('POST', '/', { records });
    console.log('Re-submit Response Status:', submitRes2.status);
    console.log('Re-submit Response Body:', typeof submitRes2.body === 'string' ? submitRes2.body.substring(0, 200) : JSON.stringify(submitRes2.body));

    if (submitRes2.status !== 403) {
        console.error('FAIL: Re-submission should be forbidden. Status:', submitRes2.status);
    } else {
        console.log('PASS: Re-submission forbidden as expected');
    }

    console.log('Test Completed.');
}

testLocking().catch(err => console.error('Test Script Error:', err));
