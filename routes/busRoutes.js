const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Get all buses with related data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [buses] = await pool.execute(`
      SELECT 
        b.*,
        r.name as route_name,
        r.code as route_code,
        d.name as driver_name,
        c.name as conductor_name
      FROM buses b
      LEFT JOIN routes r ON b.route_id = r.id
      LEFT JOIN drivers d ON b.driver_id = d.id
      LEFT JOIN conductors c ON b.conductor_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [req.user.id]);

    res.json(buses);
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new bus
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { bus_number, capacity, route_id, driver_id, conductor_id, status, current_location } = req.body;

    if (!bus_number || !capacity) {
      return res.status(400).json({ error: 'Bus number and capacity are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO buses (user_id, bus_number, capacity, route_id, driver_id, conductor_id, status, current_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, bus_number, capacity, route_id || null, driver_id || null, conductor_id || null, status || 'stopped', current_location || 'डिपो में']
    );

    const [newBus] = await pool.execute(`
      SELECT 
        b.*,
        r.name as route_name,
        d.name as driver_name,
        c.name as conductor_name
      FROM buses b
      LEFT JOIN routes r ON b.route_id = r.id
      LEFT JOIN drivers d ON b.driver_id = d.id
      LEFT JOIN conductors c ON b.conductor_id = c.id
      WHERE b.id = ?
    `, [result.insertId]);

    res.status(201).json(newBus[0]);
  } catch (error) {
    console.error('Error creating bus:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Bus number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update a bus
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { bus_number, capacity, route_id, driver_id, conductor_id, status, current_location } = req.body;
    const busId = req.params.id;

    const [result] = await pool.execute(
      'UPDATE buses SET bus_number = ?, capacity = ?, route_id = ?, driver_id = ?, conductor_id = ?, status = ?, current_location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [bus_number, capacity, route_id || null, driver_id || null, conductor_id || null, status, current_location, busId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    const [updatedBus] = await pool.execute(`
      SELECT 
        b.*,
        r.name as route_name,
        d.name as driver_name,
        c.name as conductor_name
      FROM buses b
      LEFT JOIN routes r ON b.route_id = r.id
      LEFT JOIN drivers d ON b.driver_id = d.id
      LEFT JOIN conductors c ON b.conductor_id = c.id
      WHERE b.id = ?
    `, [busId]);

    res.json(updatedBus[0]);
  } catch (error) {
    console.error('Error updating bus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a bus
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const busId = req.params.id;

    const [result] = await pool.execute(
      'DELETE FROM buses WHERE id = ? AND user_id = ?',
      [busId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    res.json({ message: 'Bus deleted successfully' });
  } catch (error) {
    console.error('Error deleting bus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
