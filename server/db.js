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
  CREATE TABLE IF NOT EXISTS grocery_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#2D6A4F',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit TEXT DEFAULT 'item',
    category TEXT DEFAULT 'General',
    storage_location TEXT CHECK(storage_location IN ('pantry', 'fridge', 'freezer')) NOT NULL,
    commonly_used INTEGER DEFAULT 0,
    low_stock_threshold REAL DEFAULT 1,
    preferred_list_id INTEGER REFERENCES grocery_lists(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS grocery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity REAL DEFAULT 1,
    unit TEXT DEFAULT 'item',
    storage_location TEXT DEFAULT 'pantry',
    list_id INTEGER REFERENCES grocery_lists(id) ON DELETE CASCADE,
    checked INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_auto_generated INTEGER DEFAULT 0,
    source_item_id INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migrate existing data
const itemCols = db.prepare("PRAGMA table_info(items)").all().map(c => c.name);
if (!itemCols.includes('preferred_list_id')) {
  db.exec('ALTER TABLE items ADD COLUMN preferred_list_id INTEGER');
}

const groceryCols = db.prepare("PRAGMA table_info(grocery_items)").all().map(c => c.name);
if (!groceryCols.includes('list_id')) {
  db.exec('ALTER TABLE grocery_items ADD COLUMN list_id INTEGER');
}
if (!groceryCols.includes('sort_order')) {
  db.exec('ALTER TABLE grocery_items ADD COLUMN sort_order INTEGER DEFAULT 0');
}

// Seed default lists if none exist
const listCount = db.prepare('SELECT COUNT(*) as count FROM grocery_lists').get();
if (listCount.count === 0) {
  db.prepare("INSERT INTO grocery_lists (name, color) VALUES (?, ?)").run('Regular Groceries', '#2D6A4F');
  db.prepare("INSERT INTO grocery_lists (name, color) VALUES (?, ?)").run('Costco', '#457B9D');
  db.prepare("INSERT INTO grocery_lists (name, color) VALUES (?, ?)").run('Asian Market', '#E07B39');
}

module.exports = db;
