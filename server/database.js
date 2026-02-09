const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function openDb() {
  return open({
    filename: './proto.db',
    driver: sqlite3.Database
  });
}

async function initDb() {
  const db = await openDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Try to add role column if it doesn't exist (for existing databases)
    -- SQLite doesn't support IF NOT EXISTS in ALTER TABLE, so we handle it gracefully
    `);

  try {
    await db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'`);
  } catch (e) {
    // Column probably already exists, ignore error
  }
  await db.exec(`
    CREATE TABLE IF NOT EXISTS labours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      aadhaar TEXT,
      site TEXT,
      site_id INTEGER REFERENCES sites(id),
      rate REAL,
      notes TEXT,
      trade TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add site_id column if it doesn't exist (for existing databases)
  try {
    await db.exec(`ALTER TABLE labours ADD COLUMN site_id INTEGER REFERENCES sites(id)`);
  } catch (e) {
    // Column probably already exists, ignore error
  }

  // Add status column if it doesn't exist
  try {
    await db.exec(`ALTER TABLE labours ADD COLUMN status TEXT DEFAULT 'active'`);
  } catch (e) {
    // Column probably already exists, ignore error
  }

  // Sites table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      description TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Junction table for site-supervisor assignments
  await db.exec(`
    CREATE TABLE IF NOT EXISTS site_supervisors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      supervisor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(site_id, supervisor_id)
    );
  `);

  // Attendance table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      labour_id INTEGER NOT NULL REFERENCES labours(id),
      site_id INTEGER NOT NULL REFERENCES sites(id),
      supervisor_id INTEGER NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      status TEXT CHECK(status IN ('full', 'half', 'absent')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(labour_id, date)
    );
  `);

  console.log('Database initialized.');
  return db;
}

module.exports = { openDb, initDb };
