const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'No items provided' });

  const VALID_LOCATIONS = ['pantry', 'fridge', 'freezer'];
  const inserted = [], errors = [];
  const hc = req.householdCode;

  const insert = db.prepare(`
    INSERT INTO items (name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold, household_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const importMany = db.transaction((rows) => {
    for (const [i, row] of rows.entries()) {
      const name = (row.name || '').trim();
      if (!name) { errors.push(`Row ${i + 2}: missing name`); continue; }
      const location = (row.storage_location || 'pantry').toLowerCase().trim();
      if (!VALID_LOCATIONS.includes(location)) {
        errors.push(`Row ${i + 2}: invalid location "${location}"`); continue;
      }
      const result = insert.run(
        name, parseFloat(row.quantity) || 1, (row.unit || 'item').trim(),
        (row.category || 'General').trim(), location,
        ['true', '1', 'yes'].includes(String(row.commonly_used || '').toLowerCase()) ? 1 : 0,
        parseFloat(row.low_stock_threshold) || 1, hc
      );
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
