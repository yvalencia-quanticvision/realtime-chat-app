const { verifyToken } = require('../config/jwt');
const { chatService, messageService } = require('../services');

function roomName(chatId) {
  return `chat:${chatId}`;
}

function userRoomName(userId) {
  return `user:${userId}`;
}

// el middleware de socket.io corre antes de que dispare "connection", asi que
// un token malo o ausente nunca llega a tener una conexion viva
function socketAuth(socket, next) {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new Error('No autenticado'));
  }

  try {
    const payload = verifyToken(token);
    socket.userId = payload.sub;
    next();
  } catch (err) {
    next(new Error('Token invalido'));
  }
}

async function joinOwnChats(socket) {
  const chatIds = await chatService.listChatIdsForUser(socket.userId);
  chatIds.forEach((chatId) => socket.join(roomName(chatId)));
}

function registerSocketHandlers(io) {
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    // una sala personal alcanzable por userId, independiente de que chats
    // existieran al conectarse — deja que el servidor empuje "chat:new" a un
    // usuario aunque ya estuviera conectado antes de que ese chat existiera
    socket.join(userRoomName(socket.userId));

    try {
      await joinOwnChats(socket);
    } catch (err) {
      console.error('failed to join rooms', err);
    }

    socket.on('message:send', async ({ chatId, content } = {}, ack) => {
      try {
        if (!chatId || typeof content !== 'string' || !content.trim()) {
          return ack?.({ error: 'Mensaje invalido' });
        }

        // messageService vuelve a chequear la pertenencia por su cuenta, igual
        // que el camino REST, asi que un chatId viejo o falsificado no sirve
        // para escribir en un chat ajeno
        const message = await messageService.send({
          chatId,
          senderId: socket.userId,
          content: content.trim(),
        });

        io.to(roomName(chatId)).emit('message:new', message);
        ack?.({ message });
      } catch (err) {
        if (err.status) {
          return ack?.({ error: err.message });
        }
        console.error(err);
        ack?.({ error: 'No se pudo enviar el mensaje' });
      }
    });

    socket.on('chat:join', async (chatId, ack) => {
      if (!(await chatService.isMember(chatId, socket.userId))) {
        return ack?.({ error: 'No tienes acceso a este chat' });
      }
      socket.join(roomName(chatId));
      ack?.({ ok: true });
    });
  });
}

module.exports = { registerSocketHandlers, roomName, userRoomName };
