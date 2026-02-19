const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function createTable() {
    const db = await open({
        filename: './proto.db',
        driver: sqlite3.Database
    });

    console.log('Creating advances table...');
    await db.exec(`
    CREATE TABLE IF NOT EXISTS advances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      labour_id INTEGER NOT NULL REFERENCES labours(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
    console.log('Table created!');
}

createTable();
