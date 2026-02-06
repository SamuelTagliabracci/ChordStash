import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db/database.js';
import { importFromUrl } from './lib/importer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ============ API Routes ============

// Get all songs (with optional search)
app.get('/api/songs', (req, res) => {
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
app.get('/api/songs/:id', (req, res) => {
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
app.post('/api/songs', (req, res) => {
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
app.put('/api/songs/:id', (req, res) => {
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
app.patch('/api/songs/:id/favorite', (req, res) => {
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
app.delete('/api/songs/:id', (req, res) => {
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
app.post('/api/import', async (req, res) => {
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

// Catch-all for SPA
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎸 ChordStash running at http://localhost:${PORT}`);
});
