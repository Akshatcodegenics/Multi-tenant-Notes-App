const express = require('express');
const { getDatabase } = require('../database/init');

const router = express.Router();

// Helper function to check note limits for free plan
function checkNoteLimit(tenantId, callback) {
  const db = getDatabase();

  // Fetch the latest subscription plan from DB to ensure real-time gating
  db.get('SELECT subscription_plan FROM tenants WHERE id = ?', [tenantId], (err, tenant) => {
    if (err) {
      return callback(err);
    }
    if (!tenant) {
      return callback(new Error('Tenant not found'));
    }

    if (tenant.subscription_plan === 'pro') {
      return callback(null, true); // No limit for pro plan
    }

    // Count notes for free plan limit
    db.get(
      'SELECT COUNT(*) as count FROM notes WHERE tenant_id = ?',
      [tenantId],
      (err2, result) => {
        if (err2) {
          return callback(err2);
        }
        callback(null, result.count < 3); // Free plan limit: 3 notes
      }
    );
  });
}

// GET /notes - List all notes for the current tenant
router.get('/', (req, res) => {
  const db = getDatabase();
  
  db.all(
    `SELECT n.*, u.email as author_email 
     FROM notes n 
     JOIN users u ON n.user_id = u.id 
     WHERE n.tenant_id = ? 
     ORDER BY n.is_sticky DESC, n.created_at DESC`,
    [req.user.tenantId],
    (err, notes) => {
      if (err) {
        console.error('Error fetching notes:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.json({
        notes: notes.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          authorEmail: note.author_email,
          isSticky: !!note.is_sticky,
          bgColor: note.bg_color || null,
          textColor: note.text_color || null,
          createdAt: note.created_at,
          updatedAt: note.updated_at
        }))
      });
    }
  );
});

// GET /notes/:id - Retrieve a specific note
router.get('/:id', (req, res) => {
  const noteId = parseInt(req.params.id);
  
  if (isNaN(noteId)) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }

  const db = getDatabase();
  
  db.get(
    `SELECT n.*, u.email as author_email 
     FROM notes n 
     JOIN users u ON n.user_id = u.id 
     WHERE n.id = ? AND n.tenant_id = ?`,
    [noteId, req.user.tenantId],
    (err, note) => {
      if (err) {
        console.error('Error fetching note:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      res.json({
        note: {
          id: note.id,
          title: note.title,
          content: note.content,
          authorEmail: note.author_email,
          isSticky: !!note.is_sticky,
          bgColor: note.bg_color || null,
          textColor: note.text_color || null,
          createdAt: note.created_at,
          updatedAt: note.updated_at
        }
      });
    }
  );
});

