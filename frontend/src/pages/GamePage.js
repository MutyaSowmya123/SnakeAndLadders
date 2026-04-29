import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { connectSocket, disconnectSocket } from '../socket';
import GameBoard from '../components/GameBoard';
import {
  TOTAL_SQUARES, POINTS_PER_SQUARE, PLAYER_COLORS, PLAYER_NAMES_DEFAULT,
  SNAKES, LADDERS, TILE_META, getTileType,
} from '../utils/gameConstants';

/* ── Global CSS animations ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Nunito', sans-serif; }

@keyframes diceShake {
  0%   { transform: rotate(0deg)   scale(1);    }
  15%  { transform: rotate(-22deg) scale(1.12); }
  30%  { transform: rotate(18deg)  scale(0.92); }
  45%  { transform: rotate(-14deg) scale(1.08); }
  60%  { transform: rotate(10deg)  scale(0.96); }
  75%  { transform: rotate(-6deg)  scale(1.03); }
  100% { transform: rotate(0deg)   scale(1);    }
}
@keyframes diceLand {
  0%   { transform: scale(0.4) rotate(-30deg); opacity: 0; }
  60%  { transform: scale(1.2) rotate(5deg);  opacity: 1; }
  80%  { transform: scale(0.93) rotate(-2deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes popBounce {
  0%   { transform: scale(0.3) translateY(50px); opacity: 0; }
  55%  { transform: scale(1.15) translateY(-10px); opacity: 1; }
  75%  { transform: scale(0.95) translateY(3px); }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes float {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-10px); }
}
@keyframes pulse {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.55; }
}
@keyframes sparkleOut {
  0%   { transform: scale(0) rotate(0deg);   opacity: 1; }
  60%  { transform: scale(1.3) rotate(200deg); opacity: 0.8; }
  100% { transform: scale(0) rotate(360deg); opacity: 0; }
}
@keyframes slideUp {
  from { transform: translateY(14px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes winPulse {
  0%,100% { transform: scale(1) rotate(0); }
  25%     { transform: scale(1.04) rotate(-2deg); }
  75%     { transform: scale(1.04) rotate(2deg); }
}
@keyframes confettiDrop {
  from { transform: translateY(-30px) rotate(0deg); opacity: 1; }
  to   { transform: translateY(120px) rotate(540deg); opacity: 0; }
}
@keyframes btnGlow {
  0%,100% { box-shadow: 0 0 0 0 rgba(231,76,60,0.5); }
  50%      { box-shadow: 0 0 0 14px rgba(231,76,60,0); }
}
@keyframes overlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes modalIn {
  from { transform: scale(0.7) translateY(40px); opacity: 0; }
  to   { transform: scale(1) translateY(0);      opacity: 1; }
}
@keyframes shimmerBar {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
@keyframes bgShift {
  0%,100% { background-position: 0% 50%; }
  50%     { background-position: 100% 50%; }
}
@keyframes megaBounce {
  0%   { transform: scale(0.2) translateY(60px) rotate(-20deg); opacity: 0; }
  55%  { transform: scale(1.22) translateY(-18px) rotate(5deg); opacity: 1; }
  75%  { transform: scale(0.93) translateY(4px); }
  90%  { transform: scale(1.04) translateY(-2px); }
  100% { transform: scale(1) translateY(0) rotate(0deg); opacity: 1; }
}
@keyframes titleRainbow {
  0%   { color: #e74c3c; text-shadow: 0 0 24px rgba(231,76,60,0.55); }
  17%  { color: #e67e22; text-shadow: 0 0 24px rgba(230,126,34,0.55); }
  34%  { color: #f1c40f; text-shadow: 0 0 24px rgba(241,196,15,0.55); }
  51%  { color: #2ecc71; text-shadow: 0 0 24px rgba(46,204,113,0.55); }
  68%  { color: #3498db; text-shadow: 0 0 24px rgba(52,152,219,0.55); }
  85%  { color: #9b59b6; text-shadow: 0 0 24px rgba(155,89,182,0.55); }
  100% { color: #e74c3c; text-shadow: 0 0 24px rgba(231,76,60,0.55); }
}
@keyframes snakeWiggle {
  0%,100% { transform: scale(1) rotate(0deg); }
  25%     { transform: scale(1.15) rotate(-10deg); }
  75%     { transform: scale(1.15) rotate(10deg); }
}
@keyframes ladderBounce {
  0%,100% { transform: translateY(0) scale(1); }
  50%     { transform: translateY(-12px) scale(1.12); }
}
@keyframes shieldPulse {
  0%,100% { filter: drop-shadow(0 0 0px #8e44ad); }
  50%     { filter: drop-shadow(0 0 14px #8e44ad) brightness(1.3); }
}
@keyframes turboBurst {
  0%,100% { transform: scale(1) rotate(0deg); }
  50%     { transform: scale(1.2) rotate(20deg); }
}
@keyframes swapSpin {
  0%   { transform: rotate(0deg) scale(1); }
  50%  { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}
@keyframes tokenJump {
  0%,100% { transform: translateY(0); }
  40%     { transform: translateY(-16px) scale(1.15); }
  70%     { transform: translateY(-6px); }
}
@keyframes rippleOut {
  0%   { transform: scale(0); opacity: 0.9; }
  100% { transform: scale(3.5); opacity: 0; }
}
@keyframes tileRevealSpin {
  0%   { transform: scale(0) rotate(-200deg); opacity: 0; }
  60%  { transform: scale(1.35) rotate(18deg); opacity: 1; }
  80%  { transform: scale(0.9) rotate(-6deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes tileCardIn {
  0%   { transform: scale(0.5) translateY(60px) rotate(-8deg); opacity: 0; }
  65%  { transform: scale(1.06) translateY(-8px) rotate(2deg); opacity: 1; }
  82%  { transform: scale(0.97) translateY(2px); }
  100% { transform: scale(1) translateY(0) rotate(0deg); opacity: 1; }
}
@keyframes shrinkCountdown {
  from { width: 100%; }
  to   { width: 0%; }
}
@keyframes mysteryPulse {
  0%,100% { filter: drop-shadow(0 0 4px #FFD700); }
  50%     { filter: drop-shadow(0 0 14px #FFD700) brightness(1.3); }
}
.rolling    { animation: diceShake 0.13s ease-in-out infinite; }
.landed     { animation: diceLand 0.45s cubic-bezier(.34,1.56,.64,1) forwards; }
.float      { animation: float 2.8s ease-in-out infinite; }
.blink      { animation: pulse 1.4s ease-in-out infinite; }
.slide-up   { animation: slideUp 0.28s ease forwards; }
.win-anim   { animation: winPulse 0.6s ease-in-out infinite; }
.overlay-in { animation: overlayIn 0.2s ease forwards; }
.modal-in   { animation: modalIn 0.35s cubic-bezier(.34,1.56,.64,1) forwards; }
.glow-btn   { animation: btnGlow 1.8s ease-in-out infinite; }
.rainbow    { animation: titleRainbow 3s ease-in-out infinite; }
.tile-badge {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; font-weight: 800; padding: 2px 7px;
  border-radius: 20px; white-space: nowrap; letter-spacing: 0.3px;
}
`;

/* ── SVG dice dot helper ── */
const D = (cx, cy) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={5.8} fill="currentColor" />;

