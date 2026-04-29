// 10x10 board, squares 1-100
export const BOARD_SIZE = 10;
export const TOTAL_SQUARES = BOARD_SIZE * BOARD_SIZE;
export const POINTS_PER_SQUARE = 10;
export const MAX_PLAYERS = 4;

export const PLAYER_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12'];
export const PLAYER_NAMES_DEFAULT = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

// Special tile definitions — NOT shown on board until player lands
export const SNAKES   = { 97: 78, 85: 56, 73: 42, 68: 30, 54: 12 };
export const LADDERS  = { 4: 32, 15: 48, 22: 65, 46: 79, 63: 91 };

// Fusion Shield tiles
export const FUSION_SHIELD = { 17: true, 44: true, 71: true }; // skip next snake
export const TURBO         = { 9: true, 36: true, 58: true };  // roll again
export const FREE          = { 21: true, 50: true, 77: true }; // lose next turn
export const SWAP          = { 33: true, 61: true, 88: true }; // swap with another player

// New tiles
export const SAKUNI = { 13: true, 39: true, 66: true }; // -10 points
export const GOKUL  = { 52: true, 83: true };            // reset to 0

export const TILE_TYPES = {
  snake:   'snake',
  ladder:  'ladder',
  fusion:  'fusion',
  turbo:   'turbo',
  free:    'free',
  swap:    'swap',
  sakuni:  'sakuni',
  gokul:   'gokul',
  normal:  'normal',
};

export const TILE_META = {
  snake:  { icon: '🐍', label: 'Snake!',         color: '#c0392b', bg: '#fdecea' },
  ladder: { icon: '🪜', label: 'Ladder!',         color: '#27ae60', bg: '#eafaf1' },
  fusion: { icon: '🛡️', label: 'Shield',          color: '#8e44ad', bg: '#f5eef8' },
  turbo:  { icon: '⚡', label: 'Turbo Tile',      color: '#f39c12', bg: '#fef9e7' },
  free:   { icon: '🎁', label: 'Free Tile',       color: '#e74c3c', bg: '#fdecea' },
  swap:   { icon: '🔀', label: 'Swap Tile',       color: '#1abc9c', bg: '#e8f8f5' },
  sakuni: { icon: '💀', label: 'Sakuni Box',      color: '#7f8c8d', bg: '#f2f3f4' },
  gokul:  { icon: '🌀', label: 'Gokul Box',       color: '#2c3e50', bg: '#eaecee' },
  normal: { icon: '',   label: '',                color: '',        bg: ''         },
};

export function getTileType(sq) {
  if (SNAKES[sq] !== undefined)   return TILE_TYPES.snake;
  if (LADDERS[sq] !== undefined)  return TILE_TYPES.ladder;
  if (FUSION_SHIELD[sq])          return TILE_TYPES.fusion;
  if (TURBO[sq])                  return TILE_TYPES.turbo;
  if (FREE[sq])                   return TILE_TYPES.free;
  if (SWAP[sq])                   return TILE_TYPES.swap;
  if (SAKUNI[sq])                 return TILE_TYPES.sakuni;
  if (GOKUL[sq])                  return TILE_TYPES.gokul;
  return TILE_TYPES.normal;
}

// Convert square number (1-100) to row/col on 10x10 board (bottom-left = 1)
export function squareToPos(sq) {
  if (sq < 1 || sq > TOTAL_SQUARES) return null;
  const idx = sq - 1;
  const row = Math.floor(idx / BOARD_SIZE);
  const col = row % 2 === 0 ? idx % BOARD_SIZE : BOARD_SIZE - 1 - (idx % BOARD_SIZE);
  return { r: BOARD_SIZE - 1 - row, c: col };
}
