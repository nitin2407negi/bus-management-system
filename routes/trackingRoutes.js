const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Adjust if path differs
const { authenticateToken } = require('../middlewares/authMiddleware');

// Update bus location and optionally update today's passengers
router.put('/buses/:id/location', authenticateToken, async (req, res) => {
  try {
    const { current_location, passengers, fuel_level } = req.body;
    const busId = req.params.id;

    const [result] = await pool.execute(
      `UPDATE buses 
       SET current_location = ?, fuel_level = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`,
      [current_location, fuel_level, busId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    // If passenger count is provided, update or insert into daily_reports
    if (passengers !== undefined) {
      const today = new Date().toISOString().split('T')[0];
      await pool.execute(
        `INSERT INTO daily_reports (bus_id, report_date, total_passengers)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE total_passengers = VALUES(total_passengers)`,
        [busId, today, passengers]
      );
    }

    const [updatedBus] = await pool.execute('SELECT * FROM buses WHERE id = ?', [busId]);
    res.json(updatedBus[0]);
  } catch (error) {
    console.error('Error updating bus location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get live tracking data for all buses of the authenticated user
router.get('/live', authenticateToken, async (req, res) => {
  try {
    const [buses] = await pool.execute(
      `
      SELECT 
        b.*,
        r.name AS route_name,
        r.stops AS route_stops,
        d.name AS driver_name,
        d.phone AS driver_phone,
        c.name AS conductor_name,
        c.phone AS conductor_phone,
        COUNT(CASE WHEN t.journey_date = CURDATE() THEN t.id END) AS today_passengers,
        COALESCE(SUM(CASE WHEN t.journey_date = CURDATE() THEN t.fare END), 0) AS today_revenue,
        COUNT(CASE WHEN p.booked_at >= CURDATE() AND p.booked_at < CURDATE() + INTERVAL 1 DAY THEN p.id END) AS today_packages
      FROM buses b
      LEFT JOIN routes r ON b.route_id = r.id
      LEFT JOIN drivers d ON b.driver_id = d.id
      LEFT JOIN conductors c ON b.conductor_id = c.id
      LEFT JOIN tickets t ON b.id = t.bus_id
      LEFT JOIN packages p ON b.id = p.bus_id
      WHERE b.user_id = ?
      GROUP BY b.id
      ORDER BY b.updated_at DESC
      `,
      [req.user.id]
    );

    res.json(buses);
  } catch (error) {
    console.error('Error fetching live tracking data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
