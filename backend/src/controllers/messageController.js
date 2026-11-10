const fs = require('fs');
const path = require('path');
const { messageService } = require('../services');
const { roomName } = require('../sockets');
const { UPLOAD_DIR } = require('../middleware/upload');

async function listMessages(req, res, next) {
  try {
    const messages = await messageService.listForChat(req.params.chatId, req.user.id);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const message = await messageService.send({
      chatId: req.params.chatId,
      senderId: req.user.id,
      content: req.body.content.trim(),
    });

    // quien envia puede estar usando esta ruta porque su propio socket esta
    // caido, pero otros participantes pueden seguir conectados y esperar esto
    // en tiempo real, igual que por el camino del socket
    req.app.get('io')?.to(roomName(req.params.chatId)).emit('message:new', message);

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

async function sendAttachmentMessage(req, res, next) {
  try {
    const message = await messageService.sendWithAttachment({
      chatId: req.params.chatId,
      senderId: req.user.id,
      content: req.body.content ? req.body.content.trim() : null,
      file: req.file,
    });

    req.app.get('io')?.to(roomName(req.params.chatId)).emit('message:new', message);

    res.status(201).json({ message });
  } catch (err) {
    // el archivo ya quedo en disco para cuando corren los chequeos de
    // pertenencia/base de datos; sin esto se acumularia huerfano en cada
    // peticion rechazada
    if (req.file) {
      fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
    }
    next(err);
  }
}

async function downloadAttachment(req, res, next) {
  try {
    const attachment = await messageService.getAttachmentForDownload(
      req.params.chatId,
      req.params.messageId,
      req.user.id
    );

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(attachment.filename)}"`
    );
    res.sendFile(path.join(UPLOAD_DIR, attachment.storedName), (err) => {
      if (err && !res.headersSent) next(err);
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMessages, sendMessage, sendAttachmentMessage, downloadAttachment };
