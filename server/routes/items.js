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

router.get('/quick-add', (req, res) => {
  const { name, quantity, unit, category, storage_location, commonly_used, expiration_date, purchased_date } = req.query;
  if (!name || !storage_location) return res.status(400).json({ error: 'name and storage_location are required' });
  const validLocations = ['pantry', 'fridge', 'freezer'];
  if (!validLocations.includes(storage_location)) return res.status(400).json({ error: 'storage_location must be pantry, fridge, or freezer' });
  const today = new Date().toISOString().split('T')[0];
  const result = db.prepare(`
    INSERT INTO items (name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold, expiration_date, purchased_date, household_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    parseFloat(quantity) || 1,
    unit || 'item',
    category || 'Other',
    storage_location,
    commonly_used === 'true' ? 1 : 0,
    1,
    expiration_date || null,
    purchased_date || today,
    req.householdCode
  );
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, item });
});

router.get('/suggest', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `For the grocery item "${name}", respond with ONLY a JSON object (no markdown) with these exact fields:
- category: one of [Produce, Protein, Dairy, Grains, Pantry Staples, Spices, Leftovers, Snacks, Frozen, Condiments, Beverages, Other]
- storage_location: one of [pantry, fridge, freezer]
- unit: one of [item, serving, oz, lb, kg, g, ml, L, cup, tbsp, tsp, can, jar, box, bag, bunch, bottle, pack, slice]
- quantity: a sensible default number for how someone would typically buy this item

Examples:
{"category":"Protein","storage_location":"fridge","unit":"item","quantity":12} for "eggs"
{"category":"Protein","storage_location":"pantry","unit":"can","quantity":1} for "black beans"
{"category":"Produce","storage_location":"fridge","unit":"bag","quantity":1} for "spinach"
{"category":"Pantry Staples","storage_location":"pantry","unit":"bottle","quantity":1} for "olive oil"
{"category":"Produce","storage_location":"pantry","unit":"bunch","quantity":1} for "bananas"`
        }]
      })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    const suggestion = JSON.parse(text);
    res.json(suggestion);
  } catch (e) {
    res.status(500).json({ error: 'Suggestion failed' });
  }
});

router.post('/', (req, res) => {
  const { name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold, preferred_list_id, expiration_date, purchased_date } = req.body;
  if (!name || !storage_location) return res.status(400).json({ error: 'name and storage_location are required' });
  const result = db.prepare(`
    INSERT INTO items (name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold, preferred_list_id, expiration_date, purchased_date, household_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, quantity ?? 1, unit ?? 'item', category ?? 'General', storage_location, commonly_used ? 1 : 0, low_stock_threshold ?? 1, preferred_list_id ?? null, expiration_date ?? null, purchased_date ?? null, req.householdCode);
  res.status(201).json(db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const item = db.prepare('SELECT * FROM items WHERE id = ? AND household_code = ?').get(id, req.householdCode);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const { name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold, preferred_list_id, expiration_date, purchased_date } = req.body;
  db.prepare(`
    UPDATE items SET name=?, quantity=?, unit=?, category=?, storage_location=?,
      commonly_used=?, low_stock_threshold=?, preferred_list_id=?, expiration_date=?, purchased_date=?, updated_at=datetime('now')
    WHERE id=? AND household_code=?
  `).run(
    name ?? item.name, quantity ?? item.quantity, unit ?? item.unit,
    category ?? item.category, storage_location ?? item.storage_location,
    commonly_used !== undefined ? (commonly_used ? 1 : 0) : item.commonly_used,
    low_stock_threshold ?? item.low_stock_threshold,
    preferred_list_id !== undefined ? preferred_list_id : item.preferred_list_id,
    expiration_date !== undefined ? expiration_date : item.expiration_date,
    purchased_date !== undefined ? purchased_date : item.purchased_date,
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

router.post('/:id/increment', (req, res) => {
  const { id } = req.params;
  const { amount = 1 } = req.body;
  const item = db.prepare('SELECT * FROM items WHERE id = ? AND household_code = ?').get(id, req.householdCode);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const newQty = item.quantity + amount;
  db.prepare(`UPDATE items SET quantity=?, updated_at=datetime('now') WHERE id=?`).run(newQty, id);
  res.json(db.prepare('SELECT * FROM items WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  if (!db.prepare('SELECT id FROM items WHERE id = ? AND household_code = ?').get(req.params.id, req.householdCode))
    return res.status(404).json({ error: 'Item not found' });
  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
