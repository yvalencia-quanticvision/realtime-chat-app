const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  // los cuerpos multipart ponen su propio Content-Type (con el boundary), asi
  // que ese header hay que omitirlo para FormData en vez de forzarlo a json
  const isFormData = body instanceof FormData;
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError('No se pudo contactar al servidor', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    // sin cuerpo, ej. 204
  }

  if (!res.ok) {
    throw new ApiError(data?.error || 'Error inesperado', res.status);
  }

  return data;
}

// la ruta de descarga del adjunto exige autenticacion, asi que un <img src>
// comun no puede pedirla directo; se trae como blob con el token en el
// header en vez de dejarlo filtrarse en la URL como parametro
async function fetchAttachmentBlob(token, url) {
  let res;
  try {
    res = await fetch(`${API_URL}${url}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch (err) {
    throw new ApiError('No se pudo contactar al servidor', 0);
  }

  if (!res.ok) {
    let message = 'No se pudo descargar el archivo';
    try {
      const data = await res.json();
      message = data?.error || message;
    } catch (err) {
      // sin cuerpo json
    }
    throw new ApiError(message, res.status);
  }

  return res.blob();
}

export const api = {
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/api/auth/me', { token }),
  listUsers: (token) => request('/api/users', { token }),
  listChats: (token) => request('/api/chats', { token }),
  createChat: (token, participantIds, name) =>
    request('/api/chats', { method: 'POST', body: { participantIds, name }, token }),
  getChat: (token, chatId) => request(`/api/chats/${chatId}`, { token }),
  deleteChat: (token, chatId) => request(`/api/chats/${chatId}`, { method: 'DELETE', token }),
  renameChat: (token, chatId, name) =>
    request(`/api/chats/${chatId}`, { method: 'PATCH', body: { name }, token }),
  listMessages: (token, chatId) => request(`/api/chats/${chatId}/messages`, { token }),
  sendMessage: (token, chatId, content) =>
    request(`/api/chats/${chatId}/messages`, { method: 'POST', body: { content }, token }),
  sendAttachment: (token, chatId, { content, file }) => {
    const form = new FormData();
    if (content) form.append('content', content);
    form.append('file', file);
    return request(`/api/chats/${chatId}/messages/attachment`, { method: 'POST', body: form, token });
  },
  fetchAttachmentBlob: (token, url) => fetchAttachmentBlob(token, url),
};

export { ApiError };
