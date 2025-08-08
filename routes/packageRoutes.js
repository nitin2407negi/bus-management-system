const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

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

    const newPackage = await prisma.package.create({
      data: {
        bus_id,
        package_number,
        sender_name,
        sender_phone,
        receiver_name,
        receiver_phone,
        from_stop,
        to_stop,
        description,
        weight,
        fare,
        status: 'booked', // Default status
        booked_at: new Date()
      }
    });

    res.status(201).json(newPackage);
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get packages for a bus
router.get('/bus/:busId', authenticateToken, async (req, res) => {
  try {
    const busId = parseInt(req.params.busId);
    const { status } = req.query;

    const where = {
      bus_id: busId
    };

    if (status) {
      where.status = status;
    }

    const packages = await prisma.package.findMany({
      where,
      orderBy: { booked_at: 'desc' }
    });

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
    const packageId = parseInt(req.params.id);

    if (!['booked', 'in_transit', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: {
        status,
        delivered_at: status === 'delivered' ? new Date() : null
      }
    });

    res.json(updatedPackage);
  } catch (error) {
    console.error('Error updating package status:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Package not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

module.exports = router;