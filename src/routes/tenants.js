const express = require('express');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /tenants/:slug/upgrade - Upgrade tenant subscription (Admin only)
router.post('/:slug/upgrade', requireAdmin, (req, res) => {
  const { slug } = req.params;

  // Verify the admin belongs to the tenant they're trying to upgrade
  if (req.user.tenantSlug !== slug) {
    return res.status(403).json({ error: 'You can only upgrade your own tenant' });
  }

  let getDatabase;
  try {
    ({ getDatabase } = require('../database/init'));
  } catch (e) {
    console.error('DB module load failed in upgrade:', e);
    return res.status(500).json({ error: 'Database unavailable' });
  }
  const db = getDatabase();

  // Check current subscription status
  db.get(
    'SELECT * FROM tenants WHERE slug = ?',
    [slug],
    (err, tenant) => {
      if (err) {
        console.error('Error fetching tenant:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      if (tenant.subscription_plan === 'pro') {
        return res.status(400).json({ error: 'Tenant is already on Pro plan' });
      }

      // Upgrade to Pro plan
      db.run(
        'UPDATE tenants SET subscription_plan = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?',
        ['pro', slug],
        function(err) {
          if (err) {
            console.error('Error upgrading tenant:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }

          res.json({
            message: 'Tenant upgraded to Pro plan successfully',
            tenant: {
              slug: tenant.slug,
              name: tenant.name,
              subscriptionPlan: 'pro'
            }
          });
        }
      );
    }
  );
});

// GET /tenants/:slug - Get tenant information (Admin only)
router.get('/:slug', requireAdmin, (req, res) => {
  const { slug } = req.params;

  // Verify the admin belongs to the tenant they're querying
  if (req.user.tenantSlug !== slug) {
    return res.status(403).json({ error: 'You can only view your own tenant information' });
  }

  let getDatabase;
  try {
    ({ getDatabase } = require('../database/init'));
  } catch (e) {
    console.error('DB module load failed in tenant get:', e);
    return res.status(500).json({ error: 'Database unavailable' });
  }
  const db = getDatabase();

  db.get(
    `SELECT t.*, 
     (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count,
     (SELECT COUNT(*) FROM notes WHERE tenant_id = t.id) as note_count
     FROM tenants t 
     WHERE t.slug = ?`,
    [slug],
    (err, tenant) => {
      if (err) {
        console.error('Error fetching tenant details:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      res.json({
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          subscriptionPlan: tenant.subscription_plan,
          userCount: tenant.user_count,
          noteCount: tenant.note_count,
          createdAt: tenant.created_at,
          updatedAt: tenant.updated_at
        }
      });
    }
  );
});

// GET /tenants/:slug/users - List users in tenant (Admin only)
router.get('/:slug/users', requireAdmin, (req, res) => {
  const { slug } = req.params;

  // Verify the admin belongs to the tenant they're querying
  if (req.user.tenantSlug !== slug) {
    return res.status(403).json({ error: 'You can only view users in your own tenant' });
  }

  let getDatabase;
  try {
    ({ getDatabase } = require('../database/init'));
  } catch (e) {
    console.error('DB module load failed in list users:', e);
    return res.status(500).json({ error: 'Database unavailable' });
  }
  const db = getDatabase();

  db.all(
    `SELECT u.id, u.email, u.role, u.created_at 
     FROM users u 
     JOIN tenants t ON u.tenant_id = t.id 
     WHERE t.slug = ? 
     ORDER BY u.created_at DESC`,
    [slug],
    (err, users) => {
      if (err) {
        console.error('Error fetching tenant users:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.json({
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.created_at
        }))
      });
    }
  );
});

// POST /tenants/:slug/invite - Invite user to tenant (Admin only, stub implementation)
router.post('/:slug/invite', requireAdmin, (req, res) => {
  const { slug } = req.params;
  const { email } = req.body || {};

  // Verify the admin belongs to the tenant they're trying to manage
  if (req.user.tenantSlug !== slug) {
    return res.status(403).json({ error: 'You can only invite users to your own tenant' });
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  // This is a stub. In a real app, you would create a pending invite token and send an email.
  return res.json({
    message: 'Invitation sent (stubbed) - implement email flow in production',
    invited: {
      email: email.toLowerCase(),
      role: 'member',
      tenant: slug
    }
  });
});

module.exports = router;
