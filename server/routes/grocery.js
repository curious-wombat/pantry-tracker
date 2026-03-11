const express = require('express');
const router = express.Router();
const db = require('../db');

// Clean up orphaned items (no list_id)
router.delete('/orphans', (req, res) => {
  const result = db.prepare('DELETE FROM grocery_items WHERE list_id IS NULL AND household_code = ?').run(req.householdCode)
  res.json({ deleted: result.changes })
})

router.get('/', (req, res) => {
  const { list_id } = req.query;
  const hc = req.householdCode;
  let query = 'SELECT * FROM grocery_items WHERE household_code = ?';
  const params = [hc];
  if (list_id) { query += ' AND list_id = ?'; params.push(list_id); }
  query += ' ORDER BY checked ASC, sort_order ASC, created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { name, quantity, unit, storage_location, list_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare(`
    INSERT INTO grocery_items (name, quantity, unit, storage_location, list_id, is_auto_generated, household_code)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(name, quantity ?? 1, unit ?? 'item', storage_location ?? 'pantry', list_id ?? null, req.householdCode);
  res.status(201).json(db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(result.lastInsertRowid));
});

router.post('/add-from-inventory', (req, res) => {
  const { item_id, list_id } = req.body;
  const item = db.prepare('SELECT * FROM items WHERE id = ? AND household_code = ?').get(item_id, req.householdCode);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const targetList = list_id || item.preferred_list_id;
  const existing = db.prepare('SELECT id FROM grocery_items WHERE source_item_id = ? AND checked = 0 AND household_code = ?').get(item_id, req.householdCode);
  if (existing) return res.status(409).json({ error: 'Already on grocery list', id: existing.id });
  const result = db.prepare(`
    INSERT INTO grocery_items (name, quantity, unit, storage_location, list_id, is_auto_generated, source_item_id, household_code)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?)
  `).run(item.name, 1, item.unit, item.storage_location, targetList, item_id, req.householdCode);
  res.status(201).json(db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(result.lastInsertRowid));
});

router.post('/generate', (req, res) => {
  const hc = req.householdCode;
  const lowStock = db.prepare('SELECT * FROM items WHERE commonly_used = 1 AND quantity <= low_stock_threshold AND household_code = ?').all(hc);
  const inserted = [];
  for (const item of lowStock) {
    const existing = db.prepare('SELECT id FROM grocery_items WHERE source_item_id = ? AND checked = 0 AND household_code = ?').get(item.id, hc);
    if (!existing) {
      const result = db.prepare(`
        INSERT INTO grocery_items (name, quantity, unit, storage_location, list_id, is_auto_generated, source_item_id, household_code)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `).run(item.name, Math.max(item.low_stock_threshold * 2, 1), item.unit, item.storage_location, item.preferred_list_id ?? null, item.id, hc);
      inserted.push(db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(result.lastInsertRowid));
    }
  }
  res.json({ added: inserted.length, items: inserted });
});

router.put('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM grocery_items WHERE id = ? AND household_code = ?').get(req.params.id, req.householdCode);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const { checked, name, quantity, unit, storage_location, list_id, sort_order } = req.body;
  db.prepare(`
    UPDATE grocery_items SET checked=?, name=?, quantity=?, unit=?, storage_location=?, list_id=?, sort_order=?
    WHERE id=?
  `).run(
    checked !== undefined ? (checked ? 1 : 0) : item.checked,
    name ?? item.name, quantity ?? item.quantity, unit ?? item.unit,
    storage_location ?? item.storage_location,
    list_id !== undefined ? list_id : item.list_id,
    sort_order ?? item.sort_order, req.params.id
  );
  res.json(db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(req.params.id));
});

router.post('/:id/restock', (req, res) => {
  const grocItem = db.prepare('SELECT * FROM grocery_items WHERE id = ? AND household_code = ?').get(req.params.id, req.householdCode);
  if (!grocItem) return res.status(404).json({ error: 'Item not found' });
  if (grocItem.source_item_id) {
    const src = db.prepare('SELECT * FROM items WHERE id = ?').get(grocItem.source_item_id);
    if (src) db.prepare(`UPDATE items SET quantity=?, updated_at=datetime('now') WHERE id=?`).run(src.quantity + grocItem.quantity, grocItem.source_item_id);
  } else {
    db.prepare(`INSERT INTO items (name, quantity, unit, storage_location, household_code) VALUES (?, ?, ?, ?, ?)`).run(grocItem.name, grocItem.quantity, grocItem.unit, grocItem.storage_location, req.householdCode);
  }
  db.prepare('DELETE FROM grocery_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/restock/all', (req, res) => {
  const { list_id } = req.body;
  const hc = req.householdCode;
  const checkedItems = db.prepare(
    'SELECT * FROM grocery_items WHERE checked = 1 AND list_id = ? AND household_code = ?'
  ).all(list_id, hc);

  let restocked = 0;
  for (const grocItem of checkedItems) {
    if (grocItem.source_item_id) {
      const src = db.prepare('SELECT * FROM items WHERE id = ?').get(grocItem.source_item_id);
      if (src) {
        db.prepare(`UPDATE items SET quantity=?, updated_at=datetime('now') WHERE id=?`)
          .run(src.quantity + grocItem.quantity, grocItem.source_item_id);
      }
    } else {
      db.prepare(`INSERT INTO items (name, quantity, unit, storage_location, household_code) VALUES (?, ?, ?, ?, ?)`)
        .run(grocItem.name, grocItem.quantity, grocItem.unit, grocItem.storage_location || 'pantry', hc);
    }
    db.prepare('DELETE FROM grocery_items WHERE id = ?').run(grocItem.id);
    restocked++;
  }
  res.json({ success: true, restocked });
});



router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM grocery_items WHERE id = ? AND household_code = ?').run(req.params.id, req.householdCode);
  res.json({ success: true });
});
  const { list_id } = req.query;
  const hc = req.householdCode;
  if (list_id) {
    db.prepare('DELETE FROM grocery_items WHERE checked = 1 AND list_id = ? AND household_code = ?').run(list_id, hc);
  } else {
    db.prepare('DELETE FROM grocery_items WHERE checked = 1 AND household_code = ?').run(hc);
  }
  res.json({ success: true });
});

module.exports = router;
