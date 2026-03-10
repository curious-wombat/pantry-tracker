# 🥬 Pantry Tracker

A full-stack pantry, fridge, and freezer tracker with AI-powered meal suggestions. Works as a PWA installable on iPhone Chrome.

---

## Features

- **Inventory tracking** across Pantry, Fridge, and Freezer
- **Quick "used one" button** for each item — optimized for mobile tap
- **Long-press** any item card to edit or delete
- **Low-stock alerts** for commonly-used items
- **Grocery list** — manually add items or auto-generate from low-stock items
- **Restock button** on grocery list to move purchased items back to inventory
- **AI Meal Suggestions** via Anthropic API — high-protein, low-carb, pre-diabetes friendly
- **PWA** — installable to iPhone Chrome home screen

---

## Local Development

### Prerequisites
- Node.js 18+ installed ([download here](https://nodejs.org))
- An Anthropic API key ([get one here](https://console.anthropic.com))

### 1. Clone or download this project

```bash
cd pantry-tracker
```

### 2. Install dependencies

```bash
npm run setup
```

### 3. Set up environment variables

```bash
cp .env.example server/.env
```

Then open `server/.env` and add your Anthropic API key.

### 4. Run in development mode

```bash
npm install -g concurrently   # one-time install
npm run dev
```

This starts:
- Server at `http://localhost:3001`
- Client at `http://localhost:5173`

Open `http://localhost:5173` in your browser.

---

## Deploying to Railway (Recommended — Free Tier)

Railway is the easiest option. Free tier includes 500 hours/month.

### Step 1: Create a GitHub account and push your code

1. Go to [github.com](https://github.com) and create a free account
2. Click **New repository**, name it `pantry-tracker`, keep it private
3. Follow GitHub's instructions to push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/pantry-tracker.git
git push -u origin main
```

### Step 2: Create a Railway account

1. Go to [railway.app](https://railway.app)
2. Click **Login** → **Login with GitHub**
3. Authorize Railway

### Step 3: Create a new project

1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Select `pantry-tracker`
4. Railway will auto-detect it as a Node.js project

### Step 4: Configure build & start commands

In your Railway project settings:
- **Build Command:** `npm run deploy-build`
- **Start Command:** `npm start`

### Step 5: Add environment variables

In Railway → your service → **Variables** tab, add:
- `ANTHROPIC_API_KEY` = your key from console.anthropic.com
- `NODE_ENV` = `production`
- `PORT` = `3001`

Optional (for persistent database — highly recommended):
- Add a **Volume** in Railway and set `DB_PATH` = `/data/pantry.db`

### Step 6: Get your URL

Railway gives you a URL like `https://pantry-tracker-production.up.railway.app`

Open it in iPhone Chrome → tap the share button → **Add to Home Screen**

---

## Deploying to Render (Alternative — Free Tier)

### Step 1: Push to GitHub (same as Railway Step 1 above)

### Step 2: Create a Render account

1. Go to [render.com](https://render.com)
2. Click **Get Started** → sign up with GitHub

### Step 3: Create a Web Service

1. Click **New** → **Web Service**
2. Connect your `pantry-tracker` GitHub repo
3. Configure:
   - **Name:** pantry-tracker
   - **Build Command:** `npm run deploy-build`
   - **Start Command:** `npm start`
   - **Environment:** Node

### Step 4: Add environment variables

Under **Environment** tab:
- `ANTHROPIC_API_KEY` = your key
- `NODE_ENV` = `production`

### Step 5: Add a Disk (for database persistence)

1. Go to your service → **Disks** tab
2. Add a disk, mount path: `/data`
3. Add env var: `DB_PATH` = `/data/pantry.db`

### Step 6: Deploy

Click **Create Web Service**. Render will build and deploy. Get your URL at the top.

> ⚠️ Note: Render free tier spins down after 15 min of inactivity — first load may be slow. Railway has better free tier behavior for always-on apps.

---

## Installing on iPhone Chrome

1. Open your app URL in Chrome on iPhone
2. Tap the **share icon** (box with arrow) in Chrome's address bar
3. Scroll down and tap **Add to Home Screen**
4. Name it "Pantry" and tap **Add**

It will appear on your home screen like a native app.

---

## Project Structure

```
pantry-tracker/
├── client/                  # React frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation.jsx
│   │   │   ├── InventoryView.jsx
│   │   │   ├── ItemCard.jsx
│   │   │   ├── AddItemModal.jsx
│   │   │   ├── GroceryList.jsx
│   │   │   └── MealSuggestions.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js       # PWA config + dev proxy
│   └── tailwind.config.js
├── server/                  # Node/Express backend
│   ├── routes/
│   │   ├── items.js         # Inventory CRUD
│   │   ├── grocery.js       # Grocery list + restock
│   │   └── meals.js         # Anthropic API meal suggestions
│   ├── db.js                # SQLite setup
│   └── index.js             # Express server
├── .env.example
└── README.md
```

---

## Adding PWA Icons

For a proper app icon on your home screen, add these two files to `client/public/`:
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

You can create simple icons at [favicon.io](https://favicon.io) or use any image editor.
The app will still work without them, but will use a default browser icon.
