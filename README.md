# 🥬 Pantry Tracker

A full-stack pantry, fridge, and freezer tracker with AI-powered meal suggestions, multi-household support, and grocery list management. Works as a PWA — installable on iPhone like a native app.

---

## Features

### Inventory
- Track items across **Pantry**, **Fridge**, and **Freezer**
- **Tap item name** to edit inline (name, quantity, unit, storage location)
- **Long-press** any item card to edit or delete
- **− button** to decrement quantity by one (quick "used one")
- **★ Commonly Used** flag — marks items for low-stock tracking
- **Low-stock alerts** — orange bar + tag when quantity drops below your threshold
- **Expiration date** tracking on fridge and freezer items
  - **Leftovers auto-expiry** — adding a Leftovers item to the fridge automatically sets expiration to 4 days from today
  - Color-coded tags: gray (future), orange (≤3 days), red (expired/today)
- **Categories**: Produce, Protein, Dairy, Grains, Pantry Staples, Spices, Leftovers, Snacks, Frozen, Condiments, Beverages, Other
- **Search and sort** by category, name, or low-stock
- **Bulk CSV import** — import up to 100+ items at once with preview
- **Preferred store** per item — set which grocery list an item restocks to

### Grocery Lists
- **Multiple named lists** with custom colors (e.g. Regular Groceries, Costco, Asian Market)
- **Drag to reorder** items within a list (touch-friendly)
- **Move between lists** — ↗ button to move any item to another list
- **Tap item** to edit name, quantity, unit, or storage location inline
- **Auto-generate** grocery list from all low-stock ★ items
- **Add from inventory** — cart button on any item card adds it to your preferred list
- **Restock button** on checked items — sends purchased items back to inventory
- **Clear all checked** items at once

### Meal Suggestions
- **AI-powered** via Anthropic's Claude API
- Suggests 4 meals based on what's actually in your pantry
- Dietary focus: high-protein, lower-carb, pre-diabetes friendly, vegetarian-inclusive
- Shows ingredients, approximate macros, and prep time

### Households
- **Multi-household support** — each household has its own private code
- First visit prompts you to enter or create a household code
- Share your code with housemates to access the same pantry
- **Switch households** anytime via the 🏠 button — enter any code to jump to a different household
- All data (inventory, grocery lists, settings) is fully isolated per household

---

## Local Development

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org))
- An Anthropic API key ([get one](https://console.anthropic.com))

### Setup

```bash
cd pantry-tracker
npm run setup
cp .env.example server/.env
# Add your ANTHROPIC_API_KEY to server/.env
npm install -g concurrently   # one-time
npm run dev
```

This starts:
- Server at `http://localhost:3001`
- Client at `http://localhost:5173`

---

## Deploying to Railway

Railway is the recommended host. Free tier includes 500 hours/month.

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/pantry-tracker.git
git push -u origin main
```

### Step 2: Create a Railway project

1. Go to [railway.app](https://railway.app) → login with GitHub
2. **New Project** → **Deploy from GitHub repo** → select `pantry-tracker`

### Step 3: Configure

In Railway service settings:
- **Build Command:** `npm run deploy-build`
- **Start Command:** `npm start`

### Step 4: Environment variables

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | your key from console.anthropic.com |
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `DB_PATH` | `/data/pantry.db` |

### Step 5: Add a Volume (required for data persistence)

In Railway → your service → **Volumes** tab → add volume mounted at `/data`

### Step 6: Get your URL

Railway provides a URL like `https://pantry-tracker-production.up.railway.app`

---

## Installing on iPhone

1. Open your app URL in **Chrome** on iPhone
2. Tap the **share icon** in Chrome's address bar
3. Tap **Add to Home Screen**
4. Name it "Pantry" → tap **Add**

It will appear on your home screen and launch like a native app.

---

## Household Codes

The app uses simple shared codes — no accounts or passwords needed.

- **First visit:** you'll see a setup screen. Enter any code (e.g. `jo-house`)
- **Housemates:** give them the same code — they'll see your shared pantry
- **New household:** use a different code — completely separate data
- **Switch:** tap the 🏠 code button in the top bar and enter a different code
- Codes are case-insensitive (`jo-house` = `JO-HOUSE`) and can contain letters, numbers, and hyphens

---

## CSV Import Format

To bulk-import items, create a CSV with these columns:

```
name,quantity,unit,category,storage_location,commonly_used,low_stock_threshold
Olive Oil,1,bottle,Pantry Staples,pantry,true,1
Eggs,12,item,Protein,fridge,true,4
```

- `storage_location`: must be `pantry`, `fridge`, or `freezer`
- `commonly_used`: `true` or `false`
- All fields except `name` and `storage_location` are optional

---

## Project Structure

```
pantry-tracker/
├── client/                      # React frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── api.js               # Fetch wrapper — sends household code header
│   │   ├── App.jsx              # Main state + routing
│   │   └── components/
│   │       ├── HouseholdSetup.jsx   # First-visit + switch screen
│   │       ├── Navigation.jsx
│   │       ├── InventoryView.jsx
│   │       ├── ItemCard.jsx
│   │       ├── AddItemModal.jsx
│   │       ├── GroceryList.jsx
│   │       ├── ImportModal.jsx
│   │       └── MealSuggestions.jsx
│   ├── vite.config.js           # PWA config + dev proxy
│   └── tailwind.config.js       # Custom colors: forest, sage, cream, terra, frost, amber
├── server/
│   ├── middleware/
│   │   └── household.js         # Extracts + validates X-Household-Code header
│   ├── routes/
│   │   ├── items.js             # Inventory CRUD
│   │   ├── grocery.js           # Grocery list CRUD + generate + restock
│   │   ├── lists.js             # Grocery list tabs CRUD + bootstrap
│   │   ├── meals.js             # Anthropic API meal suggestions
│   │   └── import.js            # Bulk CSV import
│   ├── db.js                    # SQLite setup + migrations
│   └── index.js                 # Express server
├── .env.example
└── README.md
```

---

## PWA Icons

For a proper app icon, add to `client/public/`:
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

Create icons at [favicon.io](https://favicon.io). App works without them but will use the default browser icon.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable |
| PWA | vite-plugin-pwa |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| AI | Anthropic Claude API (claude-sonnet-4-6) |
| Hosting | Railway |
