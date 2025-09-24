const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
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
        const token = jwt.sign(
          { 
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenant_id,
            tenantSlug: user.tenant_slug
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

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

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
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
