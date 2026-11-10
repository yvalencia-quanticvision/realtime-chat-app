// centralizado para que los controllers solo lancen el error o llamen a next(err)
function notFound(req, res, next) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 'P2002') {
    // restriccion unique de prisma
    return res.status(409).json({ error: 'El registro ya existe' });
  }

  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo supera el tamano maximo permitido (10MB)'
        : 'No se pudo procesar el archivo';
    return res.status(400).json({ error: message });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Error interno del servidor' : err.message;
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
