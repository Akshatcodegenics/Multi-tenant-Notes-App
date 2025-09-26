// Lightweight in-memory DB shim for Vercel/serverless environments
// Supports just the query patterns used in this project
const bcrypt = require('bcryptjs');

function nowISO() {
  return new Date().toISOString();
}

class MemDB {
  constructor() {
    this.tenants = [];
    this.users = [];
    this.notes = [];
    this._auto = { tenant: 1, user: 1, note: 1 };
  }

  // SQLite-like API
  run(sql, params = [], cb = () => {}) {
    try {
      const s = sql.trim().toUpperCase();
      let ctx = { lastID: undefined, changes: 0 };

      if (s.startsWith('INSERT INTO TENANTS')) {
        const [slug, name, plan] = params;
        const t = { id: this._auto.tenant++, slug, name, subscription_plan: plan || 'free', created_at: nowISO(), updated_at: nowISO() };
        this.tenants.push(t);
        ctx.lastID = t.id;
        ctx.changes = 1;
      } else if (s.startsWith('INSERT INTO USERS')) {
        const [email, password_hash, role, tenant_id] = params;
        const u = { id: this._auto.user++, email: email.toLowerCase(), password_hash, role, tenant_id, created_at: nowISO(), updated_at: nowISO() };
        this.users.push(u);
        ctx.lastID = u.id;
        ctx.changes = 1;
      } else if (s.startsWith('INSERT INTO NOTES')) {
        const [title, content, user_id, tenant_id, is_sticky, bg_color, text_color] = params;
        const n = { id: this._auto.note++, title, content, user_id, tenant_id, is_sticky: is_sticky ? 1 : 0, bg_color, text_color, created_at: nowISO(), updated_at: nowISO() };
        this.notes.push(n);
        ctx.lastID = n.id;
        ctx.changes = 1;
      } else if (s.startsWith('UPDATE TENANTS SET SUBSCRIPTION_PLAN')) {
        const [plan, slug] = params;
        const t = this.tenants.find(tt => tt.slug === slug);
        if (t) { t.subscription_plan = plan; t.updated_at = nowISO(); ctx.changes = 1; }
      } else if (s.startsWith('UPDATE NOTES SET')) {
        const [title, content, is_sticky, bg_color, text_color, id] = params;
        const n = this.notes.find(nn => nn.id === id);
        if (n) { n.title = title; n.content = content; n.is_sticky = is_sticky ? 1 : 0; n.bg_color = bg_color; n.text_color = text_color; n.updated_at = nowISO(); ctx.changes = 1; }
      } else if (s.startsWith('DELETE FROM NOTES WHERE ID =')) {
        const [id] = params;
        const len = this.notes.length;
        this.notes = this.notes.filter(n => n.id !== id);
        ctx.changes = len - this.notes.length;
      }

      cb.call(ctx, null);
    } catch (e) {
      cb.call({}, e);
    }
    return this;
  }

  get(sql, params = [], cb = () => {}) {
    try {
      const up = sql.trim().toUpperCase();
      if (up.startsWith('SELECT COUNT(*) AS COUNT FROM TENANTS')) {
        return cb(null, { count: this.tenants.length });
      }
      if (up.startsWith('SELECT ID, SLUG FROM TENANTS')) {
        // not used with get; but handle gracefully
        const rows = this.tenants.map(t => ({ id: t.id, slug: t.slug }));
        return cb(null, rows[0] || null);
      }
      if (up.includes('FROM USERS U') && up.includes('JOIN TENANTS T') && up.includes('WHERE U.EMAIL =')) {
        const [email] = params;
        const u = this.users.find(x => x.email === String(email).toLowerCase());
        if (!u) return cb(null, undefined);
        const t = this.tenants.find(tt => tt.id === u.tenant_id);
        return cb(null, { ...u, tenant_slug: t.slug, tenant_name: t.name, subscription_plan: t.subscription_plan });
      }
      if (up.includes('FROM USERS U') && up.includes('JOIN TENANTS T') && up.includes('WHERE U.ID =')) {
        const [id] = params;
        const u = this.users.find(x => x.id === id);
        if (!u) return cb(null, undefined);
        const t = this.tenants.find(tt => tt.id === u.tenant_id);
        return cb(null, { ...u, tenant_slug: t.slug, tenant_name: t.name, subscription_plan: t.subscription_plan });
      }
      if (up.startsWith('SELECT * FROM NOTES WHERE ID =') && up.includes('AND TENANT_ID =')) {
        const [id, tenantId] = params;
        const n = this.notes.find(nn => nn.id === id && nn.tenant_id === tenantId);
        return cb(null, n || undefined);
      }
      if (up.startsWith('SELECT N.*, U.EMAIL AS AUTHOR_EMAIL FROM NOTES N')) {
        if (up.includes('WHERE N.ID = ?')) {
          const [id] = params;
          const n = this.notes.find(nn => nn.id === id);
          if (!n) return cb(null, undefined);
          const u = this.users.find(uu => uu.id === n.user_id);
          return cb(null, { ...n, author_email: u ? u.email : null });
        }
      }
      if (up.startsWith('SELECT * FROM TENANTS WHERE SLUG =')) {
        const [slug] = params;
        const t = this.tenants.find(tt => tt.slug === slug);
        return cb(null, t || undefined);
      }
      if (up.startsWith('SELECT T.*,') && up.includes('FROM TENANTS T') && up.includes('WHERE T.SLUG =')) {
        const [slug] = params;
        const t = this.tenants.find(tt => tt.slug === slug);
        if (!t) return cb(null, undefined);
        const user_count = this.users.filter(u => u.tenant_id === t.id).length;
        const note_count = this.notes.filter(n => n.tenant_id === t.id).length;
        return cb(null, { ...t, user_count, note_count });
      }
      if (up.startsWith('SELECT SUBSCRIPTION_PLAN FROM TENANTS WHERE ID =')) {
        const [tenantId] = params;
        const t = this.tenants.find(tt => tt.id === tenantId);
        return cb(null, t ? { subscription_plan: t.subscription_plan } : undefined);
      }
      cb(null, undefined);
    } catch (e) {
      cb(e);
    }
  }

