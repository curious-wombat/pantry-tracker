const express = require('express');
const router = express.Router();
const db = require('../db');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/suggest', async (req, res) => {
  try {
    const items = db.prepare('SELECT name, category, storage_location, quantity, unit FROM items WHERE household_code = ? AND quantity > 0 ORDER BY storage_location, category').all(req.householdCode);
    if (items.length === 0) return res.status(400).json({ error: 'No items in inventory' });

    const itemList = items.map(i => `${i.name} (${i.quantity} ${i.unit}, ${i.storage_location})`).join('\n');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Based on these pantry items, suggest 4 healthy meal ideas. Focus on high-protein, lower-carb options. Include vegetarian options where possible. For each meal provide: name, brief description, key ingredients from the list, and approximate macros (protein/carbs/fat).

Pantry items:
${itemList}

Respond in JSON format: { "meals": [{ "name": "", "description": "", "ingredients": [], "macros": { "protein": "", "carbs": "", "fat": "" }, "prepTime": "" }] }`
      }]
    });

    const text = message.content[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(clean);
    res.json(data);
  } catch (err) {
    console.error('Meal suggestion error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;const express = require('express');
const router = express.Router();
const db = require('../db');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/suggest', async (req, res) => {
  try {
    const items = db.prepare('SELECT name, category, storage_location, quantity, unit FROM items WHERE household_code = ? AND quantity > 0 ORDER BY storage_location, category').all(req.householdCode);
    if (items.length === 0) return res.status(400).json({ error: 'No items in inventory' });

    const itemList = items.map(i => `${i.name} (${i.quantity} ${i.unit}, ${i.storage_location})`).join('\n');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Based on these pantry items, suggest 4 healthy meal ideas. Focus on high-protein, lower-carb options. Include vegetarian options where possible. For each meal provide: name, brief description, key ingredients from the list, and approximate macros (protein/carbs/fat).

Pantry items:
${itemList}

Respond in JSON format: { "meals": [{ "name": "", "description": "", "ingredients": [], "macros": { "protein": "", "carbs": "", "fat": "" }, "prepTime": "" }] }`
      }]
    });

    const text = message.content[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(clean);
    res.json(data);
  } catch (err) {
    console.error('Meal suggestion error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
