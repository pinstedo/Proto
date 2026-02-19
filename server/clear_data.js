const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

(async () => {
    try {
        const db = await open({
            filename: path.join(__dirname, 'proto.db'),
            driver: sqlite3.Database
        });

        console.log('Clearing database data...');

        // Order matters due to foreign keys if they are enforced (sqlite default is OFF but better safe)
        // Deleting from child tables first
        const tablesToClear = [
            'overtime',
            'advances',
            'attendance',
            'daily_site_attendance_status',
            'site_supervisors',
            'labours',
            'sites'
        ];

        for (const table of tablesToClear) {
            console.log(`Clearing ${table}...`);
            await db.run(`DELETE FROM ${table}`);
            // Reset auto increment
            await db.run(`DELETE FROM sqlite_sequence WHERE name='${table}'`);
        }

        console.log('-----------------------------------');
        console.log('Business data cleared successfully.');
        console.log('User accounts (Admin/Supervisors) have been RETARDED to allow login.');
        console.log('To strictly clear EVERYTHING including users, delete the proto.db file.');
        console.log('-----------------------------------');

    } catch (err) {
        console.error('Error clearing database:', err);
    }
})();
