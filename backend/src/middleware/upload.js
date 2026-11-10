const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const { ApiError } = require('../lib/errors');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  // nunca confiar en el nombre de archivo que manda el cliente para el nombre
  // en disco (riesgo de path traversal); el nombre original solo se guarda
  // como metadata en la base de datos
  filename: (req, file, cb) => cb(null, crypto.randomUUID()),
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new ApiError('Tipo de archivo no permitido', 400));
  }
  cb(null, true);
}

const uploadAttachment = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = { uploadAttachment, UPLOAD_DIR, MAX_FILE_SIZE, ALLOWED_MIME_TYPES };
