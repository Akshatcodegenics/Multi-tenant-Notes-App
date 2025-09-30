const express = require('express');
const db = require('../services/database');
const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Check in-memory database status
    const tenantCount = db.data.tenants.length;
    const userCount = db.data.users.length;
    const noteCount = db.data.notes.length;
    
    // Return success response
    res.json({
      status: 'ok',
      database: 'in-memory',
      data: {
        tenants: tenantCount,
        users: userCount,
        notes: noteCount
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;