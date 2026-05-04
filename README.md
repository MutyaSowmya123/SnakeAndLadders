# 🛡️ Fusion Shield — Snake & Ladder

[![MIT License](https://img.shields.io/badge/License-MIT-red.svg)](LICENSE)

### Try playing
https://mutyasowmya123.github.io/SnakeAndLadders/

A feature-rich multiplayer Snake & Ladder game with a React frontend and Node.js/Socket.io backend. Supports both **local pass-and-play** and **real-time online multiplayer** via room codes.

---

## Features

### Game Modes
- **Local Play** — 2–4 players on the same device (pass-and-play)
- **Online Multiplayer** — Real-time multiplayer over the internet using Socket.io room codes

### Online Multiplayer Flow
1. Login → choose **Online Multiplayer**
2. **Create Room** → get a 6-character room code → share with friends
3. Friends click **Join Room** → enter code → wait in lobby
4. Host clicks **Start Game** (requires 2+ players)
5. Each player rolls only on their own turn — all moves sync live to everyone in the room

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
- 10×10 board (100 squares)
- Each square moved is worth 10 points
- Must land on square 100 exactly to win (no overshooting)
- Tile types are **hidden** — revealed only when a player lands on them
- Supports 2–4 players

### Auth System
- User registration & login with JWT
- MongoDB integration (falls back to in-memory store if MongoDB is unavailable)
- Passwords hashed with bcrypt

---

## Project Structure

```
SnakeAndLadder/
├── backend/
│   ├── server.js              # Express + Socket.io server
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js            # JWT auth middleware
│   ├── models/
│   │   └── User.js            # Mongoose user schema
│   ├── routes/
│   │   ├── auth.js            # /api/auth — register & login
│   │   └── game.js            # /api/game — config & save
│   └── socket/
│       └── gameSocket.js      # Socket.io room management & game logic
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── socket.js              # socket.io-client singleton
        ├── context/
        │   └── AuthContext.js     # Auth state (login/logout)
        ├── pages/
        │   ├── AuthPage.js        # Login / Register UI
        │   └── GamePage.js        # Game UI — local & online modes
        ├── components/
        │   └── GameBoard.js       # Canvas-based board renderer
        └── utils/
            └── gameConstants.js   # Board definitions, tile types, helpers
```

---

## Setup & Run

### Prerequisites
- Node.js 18+
- npm
- MongoDB (optional — app works without it using an in-memory store)

### 1. Install dependencies
```bash
# From project root
npm run install:all
```

### 2. Start the backend
```bash
cd backend
npm start
# Server runs on http://localhost:5001
```

### 3. Start the frontend
```bash
cd frontend
npm start
# App runs on http://localhost:3000
```

### Environment Variables (optional)
Create `backend/.env`:
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/fusionshield
JWT_SECRET=your_secret_here
```

For online multiplayer across devices, set the socket URL in the frontend:
```
REACT_APP_SOCKET_URL=http://<your-server-ip>:5001
```

---

## Board Layout (10×10)

Squares numbered 1–100, bottom-left to top-right in a snake (boustrophedon) pattern.

### Snakes (slide down)
| Head | Tail |
|------|------|
| 97 | 78 |
| 85 | 56 |
| 73 | 42 |
| 68 | 30 |
| 54 | 12 |

### Ladders (climb up)
| Bottom | Top |
|--------|-----|
| 4 | 32 |
| 15 | 48 |
| 22 | 65 |
| 46 | 79 |
| 63 | 91 |

### Special Tile Positions
| Tile | Squares |
|------|---------|
| 🛡️ Fusion Shield | 17, 44, 71 |
| ⚡ Turbo | 9, 36, 58 |
| 🎁 Free | 21, 50, 77 |
| 🔀 Swap | 33, 61, 88 |
| 💀 Sakuni | 13, 39, 66 |
| 🌀 Gokul | 52, 83 |

---

## AWS Deployment

Recommended architecture for hosting online multiplayer:

```
Players → CloudFront → S3            (React frontend — static files)
                ↕
         Elastic Beanstalk           (Node.js + Socket.io backend)
                ↕
            MongoDB Atlas             (optional managed database)
```

### Frontend → S3 + CloudFront
```bash
cd frontend && npm run build
# Upload the build/ folder to an S3 bucket
# Enable static website hosting and attach a CloudFront distribution
```

### Backend → Elastic Beanstalk
- Deploy the `backend/` folder as a Node.js application
- Set environment variables (`PORT`, `MONGODB_URI`, `JWT_SECRET`) in the EB console
- Enable WebSocket support: set **Connection type** to `Upgrade` in the load balancer configuration

> **Cost note:** Elastic Beanstalk itself is free — you pay only for the underlying EC2 instance. A `t3.micro` qualifies for the AWS free tier (12 months).

---

## License

This project is licensed under the [MIT License](LICENSE) — free to use, modify, and distribute with attribution.

---
