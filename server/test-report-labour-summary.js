const express = require('express');
const { openDb, initDb } = require('./database');
const reportsRoute = require('./routes/reports');

// Mock App
const app = express();
app.use(express.json());
app.use((req, res, next) => { next(); }); // Mock auth
app.use('/api/reports', reportsRoute);

const PORT = 5003;

async function testLabourSummary() {
    let server;
    try {
        const db = await initDb();
        console.log('--- Setup Test Data ---');

        // Create Site
        const siteName = `Report Site ${Date.now()}`;
        const siteRes = await db.run('INSERT INTO sites (name) VALUES (?)', [siteName]);
        const siteId = siteRes.lastID;

        // Create Labour
        const labourName = `Report Labour ${Date.now()}`;
        const rate = 500;
        const labourRes = await db.run('INSERT INTO labours (name, site_id, rate, status) VALUES (?, ?, ?, ?)', [labourName, siteId, rate, 'active']);
        const labourId = labourRes.lastID;
        console.log(`Created Site: ${siteId}, Labour: ${labourId}, Rate: ${rate}`);

        // Dates
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d1 = String(today.getDate()).padStart(2, '0');
        const d2 = String(today.getDate() - 1).padStart(2, '0'); // Yesterday

        const date1 = `${y}-${m}-${d1}`;
        const date2 = `${y}-${m}-${d2}`;

        // Add Attendance
        // 1 Full Day
        await db.run('INSERT INTO attendance (labour_id, site_id, supervisor_id, date, status) VALUES (?, ?, 1, ?, ?)',
            [labourId, siteId, date1, 'full']);
        // 1 Half Day
        await db.run('INSERT INTO attendance (labour_id, site_id, supervisor_id, date, status) VALUES (?, ?, 1, ?, ?)',
            [labourId, siteId, date2, 'half']);

        console.log(`Marked Full on ${date1} and Half on ${date2}`);

        // Add Overtime
        const otAmount = 200;
        await db.run('INSERT INTO overtime (labour_id, site_id, hours, amount, date) VALUES (?, ?, 2, ?, ?)',
            [labourId, siteId, otAmount, date1]);
        console.log(`Added Overtime: ${otAmount} on ${date1}`);

        // Add Advance
        const advAmount = 100;
        await db.run('INSERT INTO advances (labour_id, amount, date) VALUES (?, ?, ?)',
            [labourId, advAmount, date1]);
        console.log(`Added Advance: ${advAmount} on ${date1}`);

        // Expected Calculation
        // Rate = 500/hr (previously daily)
        // Wage = (1 * 8 * 500) + (1 * 4 * 500) = 4000 + 2000 = 6000
        // Net = 6000 + 200 (OT) - 100 (Adv) = 6100
        const expectedNet = 6100;

        // Start Server
        server = app.listen(PORT, async () => {
            console.log(`Test server running on port ${PORT}`);

            try {
                // Fetch Report
                const url = `http://localhost:${PORT}/api/reports/labour-summary?startDate=${date2}&endDate=${date1}`;
                const res = await fetch(url);

                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(`API Error ${res.status}: ${txt}`);
                }

                const data = await res.json();
                const record = data.find(r => r.id === labourId);

                if (record) {
                    console.log('Report Record:', JSON.stringify(record, null, 2));

                    if (record.net_payable === expectedNet) {
                        console.log('SUCCESS: Calculation matches expected value.');
                    } else {
                        console.error(`FAILURE: Expected ${expectedNet}, got ${record.net_payable}`);
                    }
                } else {
                    console.error('FAILURE: Labour record not found in report.');
                }

            } catch (e) {
                console.error('Test Execution Error:', e);
            } finally {
                server.close();
            }
        });

    } catch (err) {
        console.error('Setup Error:', err);
        if (server) server.close();
    }
}

testLabourSummary();
