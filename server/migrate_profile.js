const { openDb } = require('./database');

async function migrate() {
    try {
        const db = await openDb();
        console.log('Migrating database...');

        // Add profile_image column
        try {
            await db.run('ALTER TABLE labours ADD COLUMN profile_image TEXT');
            console.log('Added profile_image column.');
        } catch (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('profile_image column already exists.');
            } else {
                throw err;
            }
        }

        // Add age column
        try {
            await db.run('ALTER TABLE labours ADD COLUMN age INTEGER');
            console.log('Added age column.');
        } catch (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('age column already exists.');
            } else {
                throw err;
            }
        }

        // Add emergency_phone column
        try {
            await db.run('ALTER TABLE labours ADD COLUMN emergency_phone TEXT');
            console.log('Added emergency_phone column.');
        } catch (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('emergency_phone column already exists.');
            } else {
                throw err;
            }
        }

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
