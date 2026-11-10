// compartido por chatService (previews de mensajes) y messageService
// (mensajes completos) para que la forma del adjunto nunca se desalinee entre los dos
function serializeAttachment(attachment, chatId) {
  if (!attachment) return null;
  return {
    id: attachment.id,
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    size: attachment.size,
    url: `/api/chats/${chatId}/messages/${attachment.messageId}/attachment`,
  };
}

module.exports = { serializeAttachment };
