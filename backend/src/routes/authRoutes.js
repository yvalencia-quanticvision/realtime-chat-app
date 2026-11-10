const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, me } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// login/register son las unicas rutas sin autenticacion, por eso son el
// blanco obvio de fuerza bruta / relleno de credenciales
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, intenta de nuevo mas tarde' },
});

// crea un usuario nuevo (nombre, email, password) y devuelve su token
router.post('/register', authLimiter, validateRegister, register);
// valida credenciales y devuelve un token nuevo
router.post('/login', authLimiter, validateLogin, login);
// datos del usuario autenticado (para restaurar la sesion al recargar)
router.get('/me', requireAuth, me);

module.exports = router;
