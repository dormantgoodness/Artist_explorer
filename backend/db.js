import Database from 'better-sqlite3';

// Creates db.sqlite in working dir if not present
const db = new Database('db.sqlite');

db.pragma('journal_mode = WAL');

// Simple favorites table keyed by artist_id
// picture is optional; added_at defaults to now

db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    artist_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    picture TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export const addFavorite = db.prepare(
  `INSERT OR REPLACE INTO favorites (artist_id, name, picture) VALUES (@artist_id, @name, @picture)`
);

export const removeFavorite = db.prepare(
  `DELETE FROM favorites WHERE artist_id = ?`
);

export const listFavorites = db.prepare(
  `SELECT artist_id AS artistId, name, picture, added_at AS addedAt FROM favorites ORDER BY added_at DESC`
);

export default db;