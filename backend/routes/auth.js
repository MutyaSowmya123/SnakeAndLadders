const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fusionshield_secret_2024';

// In-memory user store (fallback when MongoDB unavailable)
const inMemoryUsers = [];

let User;
try {
  User = require('../models/User');
} catch (e) {
  User = null;
}

async function findUser(query) {
  if (User) {
    try { return await User.findOne(query); } catch (e) {
      console.error('MongoDB findUser failed:', e.message);
    }
  }
  console.warn('⚠️  Using in-memory store — data will not persist across restarts');
  const [key, val] = Object.entries(query)[0];
  return inMemoryUsers.find(u => u[key] === val) || null;
}

async function createUser(data) {
  if (User) {
    try {
      const u = new User(data);
      await u.save();
      console.log('✅ User saved to MongoDB:', data.username);
      return u;
    } catch (e) {
      console.error('MongoDB createUser failed:', e.message);
    }
  }
  console.warn('⚠️  Using in-memory store — data will not persist across restarts');
  const u = { ...data, _id: Date.now().toString(), stats: { gamesPlayed: 0, gamesWon: 0, totalPoints: 0 } };
  inMemoryUsers.push(u);
  return u;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    const existing = await findUser({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const existingUser = await findUser({ username });
    if (existingUser) return res.status(409).json({ message: 'Username taken' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser({ username, email, password: hashed });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email, stats: user.stats } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await findUser({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, stats: user.stats } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
