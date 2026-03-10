const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/suggest', async (req, res) => {
  const { items } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' });
  }

  const itemsList = items
    .filter(i => i.quantity > 0)
    .map(i => `- ${i.name}: ${i.quantity} ${i.unit} (${i.storage_location})`)
    .join('\n');

  const prompt = `You are a nutritionist and chef. Based on the pantry/fridge/freezer inventory below, suggest 4 healthy meal ideas.

STRICT DIETARY REQUIREMENTS:
- High protein, lower calorie
- Pre-diabetes friendly: low glycemic index, avoid refined sugars, minimize high-carb ingredients
- Include at least 1 vegetarian option
- Avoid white rice, white pasta, processed foods, sugary sauces

CURRENT INVENTORY:
${itemsList}

Respond with ONLY a valid JSON object (no markdown, no backticks, no preamble). Use exactly this structure:
{
  "meals": [
    {
      "name": "Meal Name",
      "description": "One-sentence description",
      "prepTime": "25 mins",
      "calories": "~420 cal",
      "protein": "~38g",
      "isVegetarian": false,
      "tags": ["high-protein", "low-carb"],
      "availableIngredients": ["eggs", "spinach"],
      "neededIngredients": ["feta cheese"],
      "instructions": "2-3 sentence cooking overview"
    }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text.trim();
    // Strip any accidental markdown fences
    const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (err) {
    console.error('Meal suggestion error:', err);
    res.status(500).json({ error: 'Failed to generate meal suggestions. Check your ANTHROPIC_API_KEY.' });
  }
});

module.exports = router;
