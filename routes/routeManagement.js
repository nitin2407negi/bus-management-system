const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();


// Get all routes for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
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

    const newRoute = await prisma.route.create({
      data: {
        user_id: req.user.id,
        name,
        code,
        distance,
        base_fare,
        per_km_rate,
        stops: JSON.stringify(stops),
        active: active !== false
      }
    });

    res.status(201).json(newRoute);
  } catch (error) {
    console.error('Error creating route:', error);
    if (error.code === 'P2002') { // Prisma unique constraint error code
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
    const routeId = parseInt(req.params.id);

    // First check if route exists and belongs to user
    const existingRoute = await prisma.route.findFirst({
      where: {
        id: routeId,
        user_id: req.user.id
      }
    });

    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found or unauthorized' });
    }

    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: {
        name,
        code,
        distance,
        base_fare,
        per_km_rate,
        stops: JSON.stringify(stops),
        active,
        updated_at: new Date()
      }
    });

    res.json(updatedRoute);
  } catch (error) {
    console.error('Error updating route:', error);
    if (error.code === 'P2002') { // Prisma unique constraint violation
      res.status(400).json({ error: 'Route code already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete a route
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const routeId = parseInt(req.params.id);

    // First check if route exists and belongs to user
    const existingRoute = await prisma.route.findFirst({
      where: {
        id: routeId,
        user_id: req.user.id
      }
    });

    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found or unauthorized' });
    }

    await prisma.route.delete({
      where: { id: routeId }
    });

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
