const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Update bus location and optionally update today's passengers
// Update bus location and optionally update today's passengers
router.put('/buses/:id/location', authenticateToken, async (req, res) => {
  try {
    const { current_location, passengers, fuel_level } = req.body;
    const busId = parseInt(req.params.id);

    // Update bus location and fuel level
    const updatedBus = await prisma.bus.update({
      where: { 
        id: busId,
        user_id: req.user.id 
      },
      data: {
        current_location,
        fuel_level,
        updated_at: new Date()
      }
    });

    // If passenger count is provided, update daily report
    if (passengers !== undefined) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day

      // First try to update existing record
      const updatedReport = await prisma.dailyReport.updateMany({
        where: {
          bus_id: busId,
          report_date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Next day
          }
        },
        data: {
          total_passengers: passengers
        }
      });

      // If no record was updated, create a new one
      if (updatedReport.count === 0) {
        await prisma.dailyReport.create({
          data: {
            bus_id: busId,
            report_date: today,
            total_passengers: passengers
          }
        });
      }
    }

    res.json(updatedBus);
  } catch (error) {
    console.error('Error updating bus location:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Bus not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get live tracking data for all buses of the authenticated user
router.get('/live', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const buses = await prisma.bus.findMany({
      where: { user_id: req.user.id },
      include: {
        route: {
          select: {
            name: true,
            stops: true
          }
        },
        driver: {
          select: {
            name: true,
            phone: true
          }
        },
        conductor: {
          select: {
            name: true,
            phone: true
          }
        },
        tickets: {
          where: {
            journey_date: {
              gte: today,
              lt: tomorrow
            }
          },
          select: {
            id: true,
            fare: true
          }
        },
        packages: {
          where: {
            booked_at: {
              gte: today,
              lt: tomorrow
            }
          },
          select: {
            id: true
          }
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    // Format the response to match the original structure
    const formattedBuses = buses.map(bus => ({
      ...bus,
      route_name: bus.route?.name || null,
      route_stops: bus.route?.stops || null,
      driver_name: bus.driver?.name || null,
      driver_phone: bus.driver?.phone || null,
      conductor_name: bus.conductor?.name || null,
      conductor_phone: bus.conductor?.phone || null,
      today_passengers: bus.tickets.length,
      today_revenue: bus.tickets.reduce((sum, ticket) => sum + ticket.fare, 0),
      today_packages: bus.packages.length
    }));

    res.json(formattedBuses);
  } catch (error) {
    console.error('Error fetching live tracking data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;