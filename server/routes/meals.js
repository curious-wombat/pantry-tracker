const express = require('express');
const router = express.Router();
const db = require('../db');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/suggest', async (req, res) => {
  try {
    const { mealType = 'dinner' } = req.body
    const items = db.prepare('SELECT name, category, storage_location, quantity, unit, expiration_date FROM items WHERE household_code = ? AND quantity > 0 ORDER BY storage_location, category').all(req.householdCode);
    if (items.length === 0) return res.status(400).json({ error: 'No items in inventory' });

    const today = new Date(); today.setHours(0,0,0,0);
    const threeDays = new Date(today); threeDays.setDate(today.getDate() + 3);

    const expiringItems = items.filter(i => {
      if (!i.expiration_date) return false;
      const exp = new Date(i.expiration_date); exp.setHours(0,0,0,0);
      return exp <= threeDays;
    });

    const itemList = items.map(i => `${i.name} (${i.quantity} ${i.unit}, ${i.storage_location})`).join('\n');
    const expiringList = expiringItems.length > 0
      ? `\n⚠️ EXPIRING SOON (use these first!):\n${expiringItems.map(i => `- ${i.name} (expires ${i.expiration_date})`).join('\n')}`
      : '';

    const macroContext = 'The user targets 1700–1900 calories/day and 100–120g protein/day. Tailor portion sizes and ingredient choices to support these goals across meals. Prioritize protein density and flag approximate calories and protein per serving.'

    const mealGuidance = {
      breakfast: 'Focus on high-protein breakfast options: eggs, Greek yogurt parfaits, smoothies, overnight oats, savory breakfast bowls. Keep it energizing and blood-sugar friendly. Prioritize fiber-rich ingredients and a rainbow of colorful fruits and vegetables for micronutrients.',
      lunch: 'Focus on satisfying lunches: grain bowls, salads with protein, wraps, or soups. Prioritize fiber, a variety of colorful vegetables, and balanced macros.',
      dinner: 'Focus on complete dinner meals: proteins with vegetables and a healthy carb. High-protein, lower-carb, filling. Aim for a rainbow of colorful vegetables for micronutrients and include fiber-rich ingredients.',
      snack: 'Focus on healthy snacks: protein-rich bites, fiber-rich vegetables, small portions that curb hunger without spiking blood sugar. Colorful raw veggies, fruit, or protein combos are ideal.',
      dessert: 'Focus on lower-sugar, healthier dessert options: fruit-based, Greek yogurt desserts, or naturally sweet treats. Lean into colorful fruits for micronutrients and fiber.'
    }

    const expiringNote = expiringItems.length > 0
      ? `IMPORTANT: Prioritize using the expiring items listed above — try to incorporate them into as many of the 4 suggestions as possible.`
      : '';

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Based on these pantry items, suggest 4 healthy ${mealType} ideas. ${mealGuidance[mealType] || ''} ${macroContext} ${expiringNote} Include vegetarian options where possible.
${expiringList}

All pantry items:
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
      "instructions": ["Step one.", "Step two.", "Step three."]
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
