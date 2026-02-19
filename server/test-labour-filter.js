const { openDb } = require('./database');

async function setupTestData() {
    const db = await openDb();

    // 1. Create a test site
    const siteResult = await db.run("INSERT INTO sites (name, address, description, created_by) VALUES ('Test Filter Site', '123 Test St', 'Testing Filters', 1)");
    const siteId = siteResult.lastID;
    console.log(`Created test site with ID: ${siteId}`);

    // 2. Create labours with different statuses
    const statuses = ['active', 'terminated', 'blacklisted'];
    for (const status of statuses) {
        await db.run(
            "INSERT INTO labours (name, phone, site_id, status) VALUES (?, ?, ?, ?)",
            [`Labour ${status} ${Date.now()}`, `555-${status}-${Date.now()}`, siteId, status]
        );
        console.log(`Created labour with status: ${status}`);
    }

    // 3. Ensure a supervisor exists and is assigned
    // We'll use ID 9999 for test supervisor to avoid conflict with existing users if possible, or just insert one
    await db.run("INSERT OR IGNORE INTO users (id, name, phone, password_hash, role) VALUES (9999, 'Test Supervisor', '9999999999', 'hash', 'supervisor')");
    await db.run("INSERT OR IGNORE INTO site_supervisors (site_id, supervisor_id) VALUES (?, ?)", [siteId, 9999]);

    return { siteId, supervisorId: 9999 };
}

async function logResult(labours, successMsg) {
    console.log(`Total: ${labours.length}`);
    labours.forEach(l => console.log(`- ${l.name} (${l.status})`));

    // We expect at least one active labour from our setup
    const hasActive = labours.some(l => l.status === 'active');
    const hasNonActive = labours.some(l => l.status !== 'active' && l.status !== null); // assuming default is active or we check explicitly

    if (hasActive && !hasNonActive) {
        console.log(`SUCCESS: ${successMsg}`);
    } else if (!hasActive) {
        console.log('WARNING: No active labours returned (Check setup).');
    } else {
        console.log('FAIL: Non-active labours returned.');
    }
}

async function runTests() {
    try {
        const { siteId, supervisorId } = await setupTestData();
        const db = await openDb();

        console.log('\n--- Testing SQL Queries ---');

        console.log('\n1. Attendance Screen Query (GET /sites/:id/labours)');
        const q1 = "SELECT * FROM labours WHERE site_id = ? AND status = 'active' ORDER BY created_at DESC";
        const res1 = await db.all(q1, [siteId]);
        await logResult(res1, 'Only active labours returned');

        console.log('\n2. Site Details Query (GET /sites/:id)');
        const q2 = "SELECT * FROM labours WHERE site_id = ? AND status = 'active'";
        const res2 = await db.all(q2, [siteId]);
        await logResult(res2, 'Only active labours returned in details');

        console.log('\n3. Supervisor List Query (GET /labours?supervisor_id=...)');
        const q3 = `
            SELECT l.* 
            FROM labours l
            JOIN site_supervisors ss ON l.site_id = ss.site_id
            WHERE ss.supervisor_id = ? AND l.status = 'active'
        `;
        const res3 = await db.all(q3, [supervisorId]);
        await logResult(res3, 'Only active labours returned for supervisor');

    } catch (err) {
        console.error('Test failed:', err);
    }
}

runTests();
