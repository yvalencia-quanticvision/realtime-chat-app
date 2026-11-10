const express = require('express');
const { createChat, listChats, getChat, deleteChat, renameChat } = require('../controllers/chatController');
const {
  listMessages,
  sendMessage,
  sendAttachmentMessage,
  downloadAttachment,
} = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');
const { uploadAttachment } = require('../middleware/upload');
const {
  validateCreateChat,
  validateRenameChat,
  validateMessage,
  validateAttachmentMessage,
} = require('../middleware/validate');

const router = express.Router();

router.use(requireAuth);

// lista los chats del usuario autenticado, con el ultimo mensaje de cada uno
router.get('/', listChats);
// crea un chat (o grupo, si hay mas de un participante)
router.post('/', validateCreateChat, createChat);
// trae un chat puntual, verificando que el usuario sea participante
router.get('/:chatId', getChat);
// elimina un chat entero (participantes y mensajes en cascada)
router.delete('/:chatId', deleteChat);
// cambia el nombre de un grupo (no aplica a chats 1 a 1)
router.patch('/:chatId', validateRenameChat, renameChat);
// historial de mensajes de un chat
router.get('/:chatId/messages', listMessages);
// manda un mensaje de solo texto
router.post('/:chatId/messages', validateMessage, sendMessage);
// manda un mensaje con un archivo adjunto (imagen o documento)
router.post(
  '/:chatId/messages/attachment',
  uploadAttachment.single('file'),
  validateAttachmentMessage,
  sendAttachmentMessage
);
// descarga/muestra el archivo adjunto de un mensaje, solo si eres participante del chat
router.get('/:chatId/messages/:messageId/attachment', downloadAttachment);

module.exports = router;
