import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Nunito', sans-serif; }
@keyframes float {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-12px); }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes tileIn {
  from { opacity:0; transform: scale(0.8) rotate(-5deg); }
  to   { opacity:1; transform: scale(1) rotate(0deg); }
}
.float-shield { animation: float 3s ease-in-out infinite; }
.fade-in { animation: fadeSlideUp 0.5s ease forwards; }
.tile-appear { animation: tileIn 0.4s cubic-bezier(.34,1.56,.64,1) forwards; }
input:focus { outline: none; border-color: #c0392b !important; box-shadow: 0 0 0 3px rgba(192,57,43,0.15); }
`;

const TILES = [
  { icon:'🛡️', name:'Shield Tile',   desc:'Skip next snake',   color:'#8e44ad', bg:'#f5eef8', delay: 0    },
  { icon:'⚡', name:'Turbo Tile',    desc:'Roll again',         color:'#e67e22', bg:'#fef5e7', delay: 0.08 },
  { icon:'🎁', name:'Free Tile',     desc:'Lose next turn',     color:'#e74c3c', bg:'#fdecea', delay: 0.16 },
  { icon:'🔀', name:'Swap Tile',     desc:'Trade positions',    color:'#1abc9c', bg:'#e8f8f5', delay: 0.24 },
  { icon:'💀', name:'Sakuni Box',    desc:'−10 points',         color:'#7f8c8d', bg:'#f2f3f4', delay: 0.32 },
  { icon:'🌀', name:'Gokul Box',     desc:'Back to start',      color:'#2c3e50', bg:'#eaecee', delay: 0.40 },
  { icon:'🐍', name:'Snake',         desc:'Slide down',         color:'#c0392b', bg:'#fdecea', delay: 0.48 },
  { icon:'🪜', name:'Ladder',        desc:'Climb up',           color:'#27ae60', bg:'#eafaf1', delay: 0.56 },
];

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username:'', email:'', password:'' });
  const [showPw, setShowPw] = useState(false);
  const { login, register, loading, error, setError } = useAuth();

  useEffect(() => { setError(''); }, [mode, setError]);

  const handleChange = e => {
    setError('');
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (mode === 'login') await login(form.email, form.password);
    else await register(form.username, form.email, form.password);
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={St.page}>
        {/* Floating bg circles */}
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
          {[...Array(6)].map((_,i) => (
            <div key={i} style={{
              position:'absolute',
              width: 80+i*60, height: 80+i*60,
              borderRadius:'50%',
              background:`rgba(192,57,43,${0.04+i*0.01})`,
              top:`${[10,60,25,75,40,85][i]}%`,
              left:`${[5,80,50,15,90,40][i]}%`,
              transform:'translate(-50%,-50%)',
              animation:`float ${3+i*0.5}s ${i*0.3}s ease-in-out infinite`,
            }}/>
          ))}
        </div>

        <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:900, display:'flex', gap:24, alignItems:'flex-start', justifyContent:'center', flexWrap:'wrap', padding:16 }}>

          {/* Auth card */}
          <div className="fade-in" style={St.card}>
            {/* Logo */}
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{ fontSize:60, lineHeight:1, marginBottom:12, display:'flex', justifyContent:'center', gap:10 }}>
                <span className="float-shield" style={{ display:'inline-block', animation:'float 1.4s ease-in-out infinite' }}>🐍</span>
                <span className="float-shield" style={{ display:'inline-block' }}>🎲</span>
                <span className="float-shield" style={{ display:'inline-block', animation:'float 1.6s 0.3s ease-in-out infinite' }}>🪜</span>
              </div>
              <h1 style={St.title}>ROLL FOR MADNESS</h1>
              <p style={{ color:'#bbb', fontWeight:700, fontSize:11, letterSpacing:3 }}>SNAKE &amp; LADDER REIMAGINED</p>
            </div>

            {/* Mode tabs */}
            <div style={St.tabs}>
              {['login','register'].map(m => (
                <button key={m} style={{ ...St.tab, ...(mode===m ? St.tabOn : {}) }} onClick={() => setMode(m)}>
                  {m==='login' ? '🔑 Login' : '✨ Register'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {mode==='register' && (
                <div style={St.field}>
                  <label style={St.label}>👤 Username</label>
                  <input name="username" value={form.username} onChange={handleChange}
                    placeholder="Choose a cool username" style={St.input} required minLength={3} />
                </div>
              )}
              <div style={St.field}>
                <label style={St.label}>📧 Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="your@email.com" style={St.input} required />
              </div>
              <div style={St.field}>
                <label style={St.label}>🔒 Password</label>
                <div style={{ position:'relative' }}>
                  <input name="password" type={showPw?'text':'password'} value={form.password}
                    onChange={handleChange} placeholder="••••••••"
                    style={{ ...St.input, paddingRight:44 }} required minLength={6} />
                  <button type="button" onClick={() => setShowPw(s=>!s)}
                    style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16 }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div style={St.errBox}>
                  <span style={{ fontSize:16 }}>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" style={St.submitBtn} disabled={loading}>
                {loading
                  ? <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                      <span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                      Please wait...
                    </span>
                  : mode==='login' ? '⚡ Enter the Arena' : '🎮 Create Account'}
              </button>
            </form>

            <div style={{ textAlign:'center', marginTop:16, fontSize:12, color:'#bbb' }}>
              {mode==='login'
                ? <>No account? <button style={St.linkBtn} onClick={()=>setMode('register')}>Register here →</button></>
                : <>Have an account? <button style={St.linkBtn} onClick={()=>setMode('login')}>Login →</button></>
              }
            </div>
          </div>

          {/* Tile guide panel */}
          <div className="fade-in" style={{ ...St.card, maxWidth:360, flex:'1 1 300px' }}>
            <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:18, color:'#c0392b', marginBottom:4 }}>
              🗺️ Tile Guide
            </h2>
            <p style={{ fontSize:11, color:'#bbb', fontWeight:700, letterSpacing:1, marginBottom:16 }}>
              TILES ARE HIDDEN UNTIL YOU LAND ON THEM!
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {TILES.map((t, i) => (
                <div key={t.name} className="tile-appear" style={{
                  display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                  background:t.bg, borderRadius:12, border:`1.5px solid ${t.color}44`,
                  animationDelay:`${t.delay}s`, opacity:0,
                }}>
                  <span style={{ fontSize:26, flexShrink:0 }}>{t.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:13, color:t.color }}>{t.name}</div>
                    <div style={{ fontSize:11, color:'#888' }}>{t.desc}</div>
                  </div>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:t.color, flexShrink:0 }}/>
                </div>
              ))}
            </div>

            {/* 8x8 info */}
            <div style={{ marginTop:16, padding:'12px 14px', background:'#f8f8f8', borderRadius:12, border:'1.5px solid #eee' }}>
              <div style={{ fontWeight:800, fontSize:12, color:'#555', marginBottom:6 }}>📐 Game Info</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {[['🟦','8×8 Board'],['📍','64 Squares'],['🎯','10 pts / sq'],['👥','2–4 Players']].map(([ic,lb])=>(
                  <div key={lb} style={{ display:'flex', gap:6, alignItems:'center', fontSize:11, color:'#777', fontWeight:700 }}>
                    <span style={{ fontSize:14 }}>{ic}</span>{lb}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const St = {
  page: {
    minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
    background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
    padding:16,
  },
  card: {
    background:'#fff', borderRadius:28, padding:'36px 28px', width:'100%', maxWidth:420, flex:'1 1 380px',
    boxShadow:'0 32px 80px rgba(0,0,0,0.55)',
  },
  title: { fontFamily:"'Fredoka One',cursive", fontSize:28, color:'#c0392b', letterSpacing:2, margin:'8px 0 4px' },
  tabs: { display:'flex', background:'#f5f5f5', borderRadius:14, padding:4, marginBottom:22, gap:4 },
  tab: {
    flex:1, padding:'10px 0', border:'none', borderRadius:10, background:'transparent',
    fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:13, color:'#aaa', cursor:'pointer', transition:'all .2s',
  },
  tabOn: { background:'#fff', color:'#c0392b', boxShadow:'0 2px 10px rgba(0,0,0,0.1)' },
  field: { display:'flex', flexDirection:'column', gap:5 },
  label: { fontSize:11, fontWeight:800, color:'#888', textTransform:'uppercase', letterSpacing:.8 },
  input: {
    padding:'11px 14px', border:'2px solid #eee', borderRadius:11, fontSize:14,
    fontFamily:"'Nunito',sans-serif", width:'100%', color:'#333', transition:'border-color .2s, box-shadow .2s',
  },
  errBox: {
    display:'flex', alignItems:'center', gap:8,
    background:'#fdecea', border:'1px solid #f5c6cb', color:'#c0392b',
    padding:'10px 14px', borderRadius:10, fontSize:13, fontWeight:700,
  },
  submitBtn: {
    padding:'13px 0', background:'linear-gradient(135deg,#c0392b,#e74c3c)',
    color:'#fff', border:'none', borderRadius:13, fontSize:16,
    fontFamily:"'Fredoka One',cursive", cursor:'pointer', letterSpacing:1,
    boxShadow:'0 6px 22px rgba(192,57,43,0.4)', transition:'transform .1s',
  },
  linkBtn: {
    background:'none', border:'none', color:'#c0392b', fontWeight:800, fontSize:12,
    cursor:'pointer', fontFamily:"'Nunito',sans-serif", textDecoration:'underline',
  },
};
