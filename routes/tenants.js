const express = require('express');
const db = require('../services/database');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get current tenant information
router.get('/current', async (req, res) => {
  try {
    const tenant = db.findTenant({ _id: req.user.tenantId });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get current note count
    const noteCount = db.countNotes({ tenantId: tenant._id });
    
    res.json({
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        subscription: tenant.subscription,
        noteCount,
        noteLimit: tenant.subscription === 'FREE' ? 3 : -1,
        canCreateNote: tenant.subscription === 'PRO' || noteCount < 3
      }
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Failed to get tenant information' });
  }
});

// Upgrade tenant subscription (Admin only)
router.post('/:slug/upgrade', requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Ensure the admin can only upgrade their own tenant
    if (slug !== req.user.tenant.slug) {
      return res.status(403).json({ 
        error: 'Access denied - can only upgrade your own tenant' 
      });
    }

    const tenant = db.findTenant({ _id: req.user.tenantId });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (tenant.subscription === 'PRO') {
      return res.status(400).json({ 
        error: 'Tenant is already on Pro plan' 
      });
    }

    // Upgrade to Pro
    const updatedTenant = db.updateTenant(tenant._id, { subscription: 'PRO' });

    // Get updated note count for response
    const noteCount = db.countNotes({ tenantId: tenant._id });

    res.json({
      message: 'Successfully upgraded to Pro plan',
      tenant: {
        id: updatedTenant._id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        subscription: updatedTenant.subscription,
        noteCount,
        noteLimit: -1, // Unlimited
        canCreateNote: true
      }
    });
  } catch (error) {
    console.error('Upgrade tenant error:', error);
    res.status(500).json({ error: 'Failed to upgrade tenant' });
  }
});

// Get tenant stats (Admin only)
router.get('/:slug/stats', requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Ensure the admin can only view their own tenant stats
    if (slug !== req.user.tenant.slug) {
      return res.status(403).json({ 
        error: 'Access denied - can only view your own tenant stats' 
      });
    }

    const tenant = await Tenant.findById(req.user.tenantId);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get comprehensive stats
    const noteCount = await Note.countDocuments({ tenantId: tenant._id });
    const User = require('../models/User');
    const userCount = await User.countDocuments({ tenantId: tenant._id });
    
    // Get notes created in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentNotesCount = await Note.countDocuments({ 
      tenantId: tenant._id,
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        subscription: tenant.subscription,
        createdAt: tenant.createdAt
      },
      stats: {
        totalNotes: noteCount,
        totalUsers: userCount,
        notesLast30Days: recentNotesCount,
        noteLimit: tenant.subscription === 'FREE' ? 3 : -1,
        canCreateNote: tenant.subscription === 'PRO' || noteCount < 3
      }
    });
  } catch (error) {
    console.error('Get tenant stats error:', error);
    res.status(500).json({ error: 'Failed to get tenant stats' });
  }
});

module.exports = router;