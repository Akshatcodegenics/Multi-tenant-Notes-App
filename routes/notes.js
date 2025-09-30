const express = require('express');
const db = require('../services/database');
const { requireMember } = require('../middleware/auth');
const router = express.Router();

// Apply member requirement to all routes
router.use(requireMember);

// Create a new note
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        error: 'Title and content are required' 
      });
    }

    if (title.length > 200) {
      return res.status(400).json({ 
        error: 'Title must be 200 characters or less' 
      });
    }

    if (content.length > 10000) {
      return res.status(400).json({ 
        error: 'Content must be 10,000 characters or less' 
      });
    }

    // Check if tenant can create more notes (subscription limits)
    const tenant = db.findTenant({ _id: req.user.tenantId });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check subscription limits
    const noteCount = db.countNotes({ tenantId: tenant._id });
    const canCreate = tenant.subscription === 'PRO' || noteCount < 3;
    
    if (!canCreate) {
      return res.status(403).json({ 
        error: 'Note limit reached. Upgrade to Pro for unlimited notes.',
        noteCount,
        noteLimit: 3,
        subscription: tenant.subscription
      });
    }

    // Create the note
    const note = db.createNote({
      title: title.trim(),
      content: content.trim(),
      userId: req.user.id,
      tenantId: req.user.tenantId
    });

    // Get user information for response
    const author = db.findUser({ _id: req.user.id });

    res.status(201).json({
      message: 'Note created successfully',
      note: {
        id: note._id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        author: {
          id: author._id,
          email: author.email,
          role: author.role
        }
      }
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Get all notes for current tenant
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Find notes for current tenant
    const allNotes = db.findNotes({ tenantId: req.user.tenantId });
    
    // Sort by creation date (newest first)
    allNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const notes = allNotes.slice(skip, skip + limit);
    const totalNotes = allNotes.length;
    const totalPages = Math.ceil(totalNotes / limit);

    // Populate with user data and format
    const formattedNotes = notes.map(note => {
      const author = db.findUser({ _id: note.userId });
      return {
        id: note._id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        author: {
          id: author._id,
          email: author.email,
          role: author.role
        }
      };
    });

    res.json({
      notes: formattedNotes,
      pagination: {
        currentPage: page,
        totalPages,
        totalNotes,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to get notes' });
  }
});

// Get a specific note by ID (in-memory)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const note = db.findNote({ _id: id, tenantId: req.user.tenantId });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const author = db.findUser({ _id: note.userId });

    res.json({
      note: {
        id: note._id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        author: author ? { id: author._id, email: author.email, role: author.role } : null
      }
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to get note' });
  }
});

// Update a note (in-memory)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        error: 'Title and content are required' 
      });
    }

    if (title.length > 200) {
      return res.status(400).json({ 
        error: 'Title must be 200 characters or less' 
      });
    }

    if (content.length > 10000) {
      return res.status(400).json({ 
        error: 'Content must be 10,000 characters or less' 
      });
    }

    // Find note and ensure tenant isolation
    const existing = db.findNote({ _id: id, tenantId: req.user.tenantId });

    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user can edit this note (only the author can edit)
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied - you can only edit your own notes' 
      });
    }

    // Update the note
    const updated = db.updateNote(id, { 
      title: title.trim(),
      content: content.trim()
    });

    const author = db.findUser({ _id: updated.userId });

    res.json({
      message: 'Note updated successfully',
      note: {
        id: updated._id,
        title: updated.title,
        content: updated.content,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        author: author ? { id: author._id, email: author.email, role: author.role } : null
      }
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note (in-memory)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find note and ensure tenant isolation
    const existing = db.findNote({ _id: id, tenantId: req.user.tenantId });

    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user can delete this note (only the author can delete)
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied - you can only delete your own notes' 
      });
    }

    // Delete the note
    db.deleteNote(id);

    res.json({
      message: 'Note deleted successfully',
      noteId: id
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;