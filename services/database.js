const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

class InMemoryDatabase {
  constructor() {
    this.data = {
      tenants: [],
      users: [],
      notes: []
    };
    this.loadDemoData();
  }

  async loadDemoData() {
    try {
      // Hash password for demo accounts
      const hashedPassword = await bcrypt.hash('password', 12);
      
      // Create demo tenants
      this.data.tenants = [
        {
          _id: 'tenant-acme-123',
          name: 'Acme Corporation',
          slug: 'acme',
          subscription: 'FREE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'tenant-globex-456',
          name: 'Globex Corporation', 
          slug: 'globex',
          subscription: 'FREE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Create demo users
      this.data.users = [
        {
          _id: 'user-acme-admin-1',
          email: 'admin@acme.test',
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: 'tenant-acme-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'user-acme-member-2',
          email: 'user@acme.test',
          password: hashedPassword,
          role: 'MEMBER',
          tenantId: 'tenant-acme-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'user-globex-admin-3',
          email: 'admin@globex.test',
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: 'tenant-globex-456',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: 'user-globex-member-4',
          email: 'user@globex.test',
          password: hashedPassword,
          role: 'MEMBER',
          tenantId: 'tenant-globex-456',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Create demo notes
      this.data.notes = [
        {
          _id: 'note-acme-1',
          title: 'Welcome to Acme Notes',
          content: 'This is your first note in the Acme tenant. You can create, edit, and delete notes here. The beautiful UI makes note-taking a pleasure!',
          userId: 'user-acme-admin-1',
          tenantId: 'tenant-acme-123',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          _id: 'note-acme-2',
          title: 'Team Meeting Notes',
          content: 'Discussion about Q4 goals and project timelines. Remember to follow up on action items. The modern interface helps us stay organized!',
          userId: 'user-acme-member-2',
          tenantId: 'tenant-acme-123',
          createdAt: new Date(Date.now() - 43200000).toISOString(),
          updatedAt: new Date(Date.now() - 43200000).toISOString()
        },
        {
          _id: 'note-globex-1',
          title: 'Globex Project Overview',
          content: 'Initial planning for the new product launch. Market research indicates strong demand. The multi-tenant architecture is working perfectly with this beautiful UI!',
          userId: 'user-globex-admin-3',
          tenantId: 'tenant-globex-456',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          _id: 'note-globex-2',
          title: 'Daily Standup Notes',
          content: 'Progress on current sprint. All tasks on track for completion by Friday. The enhanced UI with glassmorphism effects looks absolutely stunning!',
          userId: 'user-globex-member-4',
          tenantId: 'tenant-globex-456',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      console.log('✅ Demo data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading demo data:', error);
    }
  }

  // Utility methods to simulate MongoDB operations
  generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Find methods
  findUser(query) {
    return this.data.users.find(user => {
      return Object.keys(query).every(key => user[key] === query[key]);
    });
  }

  findTenant(query) {
    return this.data.tenants.find(tenant => {
      return Object.keys(query).every(key => tenant[key] === query[key]);
    });
  }

  findNotes(query) {
    return this.data.notes.filter(note => {
      return Object.keys(query).every(key => note[key] === query[key]);
    });
  }

  findNote(query) {
    return this.data.notes.find(note => {
      return Object.keys(query).every(key => note[key] === query[key]);
    });
  }

  // Create methods
  createNote(noteData) {
    const note = {
      _id: this.generateId(),
      ...noteData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.notes.push(note);
    return note;
  }

  // Update methods
  updateNote(id, updateData) {
    const noteIndex = this.data.notes.findIndex(note => note._id === id);
    if (noteIndex !== -1) {
      this.data.notes[noteIndex] = {
        ...this.data.notes[noteIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      return this.data.notes[noteIndex];
    }
    return null;
  }

  updateTenant(id, updateData) {
    const tenantIndex = this.data.tenants.findIndex(tenant => tenant._id === id);
    if (tenantIndex !== -1) {
      this.data.tenants[tenantIndex] = {
        ...this.data.tenants[tenantIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      return this.data.tenants[tenantIndex];
    }
    return null;
  }

  // Delete methods
  deleteNote(id) {
    const noteIndex = this.data.notes.findIndex(note => note._id === id);
    if (noteIndex !== -1) {
      return this.data.notes.splice(noteIndex, 1)[0];
    }
    return null;
  }

  // Count methods
  countNotes(query) {
    return this.data.notes.filter(note => {
      return Object.keys(query).every(key => note[key] === query[key]);
    }).length;
  }

  // Populate user data for notes
  populateNoteUsers(notes) {
    return notes.map(note => ({
      ...note,
      author: this.data.users.find(user => user._id === note.userId)
    }));
  }
}

// Export singleton instance
module.exports = new InMemoryDatabase();