const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'pantry.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS grocery_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#2D6A4F',
    household_code TEXT NOT NULL DEFAULT 'default',
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
    expiration_date TEXT,
    household_code TEXT NOT NULL DEFAULT 'default',
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
    household_code TEXT NOT NULL DEFAULT 'default',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migrations
const addCol = (table, col, type) => {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
};

addCol('items', 'preferred_list_id', 'INTEGER');
addCol('items', 'expiration_date', 'TEXT');
addCol('items', 'purchased_date', 'TEXT');
addCol('items', 'household_code', "TEXT NOT NULL DEFAULT 'default'");
addCol('grocery_items', 'list_id', 'INTEGER');
addCol('grocery_items', 'sort_order', 'INTEGER DEFAULT 0');
addCol('grocery_items', 'household_code', "TEXT NOT NULL DEFAULT 'default'");
addCol('grocery_lists', 'household_code', "TEXT NOT NULL DEFAULT 'default'");

// Migration: 'default' household code is no longer used; new households are set up via the app
db.prepare("UPDATE items SET household_code = 'default' WHERE household_code = 'default'").run();


module.exports = db;
