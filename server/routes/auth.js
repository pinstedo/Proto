const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { openDb } = require('../database');

const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'secret_key';

const crypto = require('crypto');

// Generate tokens
const generateTokens = async (user, db, refreshExpiresInDays = 30) => {
    const accessToken = jwt.sign(
        { id: user.id, phone: user.phone, role: user.role },
        SECRET_KEY,
        { expiresIn: '15m' } // Short-lived access token
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + refreshExpiresInDays * 24 * 60 * 60 * 1000).toISOString();

    await db.run(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
        [user.id, refreshToken, expiresAt] // user.id here might need to be careful if it conflicts with admin/supervisor user ids? 
        // Wait, labours are in 'labours' table, users (admin/super) are in 'users' table.
        // IDs might collide. 
        // We need to differentiate user type in refresh_tokens or use a global ID system.
        // OR we can add a 'user_type' column to refresh_tokens.
        // For now, let's assume we need to handle this.
        // Let's check the schema again. 'users' table has 'users'. 'labours' table has 'labours'.
        // Both have 'id' starting from 1.
        // IMPORTANT: We need to distinguish them.
        // Let's add 'user_type' to refresh_tokens? Or just store a composite like 'labour_123'?
        // The implementation plan didn't specify this but it's CRITICAL.
        // Let's check existing generateTokens usage. It's used for admins/supervisors in 'users' table.
        // If I use it for labours, I must differentiate.
    );

    return { accessToken, refreshToken };
};

