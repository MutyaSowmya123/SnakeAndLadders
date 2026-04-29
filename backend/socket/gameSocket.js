// Server-side game logic and room management for Snake & Ladder multiplayer

const TOTAL_SQUARES = 100;
const POINTS_PER_SQUARE = 10;
const MAX_PLAYERS = 4;

const SNAKES  = { 97:78, 85:56, 73:42, 68:30, 54:12 };
const LADDERS = { 4:32, 15:48, 22:65, 46:79, 63:91 };
const FUSION_SHIELD = { 17:true, 44:true, 71:true };
const TURBO  = { 9:true, 36:true, 58:true };
const FREE   = { 21:true, 50:true, 77:true };
const SWAP   = { 33:true, 61:true, 88:true };
const SAKUNI = { 13:true, 39:true, 66:true };
const GOKUL  = { 52:true, 83:true };

function getTileType(sq) {
  if (SNAKES[sq]  !== undefined) return 'snake';
  if (LADDERS[sq] !== undefined) return 'ladder';
  if (FUSION_SHIELD[sq]) return 'fusion';
  if (TURBO[sq])  return 'turbo';
  if (FREE[sq])   return 'free';
  if (SWAP[sq])   return 'swap';
  if (SAKUNI[sq]) return 'sakuni';
  if (GOKUL[sq])  return 'gokul';
  return 'normal';
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// In-memory room store: Map<roomId, RoomState>
const rooms = new Map();

function freshRoomState() {
  return {
    players: [],
    started: false,
    positions:    [0, 0, 0, 0],
    points:       [0, 0, 0, 0],
    turn:         0,
    shieldActive: [false, false, false, false],
    skipTurn:     [false, false, false, false],
    swapPending:  null,
    gameOver:     false,
    winner:       null,
    revealedTiles: {},
    log:          [],
  };
}

function getRoomBySocket(socketId) {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.some(p => p.socketId === socketId)) return { roomId, room };
  }
  return null;
}

function addLog(room, msg, color) {
  const time = new Date().toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
  room.log.push({ msg, color: color || '#888', time });
  if (room.log.length > 100) room.log = room.log.slice(-100);
}

function applyMove(room, playerIdx, diceVal) {
  const oldPos = room.positions[playerIdx];
  const newPos = oldPos + diceVal;
  const numPlayers = room.players.length;

  if (newPos > TOTAL_SQUARES) {
    addLog(room, `${room.players[playerIdx].username} rolled ${diceVal} — needs exact roll!`, '#aaa');
    room.turn = (room.turn + 1) % numPlayers;
    return { tileType: 'normal', newPos: oldPos };
  }

  room.positions[playerIdx] = newPos;
  room.points[playerIdx] = Math.max(0, room.points[playerIdx] + diceVal * POINTS_PER_SQUARE);

  const tileType = getTileType(newPos);
  if (tileType !== 'normal') room.revealedTiles[newPos] = tileType;

  let msg = '';

  if (tileType === 'snake') {
    if (room.shieldActive[playerIdx]) {
      msg = '🛡️ Shield blocks the snake!';
      room.shieldActive[playerIdx] = false;
    } else {
      const dest = SNAKES[newPos];
      room.positions[playerIdx] = dest;
      msg = `🐍 Snake! Slides down to ${dest}`;
    }
  } else if (tileType === 'ladder') {
    const dest = LADDERS[newPos];
    room.positions[playerIdx] = dest;
    msg = `🪜 Ladder! Climbs up to ${dest}`;
  } else if (tileType === 'fusion') {
    room.shieldActive[playerIdx] = true;
    msg = '🛡️ Shield active — next snake skipped!';
  } else if (tileType === 'turbo') {
    addLog(room, `${room.players[playerIdx].username} rolled ${diceVal} → sq ${newPos}. ⚡ Turbo — roll again!`, null);
    // don't advance turn
    return { tileType, newPos };
  } else if (tileType === 'free') {
    room.skipTurn[playerIdx] = true;
    msg = '🎁 Free Tile — lose next turn!';
  } else if (tileType === 'swap') {
    addLog(room, `${room.players[playerIdx].username} rolled ${diceVal} → sq ${newPos}. 🔀 Swap — choose a player!`, '#1abc9c');
    room.swapPending = playerIdx;
    return { tileType, newPos };
  } else if (tileType === 'sakuni') {
    room.points[playerIdx] = Math.max(0, room.points[playerIdx] - 10);
    msg = '💀 Sakuni Box! −10 points!';
  } else if (tileType === 'gokul') {
    room.positions[playerIdx] = 0;
    room.points[playerIdx] = 0;
    msg = '🌀 Gokul Box! Sent to START!';
  }

  addLog(room, `${room.players[playerIdx].username} rolled ${diceVal} → sq ${newPos}. ${msg}`, null);

  if (room.positions[playerIdx] === TOTAL_SQUARES) {
    room.gameOver = true;
    room.winner = playerIdx;
    return { tileType, newPos };
  }

  room.turn = (room.turn + 1) % numPlayers;
  return { tileType, newPos };
}

