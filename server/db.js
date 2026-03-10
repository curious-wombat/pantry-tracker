const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'pantry.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit TEXT DEFAULT 'item',
    category TEXT DEFAULT 'General',
    storage_location TEXT CHECK(storage_location IN ('pantry', 'fridge', 'freezer')) NOT NULL,
    commonly_used INTEGER DEFAULT 0,
    low_stock_threshold REAL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS grocery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit TEXT DEFAULT 'item',
    storage_location TEXT DEFAULT 'pantry',
    checked INTEGER DEFAULT 0,
    is_auto_generated INTEGER DEFAULT 0,
    source_item_id INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;
