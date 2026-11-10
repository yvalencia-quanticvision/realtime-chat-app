const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LEN = 80;
const MAX_EMAIL_LEN = 254;
// bcrypt ignora en silencio cualquier byte despues del 72, asi que no tiene sentido aceptar mas
const MAX_PASSWORD_LEN = 72;
const MAX_PARTICIPANTS = 50;
const MAX_CONTENT_LEN = 4000;

function validateRegister(req, res, next) {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim() || name.trim().length > MAX_NAME_LEN) {
    errors.push(`El nombre es obligatorio y debe tener menos de ${MAX_NAME_LEN} caracteres`);
  }
  if (
    !email ||
    typeof email !== 'string' ||
    email.trim().length > MAX_EMAIL_LEN ||
    !EMAIL_RE.test(email.trim())
  ) {
    errors.push('El email no es valido');
  }
  if (
    !password ||
    typeof password !== 'string' ||
    password.length < 6 ||
    password.length > MAX_PASSWORD_LEN
  ) {
    errors.push(`La contrasena debe tener entre 6 y ${MAX_PASSWORD_LEN} caracteres`);
  }

  if (errors.length) {
    return res.status(400).json({ error: errors.join('. ') });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    errors.push('El email no es valido');
  }
  if (!password || typeof password !== 'string' || password.length > MAX_PASSWORD_LEN) {
    errors.push('La contrasena es obligatoria');
  }

  if (errors.length) {
    return res.status(400).json({ error: errors.join('. ') });
  }

  next();
}

function validateCreateChat(req, res, next) {
  const { participantIds } = req.body || {};

  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    return res.status(400).json({ error: 'Debes seleccionar al menos un participante' });
  }
  if (participantIds.length > MAX_PARTICIPANTS) {
    return res.status(400).json({ error: 'Demasiados participantes para un solo chat' });
  }
  if (!participantIds.every((id) => typeof id === 'string' && id.trim() && id.length <= 100)) {
    return res.status(400).json({ error: 'Lista de participantes invalida' });
  }

  next();
}

function validateRenameChat(req, res, next) {
  const { name } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim() || name.trim().length > MAX_NAME_LEN) {
    return res
      .status(400)
      .json({ error: `El nombre es obligatorio y debe tener menos de ${MAX_NAME_LEN} caracteres` });
  }

  next();
}

function validateMessage(req, res, next) {
  const { content } = req.body || {};

  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacio' });
  }
  if (content.length > MAX_CONTENT_LEN) {
    return res.status(400).json({ error: 'El mensaje es demasiado largo' });
  }

  next();
}

function validateAttachmentMessage(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'Debes adjuntar un archivo' });
  }

  const { content } = req.body || {};
  if (content !== undefined && typeof content === 'string' && content.length > MAX_CONTENT_LEN) {
    return res.status(400).json({ error: 'El mensaje es demasiado largo' });
  }

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateChat,
  validateRenameChat,
  validateMessage,
  validateAttachmentMessage,
};
