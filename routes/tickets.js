const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

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

    const newTicket = await prisma.ticket.create({
      data: {
        bus_id,
        ticket_number,
        passenger_name,
        passenger_phone,
        from_stop,
        to_stop,
        passenger_type: passenger_type || 'general',
        fare,
        journey_date: new Date(journey_date)
      }
    });

    res.status(201).json(newTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tickets for a specific bus
router.get('/bus/:busId', authenticateToken, async (req, res) => {
  try {
    const busId = parseInt(req.params.busId);
    const { date } = req.query;

    const where = {
      bus_id: busId
    };

    if (date) {
      where.journey_date = new Date(date);
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { issue_time: 'desc' }
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;