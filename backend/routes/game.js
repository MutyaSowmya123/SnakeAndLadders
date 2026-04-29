const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// In-memory game sessions
const games = {};

// GET /api/game/config - return board config (hidden tile types revealed only on landing)
router.get('/config', authMiddleware, (req, res) => {
  res.json({
    boardSize: 10,
    totalSquares: 100,
    pointsPerSquare: 10,
    specialTiles: getSpecialTiles(),
  });
});

// POST /api/game/save - save game result
router.post('/save', authMiddleware, (req, res) => {
  const { winner, scores } = req.body;
  // In production: save to DB
  res.json({ success: true, message: 'Game saved' });
});

function getSpecialTiles() {
  // 10x10 board: squares 1-100
  return {
    snakes:      { 97: 78, 85: 56, 73: 42, 68: 30, 54: 12 },
    ladders:     { 4: 32, 15: 48, 22: 65, 46: 79, 63: 91 },
    fusionShield:{ 17: true, 44: true, 71: true },    // skip next snake
    turbo:       { 9: true, 36: true, 58: true },     // roll again
    free:        { 21: true, 50: true, 77: true },    // lose next turn
    swap:        { 33: true, 61: true, 88: true },    // trade positions
    sakuni:      { 13: true, 39: true, 66: true },    // -10 points
    gokul:       { 52: true, 83: true },              // go to position 0
  };
}

module.exports = router;
