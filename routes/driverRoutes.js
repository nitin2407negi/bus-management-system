const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Get all drivers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [drivers] = await pool.execute(
      'SELECT * FROM drivers WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create driver
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, phone, license_number, license_expiry, experience_years, address, emergency_contact } = req.body;

    if (!name || !phone || !license_number) {
      return res.status(400).json({ error: 'Name, phone, and license number are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO drivers (user_id, name, phone, license_number, license_expiry, experience_years, address, emergency_contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, name, phone, license_number, license_expiry, experience_years || 0, address, emergency_contact]
    );

    const [newDriver] = await pool.execute('SELECT * FROM drivers WHERE id = ?', [result.insertId]);
    res.status(201).json(newDriver[0]);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update driver
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, phone, license_number, license_expiry, experience_years, address, emergency_contact, active } = req.body;
    const driverId = req.params.id;

    const [result] = await pool.execute(
      'UPDATE drivers SET name = ?, phone = ?, license_number = ?, license_expiry = ?, experience_years = ?, address = ?, emergency_contact = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [name, phone, license_number, license_expiry, experience_years, address, emergency_contact, active, driverId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const [updatedDriver] = await pool.execute('SELECT * FROM drivers WHERE id = ?', [driverId]);
    res.json(updatedDriver[0]);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete driver
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const driverId = req.params.id;

    const [result] = await pool.execute(
      'DELETE FROM drivers WHERE id = ? AND user_id = ?',
      [driverId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