// POST /notes - Create a new note
router.post('/', (req, res) => {
  const { title, content, isSticky = false, bgColor = null, textColor = null } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Check note limit for free plan
  checkNoteLimit(req.user.tenantId, (err, canCreate) => {
    if (err) {
      console.error('Error checking note limit:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!canCreate) {
      return res.status(403).json({ 
        error: 'note limit reached',
        limitReached: true,
        upgradeUrl: `/tenants/${req.user.tenantSlug}/upgrade`
      });
    }

    const db = getDatabase();
    
    db.run(
      'INSERT INTO notes (title, content, user_id, tenant_id, is_sticky, bg_color, text_color) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title.trim(), content || '', req.user.id, req.user.tenantId, isSticky ? 1 : 0, bgColor, textColor],
      function(err) {
        if (err) {
          console.error('Error creating note:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Fetch the created note with author info
        db.get(
          `SELECT n.*, u.email as author_email 
           FROM notes n 
           JOIN users u ON n.user_id = u.id 
           WHERE n.id = ?`,
          [this.lastID],
          (err, note) => {
            if (err) {
              console.error('Error fetching created note:', err);
              return res.status(500).json({ error: 'Internal server error' });
            }

            res.status(201).json({
              note: {
                id: note.id,
                title: note.title,
                content: note.content,
                authorEmail: note.author_email,
                createdAt: note.created_at,
                updatedAt: note.updated_at
              }
            });
          }
        );
      }
    );
  });
});

// PUT /notes/:id - Update a note
router.put('/:id', (req, res) => {
  const noteId = parseInt(req.params.id);
  const { title, content, isSticky = false, bgColor = null, textColor = null } = req.body;

  if (isNaN(noteId)) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const db = getDatabase();

  // First, verify the note exists and belongs to the current tenant
  db.get(
    'SELECT * FROM notes WHERE id = ? AND tenant_id = ?',
    [noteId, req.user.tenantId],
    (err, note) => {
      if (err) {
        console.error('Error fetching note for update:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      // Update the note
      db.run(
        'UPDATE notes SET title = ?, content = ?, is_sticky = ?, bg_color = ?, text_color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title.trim(), content || '', isSticky ? 1 : 0, bgColor, textColor, noteId],
        function(err) {
          if (err) {
            console.error('Error updating note:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }

          // Fetch the updated note with author info
          db.get(
            `SELECT n.*, u.email as author_email 
             FROM notes n 
             JOIN users u ON n.user_id = u.id 
             WHERE n.id = ?`,
            [noteId],
            (err, updatedNote) => {
              if (err) {
                console.error('Error fetching updated note:', err);
                return res.status(500).json({ error: 'Internal server error' });
              }

              res.json({
                note: {
                  id: updatedNote.id,
                  title: updatedNote.title,
                  content: updatedNote.content,
                  authorEmail: updatedNote.author_email,
                  createdAt: updatedNote.created_at,
                  updatedAt: updatedNote.updated_at
                }
              });
            }
          );
        }
      );
    }
  );
});

// DELETE /notes/:id - Delete a note
router.delete('/:id', (req, res) => {
  const noteId = parseInt(req.params.id);

  if (isNaN(noteId)) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }

  const db = getDatabase();

  // First, verify the note exists and belongs to the current tenant
  db.get(
    'SELECT * FROM notes WHERE id = ? AND tenant_id = ?',
    [noteId, req.user.tenantId],
    (err, note) => {
      if (err) {
        console.error('Error fetching note for deletion:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      // Delete the note
      db.run(
        'DELETE FROM notes WHERE id = ?',
        [noteId],
        function(err) {
          if (err) {
            console.error('Error deleting note:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }

          res.json({ message: 'Note deleted successfully' });
        }
      );
    }
  );
});

// POST /notes/:id/toggle-sticky - Toggle sticky flag
router.post('/:id/toggle-sticky', (req, res) => {
  const noteId = parseInt(req.params.id);
  if (isNaN(noteId)) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }
  const db = getDatabase();
  db.get('SELECT * FROM notes WHERE id = ? AND tenant_id = ?', [noteId, req.user.tenantId], (err, note) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const next = note.is_sticky ? 0 : 1;
    db.run('UPDATE notes SET is_sticky = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [next, noteId], function(updateErr) {
      if (updateErr) return res.status(500).json({ error: 'Internal server error' });
      return res.json({ id: noteId, isSticky: !!next });
    });
  });
});

// GET /notes/recommendations - AI-like recommendations (rule-based demo)
router.get('/recommendations', (req, res) => {
  const db = getDatabase();
  // Simple heuristic recommendations: suggest recent notes or sticky notes
  db.all(
    `SELECT id, title, is_sticky FROM notes WHERE tenant_id = ? ORDER BY is_sticky DESC, updated_at DESC LIMIT 5`,
    [req.user.tenantId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Internal server error' });
      const recs = rows.map((r, idx) => ({
        noteId: r.id,
        title: r.title,
        reason: r.is_sticky ? 'You marked this as important' : 'Recently updated',
        score: r.is_sticky ? 0.9 - idx * 0.05 : 0.7 - idx * 0.05
      }));
      res.json({ recommendations: recs });
    }
  );
});

module.exports = router;
