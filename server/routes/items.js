const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all items, optionally filtered by location
router.get('/', (req, res) => {
  const { location } = req.query;
  let query = 'SELECT * FROM items';
  const params = [];
  if (location) {
    query += ' WHERE storage_location = ?';
    params.push(location);
  }
  query += ' ORDER BY category, name';
  const items = db.prepare(query).all(...params);
  res.json(items);
});

// POST create item
router.post('/', (req, res) => {
  const { name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold } = req.body;
  if (!name || !storage_location) {
    return res.status(400).json({ error: 'name and storage_location are required' });
  }
  const result = db.prepare(`
    INSERT INTO items (name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    quantity ?? 1,
    unit ?? 'item',
    category ?? 'General',
    storage_location,
    commonly_used ? 1 : 0,
    low_stock_threshold ?? 1
  );
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

// PUT update item
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const { name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold } = req.body;
  db.prepare(`
    UPDATE items SET
      name = ?, quantity = ?, unit = ?, category = ?,
      storage_location = ?, commonly_used = ?, low_stock_threshold = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name ?? item.name,
    quantity ?? item.quantity,
    unit ?? item.unit,
    category ?? item.category,
    storage_location ?? item.storage_location,
    commonly_used !== undefined ? (commonly_used ? 1 : 0) : item.commonly_used,
    low_stock_threshold ?? item.low_stock_threshold,
    id
  );
  res.json(db.prepare('SELECT * FROM items WHERE id = ?').get(id));
});

// POST use one (decrement quantity by 1)
router.post('/:id/use', (req, res) => {
  const { id } = req.params;
  const { amount = 1 } = req.body;
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const newQty = Math.max(0, item.quantity - amount);
  db.prepare(`UPDATE items SET quantity = ?, updated_at = datetime('now') WHERE id = ?`).run(newQty, id);
  const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  const isLow = updated.commonly_used && updated.quantity <= updated.low_stock_threshold;
  res.json({ ...updated, isLow });
});

// DELETE item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  if (!db.prepare('SELECT id FROM items WHERE id = ?').get(id)) {
    return res.status(404).json({ error: 'Item not found' });
  }
  db.prepare('DELETE FROM items WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
