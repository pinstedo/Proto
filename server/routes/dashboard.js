const express = require('express');
const { openDb } = require('../database');

const router = express.Router();

router.get('/stats', async (req, res) => {
    try {
        const db = await openDb();

        const workersCount = await db.get('SELECT COUNT(*) as count FROM labours');
        const activeWorkersCount = await db.get('SELECT COUNT(*) as count FROM labours WHERE site_id IS NOT NULL');
        const sitesCount = await db.get('SELECT COUNT(*) as count FROM sites');

        // Placeholder for attendance until implemented
        const presentCount = { count: 0 };

        res.json({
            workers: workersCount.count,
            jobs: activeWorkersCount.count,
            attendance: presentCount.count,
            approvals: sitesCount.count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/recent', async (req, res) => {
    try {
        const db = await openDb();

        const recentLabours = await db.all('SELECT name, created_at, "labour" as type FROM labours ORDER BY created_at DESC LIMIT 5');
        const recentSites = await db.all('SELECT name, created_at, "site" as type FROM sites ORDER BY created_at DESC LIMIT 5');

        const allActivity = [...recentLabours, ...recentSites]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        const activities = allActivity.map(item => {
            if (item.type === 'labour') return `New labour added: ${item.name}`;
            if (item.type === 'site') return `New site created: ${item.name}`;
            return '';
        });

        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