const DICE_DOTS = {
  1: [D(40,40)],
  2: [D(22,22), D(58,58)],
  3: [D(22,22), D(40,40), D(58,58)],
  4: [D(22,22), D(58,22), D(22,58), D(58,58)],
  5: [D(22,22), D(58,22), D(40,40), D(22,58), D(58,58)],
  6: [D(22,20), D(58,20), D(22,40), D(58,40), D(22,60), D(58,60)],
};

function DiceSVG({ value, size = 90, color = '#c0392b', isRolling = false, isLanded = false }) {
  const cls = isRolling ? 'rolling' : isLanded ? 'landed' : '';
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className={cls}
      style={{ display: 'block', filter: isRolling ? 'none' : 'drop-shadow(0 6px 18px rgba(0,0,0,0.22))' }}>
      <rect x={3} y={3} width={74} height={74} rx={15} fill="white" stroke={color} strokeWidth={3.5} />
      <g color={color}>
        {value >= 1 && value <= 6
          ? DICE_DOTS[value]
          : <text x={40} y={52} textAnchor="middle" fontSize={34} fontFamily="Fredoka One" fill={color}>?</text>
        }
      </g>
    </svg>
  );
}

/* ── Player tokens ── */
const P_TOKEN = ['👑','🚀','⭐','🔥'];

/* ── Tile info registry ── */
const TILE_INFO = {
  fusion: { icon:'🛡️', name:'Shield Tile',   desc:'Skip next snake',   color:'#8e44ad', bg:'#f5eef8' },
  turbo:  { icon:'⚡', name:'Turbo Tile',    desc:'Roll again',         color:'#e67e22', bg:'#fef5e7' },
  free:   { icon:'🎁', name:'Free Tile',     desc:'Lose next turn',     color:'#e74c3c', bg:'#fdecea' },
  swap:   { icon:'🔀', name:'Swap Tile',     desc:'Trade positions',    color:'#1abc9c', bg:'#e8f8f5' },
  sakuni: { icon:'💀', name:'Sakuni Box',    desc:'−10 points',         color:'#7f8c8d', bg:'#f2f3f4' },
  gokul:  { icon:'🌀', name:'Gokul Box',     desc:'Back to start!',     color:'#2c3e50', bg:'#eaecee' },
  snake:  { icon:'🐍', name:'Snake!',        desc:'Slide down',         color:'#c0392b', bg:'#fdecea' },
  ladder: { icon:'🪜', name:'Ladder!',       desc:'Climb up',           color:'#27ae60', bg:'#eafaf1' },
};