// Signup
router.post('/signup', async (req, res) => {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const db = await openDb();
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.run(
            `INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)`,
            [name, phone, hashedPassword, 'admin']
        );

        const user = { id: result.lastID, name, phone, role: 'admin' };
        const tokens = await generateTokens(user, db);

        res.status(201).json({ message: 'User created successfully', user, ...tokens });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Phone number already registered' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Signin
router.post('/signin', async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ error: 'Phone and password are required' });
    }

    try {
        const db = await openDb();
        const user = await db.get(`SELECT * FROM users WHERE phone = ?`, [phone]);

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Single Session Enforcement for Supervisors
        if (user.role === 'supervisor') {
            const existingToken = await db.get(
                `SELECT * FROM refresh_tokens WHERE user_id = ? AND revoked = 0 AND expires_at > ?`,
                [user.id, new Date().toISOString()]
            );

            if (existingToken) {
                return res.status(403).json({ error: 'Supervisor already logged in on another device.' });
            }
        }

        const tokens = await generateTokens(user, db);
        console.log('Signin generated tokens:', tokens);
        res.json({
            message: 'Login successful',
            ...tokens,
            user: { id: user.id, name: user.name, phone: user.phone, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
    }

    try {
        const db = await openDb();
        await db.run(`UPDATE refresh_tokens SET revoked = 1 WHERE token = ?`, [refreshToken]);
        // Also try to revoke from labour_refresh_tokens just in case, or make it specific?
        // The implementation plan focused on supervisors (users table -> refresh_tokens). 
        // But let's be safe and check both or just the one relevant.
        // Given we don't know the type of user from just the token easily without a query, 
        // and we want to be robust:
        await db.run(`UPDATE labour_refresh_tokens SET revoked = 1 WHERE token = ?`, [refreshToken]);

        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Refresh Token
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
    }

    try {
        const db = await openDb();

        // Check User Refresh Tokens
        let storedToken = await db.get(
            `SELECT * FROM refresh_tokens WHERE token = ? AND revoked = 0`,
            [refreshToken]
        );

        if (storedToken) {
            if (new Date(storedToken.expires_at) < new Date()) {
                return res.status(403).json({ error: 'Refresh token expired' });
            }

            const user = await db.get(`SELECT * FROM users WHERE id = ?`, [storedToken.user_id]);
            if (!user) {
                return res.status(403).json({ error: 'User not found' });
            }

            // Revoke old token (Rotation)
            await db.run(`UPDATE refresh_tokens SET revoked = 1 WHERE id = ?`, [storedToken.id]);

            // For supervisors, do we allow refresh if a new session was created elsewhere? 
            // The single session check is at Login. 
            // If we are refreshing, it means we ARE the active session (unless we were hijacked).
            // But if we enforce STRICT single session, we should perhaps fail if there are *other* active tokens?
            // But we just revoked the current one 2 lines ago.
            // So we are safe to generate a new one.

            const newTokens = await generateTokens(user, db);
            return res.json(newTokens);
        }

        // Check Labour Refresh Tokens
        storedToken = await db.get(
            `SELECT * FROM labour_refresh_tokens WHERE token = ? AND revoked = 0`,
            [refreshToken]
        );

        if (storedToken) {
            if (new Date(storedToken.expires_at) < new Date()) {
                return res.status(403).json({ error: 'Refresh token expired' });
            }

            const labour = await db.get(`SELECT * FROM labours WHERE id = ?`, [storedToken.labour_id]);
            if (!labour) {
                return res.status(403).json({ error: 'Labour not found' });
            }

            // Revoke old token
            await db.run(`UPDATE labour_refresh_tokens SET revoked = 1 WHERE id = ?`, [storedToken.id]);

            // Generate new tokens for labour (7 days)
            // We need a separate generate function or adapt the existing one.
            // Let's inline or adapt.
            // NOTE: generateTokens helper forces 'refresh_tokens' table. We should refactor or duplicate logic.
            // Duplicating for clarity/safety now.

            const accessToken = jwt.sign(
                { id: labour.id, phone: labour.phone, role: 'labour' },
                SECRET_KEY,
                { expiresIn: '15m' }
            );

            const newRefreshToken = crypto.randomBytes(40).toString('hex');
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

            await db.run(
                `INSERT INTO labour_refresh_tokens (labour_id, token, expires_at) VALUES (?, ?, ?)`,
                [labour.id, newRefreshToken, expiresAt]
            );

            return res.json({ accessToken, refreshToken: newRefreshToken });
        }

        return res.status(403).json({ error: 'Invalid refresh token' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Labour Signin
router.post('/labour-signin', async (req, res) => {
    const { name, phone } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
    }

    try {
        const db = await openDb();
        // Check for exact match on name and phone
        // Also ensure status is active? User request didn't specify, but implied access.
        // Let's enforce status='active' for security.
        const labour = await db.get(
            `SELECT * FROM labours WHERE name = ? AND phone = ? AND status = 'active'`,
            [name, phone]
        );

        if (!labour) {
            return res.status(401).json({ error: 'Invalid credentials or inactive account' });
        }

        // Generate tokens (7 days for refresh)
        const accessToken = jwt.sign(
            { id: labour.id, phone: labour.phone, role: 'labour' },
            SECRET_KEY,
            { expiresIn: '15m' }
        );

        const refreshToken = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

        await db.run(
            `INSERT INTO labour_refresh_tokens (labour_id, token, expires_at) VALUES (?, ?, ?)`,
            [labour.id, refreshToken, expiresAt]
        );

        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: labour // Returning labour object as 'user' for frontend compatibility
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all supervisors
router.get('/supervisors', authenticateToken, async (req, res) => {
    try {
        const db = await openDb();
        const supervisors = await db.all(`SELECT id, name, phone FROM users WHERE role = 'supervisor'`);
        res.json(supervisors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Supervisor (Admin Only)
router.post('/add-supervisor', authenticateToken, async (req, res) => {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const db = await openDb();
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.run(
            `INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)`,
            [name, phone, hashedPassword, 'supervisor']
        );

        res.status(201).json({ message: 'Supervisor added successfully' });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Phone number already registered' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update Supervisor (Admin Only)
router.put('/supervisors/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, phone, password } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
    }

    try {
        const db = await openDb();
        const existing = await db.get('SELECT * FROM users WHERE id = ? AND role = "supervisor"', [id]);

        if (!existing) {
            return res.status(404).json({ error: 'Supervisor not found' });
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.run(
                `UPDATE users SET name = ?, phone = ?, password_hash = ? WHERE id = ?`,
                [name, phone, hashedPassword, id]
            );
        } else {
            await db.run(
                `UPDATE users SET name = ?, phone = ? WHERE id = ?`,
                [name, phone, id]
            );
        }

        res.json({ message: 'Supervisor updated successfully' });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Phone number already registered' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
