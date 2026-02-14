import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'data', 'songs.db');
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent performance
sqlite.pragma('journal_mode = WAL');

// Initialize schema
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT,
    content TEXT NOT NULL,
    source_url TEXT,
    is_favorite INTEGER DEFAULT 0,
    default_instrument TEXT DEFAULT 'guitar',
    strummings TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
  CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
  CREATE INDEX IF NOT EXISTS idx_songs_favorite ON songs(is_favorite);

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'readonly',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO users (email, name, role) VALUES ('sam@cornelltech.ca', 'Sam', 'admin');
`);

// Add columns if they don't exist (for existing databases)
const columnsToAdd = ['strummings TEXT', 'youtube_url TEXT', 'spotify_url TEXT'];
for (const col of columnsToAdd) {
  try {
    sqlite.exec(`ALTER TABLE songs ADD COLUMN ${col}`);
  } catch (e) {
    // Column already exists
  }
}

// Prepared statements
const stmts = {
  getAll: sqlite.prepare(`
    SELECT id, title, artist, is_favorite, default_instrument, created_at, updated_at
    FROM songs ORDER BY updated_at DESC
  `),
  getFavorites: sqlite.prepare(`
    SELECT id, title, artist, is_favorite, default_instrument, created_at, updated_at
    FROM songs WHERE is_favorite = 1 ORDER BY title ASC
  `),
  getOne: sqlite.prepare('SELECT * FROM songs WHERE id = ?'),
  search: sqlite.prepare(`
    SELECT id, title, artist, is_favorite, default_instrument, created_at, updated_at
    FROM songs
    WHERE title LIKE ? OR artist LIKE ?
    ORDER BY title ASC
  `),
  insert: sqlite.prepare(`
    INSERT INTO songs (title, artist, content, source_url, strummings, youtube_url, spotify_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  update: sqlite.prepare(`
    UPDATE songs
    SET title = COALESCE(?, title),
        artist = COALESCE(?, artist),
        content = COALESCE(?, content),
        source_url = COALESCE(?, source_url),
        is_favorite = COALESCE(?, is_favorite),
        default_instrument = COALESCE(?, default_instrument),
        strummings = COALESCE(?, strummings),
        youtube_url = ?,
        spotify_url = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  toggleFavorite: sqlite.prepare(`
    UPDATE songs SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `),
  delete: sqlite.prepare('DELETE FROM songs WHERE id = ?'),

  // Users
  getUserByEmail: sqlite.prepare('SELECT * FROM users WHERE email = ?'),
  getAllUsers: sqlite.prepare('SELECT * FROM users ORDER BY created_at ASC'),
  insertUser: sqlite.prepare('INSERT INTO users (email, name, role) VALUES (?, ?, ?)'),
  updateUser: sqlite.prepare('UPDATE users SET name = ?, role = ? WHERE id = ?'),
  deleteUser: sqlite.prepare('DELETE FROM users WHERE id = ?'),
  getUserById: sqlite.prepare('SELECT * FROM users WHERE id = ?'),
  countAdmins: sqlite.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
};

const db = {
  getAllSongs() {
    return stmts.getAll.all();
  },

  getFavorites() {
    return stmts.getFavorites.all();
  },

  getSong(id) {
    return stmts.getOne.get(id);
  },

  searchSongs(query) {
    const pattern = `%${query}%`;
    return stmts.search.all(pattern, pattern);
  },

  createSong({ title, artist, content, source_url, strummings, youtube_url, spotify_url }) {
    const strummingsJson = strummings ? JSON.stringify(strummings) : null;
    const result = stmts.insert.run(
      title, artist || null, content, source_url || null,
      strummingsJson, youtube_url || null, spotify_url || null
    );
    return this.getSong(result.lastInsertRowid);
  },

  updateSong(id, { title, artist, content, source_url, is_favorite, default_instrument, strummings, youtube_url, spotify_url }) {
    const strummingsJson = strummings ? JSON.stringify(strummings) : null;
    const result = stmts.update.run(
      title, artist, content, source_url,
      is_favorite !== undefined ? (is_favorite ? 1 : 0) : null,
      default_instrument,
      strummingsJson,
      youtube_url !== undefined ? youtube_url : null,
      spotify_url !== undefined ? spotify_url : null,
      id
    );
    if (result.changes === 0) return null;
    return this.getSong(id);
  },

  toggleFavorite(id) {
    const result = stmts.toggleFavorite.run(id);
    if (result.changes === 0) return null;
    return this.getSong(id);
  },

  deleteSong(id) {
    const result = stmts.delete.run(id);
    return result.changes > 0;
  },

  // User methods
  getUserByEmail(email) {
    return stmts.getUserByEmail.get(email);
  },

  getAllUsers() {
    return stmts.getAllUsers.all();
  },

  createUser({ email, name, role }) {
    const result = stmts.insertUser.run(email, name || null, role || 'readonly');
    return stmts.getUserById.get(result.lastInsertRowid);
  },

  updateUser(id, { name, role }) {
    const result = stmts.updateUser.run(name || null, role, id);
    if (result.changes === 0) return null;
    return stmts.getUserById.get(id);
  },

  deleteUser(id) {
    const result = stmts.deleteUser.run(id);
    return result.changes > 0;
  },

  getUserById(id) {
    return stmts.getUserById.get(id);
  },

  countAdmins() {
    return stmts.countAdmins.get().count;
  }
};

export default db;
