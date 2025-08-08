const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Get all buses with related data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      where: { user_id: req.user.id },
      include: {
        route: {
          select: {
            name: true,
            code: true
          }
        },
        driver: {
          select: {
            name: true
          }
        },
        conductor: {
          select: {
            name: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Format the response to match the original structure
    const formattedBuses = buses.map(bus => ({
      ...bus,
      route_name: bus.route?.name || null,
      route_code: bus.route?.code || null,
      driver_name: bus.driver?.name || null,
      conductor_name: bus.conductor?.name || null
    }));

    res.json(formattedBuses);
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

    const newBus = await prisma.bus.create({
      data: {
        user_id: req.user.id,
        bus_number,
        capacity,
        route_id: route_id || null,
        driver_id: driver_id || null,
        conductor_id: conductor_id || null,
        status: status || 'stopped',
        current_location: current_location || 'डिपो में'
      },
      include: {
        route: {
          select: {
            name: true
          }
        },
        driver: {
          select: {
            name: true
          }
        },
        conductor: {
          select: {
            name: true
          }
        }
      }
    });

    // Format the response to match the original structure
    const formattedBus = {
      ...newBus,
      route_name: newBus.route?.name || null,
      driver_name: newBus.driver?.name || null,
      conductor_name: newBus.conductor?.name || null
    };

    res.status(201).json(formattedBus);
  } catch (error) {
    console.error('Error creating bus:', error);
    if (error.code === 'P2002') {
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
    const busId = parseInt(req.params.id);

    const updatedBus = await prisma.bus.update({
      where: { 
        id: busId,
        user_id: req.user.id 
      },
      data: {
        bus_number,
        capacity,
        route_id: route_id || null,
        driver_id: driver_id || null,
        conductor_id: conductor_id || null,
        status,
        current_location,
        updated_at: new Date()
      },
      include: {
        route: {
          select: {
            name: true
          }
        },
        driver: {
          select: {
            name: true
          }
        },
        conductor: {
          select: {
            name: true
          }
        }
      }
    });

    // Format the response to match the original structure
    const formattedBus = {
      ...updatedBus,
      route_name: updatedBus.route?.name || null,
      driver_name: updatedBus.driver?.name || null,
      conductor_name: updatedBus.conductor?.name || null
    };

    res.json(formattedBus);
  } catch (error) {
    console.error('Error updating bus:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Bus not found' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ error: 'Bus number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete a bus
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const busId = parseInt(req.params.id);

    await prisma.bus.delete({
      where: { 
        id: busId,
        user_id: req.user.id 
      }
    });

    res.json({ message: 'Bus deleted successfully' });
  } catch (error) {
    console.error('Error deleting bus:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Bus not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

module.exports = router;