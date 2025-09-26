const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'development-insecure-secret'; // DO NOT use in production

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Verify user still exists and get current user data
    let getDatabase;
    try {
      ({ getDatabase } = require('../database/init'));
    } catch (e) {
      console.error('DB module load failed in auth middleware:', e);
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
          console.error('Database error in auth middleware:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
          return res.status(403).json({ error: 'User not found' });
        }

        // Add user info to request object
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenant_id,
          tenantSlug: user.tenant_slug,
          tenantName: user.tenant_name,
          subscriptionPlan: user.subscription_plan
        };

        next();
      }
    );
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: `${role} role required` });
    }

    next();
  };
}

function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin
};
