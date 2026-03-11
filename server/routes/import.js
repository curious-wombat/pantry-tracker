const express = require('express');
const router = express.Router();
const db = require('../db');

// POST bulk import items from CSV data
router.post('/', (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' });
  }

  const VALID_LOCATIONS = ['pantry', 'fridge', 'freezer'];
  const VALID_UNITS = ['item', 'serving', 'oz', 'lb', 'kg', 'g', 'ml', 'L', 'cup', 'tbsp', 'tsp', 'can', 'box', 'bag', 'bunch', 'bottle', 'pack', 'slice'];

  const inserted = [];
  const errors = [];

  const insert = db.prepare(`
    INSERT INTO items (name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const importMany = db.transaction((rows) => {
    for (const [i, row] of rows.entries()) {
      const name = (row.name || '').trim();
      if (!name) { errors.push(`Row ${i + 2}: missing name`); continue; }

      const location = (row.storage_location || 'pantry').toLowerCase().trim();
      if (!VALID_LOCATIONS.includes(location)) {
        errors.push(`Row ${i + 2}: invalid location "${location}" — use pantry, fridge, or freezer`);
        continue;
      }

      const unit = (row.unit || 'item').trim();
      const quantity = parseFloat(row.quantity) || 1;
      const category = (row.category || 'General').trim();
      const commonly_used = ['true', '1', 'yes'].includes(String(row.commonly_used || '').toLowerCase()) ? 1 : 0;
      const low_stock_threshold = parseFloat(row.low_stock_threshold) || 1;

      const result = insert.run(name, quantity, unit, category, location, commonly_used, low_stock_threshold);
      inserted.push(result.lastInsertRowid);
    }
  });

  try {
    importMany(items);
    res.json({ imported: inserted.length, errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
