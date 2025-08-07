const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Generate a simple ticket number
function generateTicketNumber() {
  return 'TKT-' + Date.now().toString().slice(-6); // Example: TKT-123456
}

// Create ticket
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { bus_id, passenger_name, passenger_phone, from_stop, to_stop, passenger_type, fare, journey_date } = req.body;

    if (!bus_id || !from_stop || !to_stop || !fare || !journey_date) {
      return res.status(400).json({ error: 'Bus, stops, fare, and journey date are required' });
    }

    const ticket_number = generateTicketNumber();

    const [result] = await pool.execute(
      'INSERT INTO tickets (bus_id, ticket_number, passenger_name, passenger_phone, from_stop, to_stop, passenger_type, fare, journey_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [bus_id, ticket_number, passenger_name, passenger_phone, from_stop, to_stop, passenger_type || 'general', fare, journey_date]
    );

    const [newTicket] = await pool.execute('SELECT * FROM tickets WHERE id = ?', [result.insertId]);
    res.status(201).json(newTicket[0]);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tickets for a specific bus
router.get('/bus/:busId', authenticateToken, async (req, res) => {
  try {
    const busId = req.params.busId;
    const { date } = req.query;

    let query = 'SELECT * FROM tickets WHERE bus_id = ?';
    let params = [busId];

    if (date) {
      query += ' AND journey_date = ?';
      params.push(date);
    }

    query += ' ORDER BY issue_time DESC';

    const [tickets] = await pool.execute(query, params);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
