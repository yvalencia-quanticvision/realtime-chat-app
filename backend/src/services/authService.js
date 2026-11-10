const bcrypt = require('bcryptjs');
const { signToken } = require('../config/jwt');
const { ApiError } = require('../lib/errors');

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

// prisma se recibe por parametro en vez de requerirse a nivel de modulo, asi
// es intercambiable (pruebas, otro cliente) sin tocar la logica de negocio de abajo
function createAuthService(prisma) {
  async function register({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ApiError('Ese email ya esta registrado', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name: name.trim(), email: normalizedEmail, passwordHash },
    });

    return { token: signToken({ sub: user.id, email: user.email }), user: toPublicUser(user) };
  }

  async function login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // mismo mensaje para "usuario no existe" y "contrasena incorrecta" a
    // proposito, para que el error nunca revele si un email esta registrado
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new ApiError('Credenciales invalidas', 401);
    }

    return { token: signToken({ sub: user.id, email: user.email }), user: toPublicUser(user) };
  }

  async function getById(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? toPublicUser(user) : null;
  }

  return { register, login, getById };
}

module.exports = createAuthService;
