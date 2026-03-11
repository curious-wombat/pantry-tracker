const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all lists
router.get('/', (req, res) => {
  const lists = db.prepare('SELECT * FROM grocery_lists ORDER BY created_at ASC').all();
  res.json(lists);
});

// POST create list
router.post('/', (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare('INSERT INTO grocery_lists (name, color) VALUES (?, ?)').run(name, color || '#2D6A4F');
  res.status(201).json(db.prepare('SELECT * FROM grocery_lists WHERE id = ?').get(result.lastInsertRowid));
});

// PUT rename/recolor list
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const list = db.prepare('SELECT * FROM grocery_lists WHERE id = ?').get(id);
  if (!list) return res.status(404).json({ error: 'List not found' });
  const { name, color } = req.body;
  db.prepare('UPDATE grocery_lists SET name = ?, color = ? WHERE id = ?').run(name ?? list.name, color ?? list.color, id);
  res.json(db.prepare('SELECT * FROM grocery_lists WHERE id = ?').get(id));
});

// DELETE list (cascades to grocery_items)
router.delete('/:id', (req, res) => {
  const lists = db.prepare('SELECT COUNT(*) as count FROM grocery_lists').get();
  if (lists.count <= 1) return res.status(400).json({ error: 'Cannot delete the last list' });
  db.prepare('DELETE FROM grocery_lists WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
