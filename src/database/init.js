const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Prefer explicit DATABASE_PATH; on Vercel (serverless) default to /tmp which is writable
const DB_PATH = process.env.DATABASE_PATH || (process.env.VERCEL ? '/tmp/database.sqlite' : './database.sqlite');

let db;

function getDatabase() {
  if (!db) {
    // Ensure directory exists for DB path if not /:memory:
    try {
      const dir = path.dirname(DB_PATH);
      if (dir && dir !== ':' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.warn('Could not ensure DB directory exists:', e.message);
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
      }
    });
  }
  return db;
}

async function initializeDatabase() {
  const database = getDatabase();
  
  return new Promise((resolve, reject) => {
    database.serialize(async () => {
      try {
        // Create tenants table
        database.run(`
          CREATE TABLE IF NOT EXISTS tenants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create users table
        database.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
            tenant_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
          )
        `);

        // Create notes table
        database.run(`
          CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            user_id INTEGER NOT NULL,
            tenant_id INTEGER NOT NULL,
            is_sticky INTEGER NOT NULL DEFAULT 0,
            bg_color TEXT,
            text_color TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
          )
        `);

        // Ensure new columns exist if migrating from older schema
        await ensureNotesExtendedColumns(database);

        // Create indexes for better performance (after ensuring columns exist)
        database.run(`CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users (tenant_id)`);
        database.run(`CREATE INDEX IF NOT EXISTS idx_notes_tenant_id ON notes (tenant_id)`);
        database.run(`CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes (user_id)`);
        database.run(`CREATE INDEX IF NOT EXISTS idx_notes_sticky_created ON notes (is_sticky DESC, created_at DESC)`);

        // Seed initial data
        await seedInitialData(database);
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function ensureNotesExtendedColumns(database) {
  return new Promise((resolve) => {
    // Check existing columns
    database.all("PRAGMA table_info(notes)", (err, rows) => {
      if (err) {
        console.warn('Unable to inspect notes schema:', err.message);
        return resolve();
      }
      const cols = rows.map(r => r.name);
      const tasks = [];

      if (!cols.includes('is_sticky')) {
        tasks.push(new Promise(res => {
          database.run("ALTER TABLE notes ADD COLUMN is_sticky INTEGER NOT NULL DEFAULT 0", () => res());
        }));
      }
      if (!cols.includes('bg_color')) {
        tasks.push(new Promise(res => {
          database.run("ALTER TABLE notes ADD COLUMN bg_color TEXT", () => res());
        }));
      }
      if (!cols.includes('text_color')) {
        tasks.push(new Promise(res => {
          database.run("ALTER TABLE notes ADD COLUMN text_color TEXT", () => res());
        }));
      }

      Promise.all(tasks).then(() => resolve());
    });
  });
}

async function seedInitialData(database) {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if data already exists
      database.get("SELECT COUNT(*) as count FROM tenants", async (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row.count > 0) {
          console.log('Database already seeded');
          resolve();
          return;
        }

        console.log('Seeding initial data...');

        // Insert tenants
        const insertTenant = database.prepare("INSERT INTO tenants (slug, name, subscription_plan) VALUES (?, ?, ?)");
        insertTenant.run('acme', 'Acme Corporation', 'free');
        insertTenant.run('globex', 'Globex Corporation', 'free');
        insertTenant.finalize();

        // Hash password for all test accounts
        const passwordHash = await bcrypt.hash('password', 10);

        // Get tenant IDs
        database.all("SELECT id, slug FROM tenants", (err, tenants) => {
          if (err) {
            reject(err);
            return;
          }

          const acmeTenant = tenants.find(t => t.slug === 'acme');
          const globexTenant = tenants.find(t => t.slug === 'globex');

          // Insert users
          const insertUser = database.prepare("INSERT INTO users (email, password_hash, role, tenant_id) VALUES (?, ?, ?, ?)");
          
          // Acme users
          insertUser.run('admin@acme.test', passwordHash, 'admin', acmeTenant.id);
          insertUser.run('user@acme.test', passwordHash, 'member', acmeTenant.id);
          
          // Globex users
          insertUser.run('admin@globex.test', passwordHash, 'admin', globexTenant.id);
          insertUser.run('user@globex.test', passwordHash, 'member', globexTenant.id);
          
          insertUser.finalize();

          console.log('Initial data seeded successfully');
          resolve();
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, closing database...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, closing database...');
  closeDatabase();
  process.exit(0);
});

module.exports = {
  getDatabase,
  initializeDatabase,
  closeDatabase
};
