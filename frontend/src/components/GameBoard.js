import React, { useRef, useEffect } from 'react';
import {
  squareToPos, BOARD_SIZE, SNAKES, LADDERS, PLAYER_COLORS,
  FUSION_SHIELD, TURBO, FREE, SWAP, SAKUNI, GOKUL,
} from '../utils/gameConstants';

// ── palette ────────────────────────────────────────────────────
const ROW_LIGHT = ['#FFD6D6','#FFE4CE','#FFF9C0','#D8F5D0','#C6F0FF','#CDD8FF','#DDD0FF','#F9D0FF','#D0FFE8','#FFE0D0'];
const ROW_DARK  = ['#FFB0B0','#FFCA99','#FFF076','#AAEEA0','#88DEFF','#99AAFF','#BB99FF','#F299FF','#88FFCC','#FFAA80'];
const SNAKE_COLS    = ['#e53935','#f57c00','#7b1fa2','#0277bd'];
const LADDER_COLS   = ['#2e7d32','#e65100','#1565c0','#6a1b9a'];
const PLAYER_AVATARS = ['🦁', '🐼', '🦊', '🐸'];

// ── helpers ────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;

export default function GameBoard({ positions, numPlayers }) {
  // Three canvas layers
  const bgRef     = useRef(null);   // static: cells + tile icons  (drawn once)
  const snakeRef  = useRef(null);   // animated: snakes + ladders   (every frame)
  const piecesRef = useRef(null);   // animated: player tokens      (every frame)

  // All mutable animation state lives here — never causes re-render
  const anim = useRef({
    phase:         0,               // drives snake wiggle & ladder shimmer
    prevPositions: [0, 0, 0, 0],   // last known positions
    tokenAnims:    [null, null, null, null], // active jump animations
    numPlayers:    numPlayers,
    positions:     [...positions],
  });

  // ── sync numPlayers & positions into the ref ────────────────
  useEffect(() => { anim.current.numPlayers = numPlayers; }, [numPlayers]);
  useEffect(() => { anim.current.positions  = [...positions]; }, [positions]);

  // ── draw static background once on mount ────────────────────
  useEffect(() => {
    drawBg();
  }, []);                           // eslint-disable-line react-hooks/exhaustive-deps

  // ── detect position changes → start jump animation ───────────
  useEffect(() => {
    const prev = anim.current.prevPositions;
    for (let p = 0; p < 4; p++) {
      if (positions[p] !== prev[p]) {
        anim.current.tokenAnims[p] = { from: prev[p], to: positions[p], t: 0 };
      }
    }
    anim.current.prevPositions = [...positions];
  }, [positions]);                  // eslint-disable-line react-hooks/exhaustive-deps

  // ── RAF animation loop ────────────────────────────────────────
  useEffect(() => {
    let rafId;
    let lastW = 0;

    const tick = () => {
      anim.current.phase += 0.022;  // ~1.3 rad/s at 60 fps — slow natural wiggle

      // Advance jump animations
      anim.current.tokenAnims = anim.current.tokenAnims.map(a => {
        if (!a) return null;
        const next = { ...a, t: a.t + 0.036 }; // ~28 frames ≈ 0.46 s total
        return next.t >= 1 ? null : next;
      });

      // Get canvas width; redraw bg if layout resized
      const canvas = bgRef.current;
      const W = canvas ? canvas.parentElement.offsetWidth : 0;
      if (W > 0) {
        if (W !== lastW) { lastW = W; drawBg(); }
        drawSnakesAndLadders(W);
        drawPieces(W);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);                           // eslint-disable-line react-hooks/exhaustive-deps

  // ── STATIC BACKGROUND (cells + special icons) ────────────────
  function drawBg() {
    const canvas = bgRef.current;
    if (!canvas) return;
    const W = canvas.parentElement.offsetWidth;
    canvas.width = W; canvas.height = W;
    const ctx = canvas.getContext('2d');
    const cell = W / BOARD_SIZE;

    // Build special-tile map
    const sp = {};
    Object.keys(FUSION_SHIELD).forEach(q => { sp[+q] = '🛡️'; });
    Object.keys(TURBO).forEach(q         => { sp[+q] = '⚡';  });
    Object.keys(FREE).forEach(q          => { sp[+q] = '🎁';  });
    Object.keys(SWAP).forEach(q          => { sp[+q] = '🔀';  });
    Object.keys(SAKUNI).forEach(q        => { sp[+q] = '💀';  });
    Object.keys(GOKUL).forEach(q         => { sp[+q] = '🌀';  });

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const row = BOARD_SIZE - 1 - r;
        const col = row % 2 === 0 ? c : BOARD_SIZE - 1 - c;
        const sq  = row * BOARD_SIZE + col + 1;

        // Rainbow cell fill
        ctx.fillStyle = (r + c) % 2 === 0 ? ROW_LIGHT[r] : ROW_DARK[r];
        ctx.fillRect(c * cell, r * cell, cell, cell);

        // Crisp white grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.72)'; ctx.lineWidth = 1;
        ctx.strokeRect(c * cell, r * cell, cell, cell);

        // Square number (top-center)
        ctx.fillStyle = 'rgba(0,0,0,0.36)';
        ctx.font = `bold ${cell * 0.17}px Nunito,sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(sq, c * cell + cell / 2, r * cell + 2);

        // Mystery badge — icon hidden until player lands
        if (sp[sq]) {
          const ix = c * cell + cell / 2, iy = r * cell + cell / 2 + 2;
          // Dark pill background
          ctx.fillStyle = 'rgba(18, 14, 50, 0.82)';
          ctx.beginPath();
          ctx.ellipse(ix, iy, cell * 0.27, cell * 0.27, 0, 0, Math.PI * 2);
          ctx.fill();
          // Gold glow ring
          ctx.strokeStyle = 'rgba(255, 210, 0, 0.85)';
          ctx.lineWidth = cell * 0.028;
          ctx.stroke();
          // Gold ? mark
          ctx.fillStyle = '#FFD700';
          ctx.font = `bold ${cell * 0.3}px Nunito, sans-serif`;
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'center';
          ctx.fillText('?', ix, iy);
        }
      }
    }
  }

  // ── ANIMATED SNAKES + LADDERS ─────────────────────────────────
  function drawSnakesAndLadders(W) {
    const canvas = snakeRef.current;
    if (!canvas) return;
    if (canvas.width !== W) { canvas.width = W; canvas.height = W; }
    const ctx = canvas.getContext('2d');
    const cell = W / BOARD_SIZE;
    ctx.clearRect(0, 0, W, W);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    const ph = anim.current.phase;

    // ── Snakes (realistic) ────────────────────────────────────
    let si = 0;
    Object.entries(SNAKES).forEach(([from, to]) => {
      const f = squareToPos(+from), t = squareToPos(+to);
      if (!f || !t) return;
      const fx = f.c * cell + cell / 2, fy = f.r * cell + cell / 2;
      const tx = t.c * cell + cell / 2, ty = t.r * cell + cell / 2;
      const sc = SNAKE_COLS[si % SNAKE_COLS.length];
      const sp = ph + si * 1.4;
      si++;

      const N = 36;
      // Animated S-curve via cubic bezier
      const ddx = tx - fx, ddy = ty - fy;
      const blen = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
      const perpX = -ddy / blen, perpY = ddx / blen;
      const wig = Math.sin(sp * 1.6) * cell * 0.14;
      const cp1x = fx + ddx * 0.33 + perpX * (blen * 0.30 + wig);
      const cp1y = fy + ddy * 0.33 + perpY * (blen * 0.30 + wig);
      const cp2x = fx + ddx * 0.67 - perpX * (blen * 0.24 + wig * 0.8);
      const cp2y = fy + ddy * 0.67 - perpY * (blen * 0.24 + wig * 0.8);

      // Sample N+1 points along cubic bezier (pts[0]=head, pts[N]=tail)
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const tt = i / N, u = 1 - tt;
        pts.push([
          u*u*u*fx + 3*u*u*tt*cp1x + 3*u*tt*tt*cp2x + tt*tt*tt*tx,
          u*u*u*fy + 3*u*u*tt*cp1y + 3*u*tt*tt*cp2y + tt*tt*tt*ty,
        ]);
      }

      const maxR = cell * 0.108, minR = cell * 0.025;
      const bodyR = (i) => maxR * Math.pow(1 - (i / N) * 0.8, 0.55) + minR;

      // Shadow pass
      ctx.globalAlpha = 0.14;
      for (let i = N; i >= 2; i--) {
        ctx.beginPath();
        ctx.arc(pts[i][0] + 2.5, pts[i][1] + 2.5, bodyR(i), 0, Math.PI * 2);
        ctx.fillStyle = '#000'; ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Body segments — tail → head
      for (let i = N; i >= 1; i--) {
        const r = bodyR(i);
        ctx.beginPath();
        ctx.arc(pts[i][0], pts[i][1], r, 0, Math.PI * 2);
        ctx.fillStyle = sc; ctx.fill();
        // Dark banding every other pair (like a real patterned snake)
        if (Math.floor(i / 2) % 2 === 0 && i > 2) {
          ctx.beginPath();
          ctx.arc(pts[i][0], pts[i][1], r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();
        }
        // Belly highlight arc (lighter underside)
        if (i > 1 && i < N - 1) {
          const bAng = Math.atan2(pts[i-1][1] - pts[i][1], pts[i-1][0] - pts[i][0]);
          ctx.beginPath();
          ctx.arc(pts[i][0], pts[i][1], r * 0.7, bAng - 0.42, bAng + 0.42);
          ctx.fillStyle = 'rgba(255,255,210,0.28)'; ctx.fill();
        }
      }

      // Scale arc markings
      for (let i = 3; i < N - 2; i += 3) {
        const r = bodyR(i);
        const [cx, cy] = pts[i];
        const ang = Math.atan2(pts[i+1][1] - cy, pts[i+1][0] - cx) + Math.PI / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.88, ang - 0.5, ang + 0.5);
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.lineWidth = r * 0.3; ctx.stroke();
      }

      // ── Realistic head ──────────────────────────────────────
      const bob = Math.sin(sp * 3) * 2.5;
      const headR = maxR * 1.55;
      const [p1x, p1y] = pts[1];
      const headAng = Math.atan2(fy - p1y, fx - p1x);

      // Head shadow
      ctx.beginPath();
      ctx.ellipse(fx + 2.5, fy + bob + 2.5, headR * 1.4, headR, headAng, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();

      // Main head — wide, spade-shaped
      ctx.beginPath();
      ctx.ellipse(fx, fy + bob, headR * 1.4, headR, headAng, 0, Math.PI * 2);
      ctx.fillStyle = sc; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.8; ctx.stroke();

      // Snout extension
      const snoutX = fx + Math.cos(headAng) * headR * 0.78;
      const snoutY = fy + Math.sin(headAng) * headR * 0.78 + bob;
      ctx.beginPath();
      ctx.ellipse(snoutX, snoutY, headR * 0.6, headR * 0.52, headAng, 0, Math.PI * 2);
      ctx.fillStyle = sc; ctx.fill();

      // Eyes — gold iris with vertical slit pupil
      const eyePerp = headAng + Math.PI / 2;
      const eyeDist = headR * 0.66;
      const eyeFwd  = headR * 0.32;
      [-1, 1].forEach(side => {
        const ex = fx + Math.cos(eyePerp) * eyeDist * side + Math.cos(headAng) * eyeFwd;
        const ey = fy + Math.sin(eyePerp) * eyeDist * side + Math.sin(headAng) * eyeFwd + bob;
        // Socket
        ctx.beginPath(); ctx.arc(ex, ey, headR * 0.27, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
        // Gold iris
        ctx.beginPath(); ctx.arc(ex, ey, headR * 0.21, 0, Math.PI * 2);
        ctx.fillStyle = '#e8b400'; ctx.fill();
        // Vertical slit pupil
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(headAng + Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, headR * 0.065, headR * 0.175, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a0a'; ctx.fill();
        ctx.restore();
      });

      // Nostrils
      const nDist = headR * 0.28;
      [-1, 1].forEach(side => {
        const nx = snoutX + Math.cos(eyePerp) * nDist * side;
        const ny = snoutY + Math.sin(eyePerp) * nDist * side;
        ctx.beginPath(); ctx.arc(nx, ny, headR * 0.075, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.48)'; ctx.fill();
      });

      // Forked tongue — flickers in/out
      const tongueFl = Math.max(0, Math.sin(sp * 4.8));
      if (tongueFl > 0.08) {
        const stemBaseX = fx + Math.cos(headAng) * headR * 1.08;
        const stemBaseY = fy + Math.sin(headAng) * headR * 1.08 + bob;
        const stemLen   = headR * 1.35 * tongueFl;
        const tipX = stemBaseX + Math.cos(headAng) * stemLen * 0.5;
        const tipY = stemBaseY + Math.sin(headAng) * stemLen * 0.5;
        ctx.strokeStyle = '#ff1a1a'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(stemBaseX, stemBaseY); ctx.lineTo(tipX, tipY); ctx.stroke();
        [-0.35, 0.35].forEach(fork => {
          const fLen = headR * 0.85 * tongueFl;
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(tipX + Math.cos(headAng + fork) * fLen, tipY + Math.sin(headAng + fork) * fLen);
          ctx.stroke();
        });
      }

      // Tail tip
      ctx.beginPath(); ctx.arc(tx, ty, minR * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = sc; ctx.fill();
    });

    // ── Ladders ───────────────────────────────────────────────
    let li = 0;
    Object.entries(LADDERS).forEach(([from, to]) => {
      const f = squareToPos(+from), t = squareToPos(+to);
      if (!f || !t) return;
      const fx = f.c * cell + cell / 2, fy = f.r * cell + cell / 2;
      const tx = t.c * cell + cell / 2, ty = t.r * cell + cell / 2;
      const lc = LADDER_COLS[li % LADDER_COLS.length];
      const lp = ph + li * 1.1;  // unique shimmer phase
      li++;

      const ang = Math.atan2(ty - fy, tx - fx);
      const perp = ang + Math.PI / 2;
      const hw = cell * 0.15;                         // wider rails
      const p = [
        [fx + Math.cos(perp) * hw, fy + Math.sin(perp) * hw],
        [tx + Math.cos(perp) * hw, ty + Math.sin(perp) * hw],
        [fx - Math.cos(perp) * hw, fy - Math.sin(perp) * hw],
        [tx - Math.cos(perp) * hw, ty - Math.sin(perp) * hw],
      ];

      // Rail shadows
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = cell * 0.11;
      [[0, 1], [2, 3]].forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(p[a][0] + 2, p[a][1] + 2);
        ctx.lineTo(p[b][0] + 2, p[b][1] + 2); ctx.stroke();
      });
      // Rails
      ctx.strokeStyle = lc; ctx.lineWidth = cell * 0.09;
      [[0, 1], [2, 3]].forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(p[a][0], p[a][1]);
        ctx.lineTo(p[b][0], p[b][1]); ctx.stroke();
      });

      // Shimmer-animated rungs (more rungs, thicker)
      const NR = 9;
      for (let s = 0; s <= NR; s++) {
        const frac = s / NR;
        const brightness = 0.55 + 0.45 * Math.abs(Math.sin(lp * 2.6 + s * 0.72));
        ctx.strokeStyle = `rgba(255,255,255,${brightness.toFixed(2)})`;
        ctx.lineWidth = cell * 0.065;
        ctx.beginPath();
        ctx.moveTo(p[0][0] + (p[1][0]-p[0][0])*frac, p[0][1] + (p[1][1]-p[0][1])*frac);
        ctx.lineTo(p[2][0] + (p[3][0]-p[2][0])*frac, p[2][1] + (p[3][1]-p[2][1])*frac);
        ctx.stroke();
      }

      // Base marker circle
      ctx.beginPath(); ctx.arc(fx, fy, cell * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = lc; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.font = `${cell * 0.17}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🪜', fx, fy);

      // Pulsing gold star at top
      const pulse = 0.86 + 0.16 * Math.abs(Math.sin(lp * 2.8));
      ctx.beginPath(); ctx.arc(tx, ty, cell * 0.15 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = `${cell * 0.16}px serif`;
      ctx.fillText('⭐', tx, ty);
    });
  }

  // ── ANIMATED PLAYER TOKENS ─────────────────────────────────────
  function drawPieces(W) {
    const canvas = piecesRef.current;
    if (!canvas) return;
    if (canvas.width !== W) { canvas.width = W; canvas.height = W; }
    const ctx = canvas.getContext('2d');
    const cell = W / BOARD_SIZE;
    ctx.clearRect(0, 0, W, W);

    const r = cell * 0.22;
    const offs = [[-1,-1],[1,-1],[-1,1],[1,1]];
    const { tokenAnims, prevPositions, numPlayers: np } = anim.current;

    for (let p = 0; p < np; p++) {
      const ta = tokenAnims[p];
      let cx, cy, sc = 1;

      if (ta) {
        // ── Arc-jump animation ────────────────────────────────
        const t = Math.min(ta.t, 1);
        const from = getXY(ta.from, p, cell, offs);
        const to   = getXY(ta.to,   p, cell, offs);

        cx = lerp(from.x, to.x, t);
        const arcH = cell * 0.95 * Math.sin(Math.PI * t);  // parabolic arc
        cy = lerp(from.y, to.y, t) - arcH;
        sc = 1 + 0.42 * Math.sin(Math.PI * t);              // swell at apex

        // Dynamic ground shadow (shrinks as player rises)
        const shadowScale = 1 - 0.55 * Math.sin(Math.PI * t);
        const gndY = lerp(from.y, to.y, t) + r * 0.5;
        ctx.beginPath();
        ctx.ellipse(cx, gndY, r * sc * shadowScale * 1.1, r * 0.22 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${(0.18 * shadowScale).toFixed(2)})`; ctx.fill();

        // Motion trail (3 fading ghost copies behind the token)
        for (let tr = 3; tr >= 1; tr--) {
          const tBack = Math.max(0, t - tr * 0.06);
          const trX = lerp(from.x, to.x, tBack);
          const trY = lerp(from.y, to.y, tBack) - cell * 0.95 * Math.sin(Math.PI * tBack);
          ctx.globalAlpha = (0.22 - tr * 0.06) * Math.sin(Math.PI * t);
          ctx.beginPath(); ctx.arc(trX, trY, r * sc * (1 - tr * 0.22), 0, Math.PI * 2);
          ctx.fillStyle = PLAYER_COLORS[p]; ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Landing dust burst (final 15 % of animation)
        if (t > 0.85) {
          const landFrac = (t - 0.85) / 0.15;
          const dustAlpha = 1 - landFrac;
          const landX = lerp(from.x, to.x, 1);
          const landY = lerp(from.y, to.y, 1);
          for (let d = 0; d < 8; d++) {
            const da  = (d / 8) * Math.PI * 2;
            const dd  = cell * 0.28 * landFrac;
            ctx.globalAlpha = dustAlpha * 0.7;
            ctx.beginPath();
            ctx.arc(landX + Math.cos(da) * dd, landY + Math.sin(da) * dd * 0.4, cell * 0.022, 0, Math.PI * 2);
            ctx.fillStyle = '#fff'; ctx.fill();
          }
          ctx.globalAlpha = 1;
        }

      } else {
        // ── Stationary token ─────────────────────────────────
        const pos = getXY(prevPositions[p], p, cell, offs);
        cx = pos.x; cy = pos.y;
        // Regular drop shadow
        ctx.beginPath(); ctx.arc(cx, cy + 2.5, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();
      }

      drawToken(ctx, cx, cy, r * sc, p);
    }
  }

  function getXY(sq, p, cell, offs) {
    if (sq < 1) return { x: (p % 4) * cell * 0.5 + cell * 0.25, y: BOARD_SIZE * cell - 8 };
    const pos = squareToPos(sq);
    if (!pos) return { x: 0, y: 0 };
    return { x: pos.c * cell + cell / 2 + offs[p][0] * cell * 0.16,
             y: pos.r * cell + cell / 2 + offs[p][1] * cell * 0.16 };
  }

  function drawToken(ctx, cx, cy, r, p) {
    // Drop shadow
    ctx.beginPath(); ctx.arc(cx + 2, cy + 3, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    // Colored disc
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = PLAYER_COLORS[p]; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    // Avatar emoji — centered in the disc
    ctx.font = `${Math.round(r * 1.52)}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(PLAYER_AVATARS[p], cx, cy + r * 0.08);
  }

  // ── JSX ───────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
      {/* Layer 1 — static cells + icons */}
      <canvas
        ref={bgRef}
        style={{
          width: '100%', height: '100%', borderRadius: 18,
          border: '4px solid rgba(255,255,255,0.85)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
          display: 'block',
        }}
      />
      {/* Layer 2 — animated snakes + ladders */}
      <canvas
        ref={snakeRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      {/* Layer 3 — animated player tokens */}
      <canvas
        ref={piecesRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
    </div>
  );
}
