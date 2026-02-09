const { initDb } = require('./database');

async function migrate() {
    try {
        console.log('Starting migration...');
        await initDb();
        console.log('Migration completed.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
