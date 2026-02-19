const express = require('express');
const { openDb } = require('../database');

const router = express.Router();

const { authorizeRole } = require('../middleware/auth');

// GET /api/reports/site-attendance?date=YYYY-MM-DD
router.get('/site-attendance', authorizeRole(['admin', 'supervisor']), async (req, res) => {
    try {
        const db = await openDb();
        const date = req.query.date || new Date().toISOString().split('T')[0];

        const query = `
            SELECT 
                s.id as site_id,
                s.name as site_name,
                (SELECT COUNT(*) FROM labours l WHERE l.site_id = s.id AND l.status = 'active') as total_labourers,
                (SELECT COUNT(*) FROM attendance a WHERE a.site_id = s.id AND a.date = ? AND a.status IN ('full', 'half')) as present_count,
                (SELECT COUNT(*) FROM attendance a WHERE a.site_id = s.id AND a.date = ? AND a.status = 'absent') as absent_count,
                MAX(CASE WHEN d.site_id IS NOT NULL THEN 1 ELSE 0 END) as is_submitted
            FROM sites s
            LEFT JOIN daily_site_attendance_status d ON s.id = d.site_id AND d.date = ?
            GROUP BY s.id
        `;
        const reports = await db.all(query, [date, date, date]);
        res.json(reports);
    } catch (err) {
        console.error('Error serving site attendance report:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports/labour-summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&site_id=1
router.get('/labour-summary', authorizeRole(['admin', 'supervisor']), async (req, res) => {
    try {
        const db = await openDb();
        const { startDate, endDate, site_id } = req.query;

        console.log('Fetching labour summary report for:', { startDate, endDate, site_id });

        let labourQuery = `SELECT * FROM labours`;
        const labourParams = [];

        if (site_id) {
            labourQuery += ` WHERE site_id = ?`;
            labourParams.push(site_id);
        }

        const labours = await db.all(labourQuery, labourParams);

        // Fetch food_provided status for all dates in range (or all dates if no range)
        // We'll create a map: key="site_id:date" -> value=food_provided(boolean)
        let foodStatusQuery = `SELECT site_id, date, food_provided FROM daily_site_attendance_status`;
        const foodStatusParams = [];
        const conditions = [];
        if (startDate) {
            conditions.push(`date >= ?`);
            foodStatusParams.push(startDate);
        }
        if (endDate) {
            conditions.push(`date <= ?`);
            foodStatusParams.push(endDate);
        }
        if (site_id) {
            conditions.push(`site_id = ?`);
            foodStatusParams.push(site_id);
        }
        if (conditions.length > 0) {
            foodStatusQuery += ` WHERE ` + conditions.join(' AND ');
        }

        const foodStatusRows = await db.all(foodStatusQuery, foodStatusParams);
        const foodProvidedMap = new Map(); // "site_id:date" -> true/false
        foodStatusRows.forEach(row => {
            if (row.food_provided == 1 || row.food_provided === 'true') {
                foodProvidedMap.set(`${row.site_id}:${row.date}`, true);
            }
        });

        const reports = [];

        for (const labour of labours) {
            // Attendance Stats
            // We need to count full days and half days within the range
            let attendanceQuery = `
                SELECT status, COUNT(*) as count 
                FROM attendance 
                WHERE labour_id = ? 
            `;
            const attendanceParams = [labour.id];

            if (startDate) {
                attendanceQuery += ` AND date >= ?`;
                attendanceParams.push(startDate);
            }
            if (endDate) {
                attendanceQuery += ` AND date <= ?`;
                attendanceParams.push(endDate);
            }
            if (site_id) {
                attendanceQuery += ` AND site_id = ?`; // Should we filter attendance by site too? Yes usually.
                attendanceParams.push(site_id);
            }

            attendanceQuery += ` GROUP BY status`;

            const attendanceStats = await db.all(attendanceQuery, attendanceParams);

            let fullDays = 0;
            let halfDays = 0;
            let absentDays = 0;

            attendanceStats.forEach(stat => {
                if (stat.status === 'full') fullDays = stat.count;
                else if (stat.status === 'half') halfDays = stat.count;
                else if (stat.status === 'absent') absentDays = stat.count;
            });

            // Overtime
            let overtimeQuery = `
                SELECT SUM(amount) as total_amount 
                FROM overtime 
                WHERE labour_id = ?
            `;
            const overtimeParams = [labour.id];

            if (startDate) {
                overtimeQuery += ` AND date >= ?`;
                overtimeParams.push(startDate);
            }
            if (endDate) {
                overtimeQuery += ` AND date <= ?`;
                overtimeParams.push(endDate);
            }
            // Overtime is usually site specific too, but maybe we want all overtime for the labour?
            // If filtering by site, yes.
            if (site_id) {
                overtimeQuery += ` AND site_id = ?`;
                overtimeParams.push(site_id);
            }

            const overtimeResult = await db.get(overtimeQuery, overtimeParams);
            const overtimeAmount = overtimeResult.total_amount || 0;

            // Advances
            let advanceQuery = `
                 SELECT SUM(amount) as total_amount 
                 FROM advances 
                 WHERE labour_id = ?
            `;
            const advanceParams = [labour.id];

            if (startDate) {
                advanceQuery += ` AND date >= ?`;
                advanceParams.push(startDate);
            }
            if (endDate) {
                advanceQuery += ` AND date <= ?`;
                advanceParams.push(endDate);
            }
            // Advances are not necessarily site specific in the schema (no site_id in advances table), 
            // but conceptually they might be. 
            // In the schema dump: `labour_id`, `amount`, `date`, `notes`, `created_by`, `created_at`.
            // No site_id in advances table. So we CANNOT filter advances by site_id directly.
            // We will include all advances for the labour in the period.

            const advanceResult = await db.get(advanceQuery, advanceParams);
            const advanceAmount = advanceResult.total_amount || 0;

            // Food Allowance Calculation
            // We need to fetch the specific attendance records to check dates and sites
            // attendanceStats only gave us counts by status. 
            // We need the actual dates and site_ids to check against foodProvidedMap.

            let detailedAttendanceQuery = `
                SELECT date, site_id, status
                FROM attendance
                WHERE labour_id = ? AND status IN ('full', 'half')
            `;
            const detailedParams = [labour.id];
            if (startDate) {
                detailedAttendanceQuery += ` AND date >= ?`;
                detailedParams.push(startDate);
            }
            if (endDate) {
                detailedAttendanceQuery += ` AND date <= ?`;
                detailedParams.push(endDate);
            }
            if (site_id) {
                detailedAttendanceQuery += ` AND site_id = ?`;
                detailedParams.push(site_id);
            }

            const detailedAttendance = await db.all(detailedAttendanceQuery, detailedParams);

            let foodAllowanceCount = 0;
            detailedAttendance.forEach(record => {
                const key = `${record.site_id}:${record.date}`;
                // If food was NOT provided (i.e. not in map), add allowance
                if (!foodProvidedMap.has(key)) {
                    foodAllowanceCount++;
                }
            });

            const foodAllowanceAmount = foodAllowanceCount * 70;

            // Calculation
            const hourlyRate = labour.rate || 0;
            // Full Day = 8 hours, Half Day = 4 hours
            const wage = (fullDays * 8 * hourlyRate) + (halfDays * 4 * hourlyRate);
            const netPayable = wage + overtimeAmount - advanceAmount + foodAllowanceAmount;

            reports.push({
                id: labour.id,
                name: labour.name,
                rate: hourlyRate,
                full_days: fullDays,
                half_days: halfDays,
                absent_days: absentDays,
                wage: wage,
                overtime_amount: overtimeAmount,
                advance_amount: advanceAmount,
                food_allowance_amount: foodAllowanceAmount,
                net_payable: netPayable
            });
        }

        res.json(reports);

    } catch (err) {
        console.error('Error generating labour summary report:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports/wage-month?month=YYYY-MM&site_id=OPTIONAL
router.get('/wage-month', authorizeRole(['admin', 'supervisor']), async (req, res) => {
    try {
        const db = await openDb();
        const { month, site_id } = req.query; // format: YYYY-MM

        if (!month) {
            return res.status(400).json({ error: 'Month is required (YYYY-MM)' });
        }

        const [year, monthNum] = month.split('-');
        const startDate = `${month}-01`;
        // Calculate last day of month
        const lastDay = new Date(year, monthNum, 0).getDate();
        const endDate = `${month}-${lastDay}`;
        const prevEndDate = `${month}-01`; // exclusive

        console.log('Generating wage report for:', { month, startDate, endDate, site_id });

        // 1. Get Labours (filter by site if needed)
        let labourQuery = `SELECT * FROM labours`;
        const labourParams = [];
        if (site_id) {
            labourQuery += ` WHERE site_id = ?`;
            labourParams.push(site_id);
        }
        const labours = await db.all(labourQuery, labourParams);

        // 2. Pre-fetch Food Provided Status
        const allowMap = new Map();
        const allStatus = await db.all(`SELECT site_id, date, food_provided FROM daily_site_attendance_status`);
        allStatus.forEach(row => {
            if (row.food_provided == 1 || row.food_provided === 'true') {
                allowMap.set(`${row.site_id}:${row.date}`, true);
            }
        });

        // Helper to calculate financials for a date range
        // If rangeEnd is null, it means "Before rangeStart" (Previous Balance)
        // If rangeEnd is set, it means "Between rangeStart and rangeEnd" (Current Month)
        const calculateStats = async (labour, rangeStart, rangeEnd, isPrevious) => {
            let fullDays = 0;
            let halfDays = 0;
            let foodAllowanceCount = 0;
            let wage = 0;

            // -- Attendance --
            let attQuery = `SELECT date, site_id, status FROM attendance WHERE labour_id = ?`;
            const attParams = [labour.id];

            if (isPrevious) {
                attQuery += ` AND date < ?`;
                attParams.push(rangeStart);
            } else {
                attQuery += ` AND date >= ? AND date <= ?`;
                attParams.push(rangeStart);
                attParams.push(rangeEnd);
            }

            const attendanceRecs = await db.all(attQuery, attParams);

            attendanceRecs.forEach(rec => {
                if (rec.status === 'full') fullDays++;
                if (rec.status === 'half') halfDays++;

                // Food Allowance Logic
                if ((rec.status === 'full' || rec.status === 'half') && !allowMap.has(`${rec.site_id}:${rec.date}`)) {
                    foodAllowanceCount++;
                }
            });

            const rate = labour.rate || 0;
            wage = (fullDays * 8 * rate) + (halfDays * 4 * rate);
            const foodAmount = foodAllowanceCount * 70;

            // -- Overtime --
            let otQuery = `SELECT SUM(amount) as total FROM overtime WHERE labour_id = ?`;
            const otParams = [labour.id];
            if (isPrevious) {
                otQuery += ` AND date < ?`;
                otParams.push(rangeStart);
            } else {
                otQuery += ` AND date >= ? AND date <= ?`;
                otParams.push(rangeStart);
                otParams.push(rangeEnd);
            }
            const otRes = await db.get(otQuery, otParams);
            const otAmount = otRes && otRes.total ? otRes.total : 0;

            // -- Advances --
            let advQuery = `SELECT SUM(amount) as total FROM advances WHERE labour_id = ?`;
            const advParams = [labour.id];
            if (isPrevious) {
                advQuery += ` AND date < ?`;
                advParams.push(rangeStart);
            } else {
                advQuery += ` AND date >= ? AND date <= ?`;
                advParams.push(rangeStart);
                advParams.push(rangeEnd);
            }
            const advRes = await db.get(advQuery, advParams);
            const advAmount = advRes && advRes.total ? advRes.total : 0;

            return {
                wage,
                otAmount,
                foodAmount,
                advAmount,
                fullDays,
                halfDays,
                foodAllowanceCount,
                net: wage + otAmount + foodAmount - advAmount
            };
        };

        const reports = [];

        for (const labour of labours) {
            // 1. Previous Balance (Before startDate)
            const prevStats = await calculateStats(labour, startDate, null, true);
            const previous_balance = prevStats.net;

            // 2. Current Month Stats (startDate to endDate)
            const currStats = await calculateStats(labour, startDate, endDate, false);

            reports.push({
                id: labour.id,
                name: labour.name,
                rate: labour.rate,
                site_id: labour.site_id,

                // Previous Balance
                previous_balance: previous_balance,

                // Current Month Details
                current_wage: currStats.wage,
                current_overtime_amount: currStats.otAmount,
                current_food_allowance_amount: currStats.foodAmount,
                current_advance_amount: currStats.advAmount,

                current_full_days: currStats.fullDays,
                current_half_days: currStats.halfDays,
                current_food_allowance_days: currStats.foodAllowanceCount,

                // Net for this month (Earnings - Advances)
                current_net_payable: currStats.net,

                // Total Payable
                total_payable: previous_balance + currStats.net
            });
        }

        res.json(reports);

    } catch (err) {
        console.error('Error generating wage month report:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
