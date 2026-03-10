const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all grocery items
router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM grocery_items ORDER BY checked ASC, created_at DESC').all();
  res.json(items);
});

// POST add manual item
router.post('/', (req, res) => {
  const { name, quantity, unit, storage_location } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare(`
    INSERT INTO grocery_items (name, quantity, unit, storage_location, is_auto_generated)
    VALUES (?, ?, ?, ?, 0)
  `).run(name, quantity ?? 1, unit ?? 'item', storage_location ?? 'pantry');
  res.status(201).json(db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(result.lastInsertRowid));
});

// POST auto-generate grocery list from low-stock commonly-used items
router.post('/generate', (req, res) => {
  const lowStock = db.prepare(`
    SELECT * FROM items WHERE commonly_used = 1 AND quantity <= low_stock_threshold
  `).all();

  const inserted = [];
  for (const item of lowStock) {
    const existing = db.prepare(
      'SELECT id FROM grocery_items WHERE source_item_id = ? AND checked = 0'
    ).get(item.id);
    if (!existing) {
      const result = db.prepare(`
        INSERT INTO grocery_items (name, quantity, unit, storage_location, is_auto_generated, source_item_id)
        VALUES (?, ?, ?, ?, 1, ?)
      `).run(item.name, Math.max(item.low_stock_threshold * 2, 1), item.unit, item.storage_location, item.id);
      inserted.push(db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(result.lastInsertRowid));
    }
  }
  res.json({ added: inserted.length, items: inserted });
});

// PUT update grocery item (toggle check, edit)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const item = db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const { checked, name, quantity, unit, storage_location } = req.body;
  db.prepare(`
    UPDATE grocery_items SET checked = ?, name = ?, quantity = ?, unit = ?, storage_location = ?
    WHERE id = ?
  `).run(
    checked !== undefined ? (checked ? 1 : 0) : item.checked,
    name ?? item.name,
    quantity ?? item.quantity,
    unit ?? item.unit,
    storage_location ?? item.storage_location,
    id
  );
  res.json(db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(id));
});

// POST restock checked item back into inventory
router.post('/:id/restock', (req, res) => {
  const { id } = req.params;
  const grocItem = db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(id);
  if (!grocItem) return res.status(404).json({ error: 'Item not found' });

  if (grocItem.source_item_id) {
    const src = db.prepare('SELECT * FROM items WHERE id = ?').get(grocItem.source_item_id);
    if (src) {
      db.prepare(`UPDATE items SET quantity = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(src.quantity + grocItem.quantity, grocItem.source_item_id);
    }
  } else {
    db.prepare(`INSERT INTO items (name, quantity, unit, storage_location) VALUES (?, ?, ?, ?)`)
      .run(grocItem.name, grocItem.quantity, grocItem.unit, grocItem.storage_location);
  }
  db.prepare('DELETE FROM grocery_items WHERE id = ?').run(id);
  res.json({ success: true });
});

// DELETE single grocery item
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM grocery_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// DELETE all checked items
router.delete('/checked/all', (req, res) => {
  db.prepare('DELETE FROM grocery_items WHERE checked = 1').run();
  res.json({ success: true });
});

module.exports = router;
