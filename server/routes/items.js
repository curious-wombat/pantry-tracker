const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { location } = req.query;
  const hc = req.householdCode;
  let query = 'SELECT * FROM items WHERE household_code = ?';
  const params = [hc];
  if (location) { query += ' AND storage_location = ?'; params.push(location); }
  query += ' ORDER BY category, name';
  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold, preferred_list_id, expiration_date } = req.body;
  if (!name || !storage_location) return res.status(400).json({ error: 'name and storage_location are required' });
  const result = db.prepare(`
    INSERT INTO items (name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold, preferred_list_id, expiration_date, household_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, quantity ?? 1, unit ?? 'item', category ?? 'General', storage_location, commonly_used ? 1 : 0, low_stock_threshold ?? 1, preferred_list_id ?? null, expiration_date ?? null, req.householdCode);
  res.status(201).json(db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const item = db.prepare('SELECT * FROM items WHERE id = ? AND household_code = ?').get(id, req.householdCode);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const { name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold, preferred_list_id, expiration_date } = req.body;
  db.prepare(`
    UPDATE items SET name=?, quantity=?, unit=?, category=?, storage_location=?,
      commonly_used=?, low_stock_threshold=?, preferred_list_id=?, expiration_date=?, updated_at=datetime('now')
    WHERE id=? AND household_code=?
  `).run(
    name ?? item.name, quantity ?? item.quantity, unit ?? item.unit,
    category ?? item.category, storage_location ?? item.storage_location,
    commonly_used !== undefined ? (commonly_used ? 1 : 0) : item.commonly_used,
    low_stock_threshold ?? item.low_stock_threshold,
    preferred_list_id !== undefined ? preferred_list_id : item.preferred_list_id,
    expiration_date !== undefined ? expiration_date : item.expiration_date,
    id, req.householdCode
  );
  res.json(db.prepare('SELECT * FROM items WHERE id = ?').get(id));
});

router.post('/:id/use', (req, res) => {
  const { id } = req.params;
  const { amount = 1 } = req.body;
  const item = db.prepare('SELECT * FROM items WHERE id = ? AND household_code = ?').get(id, req.householdCode);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const newQty = Math.max(0, item.quantity - amount);
  db.prepare(`UPDATE items SET quantity=?, updated_at=datetime('now') WHERE id=?`).run(newQty, id);
  const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  res.json({ ...updated, isLow: updated.commonly_used === 1 && updated.quantity < updated.low_stock_threshold });
});

router.delete('/:id', (req, res) => {
  if (!db.prepare('SELECT id FROM items WHERE id = ? AND household_code = ?').get(req.params.id, req.householdCode))
    return res.status(404).json({ error: 'Item not found' });
  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
