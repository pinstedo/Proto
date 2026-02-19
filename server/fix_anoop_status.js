const { openDb } = require('./database');

async function fix() {
    try {
        const db = await openDb();
        console.log('Updating Anoop status to active...');
        const result = await db.run("UPDATE labours SET status = 'active' WHERE name = 'Anoop' AND phone = '9072495878'");
        console.log(`Updated ${result.changes} row(s).`);

        const anoop = await db.get("SELECT * FROM labours WHERE name = 'Anoop' AND phone = '9072495878'");
        console.log('New status:', anoop.status);
    } catch (err) {
        console.error('Error:', err);
    }
}

fix();
