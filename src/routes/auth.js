const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'development-insecure-secret'; // DO NOT use in production

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let getDatabase;
    try {
      ({ getDatabase } = require('../database/init'));
    } catch (e) {
      console.error('DB module load failed during login:', e);
      return res.status(500).json({ error: 'Database unavailable' });
    }
    const db = getDatabase();
    
    // Get user with tenant information
    db.get(
      `SELECT u.*, t.slug as tenant_slug, t.name as tenant_name, t.subscription_plan 
       FROM users u 
       JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.email = ?`,
      [email.toLowerCase()],
      async (err, user) => {
        if (err) {
          console.error('Database error during login:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        let token;
        try {
          token = jwt.sign(
            { 
              userId: user.id,
              email: user.email,
              role: user.role,
              tenantId: user.tenant_id,
              tenantSlug: user.tenant_slug
            },
            JWT_SECRET,
            { expiresIn: '24h' }
          );
        } catch (signErr) {
          console.error('JWT signing error:', signErr);
          return res.status(500).json({ error: 'Authentication token generation failed' });
        }

        // Return user info and token
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            tenant: {
              id: user.tenant_id,
              slug: user.tenant_slug,
              name: user.tenant_name,
              subscriptionPlan: user.subscription_plan
            }
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info (requires authentication)
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    let getDatabase;
    try {
      ({ getDatabase } = require('../database/init'));
    } catch (e) {
      console.error('DB module load failed in /me:', e);
      return res.status(500).json({ error: 'Database unavailable' });
    }
    const db = getDatabase();
    db.get(
      `SELECT u.*, t.slug as tenant_slug, t.name as tenant_name, t.subscription_plan 
       FROM users u 
       JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.id = ?`,
      [decoded.userId],
      (err, user) => {
        if (err) {
          console.error('Database error in /me endpoint:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            tenant: {
              id: user.tenant_id,
              slug: user.tenant_slug,
              name: user.tenant_name,
              subscriptionPlan: user.subscription_plan
            }
          }
        });
      }
    );
  });
});

module.exports = router;
