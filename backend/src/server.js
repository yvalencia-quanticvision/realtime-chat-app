require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const { registerSocketHandlers } = require('./sockets');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true },
});

registerSocketHandlers(io);
app.set('io', io);

server.listen(PORT, () => {
  console.log(`backend listening on port ${PORT}`);
});
