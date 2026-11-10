const { ApiError } = require('../lib/errors');
const { serializeAttachment } = require('../lib/attachments');

const senderSelect = { id: true, name: true, email: true };

// attachment.url necesita el chatId, que no esta en la fila del adjunto
function serializeMessage(message) {
  return { ...message, attachment: serializeAttachment(message.attachment, message.chatId) };
}

// recibe chatService en vez de volver a chequear la pertenencia con su propia
// consulta, asi el camino REST y el de sockets nunca se desalinean en autorizacion
function createMessageService(prisma, chatService) {
  async function assertMember(chatId, userId) {
    if (!(await chatService.isMember(chatId, userId))) {
      throw new ApiError('No tienes acceso a este chat', 403);
    }
  }

  async function listForChat(chatId, userId) {
    await assertMember(chatId, userId);

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: { sender: { select: senderSelect }, attachment: true },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map(serializeMessage);
  }

  async function send({ chatId, senderId, content }) {
    await assertMember(chatId, senderId);

    const message = await prisma.message.create({
      data: { chatId, senderId, content },
      include: { sender: { select: senderSelect }, attachment: true },
    });

    return serializeMessage(message);
  }

  async function sendWithAttachment({ chatId, senderId, content, file }) {
    await assertMember(chatId, senderId);

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        content: content || null,
        attachment: {
          create: {
            filename: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
          },
        },
      },
      include: { sender: { select: senderSelect }, attachment: true },
    });

    return serializeMessage(message);
  }

  async function getAttachmentForDownload(chatId, messageId, userId) {
    await assertMember(chatId, userId);

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { attachment: true },
    });

    if (!message || message.chatId !== chatId || !message.attachment) {
      throw new ApiError('Adjunto no encontrado', 404);
    }

    return message.attachment;
  }

  return { listForChat, send, sendWithAttachment, getAttachmentForDownload };
}

module.exports = createMessageService;
