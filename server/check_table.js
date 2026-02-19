const { openDb } = require('./database');

async function check() {
    try {
        const db = await openDb();
        const table = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='labour_refresh_tokens'");
        console.log('TABLE_EXISTS:', !!table);
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
