const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

(async () => {
    try {
        const db = await open({
            filename: path.join(__dirname, 'proto.db'),
            driver: sqlite3.Database
        });

        console.log('Creating overtime table...');
        await db.exec(`
            CREATE TABLE IF NOT EXISTS overtime (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                labour_id INTEGER NOT NULL REFERENCES labours(id) ON DELETE CASCADE,
                site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
                hours REAL NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                notes TEXT,
                created_by INTEGER REFERENCES users(id),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table created!');
    } catch (err) {
        console.error('Error creating table:', err);
    }
})();
