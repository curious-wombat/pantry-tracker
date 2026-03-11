const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM grocery_lists WHERE household_code = ? ORDER BY created_at ASC').all(req.householdCode));
});

router.post('/', (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare('INSERT INTO grocery_lists (name, color, household_code) VALUES (?, ?, ?)').run(name, color || '#2D6A4F', req.householdCode);
  res.status(201).json(db.prepare('SELECT * FROM grocery_lists WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const list = db.prepare('SELECT * FROM grocery_lists WHERE id = ? AND household_code = ?').get(req.params.id, req.householdCode);
  if (!list) return res.status(404).json({ error: 'List not found' });
  const { name, color } = req.body;
  db.prepare('UPDATE grocery_lists SET name = ?, color = ? WHERE id = ?').run(name ?? list.name, color ?? list.color, req.params.id);
  res.json(db.prepare('SELECT * FROM grocery_lists WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM grocery_lists WHERE household_code = ?').get(req.householdCode);
  if (count.count <= 1) return res.status(400).json({ error: 'Cannot delete the last list' });
  db.prepare('DELETE FROM grocery_lists WHERE id = ? AND household_code = ?').run(req.params.id, req.householdCode);
  res.json({ success: true });
});

// Bootstrap default lists for a new household
router.post('/bootstrap', (req, res) => {
  const hc = req.householdCode;
  const existing = db.prepare('SELECT COUNT(*) as count FROM grocery_lists WHERE household_code = ?').get(hc);
  if (existing.count > 0) return res.json({ bootstrapped: false });
  db.prepare("INSERT INTO grocery_lists (name, color, household_code) VALUES (?, ?, ?)").run('Regular Groceries', '#2D6A4F', hc);
  db.prepare("INSERT INTO grocery_lists (name, color, household_code) VALUES (?, ?, ?)").run('Costco', '#457B9D', hc);
  db.prepare("INSERT INTO grocery_lists (name, color, household_code) VALUES (?, ?, ?)").run('Asian Market', '#E07B39', hc);
  res.json({ bootstrapped: true });
});

module.exports = router;
