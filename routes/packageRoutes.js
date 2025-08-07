const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Adjust path if needed
const { authenticateToken } = require('../middlewares/authMiddleware');

// Utility function
function generatePackageNumber() {
  return 'PKG' + Math.floor(100000 + Math.random() * 900000);
}

// Create package booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      bus_id, sender_name, sender_phone, receiver_name, receiver_phone, 
      from_stop, to_stop, description, weight, fare 
    } = req.body;

    if (!bus_id || !sender_name || !sender_phone || !receiver_name || !receiver_phone || !from_stop || !to_stop || !fare) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const package_number = generatePackageNumber();

    const [result] = await pool.execute(
      'INSERT INTO packages (bus_id, package_number, sender_name, sender_phone, receiver_name, receiver_phone, from_stop, to_stop, description, weight, fare) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [bus_id, package_number, sender_name, sender_phone, receiver_name, receiver_phone, from_stop, to_stop, description, weight, fare]
    );

    const [newPackage] = await pool.execute('SELECT * FROM packages WHERE id = ?', [result.insertId]);
    res.status(201).json(newPackage[0]);
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get packages for a bus
router.get('/bus/:busId', authenticateToken, async (req, res) => {
  try {
    const busId = req.params.busId;
    const { status } = req.query;

    let query = 'SELECT * FROM packages WHERE bus_id = ?';
    let params = [busId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY booked_at DESC';

    const [packages] = await pool.execute(query, params);
    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update package status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const packageId = req.params.id;

    if (!['booked', 'in_transit', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [result] = await pool.execute(
      'UPDATE packages SET status = ?, delivered_at = ? WHERE id = ?',
      [status, status === 'delivered' ? new Date() : null, packageId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const [updatedPackage] = await pool.execute('SELECT * FROM packages WHERE id = ?', [packageId]);
    res.json(updatedPackage[0]);
  } catch (error) {
    console.error('Error updating package status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
