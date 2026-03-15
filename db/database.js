import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'data', 'songs.db');
const sqlite = new Database(dbPath);

sqlite.pragma('journal_mode = WAL');

// Base schema (IF NOT EXISTS — safe on existing DB)
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

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscriber_id INTEGER NOT NULL REFERENCES users(id),
    target_user_id INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subscriber_id, target_user_id)
  );
`);

// Migrations — add columns to existing tables if missing
const migrations = [
  ['songs', 'strummings TEXT'],
  ['songs', 'youtube_url TEXT'],
  ['songs', 'spotify_url TEXT'],
  ['songs', 'user_id INTEGER'],
  ['users', "status TEXT NOT NULL DEFAULT 'approved'"],
];
for (const [table, col] of migrations) {
  try {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${col}`);
  } catch (e) {
    // Column already exists
  }
}

// Assign any existing unowned songs to Sam
sqlite.exec(`
  UPDATE songs
  SET user_id = (SELECT id FROM users WHERE email = 'sam@cornelltech.ca')
  WHERE user_id IS NULL
`);

// Prepared statements
const stmts = {
  // Songs — user-scoped
  getByUser: sqlite.prepare(`
    SELECT id, title, artist, is_favorite, default_instrument, created_at, updated_at
    FROM songs WHERE user_id = ? ORDER BY updated_at DESC
  `),
  getFavoritesByUser: sqlite.prepare(`
    SELECT id, title, artist, is_favorite, default_instrument, created_at, updated_at
    FROM songs WHERE user_id = ? AND is_favorite = 1 ORDER BY title ASC
  `),
  getOne: sqlite.prepare('SELECT * FROM songs WHERE id = ?'),
  searchByUser: sqlite.prepare(`
    SELECT id, title, artist, is_favorite, default_instrument, created_at, updated_at
    FROM songs WHERE user_id = ? AND (title LIKE ? OR artist LIKE ?)
    ORDER BY title ASC
  `),
  insert: sqlite.prepare(`
    INSERT INTO songs (title, artist, content, source_url, strummings, youtube_url, spotify_url, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
    WHERE id = ? AND user_id = ?
  `),
  toggleFavorite: sqlite.prepare(`
    UPDATE songs SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `),
  delete: sqlite.prepare('DELETE FROM songs WHERE id = ? AND user_id = ?'),

  // Users
  getUserByEmail: sqlite.prepare('SELECT * FROM users WHERE email = ?'),
  getAllUsers: sqlite.prepare('SELECT * FROM users ORDER BY status ASC, created_at ASC'),
  getPendingUsers: sqlite.prepare("SELECT * FROM users WHERE status = 'pending' ORDER BY created_at ASC"),
  getApprovedUsers: sqlite.prepare("SELECT id, email, name FROM users WHERE status = 'approved' ORDER BY COALESCE(name, email) ASC"),
  insertUser: sqlite.prepare('INSERT INTO users (email, name, role, status) VALUES (?, ?, ?, ?)'),
  updateUser: sqlite.prepare('UPDATE users SET name = ?, role = ? WHERE id = ?'),
  approveUser: sqlite.prepare("UPDATE users SET status = 'approved' WHERE id = ?"),
  deleteUser: sqlite.prepare('DELETE FROM users WHERE id = ?'),
  getUserById: sqlite.prepare('SELECT * FROM users WHERE id = ?'),
  countAdmins: sqlite.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND status = 'approved'"),
  countPending: sqlite.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'pending'"),

  // Subscriptions
  getSubscriptions: sqlite.prepare(`
    SELECT u.id, u.email, u.name
    FROM subscriptions s
    JOIN users u ON u.id = s.target_user_id
    WHERE s.subscriber_id = ?
    ORDER BY COALESCE(u.name, u.email) ASC
  `),
  addSubscription: sqlite.prepare('INSERT OR IGNORE INTO subscriptions (subscriber_id, target_user_id) VALUES (?, ?)'),
  removeSubscription: sqlite.prepare('DELETE FROM subscriptions WHERE subscriber_id = ? AND target_user_id = ?'),
  isSubscribed: sqlite.prepare('SELECT 1 FROM subscriptions WHERE subscriber_id = ? AND target_user_id = ?'),
};

const db = {
  // Songs
  getSongsByUser(userId) {
    return stmts.getByUser.all(userId);
  },
  getFavoritesByUser(userId) {
    return stmts.getFavoritesByUser.all(userId);
  },
  getSong(id) {
    return stmts.getOne.get(id);
  },
  searchSongsByUser(userId, query) {
    const pattern = `%${query}%`;
    return stmts.searchByUser.all(userId, pattern, pattern);
  },
  createSong({ title, artist, content, source_url, strummings, youtube_url, spotify_url, user_id }) {
    const strummingsJson = strummings ? JSON.stringify(strummings) : null;
    const result = stmts.insert.run(
      title, artist || null, content, source_url || null,
      strummingsJson, youtube_url || null, spotify_url || null, user_id
    );
    return this.getSong(result.lastInsertRowid);
  },
  updateSong(id, userId, { title, artist, content, source_url, is_favorite, default_instrument, strummings, youtube_url, spotify_url }) {
    const strummingsJson = strummings ? JSON.stringify(strummings) : null;
    const result = stmts.update.run(
      title, artist, content, source_url,
      is_favorite !== undefined ? (is_favorite ? 1 : 0) : null,
      default_instrument,
      strummingsJson,
      youtube_url !== undefined ? youtube_url : null,
      spotify_url !== undefined ? spotify_url : null,
      id, userId
    );
    if (result.changes === 0) return null;
    return this.getSong(id);
  },
  toggleFavorite(id, userId) {
    const result = stmts.toggleFavorite.run(id, userId);
    if (result.changes === 0) return null;
    return this.getSong(id);
  },
  deleteSong(id, userId) {
    const result = stmts.delete.run(id, userId);
    return result.changes > 0;
  },

  // Users
  getUserByEmail(email) {
    return stmts.getUserByEmail.get(email);
  },
  getAllUsers() {
    return stmts.getAllUsers.all();
  },
  getPendingUsers() {
    return stmts.getPendingUsers.all();
  },
  getApprovedUsers() {
    return stmts.getApprovedUsers.all();
  },
  createUser({ email, name, role, status = 'approved' }) {
    const result = stmts.insertUser.run(email, name || null, role || 'readonly', status);
    return stmts.getUserById.get(result.lastInsertRowid);
  },
  createPendingUser({ email }) {
    const result = stmts.insertUser.run(email, null, 'readonly', 'pending');
    return stmts.getUserById.get(result.lastInsertRowid);
  },
  updateUser(id, { name, role }) {
    const result = stmts.updateUser.run(name || null, role, id);
    if (result.changes === 0) return null;
    return stmts.getUserById.get(id);
  },
  approveUser(id) {
    const result = stmts.approveUser.run(id);
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
  },
  countPending() {
    return stmts.countPending.get().count;
  },

  // Subscriptions
  getSubscriptions(userId) {
    return stmts.getSubscriptions.all(userId);
  },
  addSubscription(subscriberId, targetUserId) {
    stmts.addSubscription.run(subscriberId, targetUserId);
  },
  removeSubscription(subscriberId, targetUserId) {
    stmts.removeSubscription.run(subscriberId, targetUserId);
  },
  isSubscribed(subscriberId, targetUserId) {
    return !!stmts.isSubscribed.get(subscriberId, targetUserId);
  },
};

export default db;
