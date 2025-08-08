const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Get all drivers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
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

        // Convert license_expiry to proper Date object if it exists
    const expiryDate = license_expiry ? new Date(license_expiry) : null;
    const newDriver = await prisma.driver.create({
      data: {
        user_id: req.user.id,
        name,
        phone,
        license_number,
        license_expiry: expiryDate,
        experience_years: experience_years || 0,
        address,
        emergency_contact
      }
    });

    res.status(201).json(newDriver);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update driver
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, phone, license_number, license_expiry, experience_years, address, emergency_contact, active } = req.body;
    const driverId = parseInt(req.params.id);

    // Convert license_expiry to proper Date object if it exists
    const expiryDate = license_expiry ? new Date(license_expiry) : null;

    const updatedDriver = await prisma.driver.update({
      where: { 
        id: driverId,
        user_id: req.user.id 
      },
      data: {
        name,
        phone,
        license_number,
        license_expiry: expiryDate,
        experience_years,
        address,
        emergency_contact,
        active,
        updated_at: new Date()
      }
    });

    res.json(updatedDriver);
  } catch (error) {
    console.error('Error updating driver:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Driver not found or unauthorized' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ error: 'License number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete driver
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const driverId = parseInt(req.params.id);

    await prisma.driver.delete({
      where: { 
        id: driverId,
        user_id: req.user.id 
      }
    });

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Driver not found or unauthorized' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

module.exports = router;
