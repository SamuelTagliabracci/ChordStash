import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db/database.js';
import { importFromUrl } from './lib/importer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 9010;

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ============ Auth Middleware ============

const VALID_ROLES = ['readonly', 'moderator', 'admin'];

function requireRole(...roles) {
  return (req, res, next) => {
    const email = req.headers['x-auth-request-email'];
    if (!email) return res.status(403).json({ error: 'not_authorized' });

    const user = db.getUserByEmail(email);
    if (!user) return res.status(403).json({ error: 'not_authorized' });
    if (user.status !== 'approved') return res.status(403).json({ error: 'pending_approval' });
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'forbidden' });

    req.user = user;
    next();
  };
}

// ============ API Routes ============

// Get current user — auto-creates pending account on first login
app.get('/api/me', (req, res) => {
  const email = req.headers['x-auth-request-email'] || null;
  if (!email) return res.json({ authenticated: false });

  let user = db.getUserByEmail(email);
  if (!user) {
    user = db.createPendingUser({ email });
  }

  const response = {
    authenticated: true,
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };

  if (user.role === 'admin' && user.status === 'approved') {
    response.pendingCount = db.countPending();
  }

  res.json(response);
});

// ============ Song Routes ============

// Get songs — own library by default, or a subscribed user's via ?owner=userId
app.get('/api/songs', requireRole('readonly', 'moderator', 'admin'), (req, res) => {
  const { q, favorites, owner } = req.query;
  const ownerId = owner ? parseInt(owner) : req.user.id;

  // Viewing someone else's library — must be subscribed
  if (ownerId !== req.user.id && !db.isSubscribed(req.user.id, ownerId)) {
    return res.status(403).json({ error: 'not_subscribed' });
  }

  try {
    let songs;
    if (q) {
      songs = db.searchSongsByUser(ownerId, q);
    } else if (favorites === 'true') {
      songs = db.getFavoritesByUser(ownerId);
    } else {
      songs = db.getSongsByUser(ownerId);
    }
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single song — own or subscribed
app.get('/api/songs/:id', requireRole('readonly', 'moderator', 'admin'), (req, res) => {
  try {
    const song = db.getSong(req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });

    const isOwner = song.user_id === req.user.id;
    const isSubscribed = !isOwner && db.isSubscribed(req.user.id, song.user_id);
    if (!isOwner && !isSubscribed) return res.status(403).json({ error: 'forbidden' });

    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create song — always in your own library
app.post('/api/songs', requireRole('readonly', 'moderator', 'admin'), (req, res) => {
  const { title, artist, content, source_url, strummings } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  try {
    const song = db.createSong({ title, artist, content, source_url, strummings, user_id: req.user.id });
    res.status(201).json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update song — must be owner
app.put('/api/songs/:id', requireRole('readonly', 'moderator', 'admin'), (req, res) => {
  const { title, artist, content, source_url, is_favorite, default_instrument, youtube_url, spotify_url } = req.body;
  try {
    const song = db.updateSong(req.params.id, req.user.id, {
      title, artist, content, source_url, is_favorite, default_instrument, youtube_url, spotify_url
    });
    if (!song) return res.status(404).json({ error: 'Song not found or not yours' });
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle favorite — must be owner
app.patch('/api/songs/:id/favorite', requireRole('readonly', 'moderator', 'admin'), (req, res) => {
  try {
    const song = db.toggleFavorite(req.params.id, req.user.id);
    if (!song) return res.status(404).json({ error: 'Song not found or not yours' });
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete song — must be owner
app.delete('/api/songs/:id', requireRole('readonly', 'moderator', 'admin'), (req, res) => {
  try {
    const deleted = db.deleteSong(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Song not found or not yours' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import from URL
app.post('/api/import', requireRole('readonly', 'moderator', 'admin'), async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const songData = await importFromUrl(url);
    res.json(songData);
  } catch (err) {
    console.error('Import error:', err);
    res.status(400).json({ error: err.message || 'Failed to import from URL' });
  }
});

// ============ Subscription Routes ============

// Get my subscriptions
app.get('/api/subscriptions', requireRole('readonly', 'moderator', 'admin'), (req, res) => {
  try {
    res.json(db.getSubscriptions(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Subscribe to a user by email
app.post('/api/subscriptions', requireRole('readonly', 'moderator', 'admin'), (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const target = db.getUserByEmail(email);
  if (!target || target.status !== 'approved') {
    return res.status(404).json({ error: 'User not found' });
  }
  if (target.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot subscribe to yourself' });
  }

  try {
    db.addSubscription(req.user.id, target.id);
    res.json({ id: target.id, email: target.email, name: target.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unsubscribe
app.delete('/api/subscriptions/:targetUserId', requireRole('readonly', 'moderator', 'admin'), (req, res) => {
  try {
    db.removeSubscription(req.user.id, parseInt(req.params.targetUserId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List approved users (for subscription search)
app.get('/api/users/approved', requireRole('readonly', 'moderator', 'admin'), (req, res) => {
  try {
    const users = db.getApprovedUsers().filter(u => u.id !== req.user.id);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ User Management Routes (Admin only) ============

// List all users
app.get('/api/users', requireRole('admin'), (req, res) => {
  try {
    res.json(db.getAllUsers());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user (admin — pre-approved)
app.post('/api/users', requireRole('admin'), (req, res) => {
  const { email, name, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (role && !VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  try {
    const user = db.createUser({ email, name, role: role || 'readonly', status: 'approved' });
    res.status(201).json(user);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Approve a pending user
app.post('/api/users/:id/approve', requireRole('admin'), (req, res) => {
  const target = db.getUserById(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.status !== 'pending') return res.status(400).json({ error: 'User is not pending' });

  try {
    const user = db.approveUser(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user role
app.put('/api/users/:id', requireRole('admin'), (req, res) => {
  const { name, role } = req.body;
  if (role && !VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const targetUser = db.getUserById(req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  if (targetUser.id === req.user.id && role && role !== req.user.role) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }
  if (targetUser.role === 'admin' && role && role !== 'admin') {
    if (db.countAdmins() <= 1) {
      return res.status(400).json({ error: 'Cannot demote the last admin' });
    }
  }

  try {
    const user = db.updateUser(req.params.id, { name, role });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete or deny user
app.delete('/api/users/:id', requireRole('admin'), (req, res) => {
  const targetUser = db.getUserById(req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });
  if (targetUser.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

  if (targetUser.role === 'admin' && targetUser.status === 'approved') {
    if (db.countAdmins() <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin' });
    }
  }

  try {
    const deleted = db.deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
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
