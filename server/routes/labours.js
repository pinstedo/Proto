const express = require('express');
const { openDb } = require('../database');

const router = express.Router();

// Middleware to verify token would go here in a real app
// For this proto, we might skip strict token verification on every route or add it later

// List all labours
// List all labours or filter by supervisor
router.get('/', async (req, res) => {
    try {
        const db = await openDb();
        const { supervisor_id } = req.query;

        let query = 'SELECT * FROM labours';
        const params = [];

        if (supervisor_id) {
            // Get sites assigned to supervisor first
            // Or simpler: join with site_supervisors
            query = `
                SELECT l.* 
                FROM labours l
                JOIN site_supervisors ss ON l.site_id = ss.site_id
                WHERE ss.supervisor_id = ?
            `;
            params.push(supervisor_id);
        }

        query += ' ORDER BY created_at DESC';

        const labours = await db.all(query, params);
        res.json(labours);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new labour
router.post('/', async (req, res) => {
    const { name, phone, aadhaar, site, site_id, rate, notes, trade } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const db = await openDb();
        const result = await db.run(
            `INSERT INTO labours (name, phone, aadhaar, site, site_id, rate, notes, trade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, phone, aadhaar, site, site_id, rate, notes, trade]
        );

        const newLabour = await db.get(`SELECT * FROM labours WHERE id = ?`, [result.lastID]);
        res.status(201).json(newLabour);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get labour details
router.get('/:id', async (req, res) => {
    try {
        const db = await openDb();
        const labour = await db.get('SELECT * FROM labours WHERE id = ?', [req.params.id]);

        if (!labour) {
            return res.status(404).json({ error: 'Labour not found' });
        }

        res.json(labour);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update labour
router.put('/:id', async (req, res) => {
    const { name, phone, aadhaar, site, site_id, rate, notes, trade } = req.body;

    try {
        const db = await openDb();
        await db.run(
            `UPDATE labours SET name = ?, phone = ?, aadhaar = ?, site = ?, site_id = ?, rate = ?, notes = ?, trade = ? WHERE id = ?`,
            [name, phone, aadhaar, site, site_id, rate, notes, trade, req.params.id]
        );

        const updated = await db.get('SELECT * FROM labours WHERE id = ?', [req.params.id]);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete labour
router.delete('/:id', async (req, res) => {
    try {
        const db = await openDb();
        await db.run('DELETE FROM labours WHERE id = ?', [req.params.id]);
        res.json({ message: 'Labour deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Update labour status
router.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    const allowedStatuses = ['active', 'terminated', 'blacklisted'];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const db = await openDb();
        await db.run(
            'UPDATE labours SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        const updated = await db.get('SELECT * FROM labours WHERE id = ?', [req.params.id]);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
