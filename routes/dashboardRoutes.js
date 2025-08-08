const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // BigInt replacer function for JSON.stringify
    const bigIntReplacer = (key, value) => 
      typeof value === 'bigint' ? Number(value) : value;

    // Get today's overview stats
    const todayStats = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT b.id) as total_buses,
        COUNT(DISTINCT CASE WHEN b.status = 'running' THEN b.id END) as active_buses,
        COALESCE(SUM(CASE WHEN t.journey_date = ${today} THEN t.fare END), 0) as today_revenue,
        COUNT(CASE WHEN t.journey_date = ${today} THEN t.id END) as today_passengers,
        COUNT(CASE WHEN p.booked_at >= ${today} AND p.booked_at < ${tomorrow} THEN p.id END) as today_packages
      FROM Bus b
      LEFT JOIN Ticket t ON b.id = t.bus_id
      LEFT JOIN Package p ON b.id = p.bus_id
      WHERE b.user_id = ${req.user.id}
    `;

    // Get bus-specific stats
    const busStats = await prisma.$queryRaw`
      SELECT 
        b.id,
        b.bus_number,
        b.status,
        b.current_location,
        r.name as route_name,
        COUNT(CASE WHEN t.journey_date = ${today} THEN t.id END) as today_passengers,
        COALESCE(SUM(CASE WHEN t.journey_date = ${today} THEN t.fare END), 0) as today_revenue,
        COUNT(CASE WHEN p.booked_at >= ${today} AND p.booked_at < ${tomorrow} THEN p.id END) as today_packages
      FROM Bus b
      LEFT JOIN Route r ON b.route_id = r.id
      LEFT JOIN Ticket t ON b.id = t.bus_id
      LEFT JOIN Package p ON b.id = p.bus_id
      WHERE b.user_id = ${req.user.id}
      GROUP BY b.id
      ORDER BY today_revenue DESC
    `;

    const response = {
      overview: todayStats[0],
      buses: busStats
    };

    res.json(JSON.parse(JSON.stringify(response, bigIntReplacer)));
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get revenue report
router.get('/revenue', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, busId } = req.query;
    const tomorrow = new Date(endDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Base query
    let query = `
      SELECT 
        dates.date as date,
        COALESCE(SUM(t.fare), 0) as ticket_revenue,
        COALESCE(SUM(p.fare), 0) as package_revenue,
        COUNT(DISTINCT t.id) as total_tickets,
        COUNT(DISTINCT p.id) as total_packages
      FROM (
        SELECT DISTINCT journey_date as date FROM Ticket WHERE journey_date BETWEEN ? AND ?
        UNION
        SELECT DISTINCT DATE(booked_at) as date FROM Package WHERE DATE(booked_at) BETWEEN ? AND ?
      ) as dates
      LEFT JOIN Ticket t ON DATE(t.journey_date) = dates.date
      LEFT JOIN Package p ON DATE(p.booked_at) = dates.date
      LEFT JOIN Bus b ON (t.bus_id = b.id OR p.bus_id = b.id)
      WHERE b.user_id = ?
    `;

    // Add bus filter if provided
    if (busId) {
      query += ' AND b.id = ?';
    }

    // Add grouping and ordering
    query += ' GROUP BY dates.date ORDER BY dates.date DESC';

    // Prepare parameters
    const params = [startDate, endDate, startDate, endDate, req.user.id];
    if (busId) {
      params.push(parseInt(busId));
    }

    // Execute query
    const revenueData = await prisma.$queryRawUnsafe(query, ...params);

    // BigInt handling
    const bigIntReplacer = (key, value) => 
      typeof value === 'bigint' ? Number(value) : value;

    res.json(JSON.parse(JSON.stringify(revenueData, bigIntReplacer)));
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;