  all(sql, params = [], cb = () => {}) {
    try {
      const up = sql.trim().toUpperCase();
      if (up === 'PRAGMA TABLE_INFO(NOTES)') {
        return cb(null, [
          { name: 'id' }, { name: 'title' }, { name: 'content' }, { name: 'user_id' }, { name: 'tenant_id' },
          { name: 'is_sticky' }, { name: 'bg_color' }, { name: 'text_color' }, { name: 'created_at' }, { name: 'updated_at' }
        ]);
      }
      if (up.startsWith('SELECT ID, SLUG FROM TENANTS')) {
        const rows = this.tenants.map(t => ({ id: t.id, slug: t.slug }));
        return cb(null, rows);
      }
      if (up.startsWith('SELECT N.*, U.EMAIL AS AUTHOR_EMAIL FROM NOTES N')) {
        if (up.includes('WHERE N.TENANT_ID = ?')) {
          const [tenantId] = params;
          const rows = this.notes
            .filter(n => n.tenant_id === tenantId)
            .sort((a, b) => (b.is_sticky - a.is_sticky) || (new Date(b.created_at) - new Date(a.created_at)))
            .map(n => ({ ...n, author_email: (this.users.find(u => u.id === n.user_id) || {}).email }));
          return cb(null, rows);
        }
      }
      if (up.startsWith('SELECT U.ID, U.EMAIL, U.ROLE, U.CREATED_AT')) {
        const [slug] = params;
        const t = this.tenants.find(tt => tt.slug === slug);
        const rows = this.users
          .filter(u => t && u.tenant_id === t.id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map(u => ({ id: u.id, email: u.email, role: u.role, created_at: u.created_at }));
        return cb(null, rows);
      }
      if (up.startsWith('SELECT ID, TITLE, IS_STICKY FROM NOTES WHERE TENANT_ID =')) {
        const [tenantId] = params;
        const rows = this.notes
          .filter(n => n.tenant_id === tenantId)
          .sort((a, b) => (b.is_sticky - a.is_sticky) || (new Date(b.updated_at) - new Date(a.updated_at)))
          .slice(0, 5)
          .map(n => ({ id: n.id, title: n.title, is_sticky: n.is_sticky }));
        return cb(null, rows);
      }
      cb(null, []);
    } catch (e) {
      cb(e);
    }
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) { self.run(sql, params); return this; },
      finalize(cb = () => {}) { cb(); }
    };
  }

  close(cb = () => {}) { cb(); }
}

let memdbInstance = null;

async function initializeMemDb() {
  if (memdbInstance) return;
  memdbInstance = new MemDB();

  // Seed tenants
  const acme = { id: memdbInstance._auto.tenant++, slug: 'acme', name: 'Acme Corporation', subscription_plan: 'free', created_at: nowISO(), updated_at: nowISO() };
  const globex = { id: memdbInstance._auto.tenant++, slug: 'globex', name: 'Globex Corporation', subscription_plan: 'free', created_at: nowISO(), updated_at: nowISO() };
  memdbInstance.tenants.push(acme, globex);

  const passwordHash = await bcrypt.hash('password', 10);
  const users = [
    { email: 'admin@acme.test', role: 'admin', tenant_id: acme.id },
    { email: 'user@acme.test', role: 'member', tenant_id: acme.id },
    { email: 'admin@globex.test', role: 'admin', tenant_id: globex.id },
    { email: 'user@globex.test', role: 'member', tenant_id: globex.id }
  ];
  users.forEach(u => memdbInstance.users.push({ id: memdbInstance._auto.user++, email: u.email, password_hash: passwordHash, role: u.role, tenant_id: u.tenant_id, created_at: nowISO(), updated_at: nowISO() }));
}

function getMemDb() {
  if (!memdbInstance) throw new Error('MemDB not initialized');
  return memdbInstance;
}

module.exports = { initializeMemDb, getMemDb };