function publicState(room) {
  return {
    players:      room.players.map(p => ({ username: p.username, playerIdx: p.playerIdx })),
    numPlayers:   room.players.length,
    started:      room.started,
    positions:    room.positions,
    points:       room.points,
    turn:         room.turn,
    shieldActive: room.shieldActive,
    skipTurn:     room.skipTurn,
    swapPending:  room.swapPending,
    gameOver:     room.gameOver,
    winner:       room.winner,
    revealedTiles: room.revealedTiles,
    log:          room.log,
  };
}

function resetRoom(room) {
  room.started      = true;
  room.positions    = Array(4).fill(0);
  room.points       = Array(4).fill(0);
  room.turn         = 0;
  room.shieldActive = Array(4).fill(false);
  room.skipTurn     = Array(4).fill(false);
  room.swapPending  = null;
  room.gameOver     = false;
  room.winner       = null;
  room.revealedTiles = {};
  room.log          = [];
}

function registerGameSocket(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('create_room', ({ username }) => {
      let roomId = generateRoomId();
      while (rooms.has(roomId)) roomId = generateRoomId();

      const room = freshRoomState();
      room.players.push({ socketId: socket.id, username: username || 'Player 1', playerIdx: 0 });
      rooms.set(roomId, room);

      socket.join(roomId);
      socket.emit('room_created', { roomId, playerIdx: 0 });
      io.to(roomId).emit('room_updated', publicState(room));
    });

    socket.on('join_room', ({ roomId, username }) => {
      const room = rooms.get(roomId);
      if (!room)              return socket.emit('error', { msg: 'Room not found. Check the code and try again.' });
      if (room.started)       return socket.emit('error', { msg: 'Game already in progress.' });
      if (room.players.length >= MAX_PLAYERS) return socket.emit('error', { msg: 'Room is full (4 players max).' });

      const playerIdx = room.players.length;
      room.players.push({ socketId: socket.id, username: username || `Player ${playerIdx + 1}`, playerIdx });

      socket.join(roomId);
      socket.emit('room_joined', { roomId, playerIdx });
      io.to(roomId).emit('room_updated', publicState(room));
    });

    socket.on('start_game', () => {
      const found = getRoomBySocket(socket.id);
      if (!found) return;
      const { roomId, room } = found;

      const me = room.players.find(p => p.socketId === socket.id);
      if (!me || me.playerIdx !== 0) return;
      if (room.players.length < 2) return socket.emit('error', { msg: 'Need at least 2 players to start.' });

      resetRoom(room);
      io.to(roomId).emit('game_started', publicState(room));
    });

    socket.on('roll_dice', () => {
      const found = getRoomBySocket(socket.id);
      if (!found) return;
      const { roomId, room } = found;

      if (!room.started || room.gameOver || room.swapPending !== null) return;

      const me = room.players.find(p => p.socketId === socket.id);
      if (!me || me.playerIdx !== room.turn) return;

      const playerIdx = room.turn;

      // Handle skip turn
      if (room.skipTurn[playerIdx]) {
        addLog(room, `${room.players[playerIdx].username} skips their turn! 🎁`, '#e74c3c');
        room.skipTurn[playerIdx] = false;
        room.turn = (room.turn + 1) % room.players.length;
        io.to(roomId).emit('game_state', publicState(room));
        return;
      }

      const diceVal = Math.ceil(Math.random() * 6);

      // Broadcast dice value immediately so all clients can animate
      io.to(roomId).emit('dice_rolled', { playerIdx, diceVal });

      // Apply move after animation completes on clients (~1.5s)
      setTimeout(() => {
        const result = applyMove(room, playerIdx, diceVal);
        io.to(roomId).emit('game_state', { ...publicState(room), lastTile: result.tileType, lastDice: diceVal });
      }, 1500);
    });

    socket.on('confirm_swap', ({ targetIdx }) => {
      const found = getRoomBySocket(socket.id);
      if (!found) return;
      const { roomId, room } = found;

      if (room.swapPending === null) return;
      const me = room.players.find(p => p.socketId === socket.id);
      if (!me || me.playerIdx !== room.swapPending) return;

      const cur = room.swapPending;
      [room.positions[cur], room.positions[targetIdx]] = [room.positions[targetIdx], room.positions[cur]];
      addLog(room, `🔀 ${room.players[cur].username} ↔ ${room.players[targetIdx].username} swap positions!`, '#1abc9c');
      room.swapPending = null;
      room.turn = (room.turn + 1) % room.players.length;

      io.to(roomId).emit('game_state', publicState(room));
    });

    socket.on('restart_game', () => {
      const found = getRoomBySocket(socket.id);
      if (!found) return;
      const { roomId, room } = found;

      const me = room.players.find(p => p.socketId === socket.id);
      if (!me || me.playerIdx !== 0) return;

      resetRoom(room);
      io.to(roomId).emit('game_started', publicState(room));
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
      const found = getRoomBySocket(socket.id);
      if (!found) return;
      const { roomId, room } = found;

      room.players = room.players.filter(p => p.socketId !== socket.id);
      if (room.players.length === 0) {
        rooms.delete(roomId);
      } else {
        // Re-index remaining players
        room.players.forEach((p, i) => { p.playerIdx = i; });
        io.to(roomId).emit('room_updated', publicState(room));
      }
    });
  });
}

module.exports = { registerGameSocket };
