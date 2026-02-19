const { openDb } = require('./database');

async function check() {
    try {
        const db = await openDb();
        const labour = await db.get("SELECT * FROM labours WHERE status = 'active' LIMIT 1");
        console.log('Active Labour:', labour);
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
