const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../services/database');
const { generateToken } = require('../middleware/auth');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user in demo database
    const user = db.findUser({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get tenant information
    const tenant = db.findTenant({ _id: user.tenantId });
    if (!tenant) {
      return res.status(401).json({ error: 'Tenant not found' });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.tenantId, user.role);

    // Return success response
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        tenant: {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          subscription: tenant.subscription
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register endpoint (for testing purposes)
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'MEMBER', tenantSlug } = req.body;

    if (!email || !password || !tenantSlug) {
      return res.status(400).json({ 
        error: 'Email, password, and tenant slug are required' 
      });
    }

    // Find tenant
    const tenant = await Tenant.findOne({ slug: tenantSlug.toLowerCase() });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check if user already exists for this tenant
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(), 
      tenantId: tenant._id 
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists for this tenant' 
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      role: ['ADMIN', 'MEMBER'].includes(role) ? role : 'MEMBER',
      tenantId: tenant._id
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, tenant._id, user.role);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        tenant: {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          subscription: tenant.subscription
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'User already exists for this tenant' 
      });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user info
router.get('/me', require('../middleware/auth').authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      tenant: {
        id: req.user.tenant._id,
        name: req.user.tenant.name,
        slug: req.user.tenant.slug,
        subscription: req.user.tenant.subscription
      }
    }
  });
});

module.exports = router;