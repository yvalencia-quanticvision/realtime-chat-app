const { chatService } = require('../services');
const { userRoomName, roomName } = require('../sockets');

async function createChat(req, res, next) {
  try {
    const chat = await chatService.create({
      creatorId: req.user.id,
      participantIds: req.body.participantIds,
      name: req.body.name,
    });

    // los demas participantes pueden ya estar conectados desde antes de que
    // existiera este chat, asi que se les empuja en vez de esperar su proximo
    // poll. `chat` quedo serializado respecto a quien lo creo (su "name" es
    // lo que ve el creador), asi que cada destinatario necesita su propia
    // serializacion o veria su propio nombre reflejado en vez del de la otra persona
    const io = req.app.get('io');
    const others = chat.participants.filter((p) => p.id !== req.user.id);
    await Promise.all(
      others.map(async (p) => {
        const chatForParticipant = await chatService.getForUser(chat.id, p.id);
        io?.to(userRoomName(p.id)).emit('chat:new', chatForParticipant);
      })
    );

    res.status(201).json({ chat });
  } catch (err) {
    next(err);
  }
}

async function listChats(req, res, next) {
  try {
    const chats = await chatService.listForUser(req.user.id);
    res.json({ chats });
  } catch (err) {
    next(err);
  }
}

async function getChat(req, res, next) {
  try {
    const chat = await chatService.getForUser(req.params.chatId, req.user.id);
    res.json({ chat });
  } catch (err) {
    next(err);
  }
}

async function deleteChat(req, res, next) {
  try {
    const participantIds = await chatService.remove(req.params.chatId, req.user.id);

    const io = req.app.get('io');
    participantIds.forEach((id) =>
      io?.to(userRoomName(id)).emit('chat:deleted', { chatId: req.params.chatId })
    );
    io?.in(roomName(req.params.chatId)).socketsLeave(roomName(req.params.chatId));

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function renameChat(req, res, next) {
  try {
    const { name, participantIds } = await chatService.rename(
      req.params.chatId,
      req.user.id,
      req.body.name
    );

    const io = req.app.get('io');
    participantIds.forEach((id) =>
      io?.to(userRoomName(id)).emit('chat:updated', { chatId: req.params.chatId, name })
    );

    res.json({ chat: { id: req.params.chatId, name } });
  } catch (err) {
    next(err);
  }
}

module.exports = { createChat, listChats, getChat, deleteChat, renameChat };
