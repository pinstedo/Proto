const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, body: json });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

(async () => {
    try {
        console.log('--- Verifying Overtime Feature (HTTP) ---');

        // 1. Fetch Labours
        console.log('\nFetching Labours...');
        const laboursRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/labours?status=active',
            method: 'GET'
        });

        if (laboursRes.status !== 200) throw new Error(`Failed to fetch labours: ${laboursRes.status}`);
        const labours = laboursRes.body;

        if (labours.length === 0) {
            console.log('No labours found. Skipping.');
            return;
        }

        const labour = labours[0];
        console.log(`Using Labour: ${labour.name} (ID: ${labour.id})`);

        const site_id = labour.site_id || 1;
        const today = new Date().toISOString().split('T')[0];

        // 2. Add Overtime
        console.log('\nAdding Overtime Record...');
        const addRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/overtime',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            labour_id: labour.id,
            site_id: site_id,
            date: today,
            hours: 3.5,
            amount: (labour.rate || 100) * 3.5,
            notes: 'HTTP Test Overtime',
            created_by: 1
        });

        console.log('Add Response:', addRes.status, addRes.body);

        // 3. Fetch Overtime
        console.log(`\nFetching Overtime for date ${today}...`);
        const getRes = await request({
            hostname: 'localhost',
            port: 5000,
            path: `/api/overtime?date=${today}`,
            method: 'GET'
        });

        console.log('Get Response Status:', getRes.status);
        const records = getRes.body;
        console.log('Records found:', records.length);

        const record = records.find(r => r.labour_id === labour.id);
        if (record) {
            console.log('Verification Success: Record found.');
            console.log('Hours:', record.hours, 'Amount:', record.amount);
        } else {
            console.error('Verification Failed: Record not found.');
        }

    } catch (err) {
        console.error('Verification Error:', err);
    }
})();
