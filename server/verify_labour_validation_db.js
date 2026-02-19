const { openDb } = require('./database');

async function testDbLogic() {
    console.log('Testing DB logic directly...');
    const db = await openDb();
    const timestamp = Date.now();
    const phone = timestamp.toString().slice(-10);
    const aadhaar = `12${timestamp.toString().slice(-10)}`;

    console.log(`Inserting phone: ${phone}`);
    await db.run(
        `INSERT INTO labours (name, phone, aadhaar, site, site_id, rate, notes, trade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Test DB', phone, aadhaar, 'Site', null, 15, 'Notes', 'Trade']
    );

    console.log('Checking for duplicate...');
    const existing = await db.get('SELECT id, phone FROM labours WHERE phone = ?', [phone]);
    console.log('Result:', existing);

    if (existing && existing.phone === phone) {
        console.log('PASS: Found inserted record.');
    } else {
        console.log('FAIL: Did not find inserted record.');
    }
}

testDbLogic();
