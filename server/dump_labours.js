const { openDb } = require('./database');

async function dumpLabours() {
    const db = await openDb();
    const labours = await db.all('SELECT id, name, phone, aadhaar FROM labours');
    console.log('Labours Dump:');
    console.log(JSON.stringify(labours, null, 2));
}

dumpLabours();
