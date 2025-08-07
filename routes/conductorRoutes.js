const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Get all conductors
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [conductors] = await pool.execute(
      'SELECT * FROM conductors WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(conductors);
  } catch (error) {
    console.error('Error fetching conductors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create conductor
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, phone, experience_years, address, emergency_contact } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO conductors (user_id, name, phone, experience_years, address, emergency_contact) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, name, phone, experience_years || 0, address, emergency_contact]
    );

    const [newConductor] = await pool.execute('SELECT * FROM conductors WHERE id = ?', [result.insertId]);
    res.status(201).json(newConductor[0]);
  } catch (error) {
    console.error('Error creating conductor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update conductor
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, phone, experience_years, address, emergency_contact, active } = req.body;
    const conductorId = req.params.id;

    const [result] = await pool.execute(
      'UPDATE conductors SET name = ?, phone = ?, experience_years = ?, address = ?, emergency_contact = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [name, phone, experience_years, address, emergency_contact, active, conductorId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Conductor not found' });
    }

    const [updatedConductor] = await pool.execute('SELECT * FROM conductors WHERE id = ?', [conductorId]);
    res.json(updatedConductor[0]);
  } catch (error) {
    console.error('Error updating conductor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete conductor
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const conductorId = req.params.id;

    const [result] = await pool.execute(
      'DELETE FROM conductors WHERE id = ? AND user_id = ?',
      [conductorId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Conductor not found' });
    }

    res.json({ message: 'Conductor deleted successfully' });
  } catch (error) {
    console.error('Error deleting conductor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
