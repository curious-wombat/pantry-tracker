# 🥬 Pantry Tracker

A full-stack progressive web app (PWA) for tracking household pantry, fridge, and freezer inventory — with AI-powered meal suggestions, smart grocery list management, photo scanning, and multi-household support.

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
- **Auto-assigned expiry dates** when adding or restocking items — AI guesses shelf life based on item name (e.g. mushrooms = 7 days, eggs = 35 days, canned beans = null)
- **Purchase date tracking** — auto-set on restock, manually settable on add
- **Low stock alerts** when commonly-used items fall below threshold
- **⚠️ Expiring soon banner** — tappable alert when items expire within 3 days
- **🕐 Use It Up mode** — filters to expiring items sorted by soonest first
- **Sort by** Category, A–Z, Low Stock, or Use It Up
- **Search across all locations** — results show a location tag (fridge / pantry / freezer)
- **Bulk import** via CSV upload
- **📷 Photo scan** — take or upload a photo of a grocery haul; AI identifies every item, you review and confirm before bulk-adding to inventory
- **Add item to grocery list** via cart button on item card

### Smart Add
- When typing a new item name, AI auto-suggests **category**, **storage location**, **unit**, **quantity**, and **expiration date** on blur — all editable
- Works in both inventory and grocery list add flows
- Uses a compact unit list: each, serving, oz, lb, can, jar, bag, bunch, bottle, pack, container

### Grocery Lists
- Multiple named grocery lists (e.g. Costco, Trader Joe's, Asian Market)
- **Drag-and-drop** to reorder items within a list
- **Move items** between lists
- **Auto-fill** from low-stock inventory items
- **↩ Restock all** — one tap to send all checked items back to inventory
- **↩ Restock individual** items from the Done section
- **Duplicate detection** — when restocking a manually-typed item, fuzzy matches against existing inventory and prompts to merge or create separate entry
- **Clear all** checked items
- Tap item name to edit inline (quantity, unit, storage location)

### Meal Ideas (AI-powered)
- Choose meal type: 🌅 Breakfast · 🥗 Lunch · 🍽️ Dinner · 🍎 Snack · 🍓 Dessert
- **Prioritizes expiring ingredients** automatically when generating suggestions
- Tuned for: high-protein, low-carb, low-GI, pre-diabetes friendly, fiber-rich, colorful micronutrients
- Macro targets: 1700–1900 cal/day, 100–120g protein/day
- Each suggestion shows: prep time, calories, protein, carbs, fat, fiber, tags, ingredients you have, what to buy, and numbered step-by-step instructions

### Multi-Household
- Each household has a unique code (e.g. `test-house`)
- Switch households via 🏠 button in the inventory header
- All data is scoped per household
- Household code also accepted as a query param for API access

---

**Getting Started with Pantry Tracker**

**1. Set up your household**
When you first open the app, you'll be asked to enter a household code. Pick something simple like `your-name-house`. Anyone you share this code with can access the same pantry — keep it private.

**2. Add your inventory**
Tap the **+** button in the top right to add items one by one, or use **📥 Import** to bulk-upload a CSV. The fastest way after a grocery run is **📷 Scan** — take a photo of your haul and the app identifies everything automatically. Just review and confirm.

When typing an item name, tap out of the field and the app will auto-suggest the category, location, unit, and quantity for you.

**3. Set up your grocery lists**
Go to the **Grocery** tab and tap **✏️ Lists** to create lists for each store you shop at (e.g. Trader Joe's, Costco). Items with low stock will show a ⭐ badge — tap **⚡ Auto-fill** to add them all at once.

**4. Shop and restock**
While shopping, check items off your list. When you're home, tap **↩ Restock All** in the Done section to send everything back to inventory automatically.

**5. Get meal ideas**
Tap **Meal Ideas**, choose a meal type, and get AI-powered recipe suggestions based on what you actually have. Expiring items get prioritized automatically.

**Tips:**
- Mark frequently bought items as **★ Commonly Used** so they trigger low-stock alerts
- The navigation badge shows how many items are low or expiring soon
- Hard refresh (**Cmd+Shift+R**) if an update doesn't seem to have loaded

-----
## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| AI | Anthropic Claude API (Sonnet for vision/meals, Haiku for suggestions) |
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
        AddItemModal.jsx     — Add/edit item modal (inventory + grocery mode)
        GroceryList.jsx
        HouseholdSetup.jsx
        ImportModal.jsx
        InventoryView.jsx
        ItemCard.jsx
        MealSuggestions.jsx
        Navigation.jsx
        ScanModal.jsx        — Photo scan + AI item identification
    vite.config.js
    tailwind.config.js
  /server
    index.js
    db.js
    /middleware
      household.js          — Extracts household code from header or query param
    /routes
      grocery.js
      import.js
      items.js              — Includes /suggest, /scan, /quick-add endpoints
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
  expiration_date, purchased_date, household_code, created_at, updated_at
)

grocery_lists (id, name, color, household_code, created_at)

grocery_items (
  id, name, quantity, unit, storage_location, list_id,
  checked, sort_order, is_auto_generated, source_item_id,
  household_code, created_at
)
```

---

## API Endpoints

All endpoints require `X-Household-Code` header or `?household_code=` query param.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/items` | List all inventory items |
| POST | `/api/items` | Add item to inventory |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
| GET | `/api/items/suggest?name=` | AI-suggest category, location, unit, qty, expiry |
| POST | `/api/items/scan` | Vision scan — identify items from base64 image |
| GET | `/api/items/quick-add` | Add item via query params (agentic use) |
| GET | `/api/grocery` | List grocery items |
| POST | `/api/grocery` | Add grocery item |
| GET | `/api/grocery/quick-add` | Add to grocery list via query params (agentic use) |
| POST | `/api/grocery/generate` | Auto-fill from low-stock items |
| POST | `/api/grocery/restock/all` | Restock all checked items to inventory |
| DELETE | `/api/grocery/checked/all` | Clear all checked items |
| GET | `/api/lists` | List grocery lists |
| POST | `/api/meals/suggest` | Generate AI meal suggestions |

---

## CSV Import Format

Headers: `name, quantity, unit, category, storage_location, commonly_used, low_stock_threshold, expiration_date`

Valid values:
- **unit:** each, serving, oz, lb, can, jar, bag, bunch, bottle, pack, container
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
- **Body size limit:** 20mb (for photo scan uploads)

### To update
Use GitHub Desktop: copy updated files into local repo → commit → push → Railway auto-redeploys.

### Force fresh build
Bump version in root `package.json`.

### Clear PWA cache
```js
navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
location.reload();
```

Or hard refresh: **Cmd+Shift+R**

---

## Known Gotchas

- **SQLite booleans:** stored as 0/1 — always check `=== 1` in JSX, never just truthiness
- **List ID type mismatch:** use `String()` comparison when filtering lists
- **Meal suggestions JSON truncation:** `max_tokens` set to 4096 for large inventories
- **Photo scan:** requires `Content-Type: application/json` with base64 image — body limit is 20mb
- **Restock with expiry:** single restock and restock/all now make an async Haiku call per new item — slight delay on large restocks is expected
