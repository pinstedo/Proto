const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { initDb } = require('./database');

async function testProfileDb() {
    try {
        console.log("Initializing DB to apply schema changes...");
        const db = await initDb();

        console.log("Checking columns in users table...");
        const usersCols = await db.all("PRAGMA table_info(users)");
        const hasUserProfileImg = usersCols.some(c => c.name === 'profile_image');
        console.log(`users table has profile_image: ${hasUserProfileImg}`);

        console.log("Checking columns in labours table...");
        const laboursCols = await db.all("PRAGMA table_info(labours)");
        const hasLabourProfileImg = laboursCols.some(c => c.name === 'profile_image');
        console.log(`labours table has profile_image: ${hasLabourProfileImg}`);

        if (hasUserProfileImg && hasLabourProfileImg) {
            console.log("SUCCESS: Schema updated correctly.");
        } else {
            console.log("FAILURE: Missing columns.");
        }

    } catch (e) {
        console.error("Error testing DB", e);
    }
}

testProfileDb();
