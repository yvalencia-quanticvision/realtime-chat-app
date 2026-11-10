// composition root: este es el unico archivo que conecta los services con el
// cliente real de prisma, todo lo demas lo recibe como parametro
const prisma = require('../config/prisma');

const createAuthService = require('./authService');
const createUserService = require('./userService');
const createChatService = require('./chatService');
const createMessageService = require('./messageService');

const chatService = createChatService(prisma);

module.exports = {
  authService: createAuthService(prisma),
  userService: createUserService(prisma),
  chatService,
  messageService: createMessageService(prisma, chatService),
};
