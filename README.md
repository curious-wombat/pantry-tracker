# 🥬 Pantry Tracker

A full-stack progressive web app (PWA) for tracking household pantry, fridge, and freezer inventory — with AI-powered meal suggestions, grocery list management, and multi-household support.

**Live app:** https://pantry-tracker-production.up.railway.app  
**GitHub:** https://github.com/curious-wombat/pantry-tracker

---

## Features

### Inventory
- Track items across **Pantry**, **Fridge**, and **Freezer**
- **+ / − buttons** to increment or decrement quantity directly from the card
- **Long-press** any item card to Edit or Delete
- **Expiration date tracking** with color-coded urgency tags (gray → orange → red)
- **Auto-expiration** for Leftovers in fridge (4 days from today)
- **Low stock alerts** when commonly-used items fall below threshold
- **⚠️ Expiring soon banner** — tappable alert when items expire within 3 days
- **🕐 Use It Up mode** — filters to expiring items sorted by soonest first
- **Sort by** Category, A–Z, Low Stock, or Use It Up
- **Search across all locations** — results show a location tag (fridge / pantry / freezer)
- **Bulk import** via CSV upload
- **Add item to grocery list** via cart button on item card

### Grocery Lists
- Multiple named grocery lists (e.g. Costco, Whole Foods, Trader Joe's)
- **Drag-and-drop** to reorder items within a list
- **Move items** between lists
- **Auto-fill** from low-stock inventory items
- **↩ Restock all** — one tap to send all checked items back to inventory
- **↩ Restock individual** items from the Done section
- **Clear all** checked items
- Tap item name to edit inline (quantity, unit, storage location)

### Meal Ideas (AI-powered)
- Choose meal type: 🌅 Breakfast · 🥗 Lunch · 🍽️ Dinner · 🍎 Snack · 🍓 Dessert
- **Prioritizes expiring ingredients** automatically when generating suggestions
- Tuned for: high-protein, low-carb, low-GI, pre-diabetes friendly, fiber-rich, colorful micronutrients
- Macro targets: 1700–1900 cal/day, 100–120g protein/day
- Each suggestion shows: prep time, calories, protein, tags, ingredients you have, what to buy, and numbered step-by-step instructions
- Vegetarian options included

### Multi-Household
- Each household has a unique code (e.g. `jo-house`, `kelly-house`)
- Switch households via 🏠 button in the inventory header
- All data is scoped per household

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| AI | Anthropic Claude API (claude-sonnet-4-6) |
| PWA | vite-plugin-pwa |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Hosting | Railway (with persistent /data volume) |

---

## Project Structure

```
pantry-tracker/
  /client
    /src
      App.jsx
      api.js
      /components
        AddItemModal.jsx
        GroceryList.jsx
        HouseholdSetup.jsx
        ImportModal.jsx
        InventoryView.jsx
        ItemCard.jsx
        MealSuggestions.jsx
        Navigation.jsx
    vite.config.js
    tailwind.config.js
  /server
    index.js
    db.js
    /middleware
      household.js
    /routes
      grocery.js
      import.js
      items.js
      lists.js
      meals.js
  package.json
```

---

## Database Schema

```sql
items (
  id, name, quantity, unit, category, storage_location,
  commonly_used, low_stock_threshold, preferred_list_id,
  expiration_date, household_code, created_at, updated_at
)

grocery_lists (id, name, color, household_code, created_at)

grocery_items (
  id, name, quantity, unit, storage_location, list_id,
  checked, sort_order, is_auto_generated, source_item_id,
  household_code, created_at
)
```

---

## CSV Import Format

Headers: `name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold, expiration_date`

Valid values:
- **unit:** item, serving, oz, lb, kg, g, ml, L, cup, tbsp, tsp, can, jar, box, bag, bunch, bottle, pack, slice
- **category:** Produce, Protein, Dairy, Grains, Pantry Staples, Spices, Leftovers, Snacks, Frozen, Condiments, Beverages, Other
- **storage_location:** pantry, fridge, freezer
- **commonly_used:** true / false
- **expiration_date:** YYYY-MM-DD (optional)

---

## Deployment (Railway)

- **Build command:** `npm run deploy-build`
- **Start command:** `npm start`
- **Env vars:** `ANTHROPIC_API_KEY`, `NODE_ENV=production`, `PORT=8080`, `DB_PATH=/data/pantry.db`
- **Volume:** mounted at `/data` for SQLite persistence

### To update: edit on GitHub → Railway auto-redeploys. Always `Cmd+A` before pasting a file.

### Force fresh build: bump version in root `package.json`

### Clear PWA cache:
```js
navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
location.reload();
```

---

## Known Gotchas

- **SQLite booleans:** stored as 0/1 — always check `=== 1` in JSX, never just truthiness
- **List ID type mismatch:** use `String()` comparison when filtering lists
- **Meal suggestions JSON truncation:** `max_tokens` set to 4096 for large inventories
