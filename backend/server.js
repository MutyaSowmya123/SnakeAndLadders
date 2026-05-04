const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const { registerGameSocket } = require('./socket/gameSocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fusionshield';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 8000,
}).then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB failed:', err.message));

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.get('/api/health', (req, res) => {
  const states = { 0:'disconnected', 1:'connected', 2:'connecting', 3:'disconnecting' };
  res.json({
    status: 'ok',
    app: 'Fusion Shield',
    mongodb: states[mongoose.connection.readyState] || 'unknown',
  });
});

registerGameSocket(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Fusion Shield server running on port ${PORT}`));
