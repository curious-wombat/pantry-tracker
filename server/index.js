require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL || true
    : 'http://localhost:5173'
}));
app.use(express.json());

// API Routes
app.use('/api/items', require('./routes/items'));
app.use('/api/grocery', require('./routes/grocery'));
app.use('/api/meals', require('./routes/meals'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve static React build in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🥬 Pantry Tracker server running on port ${PORT}`);
});
