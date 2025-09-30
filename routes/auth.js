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

// Register endpoint (in-memory demo)
router.post('/register', async (req, res) => {
  try {
    const { email, password, tenantName, tenantSlug } = req.body;

    if (!email || !password || !tenantName) {
      return res.status(400).json({ 
        error: 'Email, password, and tenant name are required' 
      });
    }

    const slug = (tenantSlug || tenantName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Ensure email is globally unique in this demo
    const existingByEmail = db.findUserByEmail(email);
    if (existingByEmail) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create tenant (slug must be unique)
    let tenant;
    try {
      tenant = db.createTenant({ name: tenantName.trim(), slug, subscription: 'FREE' });
    } catch (e) {
      if (e && e.message === 'TENANT_EXISTS') {
        return res.status(409).json({ error: 'Tenant slug already exists' });
      }
      throw e;
    }

    // Hash password and create user as ADMIN (tenant owner)
    const passwordHash = await bcrypt.hash(password, 12);
    const user = db.createUser({ 
      email: email.toLowerCase(), 
      password: passwordHash, 
      role: 'ADMIN',
      tenantId: tenant._id 
    });

    // Generate JWT token
    const token = generateToken(user._id, tenant._id, user.role);

    return res.status(201).json({
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
    return res.status(500).json({ error: 'Registration failed' });
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