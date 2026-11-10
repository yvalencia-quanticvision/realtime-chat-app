const { ApiError } = require('../lib/errors');
const { serializeAttachment } = require('../lib/attachments');

const userSelect = { id: true, name: true, email: true };

function serializeLastMessage(message, chatId) {
  if (!message) return null;
  return { ...message, attachment: serializeAttachment(message.attachment, chatId) };
}

function serializeChat(chat, currentUserId) {
  const otherParticipants = chat.participants
    .filter((p) => p.userId !== currentUserId)
    .map((p) => p.user);

  return {
    id: chat.id,
    isGroup: chat.isGroup,
    name: chat.name || otherParticipants.map((u) => u.name).join(', '),
    participants: chat.participants.map((p) => p.user),
    lastMessage: serializeLastMessage(chat.messages && chat.messages[0], chat.id),
    createdAt: chat.createdAt,
  };
}

// compartido por el controller REST y la capa de sockets para que la
// pertenencia se valide en un solo lugar
function createChatService(prisma) {
  async function isMember(chatId, userId) {
    const membership = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    return Boolean(membership);
  }

  async function listChatIdsForUser(userId) {
    const memberships = await prisma.chatParticipant.findMany({
      where: { userId },
      select: { chatId: true },
    });
    return memberships.map((m) => m.chatId);
  }

  // acotado a los propios grupos de este usuario, no a todos los del sistema,
  // asi el error nunca revela la existencia/nombre de un grupo donde no esta
  async function assertUniqueGroupName(userId, name, excludeChatId) {
    const trimmed = (name || '').trim();
    if (!trimmed) return;

    const existing = await prisma.chat.findFirst({
      where: {
        isGroup: true,
        name: { equals: trimmed, mode: 'insensitive' },
        participants: { some: { userId } },
        ...(excludeChatId ? { id: { not: excludeChatId } } : {}),
      },
    });
    if (existing) {
      throw new ApiError('Ya tienes un grupo con ese nombre', 409);
    }
  }

  async function create({ creatorId, participantIds, name }) {
    const uniqueIds = [...new Set(participantIds)].filter((id) => id !== creatorId);
    if (uniqueIds.length === 0) {
      throw new ApiError('Debes seleccionar al menos otro participante', 400);
    }

    const foundUsers = await prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    if (foundUsers.length !== uniqueIds.length) {
      throw new ApiError('Alguno de los usuarios seleccionados no existe', 400);
    }

    const allParticipantIds = [creatorId, ...uniqueIds];
    const isGroup = allParticipantIds.length > 2;

    if (isGroup) {
      await assertUniqueGroupName(creatorId, name);
    }

    // para chats 1 a 1, reutiliza una conversacion existente entre los mismos dos usuarios
    if (!isGroup) {
      const existing = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          AND: allParticipantIds.map((id) => ({ participants: { some: { userId: id } } })),
        },
        include: {
          participants: { include: { user: { select: userSelect } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { attachment: true } },
        },
      });
      if (existing && existing.participants.length === allParticipantIds.length) {
        return serializeChat(existing, creatorId);
      }
    }

    const chat = await prisma.chat.create({
      data: {
        isGroup,
        name: isGroup ? name || null : null,
        participants: { create: allParticipantIds.map((userId) => ({ userId })) },
      },
      include: {
        participants: { include: { user: { select: userSelect } } },
        messages: true,
      },
    });

    return serializeChat(chat, creatorId);
  }

  async function listForUser(userId) {
    const chats = await prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: userSelect } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { attachment: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return chats.map((c) => serializeChat(c, userId));
  }

  async function getForUser(chatId, userId) {
    if (!(await isMember(chatId, userId))) {
      throw new ApiError('No tienes acceso a este chat', 403);
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: { include: { user: { select: userSelect } } },
        messages: { include: { attachment: true } },
      },
    });
    if (!chat) {
      throw new ApiError('Chat no encontrado', 404);
    }

    return serializeChat(chat, userId);
  }

  // devuelve los ids de los participantes para que quien llama pueda avisarles
  // por el socket antes de que las filas (y sus salas chat:*) dejen de tener sentido
  async function remove(chatId, userId) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });
    if (!chat) {
      throw new ApiError('Chat no encontrado', 404);
    }
    if (!chat.participants.some((p) => p.userId === userId)) {
      throw new ApiError('No tienes acceso a este chat', 403);
    }

    await prisma.chat.delete({ where: { id: chatId } });
    return chat.participants.map((p) => p.userId);
  }

  // devuelve los ids de los participantes (misma razon que remove: quien
  // llama los necesita para avisarle a todos por el socket)
  async function rename(chatId, userId, name) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });
    if (!chat) {
      throw new ApiError('Chat no encontrado', 404);
    }
    if (!chat.participants.some((p) => p.userId === userId)) {
      throw new ApiError('No tienes acceso a este chat', 403);
    }
    if (!chat.isGroup) {
      throw new ApiError('Solo los grupos se pueden renombrar', 400);
    }

    const trimmed = (name || '').trim();
    if (!trimmed) {
      throw new ApiError('El nombre no puede estar vacio', 400);
    }

    await assertUniqueGroupName(userId, trimmed, chatId);
    await prisma.chat.update({ where: { id: chatId }, data: { name: trimmed } });

    return { name: trimmed, participantIds: chat.participants.map((p) => p.userId) };
  }

  return { isMember, listChatIdsForUser, create, listForUser, getForUser, remove, rename };
}

module.exports = createChatService;
