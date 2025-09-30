const jwt = require('jsonwebtoken');
const db = require('../services/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Generate JWT token
const generateToken = (userId, tenantId, role) => {
  return jwt.sign(
    { 
      userId, 
      tenantId, 
      role 
    }, 
    JWT_SECRET, 
    { 
      expiresIn: '24h' 
    }
  );
};

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user and tenant from in-memory database
    const user = db.findUser({ _id: decoded.userId });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    const tenant = db.findTenant({ _id: user.tenantId });
    if (!tenant) {
      return res.status(401).json({ error: 'Invalid token - tenant not found' });
    }

    // Add user and tenant info to request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      tenantId: tenant._id,
      tenant: tenant
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Authorize admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Authorize member role or above
const requireMember = (req, res, next) => {
  if (!['ADMIN', 'MEMBER'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Member access or higher required' });
  }
  next();
};

// Ensure tenant isolation
const ensureTenantAccess = (tenantIdParam = 'tenantId') => {
  return (req, res, next) => {
    const requestedTenantId = req.params[tenantIdParam] || req.body.tenantId;
    
    if (requestedTenantId && requestedTenantId !== req.user.tenantId.toString()) {
      return res.status(403).json({ error: 'Access denied - tenant isolation violation' });
    }
    
    next();
  };
};

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  requireMember,
  ensureTenantAccess
};