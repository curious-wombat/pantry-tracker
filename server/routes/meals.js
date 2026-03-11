const express = require('express');
const router = express.Router();
const db = require('../db');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/suggest', async (req, res) => {
  try {
    const { mealType = 'dinner' } = req.body
    const items = db.prepare('SELECT name, category, storage_location, quantity, unit FROM items WHERE household_code = ? AND quantity > 0 ORDER BY storage_location, category').all(req.householdCode);
    if (items.length === 0) return res.status(400).json({ error: 'No items in inventory' });

    const itemList = items.map(i => `${i.name} (${i.quantity} ${i.unit}, ${i.storage_location})`).join('\n');

    const mealGuidance = {
      breakfast: 'Focus on high-protein breakfast options: eggs, Greek yogurt parfaits, smoothies, overnight oats, savory breakfast bowls. Keep it energizing and blood-sugar friendly.',
      lunch: 'Focus on satisfying lunches: grain bowls, salads with protein, wraps, or soups.',
      dinner: 'Focus on complete dinner meals: proteins with vegetables and a healthy carb. High-protein, lower-carb, filling.',
      snack: 'Focus on healthy snacks: protein-rich bites, veggie-based snacks, small portions that curb hunger without spiking blood sugar.',
      dessert: 'Focus on lower-sugar, healthier dessert options: fruit-based, Greek yogurt desserts, or naturally sweet treats.'
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Based on these pantry items, suggest 4 healthy ${mealType} ideas. ${mealGuidance[mealType] || ''} Include vegetarian options where possible.

Pantry items:
${itemList}

Respond ONLY with a JSON object in exactly this format, no other text:
{
  "meals": [
    {
      "name": "Meal Name",
      "description": "Brief 1-2 sentence description",
      "prepTime": "20 minutes",
      "calories": "450 cal",
      "protein": "35g protein",
      "isVegetarian": false,
      "tags": ["high-protein", "low-carb"],
      "availableIngredients": ["ingredient you have", "another you have"],
      "neededIngredients": ["anything they need to buy"],
      "instructions": "Brief 2-5 sentence cooking instructions, in bullet point format."
    }
  ]
}`
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
