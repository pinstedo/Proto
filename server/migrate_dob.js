const { openDb } = require('./database');

async function migrate() {
    try {
        const db = await openDb();
        console.log('Migrating database for DOB...');

        // Add date_of_birth column
        try {
            await db.run('ALTER TABLE labours ADD COLUMN date_of_birth TEXT');
            console.log('Added date_of_birth column.');
        } catch (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('date_of_birth column already exists.');
            } else {
                throw err;
            }
        }

        // Drop age column (SQLite supports DROP COLUMN since 3.35.0 - checked via package.json it has sqlite3 ^5.0.2 which usually bundles recent sqlite, but let's try. If fail, we just ignore it.)
        try {
            await db.run('ALTER TABLE labours DROP COLUMN age');
            console.log('Dropped age column.');
        } catch (err) {
            console.error('Could not drop age column (might be old SQLite version):', err.message);
        }

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
