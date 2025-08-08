const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
// Get all conductors
router.get('/', authenticateToken, async (req, res) => {
  try {
    const conductors = await prisma.conductor.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
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

    const newConductor = await prisma.conductor.create({
      data: {
        user_id: req.user.id,
        name,
        phone,
        experience_years: experience_years || 0,
        address,
        emergency_contact
      }
    });

    res.status(201).json(newConductor);
  } catch (error) {
    console.error('Error creating conductor:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Phone number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update conductor
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, phone, experience_years, address, emergency_contact, active } = req.body;
    const conductorId = parseInt(req.params.id);

    const updatedConductor = await prisma.conductor.update({
      where: { 
        id: conductorId,
        user_id: req.user.id 
      },
      data: {
        name,
        phone,
        experience_years,
        address,
        emergency_contact,
        active,
        updated_at: new Date()
      }
    });

    res.json(updatedConductor);
  } catch (error) {
    console.error('Error updating conductor:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Conductor not found' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ error: 'Phone number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete conductor
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const conductorId = parseInt(req.params.id);

    await prisma.conductor.delete({
      where: { 
        id: conductorId,
        user_id: req.user.id 
      }
    });

    res.json({ message: 'Conductor deleted successfully' });
  } catch (error) {
    console.error('Error deleting conductor:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Conductor not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});


module.exports = router;