/* ── Confetti ── */
const CC = ['#c0392b','#f39c12','#27ae60','#3498db','#8e44ad','#e74c3c','#1abc9c','#f1c40f'];
function Confetti() {
  const pieces = Array.from({ length: 22 }, (_, i) => ({
    x: Math.random() * 100, delay: Math.random() * 1.8,
    color: CC[i % CC.length], size: 5 + Math.random() * 9,
    dur: 1.4 + Math.random() * 0.8, rot: Math.random() * 360,
  }));
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position:'absolute', left:`${p.x}%`, top: -10,
          width: p.size, height: p.size, borderRadius: 2,
          background: p.color, transform: `rotate(${p.rot}deg)`,
          animation: `confettiDrop ${p.dur}s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

/* ════════════ MAIN COMPONENT ════════════ */
export default function GamePage() {
  const { user, logout } = useAuth();
  const [numPlayers, setNumPlayers]     = useState(2);
  const [started, setStarted]           = useState(false);
  const [positions, setPositions]       = useState([0,0,0,0]);
  const [points, setPoints]             = useState([0,0,0,0]);
  const [turn, setTurn]                 = useState(0);
  const [diceVal, setDiceVal]           = useState(0);
  const [rolling, setRolling]           = useState(false);
  const [landed, setLanded]             = useState(false);
  const [showModal, setShowModal]       = useState(false);
  const [gameOver, setGameOver]         = useState(false);
  const [winner, setWinner]             = useState(null);
  const [log, setLog]                   = useState([]);
  const [effect, setEffect]             = useState(null);
  const [revealedTiles, setRevealedTiles] = useState({});
  const [shieldActive, setShieldActive] = useState([false,false,false,false]);
  const [skipTurn, setSkipTurn]         = useState([false,false,false,false]);
  const [swapPending, setSwapPending]   = useState(null);
  const [lastTile, setLastTile]         = useState(null);

  // Online multiplayer
  const [mode, setMode]                 = useState(null);       // null | 'local' | 'online'
  const [onlinePhase, setOnlinePhase]   = useState('menu');     // 'menu'|'join'|'waiting_host'|'waiting_player'|'playing'
  const [roomId, setRoomId]             = useState('');
  const [roomInput, setRoomInput]       = useState('');
  const [myPlayerIdx, setMyPlayerIdx]   = useState(null);
  const [playerNames, setPlayerNames]   = useState(null);       // null = use defaults
  const logRef = useRef();
  const socketRef = useRef(null);

  const names = playerNames || PLAYER_NAMES_DEFAULT.slice(0, numPlayers);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // Socket.io: connect when online mode is active
  useEffect(() => {
    if (mode !== 'online') return;
    const socket = connectSocket();
    socketRef.current = socket;

    const syncState = (state) => {
      setPositions(state.positions);
      setPoints(state.points);
      setTurn(state.turn);
      setNumPlayers(state.numPlayers);
      setShieldActive(state.shieldActive);
      setSkipTurn(state.skipTurn);
      setSwapPending(state.swapPending);
      setGameOver(state.gameOver);
      setWinner(state.winner);
      setRevealedTiles(state.revealedTiles);
      setLog(state.log);
      setPlayerNames(state.players.map(p => p.username));
      if (state.lastTile && state.lastTile !== 'normal') setLastTile(state.lastTile);
    };

    socket.on('room_created', ({ roomId: id, playerIdx }) => {
      setRoomId(id); setMyPlayerIdx(playerIdx); setOnlinePhase('waiting_host');
    });
    socket.on('room_joined', ({ roomId: id, playerIdx }) => {
      setRoomId(id); setMyPlayerIdx(playerIdx); setOnlinePhase('waiting_player');
    });
    socket.on('room_updated', (state) => {
      setNumPlayers(state.players.length);
      setPlayerNames(state.players.map(p => p.username));
    });
    socket.on('game_started', (state) => {
      syncState(state); setOnlinePhase('playing'); setStarted(true);
    });
    socket.on('dice_rolled', ({ diceVal: finalVal }) => {
      setShowModal(true); setRolling(true); setLanded(false); setLastTile(null);
      let frame = 0;
      const iv = setInterval(() => {
        setDiceVal(Math.ceil(Math.random() * 6));
        if (++frame >= 12) {
          clearInterval(iv);
          setDiceVal(finalVal); setRolling(false);
          setTimeout(() => setLanded(true), 80);
          setTimeout(() => { setShowModal(false); setLanded(false); }, 1050);
        }
      }, 85);
    });
    socket.on('game_state', syncState);
    socket.on('error', ({ msg }) => alert(msg));

    return () => {
      ['room_created','room_joined','room_updated','game_started','dice_rolled','game_state','error']
        .forEach(ev => socket.off(ev));
    };
  }, [mode]);

  function startGame() {
    setPositions(Array(4).fill(0)); setPoints(Array(4).fill(0));
    setTurn(0); setDiceVal(0); setRolling(false); setLanded(false);
    setShowModal(false); setGameOver(false); setWinner(null);
    setLog([]); setEffect(null); setRevealedTiles({});
    setShieldActive(Array(4).fill(false)); setSkipTurn(Array(4).fill(false));
    setSwapPending(null); setLastTile(null);
    setStarted(true);
  }

  function addLog(msg, color) {
    const time = new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
    setLog(l => [...l, { msg, color: color||'#888', time }]);
  }

  function createRoom() {
    socketRef.current?.emit('create_room', { username: user?.username || 'Player 1' });
  }

  function joinRoom() {
    if (!roomInput.trim()) return;
    socketRef.current?.emit('join_room', { roomId: roomInput.trim().toUpperCase(), username: user?.username || 'Player 1' });
  }

  function triggerEffect(msg) {
    setEffect(msg);
    setTimeout(() => setEffect(null), 2500);
  }

  function rollDice() {
    if (mode === 'online') {
      if (myPlayerIdx !== turn || rolling || gameOver || swapPending !== null) return;
      socketRef.current?.emit('roll_dice');
      return;
    }
    if (rolling || gameOver || swapPending !== null) return;
    if (skipTurn[turn]) {
      addLog(`${P_TOKEN[turn]} ${names[turn]} skips their turn! 🎁`, '#e74c3c');
      const ns=[...skipTurn]; ns[turn]=false; setSkipTurn(ns);
      setTurn(t => (t+1) % numPlayers);
      return;
    }
    setRolling(true); setLanded(false); setShowModal(true); setLastTile(null);
    let frame=0, frames=16;
    const iv = setInterval(() => {
      setDiceVal(Math.ceil(Math.random()*6));
      frame++;
      if (frame >= frames) {
        clearInterval(iv);
        const val = Math.ceil(Math.random()*6);
        setDiceVal(val);
        setRolling(false);
        setTimeout(() => {
          setLanded(true);
          setTimeout(() => {
            setShowModal(false); setLanded(false);
            applyMove(val);
          }, 950);
        }, 80);
      }
    }, 85);
  }

  function applyMove(val) {
    const cur = turn;
    const oldPos = positions[cur];
    const newPos = oldPos + val;

    if (newPos > TOTAL_SQUARES) {
      addLog(`${P_TOKEN[cur]} ${names[cur]} rolled ${val} — needs exact roll!`, '#aaa');
      setTurn(t => (t+1) % numPlayers);
      return;
    }

    const nPos   = [...positions]; nPos[cur]   = newPos;
    const nPts   = [...points];    nPts[cur]   = Math.max(0, nPts[cur] + val * POINTS_PER_SQUARE);
    const nShld  = [...shieldActive];
    const nSkip  = [...skipTurn];

    const tileType = getTileType(newPos);
    const meta     = TILE_META[tileType];

    // Reveal tile icon on board
    if (tileType !== 'normal') {
      setRevealedTiles(rv => ({ ...rv, [newPos]: meta.icon }));
      setLastTile(tileType);
    }

    let msg = ''; let reroll = false;

    if (tileType === 'snake') {
      if (nShld[cur]) {
        msg = '🛡️ Shield blocks the snake!'; nShld[cur]=false;
        triggerEffect('🛡️ Shield — Snake Blocked! 💥');
      } else {
        const dest = SNAKES[newPos]; nPos[cur]=dest;
        msg = `🐍 Snake! Slides down to ${dest}`;
        triggerEffect('🐍🐍 BITTEN! Sliding down! 😱');
      }
    } else if (tileType === 'ladder') {
      const dest = LADDERS[newPos]; nPos[cur]=dest;
      msg = `🪜 Ladder! Climbs up to ${dest}`;
      triggerEffect('🪜🪜 LADDER! Climbing up! 🚀');
    } else if (tileType === 'fusion') {
      nShld[cur]=true; msg='🛡️ Shield active — next snake skipped!';
      triggerEffect('🛡️ Shield Acquired! 🌟');
    } else if (tileType === 'turbo') {
      reroll=true; msg='⚡ Turbo Tile — roll again!';
      triggerEffect('⚡⚡ TURBO! Roll Again! 🔥');
    } else if (tileType === 'free') {
      nSkip[cur]=true; msg='🎁 Free Tile — lose next turn!';
      triggerEffect('🎁 FREE TILE! Lose a turn! ⏭️');
    } else if (tileType === 'swap') {
      msg='🔀 Swap Tile — choose a player!';
      triggerEffect('🔀 SWAP! Pick your target! 😈');
      setPositions(nPos); setPoints(nPts); setShieldActive(nShld); setSkipTurn(nSkip);
      addLog(`${P_TOKEN[cur]} ${names[cur]} rolled ${val} → sq ${newPos}. ${msg}`, PLAYER_COLORS[cur]);
      setSwapPending(cur);
      return;
    } else if (tileType === 'sakuni') {
      nPts[cur]=Math.max(0, nPts[cur]-10); msg='💀 Sakuni Box! −10 points!';
      triggerEffect('💀 Sakuni! −10 Points!');
    } else if (tileType === 'gokul') {
      nPos[cur]=0; nPts[cur]=0; msg='🌀 Gokul Box! Sent to START!';
      triggerEffect('🌀 Gokul! Back to Start!');
    }

    addLog(`${P_TOKEN[cur]} ${names[cur]} rolled ${val} → sq ${newPos}. ${msg}`, PLAYER_COLORS[cur]);
    setPositions(nPos); setPoints(nPts); setShieldActive(nShld); setSkipTurn(nSkip);

    if (nPos[cur] === TOTAL_SQUARES) { setGameOver(true); setWinner(cur); return; }
    if (!reroll) setTurn(t => (t+1) % numPlayers);
  }

  function handleSwap(targetIdx) {
    if (mode === 'online') { socketRef.current?.emit('confirm_swap', { targetIdx }); return; }
    const cur = swapPending;
    setPositions(p => {
      const np=[...p]; [np[cur], np[targetIdx]]=[np[targetIdx], np[cur]]; return np;
    });
    addLog(`🔀 ${names[cur]} ↔ ${names[targetIdx]} swap positions!`, '#1abc9c');
    setSwapPending(null);
    setTurn(t => (t+1) % numPlayers);
  }

  const cc = PLAYER_COLORS[turn];

  /* ── MODE SELECTOR ── */
  if (mode === null) return (
    <>
      <style>{CSS}</style>
      <div style={St.lobby}>
        <div style={St.lobbyCard}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ fontSize:68, lineHeight:1, marginBottom:10, display:'flex', justifyContent:'center', gap:8 }}>
              <span style={{ display:'inline-block', animation:'snakeWiggle 1.4s ease-in-out infinite' }}>🐍</span>
              <span className="float" style={{ display:'inline-block', animationDelay:'0.3s' }}>🎲</span>
              <span style={{ display:'inline-block', animation:'ladderBounce 1.6s ease-in-out infinite', animationDelay:'0.6s' }}>🪜</span>
            </div>
            <h1 className="rainbow" style={St.lobbyTitle}>ROLL FOR MADNESS</h1>
            <p style={{ color:'#bbb', fontWeight:700, fontSize:12, letterSpacing:2, marginBottom:6 }}>
              SNAKE &amp; LADDER · REIMAGINED
            </p>
            {user && (
              <p style={{ fontSize:13, color:'#888' }}>
                Welcome back, <b style={{ color:'#c0392b' }}>{user.username}</b> 👋
              </p>
            )}
          </div>
          <p style={St.lobbyLabel}>🎮 Select Mode</p>
          <button style={St.startBtn} onClick={() => setMode('local')}>
            🏠 Local Play (Same Device)
          </button>
          <button
            style={{ ...St.startBtn, background:'linear-gradient(135deg,#3498db,#2980b9)', marginBottom:10 }}
            onClick={() => { setMode('online'); connectSocket(); }}
          >
            🌐 Online Multiplayer
          </button>
          <button style={St.grayBtn} onClick={logout}>← Sign Out</button>
        </div>
      </div>
    </>
  );

  /* ── ONLINE LOBBY ── */
  if (mode === 'online' && onlinePhase !== 'playing') return (
    <>
      <style>{CSS}</style>
      <div style={St.lobby}>
        <div style={St.lobbyCard}>
          <button
            style={{ ...St.grayBtn, marginBottom:20 }}
            onClick={() => { setMode(null); setOnlinePhase('menu'); setPlayerNames(null); disconnectSocket(); }}
          >
            ← Back
          </button>

          {onlinePhase === 'menu' && (
            <>
              <h2 style={{ textAlign:'center', fontFamily:"'Fredoka One',cursive", color:'#333', marginBottom:20 }}>
                🌐 Online Multiplayer
              </h2>
              <button style={St.startBtn} onClick={createRoom}>🎉 Create Room</button>
              <button
                style={{ ...St.startBtn, background:'linear-gradient(135deg,#27ae60,#2ecc71)', marginBottom:10 }}
                onClick={() => setOnlinePhase('join')}
              >
                🔑 Join Room
              </button>
            </>
          )}

          {onlinePhase === 'join' && (
            <>
              <h2 style={{ textAlign:'center', fontFamily:"'Fredoka One',cursive", color:'#333', marginBottom:20 }}>
                🔑 Join a Room
              </h2>
              <input
                placeholder="ROOM CODE"
                value={roomInput}
                onChange={e => setRoomInput(e.target.value.toUpperCase())}
                style={{
                  width:'100%', padding:'12px 16px', border:'2.5px solid #ddd', borderRadius:12,
                  fontSize:22, fontFamily:"'Fredoka One',cursive", textAlign:'center',
                  letterSpacing:6, marginBottom:12, outline:'none', boxSizing:'border-box',
                }}
                maxLength={6}
              />
              <button style={St.startBtn} onClick={joinRoom}>🚀 Join Game</button>
              <button style={St.grayBtn} onClick={() => setOnlinePhase('menu')}>← Back</button>
            </>
          )}

          {(onlinePhase === 'waiting_host' || onlinePhase === 'waiting_player') && (
            <>
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:12, color:'#888', fontWeight:700, marginBottom:8 }}>🎮 Room Code</div>
                <div style={{
                  fontFamily:"'Fredoka One',cursive", fontSize:40, color:'#c0392b',
                  letterSpacing:8, background:'#fdecea', borderRadius:16, padding:'14px 0',
                }}>
                  {roomId}
                </div>
                <div style={{ fontSize:12, color:'#aaa', marginTop:8 }}>Share this code with friends!</div>
              </div>

              <div style={St.secLabel}>👥 Players in Room ({numPlayers}/4)</div>
              {(playerNames || []).map((name, i) => (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f0f0f0' }}>
                  <div style={{ ...St.dot, width:32, height:32, fontSize:16, background:PLAYER_COLORS[i] }}>{P_TOKEN[i]}</div>
                  <span style={{ fontWeight:700, color:'#333', flex:1 }}>{name}</span>
                  {i === 0 && (
                    <span style={{ fontSize:10, background:'#fdecea', color:'#c0392b', padding:'2px 8px', borderRadius:20, fontWeight:800 }}>
                      HOST
                    </span>
                  )}
                </div>
              ))}

              <div style={{ marginTop:16 }}>
                {onlinePhase === 'waiting_host'
                  ? numPlayers >= 2
                    ? <button style={St.startBtn} onClick={() => socketRef.current?.emit('start_game')}>
                        🎮 Start Game ({numPlayers} players)
                      </button>
                    : <p className="blink" style={{ textAlign:'center', color:'#888', fontWeight:700, fontSize:13 }}>
                        Waiting for more players to join...
                      </p>
                  : <p className="blink" style={{ textAlign:'center', color:'#888', fontWeight:700, fontSize:13 }}>
                      Waiting for host to start the game...
                    </p>
                }
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );

  /* ── LOBBY ── */
  if (!started) return (
    <>
      <style>{CSS}</style>
      <div style={St.lobby}>
        <div style={St.lobbyCard}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ fontSize:68, lineHeight:1, marginBottom:10, display:'flex', justifyContent:'center', gap:8 }}>
              <span className="float" style={{ display:'inline-block', animation:'snakeWiggle 1.4s ease-in-out infinite' }}>🐍</span>
              <span className="float" style={{ display:'inline-block', animationDelay:'0.3s' }}>🎲</span>
              <span className="float" style={{ display:'inline-block', animation:'ladderBounce 1.6s ease-in-out infinite', animationDelay:'0.6s' }}>🪜</span>
            </div>
            <h1 className="rainbow" style={St.lobbyTitle}>ROLL FOR MADNESS</h1>
            <p style={{ color:'#bbb', fontWeight:700, fontSize:12, letterSpacing:2, marginBottom:6 }}>
              SNAKE &amp; LADDER · REIMAGINED
            </p>
            {user && (
              <p style={{ fontSize:13, color:'#888' }}>
                Welcome back, <b style={{ color:'#c0392b' }}>{user.username}</b> 👋
              </p>
            )}
          </div>

          <p style={St.lobbyLabel}>👥 Players</p>
          <div style={{ display:'flex', gap:10, marginBottom:22 }}>
            {[2,3,4].map(n => (
              <button key={n}
                style={{ ...St.pcBtn, ...(numPlayers===n ? St.pcBtnOn : {}) }}
                onClick={() => setNumPlayers(n)}>
                <span style={{ fontSize:26 }}>{['👫','👨‍👩‍👦','👨‍👩‍👧‍👦'][n-2]}</span>
                <span style={{ fontSize:13, fontWeight:800 }}>{n} Players</span>
              </button>
            ))}
          </div>

          <p style={St.lobbyLabel}>🗺️ Tile Guide <span style={{ fontSize:10, color:'#ccc', fontWeight:600 }}>(hidden until landed!)</span></p>
          <div style={St.guideGrid}>
            {Object.entries(TILE_INFO).map(([type, t]) => {
              const iconAnim = type==='snake' ? 'snakeWiggle 1.4s ease-in-out infinite'
                : type==='ladder' ? 'ladderBounce 1.6s ease-in-out infinite'
                : type==='turbo'  ? 'turboBurst 1.2s ease-in-out infinite'
                : type==='fusion' ? 'shieldPulse 1.8s ease-in-out infinite'
                : type==='swap'   ? 'swapSpin 2s ease-in-out infinite'
                : 'pulse 2s ease-in-out infinite';
              return (
                <div key={type} style={{ ...St.guideItem, background:t.bg, border:`2px solid ${t.color}55` }}>
                  <span style={{ fontSize:22, display:'inline-block', animation:iconAnim }}>{t.icon}</span>
                  <div>
                    <div style={{ fontWeight:800, fontSize:11, color:t.color }}>{t.name}</div>
                    <div style={{ fontSize:10, color:'#999' }}>{t.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <button style={St.startBtn} onClick={startGame}>🐍 Roll for Madness! 🎲</button>
          <button style={St.grayBtn} onClick={logout}>← Sign Out</button>
        </div>
      </div>
    </>
  );

  /* ── GAME ── */
  return (
    <div style={{ height:'100vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={St.header}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:28, animation:'snakeWiggle 1.4s ease-in-out infinite', display:'inline-block' }}>🐍</span>
          <span style={{ fontSize:26, display:'inline-block' }} className="float">🎲</span>
          <span style={{ fontSize:28, animation:'ladderBounce 1.6s ease-in-out infinite', display:'inline-block' }}>🪜</span>
          <div style={{ marginLeft:4 }}>
            <h1 className="rainbow" style={St.hTitle}>ROLL FOR MADNESS</h1>
            <p style={{ fontSize:9, color:'rgba(255,255,255,0.5)', letterSpacing:2, margin:0 }}>SNAKE &amp; LADDER</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {user && <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:700 }}>👤 {user.username}</span>}
          <button style={St.hBtn} onClick={() => {
            setStarted(false);
            if (mode === 'online') { setOnlinePhase('menu'); disconnectSocket(); setMode(null); setPlayerNames(null); }
          }}>🏠</button>
          <button style={St.hBtn} onClick={logout}>Sign out</button>
        </div>
      </div>

      {/* Turn ribbon */}
      {!gameOver && (
        <div style={{ ...St.ribbon, background: cc }}>
          <span style={{ fontSize:20 }}>{P_TOKEN[turn]}</span>
          <span style={{ fontWeight:900, fontSize:14 }}>
            {swapPending!==null ? '🔀 Pick a player to swap with!'
              : skipTurn[turn] ? `${names[turn]} loses their turn!`
              : `${names[turn]}'s Turn`}
          </span>
          <span style={{ fontSize:11, opacity:0.85, marginLeft:'auto' }}>
            Sq {positions[turn]||'Start'} · {points[turn]}pts
          </span>
        </div>
      )}

      <div style={St.layout}>

        {/* ── LEFT 20 %: Leaderboard + Players ── */}
        <div style={St.leftPanel}>
          <div style={St.secLabel}>🏟️ Players</div>
          {names.map((name, i) => {
            const isActive = i===turn && !gameOver;
            const isWin    = gameOver && i===winner;
            return (
              <div key={i} style={{
                ...St.pCard,
                borderColor: isWin?'#f0c040' : isActive?PLAYER_COLORS[i]:'#eee',
                background:  isWin?'#fffbe6' : isActive?PLAYER_COLORS[i]+'18':'#fafafa',
                transform:   isActive ? 'scale(1.025)' : 'scale(1)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ ...St.dot, background:PLAYER_COLORS[i], color:'#fff', fontSize:16 }}>
                    {P_TOKEN[i]}
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:12, color:'#222' }}>
                      {name} {isWin && '🏆'}
                    </div>
                    <div style={{ fontSize:10, color:'#999', fontWeight:600 }}>
                      📍 {positions[i]||'Start'} · 🎯 {points[i]}pts
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:3, alignItems:'flex-end' }}>
                  {shieldActive[i] && <span className="blink tile-badge" style={{ background:'#f5eef8', color:'#8e44ad' }}>🛡️</span>}
                  {skipTurn[i]     && <span className="blink tile-badge" style={{ background:'#fdecea', color:'#c0392b' }}>⏭️</span>}
                  {isActive && !shieldActive[i] && !skipTurn[i] && (
                    <span className="blink tile-badge" style={{ background:PLAYER_COLORS[i]+'22', color:PLAYER_COLORS[i] }}>🎲</span>
                  )}
                </div>
              </div>
            );
          })}

          <div style={St.secLabel}>🏅 Leaderboard</div>
          <div style={St.lbCard}>
            {[...Array(numPlayers).keys()].sort((a,b)=>points[b]-points[a]).map((i,rank) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 0', borderBottom: rank<numPlayers-1?'1px solid #f5f5f5':'none' }}>
                <span style={{ fontSize:15, width:20 }}>{['🥇','🥈','🥉','4️⃣'][rank]}</span>
                <div style={{ ...St.dot, width:24, height:24, fontSize:13, background:PLAYER_COLORS[i] }}>
                  {P_TOKEN[i]}
                </div>
                <span style={{ flex:1, fontSize:11, fontWeight:700, color:'#333' }}>{names[i]}</span>
                <span style={{ fontSize:12, fontWeight:900, color:PLAYER_COLORS[i] }}>{points[i]}<span style={{ fontSize:9, color:'#aaa' }}>pts</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER 60 %: Board ── */}
        <div style={St.boardCol}>
          {/* Constrain square board to fit both column width and panel height */}
          <div style={{ width:'min(100%, calc(100vh - 110px))', margin:'0 auto' }}>
            <GameBoard positions={positions} numPlayers={numPlayers} revealedTiles={revealedTiles} />
            {lastTile && TILE_INFO[lastTile] && (
              <div className="slide-up" style={{ ...St.revealCard, background:TILE_INFO[lastTile].bg, borderColor:TILE_INFO[lastTile].color }}>
                <span style={{ fontSize:26 }}>{TILE_INFO[lastTile].icon}</span>
                <div>
                  <div style={{ fontWeight:900, fontSize:13, color:TILE_INFO[lastTile].color }}>{TILE_INFO[lastTile].name}</div>
                  <div style={{ fontSize:11, color:'#888' }}>{TILE_INFO[lastTile].desc}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT 20 %: Roll Dice + Event Log ── */}
        <div style={St.rightPanel}>
          {!gameOver ? (
            <div style={St.ctrlCard}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
                <DiceSVG value={diceVal||0} size={72} color={cc} />
              </div>
              {swapPending !== null && (mode !== 'online' || myPlayerIdx === swapPending) ? (
                <>
                  <p style={{ fontSize:12, fontWeight:800, color:'#1abc9c', textAlign:'center', marginBottom:10 }}>
                    🔀 Swap {names[swapPending]} with:
                  </p>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
                    {names.map((n, i) => i!==swapPending && (
                      <button key={i}
                        style={{ ...St.swapBtn, borderColor:PLAYER_COLORS[i], color:PLAYER_COLORS[i] }}
                        onClick={() => handleSwap(i)}>
                        {P_TOKEN[i]} {n}
                      </button>
                    ))}
                  </div>
                </>
              ) : swapPending !== null ? (
                <p style={{ textAlign:'center', color:'#1abc9c', fontWeight:700, fontSize:13 }}>
                  🔀 {names[swapPending]} is choosing...
                </p>
              ) : (
                <button
                  className={!rolling && (mode !== 'online' || myPlayerIdx === turn) ? 'glow-btn' : ''}
                  style={{
                    ...St.rollBtn,
                    background: (mode === 'online' && myPlayerIdx !== turn) ? '#bbb' : cc,
                    opacity: rolling ? 0.65 : 1,
                    cursor: (mode === 'online' && myPlayerIdx !== turn) ? 'not-allowed' : 'pointer',
                  }}
                  onClick={rollDice}
                  disabled={rolling || gameOver || (mode === 'online' && myPlayerIdx !== turn)}
                >
                  {rolling
                    ? '🎲 Rolling...'
                    : mode === 'online' && myPlayerIdx !== turn
                      ? `⏳ ${names[turn]}'s turn...`
                      : `🎲 Roll, ${names[turn]}!`
                  }
                </button>
              )}
            </div>
          ) : (
            <div className="win-anim" style={St.winCard}>
              <Confetti />
              <div style={{ fontSize:46 }}>🏆</div>
              <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, color:'#c0392b' }}>
                {names[winner]} Wins!
              </div>
              <div style={{ fontSize:12, color:'#888', fontWeight:700 }}>
                {P_TOKEN[winner]} {points[winner]} pts
              </div>
              <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap', justifyContent:'center' }}>
                {(mode !== 'online' || myPlayerIdx === 0) && (
                  <button style={St.reBtn} onClick={() => mode === 'online' ? socketRef.current?.emit('restart_game') : startGame()}>🔄 Again</button>
                )}
                <button style={{ ...St.reBtn, background:'#555' }} onClick={() => {
                  setStarted(false);
                  if (mode === 'online') { setOnlinePhase('menu'); disconnectSocket(); setMode(null); setPlayerNames(null); }
                }}>🏠</button>
              </div>
            </div>
          )}

          <div style={St.secLabel}>📜 Event Log</div>
          <div style={St.logBox} ref={logRef}>
            {log.length===0 && (
              <div style={{ fontSize:11, color:'#ccc', textAlign:'center', padding:'10px 0' }}>
                Events will appear here...
              </div>
            )}
            {log.slice().reverse().map((e,i) => (
              <div key={i} className="slide-up" style={{ ...St.logRow, borderLeftColor:e.color }}>
                <span style={{ fontSize:9, color:'#ccc', flexShrink:0 }}>{e.time}</span>
                <span>{e.msg}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ══ CENTER DICE MODAL ══ */}
      {showModal && (
        <div className="overlay-in" style={St.overlay}>
          <div className="modal-in" style={{ ...St.diceModal, borderColor: cc }}>
            {/* Sparkles when landed */}
            {landed && Array.from({length:16}).map((_,i) => {
              const colors = ['#e74c3c','#f39c12','#2ecc71','#3498db','#9b59b6','#1abc9c','#f1c40f','#e67e22'];
              return (
                <div key={i} style={{
                  position:'absolute', top:'50%', left:'50%',
                  width: 8 + (i % 3) * 4, height: 8 + (i % 3) * 4,
                  borderRadius: i % 2 === 0 ? '50%' : '3px',
                  background: colors[i % colors.length], pointerEvents:'none',
                  transform:`rotate(${i*22.5}deg) translateX(${90 + (i%3)*20}px)`,
                  animation:`sparkleOut 0.7s ${i*0.04}s ease forwards`,
                }} />
              );
            })}

            {/* Player who's rolling */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
              <div style={{ ...St.dot, width:52, height:52, fontSize:28, background:cc }}>
                {P_TOKEN[turn]}
              </div>
              <div>
                <div style={{ fontWeight:900, fontSize:17, color:'#222' }}>{names[turn]}</div>
                <div style={{ fontSize:12, color:'#aaa', fontWeight:600 }}>
                  {rolling ? 'Rolling the dice...' : `Rolled a ${diceVal}!`}
                </div>
              </div>
            </div>

            {/* Big dice */}
            <div style={{ display:'flex', justifyContent:'center', margin:'0 0 20px' }}>
              <DiceSVG value={diceVal} size={130} color={cc} isRolling={rolling} isLanded={landed} />
            </div>

            {/* Result text */}
            {landed && (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:36, color:cc, lineHeight:1 }}>
                  {diceVal}!
                </div>
                <div style={{ fontSize:13, color:'#aaa', marginTop:6, fontWeight:600 }}>
                  Moving {diceVal} space{diceVal!==1?'s':''} forward
                </div>
                {/* Points preview */}
                <div style={{ marginTop:10, display:'inline-flex', alignItems:'center', gap:6,
                  background:cc+'15', borderRadius:20, padding:'5px 14px' }}>
                  <span style={{ fontSize:14 }}>🎯</span>
                  <span style={{ fontSize:13, fontWeight:800, color:cc }}>+{diceVal*POINTS_PER_SQUARE} pts</span>
                </div>
              </div>
            )}
            {rolling && (
              <div className="blink" style={{ textAlign:'center', fontSize:14, color:'#bbb', fontWeight:700 }}>
                🎲 Shaking...
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TILE EFFECT FLASH ══ */}
      {effect && (
        <div style={St.effectWrap}>
          {/* Ripple ring */}
          <div style={{
            position:'absolute', width:180, height:180, borderRadius:'50%',
            border:`4px solid ${cc}`, animation:'rippleOut 0.6s ease forwards',
          }} />
          <div style={{ ...St.effectBox, borderColor: cc, background:`linear-gradient(135deg,rgba(8,8,28,0.96),rgba(30,10,40,0.96))` }}>
            {effect}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ STYLES ═══════════════════ */
const St = {
  lobby: {
    minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
    background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', padding:16,
  },
  lobbyCard: {
    background:'#fff', borderRadius:28, padding:'36px 28px', width:'100%', maxWidth:460,
    boxShadow:'0 32px 80px rgba(0,0,0,0.55)',
  },
  lobbyTitle: { fontFamily:"'Fredoka One',cursive", fontSize:30, letterSpacing:2, margin:'8px 0 4px' },
  lobbyLabel: { fontWeight:800, fontSize:11, color:'#aaa', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 },
  pcBtn: {
    flex:1, padding:'12px 6px', border:'2px solid #eee', borderRadius:14,
    background:'#fafafa', fontFamily:"'Nunito',sans-serif", cursor:'pointer', color:'#aaa',
    transition:'all .2s', display:'flex', flexDirection:'column', alignItems:'center', gap:4,
  },
  pcBtnOn: { background:'#c0392b', borderColor:'#c0392b', color:'#fff' },
  guideGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 },
  guideItem: { display:'flex', gap:8, alignItems:'center', padding:'9px 10px', borderRadius:10, border:'1.5px solid' },
  startBtn: {
    width:'100%', padding:'14px 0', background:'linear-gradient(135deg,#c0392b,#e74c3c)',
    color:'#fff', border:'none', borderRadius:14, fontSize:18,
    fontFamily:"'Fredoka One',cursive", cursor:'pointer', letterSpacing:1, marginBottom:10,
    boxShadow:'0 6px 22px rgba(192,57,43,0.4)',
  },
  grayBtn: {
    width:'100%', padding:'9px 0', background:'transparent', border:'1.5px solid #ddd',
    borderRadius:12, fontSize:13, fontWeight:700, color:'#bbb', cursor:'pointer',
  },
  header: {
    background:'linear-gradient(90deg,#1a1a2e 0%,#c0392b 100%)',
    padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between',
    boxShadow:'0 2px 20px rgba(0,0,0,0.35)',
  },
  hTitle: { fontFamily:"'Fredoka One',cursive", fontSize:17, letterSpacing:1.5, margin:0 },
  hBtn: {
    background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.28)',
    color:'#fff', padding:'6px 12px', borderRadius:8, fontSize:12,
    fontFamily:"'Nunito',sans-serif", fontWeight:700, cursor:'pointer',
  },
  ribbon: {
    display:'flex', alignItems:'center', gap:10, padding:'10px 20px',
    color:'#fff', fontSize:14, fontWeight:700,
  },
  layout: {
    display:'grid', gridTemplateColumns:'1fr 3fr 1fr', gridTemplateRows:'1fr',
    gap:12, padding:'12px 16px',
    flex:'1 1 0', minHeight:0, overflow:'hidden',
    background:'linear-gradient(-45deg,#e8f5e9,#e3f2fd,#fce4ec,#fff9c4,#f3e5f5,#e0f7fa)',
    backgroundSize:'400% 400%', animation:'bgShift 18s ease infinite',
    alignItems:'start',
  },
  leftPanel:  { display:'flex', flexDirection:'column', gap:10, height:'100%', overflow:'hidden' },
  boardCol:   { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  rightPanel: { display:'flex', flexDirection:'column', gap:10, height:'100%', overflow:'hidden' },
  revealCard: {
    display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
    borderRadius:14, border:'2.5px solid', marginTop:12, background:'#fff',
  },
  secLabel: {
    fontSize:10, fontWeight:800, color:'#bbb', textTransform:'uppercase', letterSpacing:1.5,
    paddingBottom:4, borderBottom:'1.5px solid #e8e8e8',
  },
  pCard: {
    background:'#fafafa', border:'2.5px solid #eee', borderRadius:14, padding:'10px 12px',
    display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .22s',
  },
  dot: {
    width:38, height:38, borderRadius:'50%', display:'flex',
    alignItems:'center', justifyContent:'center', flexShrink:0,
  },
  lbCard: { background:'#fff', borderRadius:12, padding:'10px 14px', border:'1.5px solid #eee' },
  ctrlCard: { background:'#fff', borderRadius:16, padding:'16px', border:'1.5px solid #eee', textAlign:'center' },
  rollBtn: {
    width:'100%', padding:'13px 0', color:'#fff', border:'none', borderRadius:14,
    fontSize:16, fontFamily:"'Fredoka One',cursive", cursor:'pointer', letterSpacing:1,
    transition:'opacity .15s',
  },
  swapBtn: {
    padding:'9px 14px', background:'#fff', border:'2.5px solid',
    borderRadius:10, fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:13, cursor:'pointer',
  },
  winCard: {
    background:'#fff', border:'3px solid #f0c040', borderRadius:22,
    padding:'24px 16px', textAlign:'center', display:'flex',
    flexDirection:'column', alignItems:'center', gap:6, position:'relative', overflow:'hidden',
  },
  reBtn: {
    padding:'10px 20px', background:'#c0392b', color:'#fff', border:'none',
    borderRadius:12, fontFamily:"'Fredoka One',cursive", fontSize:15, cursor:'pointer', letterSpacing:1,
  },
  logBox: {
    background:'#fff', borderRadius:12, padding:'10px 12px', border:'1.5px solid #eee',
    flex:'1 1 0', minHeight:0,
    overflowY:'auto', display:'flex', flexDirection:'column', gap:5,
  },
  logRow: {
    display:'flex', gap:6, fontSize:11, color:'#555', paddingLeft:8,
    borderLeft:'3px solid #ddd', lineHeight:1.6, fontWeight:600,
  },
  overlay: {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.8)',
    display:'flex', alignItems:'center', justifyContent:'center',
    zIndex:1000, backdropFilter:'blur(6px)',
  },
  diceModal: {
    background:'#fff', borderRadius:28, padding:'32px 40px 28px',
    minWidth:300, textAlign:'center', border:'4px solid',
    position:'relative', overflow:'hidden',
    boxShadow:'0 28px 80px rgba(0,0,0,0.5)',
  },
  effectWrap: {
    position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
    pointerEvents:'none', zIndex:1200,
  },
  effectBox: {
    color:'#fff', padding:'20px 48px',
    borderRadius:28, fontSize:28, fontFamily:"'Fredoka One',cursive", letterSpacing:1.5,
    boxShadow:'0 16px 60px rgba(0,0,0,0.6), 0 0 0 3px rgba(255,255,255,0.12)',
    border:'3px solid', position:'relative',
    animation:'megaBounce 0.55s cubic-bezier(.34,1.56,.64,1) forwards',
  },
};
