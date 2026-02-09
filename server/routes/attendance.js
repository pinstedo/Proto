const express = require('express');
const { openDb } = require('../database');

const router = express.Router();

// Get attendance for a specific site and date
router.get('/', async (req, res) => {
    const { site_id, date } = req.query;

    if (!site_id || !date) {
        return res.status(400).json({ error: 'Site ID and date are required' });
    }

    try {
        const db = await openDb();
        const attendance = await db.all(
            `SELECT * FROM attendance WHERE site_id = ? AND date = ?`,
            [site_id, date]
        );
        res.json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark attendance (batch or single)
router.post('/', async (req, res) => {
    const { records } = req.body;
    // records should be an array of { labour_id, site_id, supervisor_id, date, status }

    if (!records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: 'Invalid attendance records' });
    }

    let db;
    try {
        db = await openDb();

        // Use a transaction for batch inserts/updates
        await db.exec('BEGIN TRANSACTION');

        const stmt = await db.prepare(
            `INSERT INTO attendance (labour_id, site_id, supervisor_id, date, status) 
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(labour_id, date) DO UPDATE SET status = excluded.status`
        );

        for (const record of records) {
            const { labour_id, site_id, supervisor_id, date, status } = record;
            if (!labour_id || !site_id || !supervisor_id || !date || !status) {
                throw new Error('Missing fields in attendance record');
            }
            await stmt.run(labour_id, site_id, supervisor_id, date, status);
        }

        await stmt.finalize();
        await db.exec('COMMIT');

        res.json({ message: 'Attendance marked successfully' });
    } catch (err) {
        // Rollback on error
        if (db) {
            await db.exec('ROLLBACK');
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
