const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');

const app = express();

app.use(cors());
app.use(express.json());

// In-memory DB for demo (replace with real MongoDB URI in production)
mongoose.connect('mongodb://127.0.0.1:27017/fusionshield', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(() => {
    console.log('MongoDB not available, using in-memory store');
  });

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Fusion Shield' }));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Fusion Shield server running on port ${PORT}`));
