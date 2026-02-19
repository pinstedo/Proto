const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');

(async () => {
    try {
        const db = await open({
            filename: './proto.db',
            driver: sqlite3.Database
        });

        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table';");
        let output = "Tables: " + tables.map(t => t.name).join(", ") + "\n\n";

        for (const table of tables) {
            if (table.name === 'sqlite_sequence') continue;
            const schema = await db.all(`PRAGMA table_info(${table.name});`);
            output += `Schema for ${table.name}:\n`;
            output += JSON.stringify(schema, null, 2) + "\n\n";
        }

        fs.writeFileSync('schema_dump.txt', output);
        console.log("Schema dumped to schema_dump.txt");
    } catch (error) {
        console.error("Error:", error);
    }
})();
