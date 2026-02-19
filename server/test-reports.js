const express = require('express');
const { openDb } = require('./database');
const reportsRoute = require('./routes/reports');


const app = express();
app.use(express.json());
// Mock auth
app.use((req, res, next) => {
    next();
});
app.use('/api/reports', reportsRoute);

const PORT = 5002;

async function testReports() {
    let server;
    try {
        const db = await openDb();
        console.log('--- Setup Test Data ---');

        const siteName = `Test Site ${Date.now()}`;
        const runResult = await db.run('INSERT INTO sites (name) VALUES (?)', [siteName]);
        const siteId = runResult.lastID;
        console.log(`Created site: ${siteName} (ID: ${siteId})`);

        const labourName = `Test Labour ${Date.now()}`;
        const labourResult = await db.run('INSERT INTO labours (name, site_id, status) VALUES (?, ?, ?)', [labourName, siteId, 'active']);
        const labourId = labourResult.lastID;
        console.log(`Created labour: ${labourName} (ID: ${labourId})`);

        const date = new Date().toISOString().split('T')[0];
        await db.run('INSERT INTO attendance (labour_id, site_id, supervisor_id, date, status) VALUES (?, ?, ?, ?, ?)',
            [labourId, siteId, 1, date, 'full']);
        console.log(`Marked attendance for labour ${labourId} on ${date}`);

        // Start server
        server = app.listen(PORT, async () => {
            console.log(`Test server running on port ${PORT}`);

            console.log('--- Testing API ---');
            try {
                const res = await fetch(`http://localhost:${PORT}/api/reports/site-attendance?date=${date}`);
                if (!res.ok) throw new Error(`API returned ${res.status}`);

                const data = await res.json();
                const report = data.find(r => r.site_id === siteId);

                if (report) {
                    console.log('Report found for test site:');
                    console.log(JSON.stringify(report, null, 2));

                    if (report.total_labourers === 1 && report.present_count === 1 && report.is_submitted === 0) {
                        console.log('SUCCESS: Data matches expected values.');
                    } else {
                        console.error('FAILURE: Data mismatch.');
                    }
                } else {
                    console.error('FAILURE: Report for test site not found.');
                }

                // Test submission
                await db.run('INSERT INTO daily_site_attendance_status (site_id, date, is_locked) VALUES (?, ?, 1)', [siteId, date]);
                console.log('Added daily site submission status.');

                const res2 = await fetch(`http://localhost:${PORT}/api/reports/site-attendance?date=${date}`);
                const data2 = await res2.json();
                const report2 = data2.find(r => r.site_id === siteId);

                if (report2 && report2.is_submitted === 1) {
                    console.log('SUCCESS: Submission status reflected.');
                } else {
                    console.error('FAILURE: Submission status not reflected.', report2);
                }

            } catch (e) {
                console.error('Fetch error:', e);
            } finally {
                server.close();
            }
        });

    } catch (err) {
        console.error('Test setup failed:', err);
        if (server) server.close();
    }
}

testReports();
