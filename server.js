import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db/database.js';
import { importFromUrl } from './lib/importer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 9010;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ============ Auth Middleware ============

const VALID_ROLES = ['readonly', 'moderator', 'admin'];

function requireRole(...roles) {
  return (req, res, next) => {
    const email = req.headers['x-auth-request-email'];
    if (!email) {
      return res.status(403).json({ error: 'not_authorized' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(403).json({ error: 'not_authorized' });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }

    req.user = user;
    next();
  };
}

// ============ API Routes ============

// Get authenticated user info (from OAuth2-proxy headers)
app.get('/api/me', (req, res) => {
  const email = req.headers['x-auth-request-email'] || null;
  if (!email) {
    return res.json({ authenticated: false });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.json({ authenticated: true, email, error: 'not_authorized' });
  }

  res.json({ authenticated: true, email, name: user.name, role: user.role });
});

// Get all songs (with optional search)
app.get('/api/songs', requireRole('readonly', 'moderator', 'admin'), (req, res) => {
  const { q, favorites } = req.query;
  try {
    let songs;
    if (q) {
      songs = db.searchSongs(q);
    } else if (favorites === 'true') {
      songs = db.getFavorites();
    } else {
      songs = db.getAllSongs();
    }
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single song
app.get('/api/songs/:id', requireRole('readonly', 'moderator', 'admin'), (req, res) => {
  try {
    const song = db.getSong(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create song
app.post('/api/songs', requireRole('moderator', 'admin'), (req, res) => {
  const { title, artist, content, source_url, strummings } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  try {
    const song = db.createSong({ title, artist, content, source_url, strummings });
    res.status(201).json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update song
app.put('/api/songs/:id', requireRole('moderator', 'admin'), (req, res) => {
  const { title, artist, content, source_url, is_favorite, default_instrument, youtube_url, spotify_url } = req.body;
  try {
    const song = db.updateSong(req.params.id, {
      title, artist, content, source_url, is_favorite, default_instrument, youtube_url, spotify_url
    });
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle favorite
app.patch('/api/songs/:id/favorite', requireRole('moderator', 'admin'), (req, res) => {
  try {
    const song = db.toggleFavorite(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete song
app.delete('/api/songs/:id', requireRole('moderator', 'admin'), (req, res) => {
  try {
    const deleted = db.deleteSong(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import from URL (Ultimate Guitar, etc.)
app.post('/api/import', requireRole('moderator', 'admin'), async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const songData = await importFromUrl(url);
    res.json(songData);
  } catch (err) {
    console.error('Import error:', err);
    res.status(400).json({ error: err.message || 'Failed to import from URL' });
  }
});

// ============ User Management Routes (Admin only) ============

// List all users
app.get('/api/users', requireRole('admin'), (req, res) => {
  try {
    const users = db.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user
app.post('/api/users', requireRole('admin'), (req, res) => {
  const { email, name, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (role && !VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const user = db.createUser({ email, name, role: role || 'readonly' });
    res.status(201).json(user);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Update user
app.put('/api/users/:id', requireRole('admin'), (req, res) => {
  const { name, role } = req.body;
  if (role && !VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const targetUser = db.getUserById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent admin from changing own role
  if (targetUser.id === req.user.id && role && role !== req.user.role) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  // Prevent demoting last admin
  if (targetUser.role === 'admin' && role && role !== 'admin') {
    const adminCount = db.countAdmins();
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot demote the last admin' });
    }
  }

  try {
    const user = db.updateUser(req.params.id, { name, role });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
app.delete('/api/users/:id', requireRole('admin'), (req, res) => {
  const targetUser = db.getUserById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent self-delete
  if (targetUser.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  // Prevent deleting last admin
  if (targetUser.role === 'admin') {
    const adminCount = db.countAdmins();
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin' });
    }
  }

  try {
    const deleted = db.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all for SPA
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ChordStash running at http://localhost:${PORT}`);
});
