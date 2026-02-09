const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function test() {
    try {
        const db = await open({
            filename: path.join(__dirname, 'proto.db'),
            driver: sqlite3.Database
        });

        // 1. Check if status column exists
        console.log('Checking schema...');
        const tableInfo = await db.all("PRAGMA table_info(labours)");
        const statusCol = tableInfo.find(col => col.name === 'status');
        if (statusCol) {
            console.log('✅ Status column exists.');
        } else {
            console.error('❌ Status column MISSING.');
            return;
        }

        // 2. Insert test labour
        console.log('Inserting test labour...');
        const result = await db.run(
            `INSERT INTO labours (name, phone, trade, status) VALUES (?, ?, ?, ?)`,
            ['Test Labour', '9999999999', 'Tester', 'active']
        );
        const labourId = result.lastID;
        console.log(`Test labour inserted with ID: ${labourId}`);

        // 3. Update status (simulate API call logic directly on DB for simplicity, 
        // ideally we should curl the endpoint but this verifies the DB layer first)
        // Let's actually use fetch to test the endpoint if server is running, 
        // but given the environment, let's stick to DB verification for schema and 
        // manual verification for the full flow as per plan.

        // Wait, if I can run node, I can run a script that uses fetch against localhost:5000
        // assuming the server is running.

        // Let's just verify DB schema and basic operations.
        console.log('Updating status to terminated...');
        await db.run('UPDATE labours SET status = ? WHERE id = ?', ['terminated', labourId]);

        const updated = await db.get('SELECT * FROM labours WHERE id = ?', [labourId]);
        if (updated.status === 'terminated') {
            console.log('✅ Status updated to terminated.');
        } else {
            console.error(`❌ Failed to update status. Got: ${updated.status}`);
        }

        // Cleanup
        await db.run('DELETE FROM labours WHERE id = ?', [labourId]);
        console.log('Test labour deleted.');

    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();
