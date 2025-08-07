const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [todayStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT b.id) as total_buses,
        COUNT(DISTINCT CASE WHEN b.status = 'running' THEN b.id END) as active_buses,
        COALESCE(SUM(CASE WHEN t.journey_date = ? THEN t.fare END), 0) as today_revenue,
        COUNT(CASE WHEN t.journey_date = ? THEN t.id END) as today_passengers,
        COUNT(CASE WHEN p.booked_at >= ? AND p.booked_at < ? + INTERVAL 1 DAY THEN p.id END) as today_packages
      FROM buses b
      LEFT JOIN tickets t ON b.id = t.bus_id
      LEFT JOIN packages p ON b.id = p.bus_id
      WHERE b.user_id = ?
    `, [today, today, today, today, req.user.id]);

    const [busStats] = await pool.execute(`
      SELECT 
        b.id,
        b.bus_number,
        b.status,
        b.current_location,
        r.name as route_name,
        COUNT(CASE WHEN t.journey_date = ? THEN t.id END) as today_passengers,
        COALESCE(SUM(CASE WHEN t.journey_date = ? THEN t.fare END), 0) as today_revenue,
        COUNT(CASE WHEN p.booked_at >= ? AND p.booked_at < ? + INTERVAL 1 DAY THEN p.id END) as today_packages
      FROM buses b
      LEFT JOIN routes r ON b.route_id = r.id
      LEFT JOIN tickets t ON b.id = t.bus_id
      LEFT JOIN packages p ON b.id = p.bus_id
      WHERE b.user_id = ?
      GROUP BY b.id
      ORDER BY today_revenue DESC
    `, [today, today, today, today, req.user.id]);

    res.json({
      overview: todayStats[0],
      buses: busStats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get revenue report
// router.get('/revenue', authenticateToken, async (req, res) => {
//   try {
//     const { startDate, endDate, busId } = req.query;
    
//     let query = `
//       SELECT 
//         DATE(COALESCE(t.journey_date, p.booked_at)) as date,
//         COALESCE(SUM(t.fare), 0) as ticket_revenue,
//         COALESCE(SUM(p.fare), 0) as package_revenue,
//         COUNT(t.id) as total_tickets,
//         COUNT(p.id) as total_packages
//       FROM (
//         SELECT DISTINCT journey_date as date FROM tickets WHERE journey_date BETWEEN ? AND ?
//         UNION
//         SELECT DISTINCT DATE(booked_at) as date FROM packages WHERE DATE(booked_at) BETWEEN ? AND ?
//       ) dates
//       LEFT JOIN tickets t ON DATE(t.journey_date) = dates.date
//       LEFT JOIN packages p ON DATE(p.booked_at) = dates.date
//       LEFT JOIN buses b ON (t.bus_id = b.id OR p.bus_id = b.id)
//       WHERE b.user_id = ?
//     `;
    
//     let params = [startDate, endDate, startDate, endDate, req.user.id];
    
//     if (busId) {
//       query += ' AND b.id = ?';
//       params.push(busId);
//     }
    
//     query += ' GROUP BY dates.date ORDER BY dates.date DESC';
    
//     const [revenueData] = await pool.execute(query, params);
//     res.json(revenueData);
//   } catch (error) {
//     console.error('Error fetching revenue report:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// Get revenue report
router.get('/revenue', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, busId } = req.query;

    let query = `
      SELECT 
        dates.date as date,
        COALESCE(SUM(t.fare), 0) as ticket_revenue,
        COALESCE(SUM(p.fare), 0) as package_revenue,
        COUNT(DISTINCT t.id) as total_tickets,
        COUNT(DISTINCT p.id) as total_packages
      FROM (
        SELECT DISTINCT journey_date as date FROM tickets WHERE journey_date BETWEEN ? AND ?
        UNION
        SELECT DISTINCT DATE(booked_at) as date FROM packages WHERE DATE(booked_at) BETWEEN ? AND ?
      ) as dates
      LEFT JOIN tickets t ON DATE(t.journey_date) = dates.date
      LEFT JOIN packages p ON DATE(p.booked_at) = dates.date
      LEFT JOIN buses b ON (t.bus_id = b.id OR p.bus_id = b.id)
      WHERE b.user_id = ?
    `;

    const params = [startDate, endDate, startDate, endDate, req.user.id];

    if (busId) {
      query += ' AND b.id = ?';
      params.push(busId);
    }

    query += ' GROUP BY dates.date ORDER BY dates.date DESC';

    const [revenueData] = await pool.execute(query, params);
    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
