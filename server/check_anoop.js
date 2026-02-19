const { openDb } = require('./database');

async function check() {
    try {
        const db = await openDb();

        console.log('--- Checking labour_refresh_tokens table ---');
        const tokenTable = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='labour_refresh_tokens'");
        console.log('Table exists:', !!tokenTable);

        console.log('\n--- All rows for name="Anoop" ---');
        const byName = await db.all("SELECT * FROM labours WHERE name = 'Anoop'");
        console.log(JSON.stringify(byName, null, 2));

        console.log('\n--- All rows for phone="9072495878" ---');
        const byPhone = await db.all("SELECT * FROM labours WHERE phone = '9072495878'");
        console.log(JSON.stringify(byPhone, null, 2));

    } catch (err) {
        console.error('Error:', err);
    }
}

check();
