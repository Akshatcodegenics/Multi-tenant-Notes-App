const express = require('express');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');
const { generateToken } = require('../middleware/auth');
const router = express.Router();

// Apply admin requirement to all routes
router.use(requireAdmin);

// Get all users for current tenant (Admin only)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.user.tenantId })
      .select('-password')
      .sort({ createdAt: -1 });

    const formattedUsers = users.map(user => ({
      id: user._id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({
      users: formattedUsers,
      totalUsers: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Invite a new user to the tenant (Admin only)
router.post('/invite', async (req, res) => {
  try {
    const { email, role = 'MEMBER' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ 
        error: 'Role must be either ADMIN or MEMBER' 
      });
    }

    // Check if user already exists for this tenant
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(), 
      tenantId: req.user.tenantId 
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists for this tenant' 
      });
    }

    // Create new user with default password
    const user = new User({
      email: email.toLowerCase(),
      password: 'password', // Default password - should be changed in production
      role,
      tenantId: req.user.tenantId
    });

    await user.save();

    res.status(201).json({
      message: 'User invited successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Invite user error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'User already exists for this tenant' 
      });
    }
    
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

// Update user role (Admin only)
router.put('/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ 
        error: 'Role must be either ADMIN or MEMBER' 
      });
    }

    // Find user and ensure they belong to the same tenant
    const user = await User.findOne({ 
      _id: userId, 
      tenantId: req.user.tenantId 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from removing their own admin role if they're the only admin
    if (user._id.toString() === req.user.id.toString() && role !== 'ADMIN') {
      const adminCount = await User.countDocuments({ 
        tenantId: req.user.tenantId, 
        role: 'ADMIN' 
      });
      
      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot remove admin role - at least one admin is required' 
        });
      }
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Remove user from tenant (Admin only)
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user and ensure they belong to the same tenant
    const user = await User.findOne({ 
      _id: userId, 
      tenantId: req.user.tenantId 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves if they're the only admin
    if (user._id.toString() === req.user.id.toString()) {
      const adminCount = await User.countDocuments({ 
        tenantId: req.user.tenantId, 
        role: 'ADMIN' 
      });
      
      if (adminCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot delete yourself - at least one admin is required' 
        });
      }
    }

    // Delete user and their notes
    const Note = require('../models/Note');
    await Note.deleteMany({ userId: user._id, tenantId: req.user.tenantId });
    await User.deleteOne({ _id: userId });

    res.json({
      message: 'User removed successfully',
      userId
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    res.status(500).json({ error: 'Failed to remove user' });
  }
});

// Get user details (Admin only)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ 
      _id: userId, 
      tenantId: req.user.tenantId 
    }).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's note count
    const Note = require('../models/Note');
    const noteCount = await Note.countDocuments({ userId: user._id });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        noteCount
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;