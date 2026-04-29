
Field	Value
Email	test@play.com
Password	Test1234
Username	testplayer

# 🛡️ Fusion Shield — Snake & Ladder

A feature-rich multiplayer Snake & Ladder game with React frontend and Node.js backend.

## Features

### Special Tiles (hidden until landed on)
| Icon | Tile | Effect |
|------|------|--------|
| 🛡️ | **Fusion Shield** | Skip the next snake you land on |
| ⚡ | **Turbo Tile** | Roll again immediately |
| 🎁 | **Free Tile** | Lose your next turn |
| 🔀 | **Swap Tile** | Trade positions with any other player |
| 💀 | **Sakuni Box** | Lose 10 points |
| 🌀 | **Gokul Box** | Sent back to position 0 (start) |

### Game Rules
- 8×8 board (64 squares)
- Each square is worth 10 points
- First player to reach square 64 wins
- Tile types are **hidden** — revealed only when a player lands on them
- Supports 2–4 players (pass-and-play on same device)

### Auth System
- User registration & login with JWT
- MongoDB integration (falls back to in-memory store if MongoDB unavailable)
- Passwords hashed with bcrypt

---

## Project Structure

```
fusion-shield/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── User.js
│   └── routes/
│       ├── auth.js
│       └── game.js
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── context/
        │   └── AuthContext.js
        ├── pages/
        │   ├── AuthPage.js
        │   └── GamePage.js
        ├── components/
        │   └── GameBoard.js
        └── utils/
            └── gameConstants.js
```

---

## Setup & Run

### Prerequisites
- Node.js 18+
- npm
- MongoDB (optional — app works without it using in-memory store)

### Backend
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

### Environment Variables (optional)
Create `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fusionshield
JWT_SECRET=your_secret_here
```

---

## Board Layout (8×8)

Squares numbered 1–64, bottom-left to top-right in a snake pattern.

### Snakes (go down)
- 47 → 26
- 56 → 18
- 62 → 44
- 49 → 30

### Ladders (go up)
- 4 → 25
- 9 → 20
- 17 → 52
- 37 → 58

### Special Tiles
- **Fusion Shield**: 12, 33, 51
- **Turbo**: 7, 28, 45
- **Free**: 15, 38, 55
- **Swap**: 22, 42, 60
- **Sakuni**: 11, 24, 48
- **Gokul**: 35, 53
