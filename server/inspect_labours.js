const { openDb } = require('./database');

async function inspect() {
    try {
        const db = await openDb();

        console.log('--- Checking labour_refresh_tokens table ---');
        const tokenTable = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='labour_refresh_tokens'");
        console.log('Table exists:', !!tokenTable);

        console.log('\n--- Checking Labours ---');
        const labours = await db.all("SELECT id, name, phone, status FROM labours");
        console.log(JSON.stringify(labours, null, 2));

        console.log('\n--- Checking specific labour (Anoop) ---');
        const anoop = await db.get("SELECT * FROM labours WHERE name = 'Anoop' AND phone = '9072495878'");
        console.log('Direct query result:', anoop);

        if (anoop) {
            console.log('Status:', JSON.stringify(anoop.status));
            console.log('Name char codes:', anoop.name.split('').map(c => c.charCodeAt(0)));
            console.log('Phone char codes:', anoop.phone.split('').map(c => c.charCodeAt(0)));
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

inspect();
