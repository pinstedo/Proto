const { openDb } = require('./database');

async function listLabours() {
    try {
        const db = await openDb();
        const labours = await db.all('SELECT id, name, phone, status FROM labours');
        console.log('Labours:', JSON.stringify(labours, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

listLabours();
