const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { openDb } = require('../database');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'secret_key';

// Signup
router.post('/signup', async (req, res) => {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const db = await openDb();
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.run(
            `INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)`,
            [name, phone, hashedPassword, 'admin']
        );

        const user = await db.get(`SELECT * FROM users WHERE phone = ?`, [phone]);
        const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

        res.status(201).json({ message: 'User created successfully', token });
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

        const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all supervisors
router.get('/supervisors', async (req, res) => {
    try {
        const db = await openDb();
        const supervisors = await db.all(`SELECT id, name, phone FROM users WHERE role = 'supervisor'`);
        res.json(supervisors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Supervisor (Admin Only)
router.post('/add-supervisor', async (req, res) => {
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

module.exports = router;
