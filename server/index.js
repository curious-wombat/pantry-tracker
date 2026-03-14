require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const household = require('./middleware/household');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173'
}));
app.use(express.json({ limit: '20mb' }));

// Health check — no auth needed
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// All API routes require household code
app.use('/api/items', household, require('./routes/items'));
app.use('/api/grocery', household, require('./routes/grocery'));
app.use('/api/lists', household, require('./routes/lists'));
app.use('/api/meals', household, require('./routes/meals'));
app.use('/api/import', household, require('./routes/import'));

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.listen(PORT, () => console.log(`🥬 Pantry Tracker server running on port ${PORT}`));
