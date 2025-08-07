// routes/routesRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const {authenticateToken} = require('../middlewares/authMiddleware');


// Get all routes for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [routes] = await pool.execute(
      'SELECT * FROM routes WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a route
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, code, distance, base_fare, per_km_rate, stops, active } = req.body;

    if (!name || !code || !distance || !base_fare || !per_km_rate || !stops) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO routes (user_id, name, code, distance, base_fare, per_km_rate, stops, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, name, code, distance, base_fare, per_km_rate, JSON.stringify(stops), active !== false]
    );

    const [newRoute] = await pool.execute('SELECT * FROM routes WHERE id = ?', [result.insertId]);
    res.status(201).json(newRoute[0]);
  } catch (error) {
    console.error('Error creating route:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Route code already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update a route
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, code, distance, base_fare, per_km_rate, stops, active } = req.body;
    const routeId = req.params.id;

    const [result] = await pool.execute(
      'UPDATE routes SET name = ?, code = ?, distance = ?, base_fare = ?, per_km_rate = ?, stops = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [name, code, distance, base_fare, per_km_rate, JSON.stringify(stops), active, routeId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Route not found or unauthorized' });
    }

    const [updatedRoute] = await pool.execute('SELECT * FROM routes WHERE id = ?', [routeId]);
    res.json(updatedRoute[0]);
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a route
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const routeId = req.params.id;

    const [result] = await pool.execute(
      'DELETE FROM routes WHERE id = ? AND user_id = ?',
      [routeId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Route not found or unauthorized' });
    }

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
