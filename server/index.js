require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./database');
const authRoutes = require('./routes/auth');
const labourRoutes = require('./routes/labours');
const dashboardRoutes = require('./routes/dashboard');
const sitesRoutes = require('./routes/sites');
const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/sites', sitesRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/labours', labourRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the Labour Management Server');
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start server
const startServer = async () => {
    try {
        await initDb();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to initialize database:', err);
    }
};

startServer();