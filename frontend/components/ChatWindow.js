'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api, ApiError } from '../lib/api';
import Avatar from './Avatar';
import EmojiPicker from './EmojiPicker';
import MessageBubble from './MessageBubble';
import { MessagesSkeleton } from './Skeleton';
import Spinner from './Spinner';

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

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChatWindow({ chat }) {
  const { user, token } = useAuth();
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const draftInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api
      .listMessages(token, chat.id)
      .then((data) => {
        if (!cancelled) setMessages(data.messages);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar los mensajes');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chat.id, token]);

  useEffect(() => {
    if (!socket) return undefined;

    function handleNew(message) {
      if (message.chatId === chat.id) {
        setMessages((prev) => [...prev, message]);
      }
    }

    // socket.io se reconecta solo, pero los mensajes mandados mientras
    // estabamos desconectados simplemente faltarian, asi que se vuelve a pedir el historial completo
    function handleReconnect() {
      api.listMessages(token, chat.id).then((data) => setMessages(data.messages));
    }

    socket.on('message:new', handleNew);
    socket.on('connect', handleReconnect);
    return () => {
      socket.off('message:new', handleNew);
      socket.off('connect', handleReconnect);
    };
  }, [socket, chat.id, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // preview local del archivo que se va a subir, no la url autenticada de
  // descarga (el mensaje todavia no existe en el servidor)
  useEffect(() => {
    if (!pendingFile || !pendingFile.type.startsWith('image/')) {
      setFilePreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(pendingFile);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  function clearPendingFile() {
    setPendingFile(null);
  }

  // desactivar el input mientras se envia le quita el foco al navegador; al
  // reactivarse no se lo devuelve solo, hay que pedirlo de nuevo despues de
  // que el DOM ya lo habilito
  function focusDraftInput() {
    requestAnimationFrame(() => draftInputRef.current?.focus());
  }

  // inserta en la posicion del cursor en vez de siempre al final, para que
  // se comporte como un teclado de emojis nativo
  function handleEmojiSelect(emoji) {
    const input = draftInputRef.current;
    const start = input?.selectionStart ?? draft.length;
    const end = input?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    setDraft(next);
    setShowEmoji(false);
    requestAnimationFrame(() => {
      input?.focus();
      const caret = start + emoji.length;
      input?.setSelectionRange(caret, caret);
    });
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // so picking the same file again still fires onChange
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('El archivo supera el tamano maximo permitido (10MB)');
      return;
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setError('Tipo de archivo no permitido');
      return;
    }

    setError('');
    setPendingFile(file);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (sending) return;

    if (pendingFile) {
      return handleSendAttachment();
    }

    const content = draft.trim();
    if (!content) return;

    setSending(true);
    setError('');

    if (socket && connected) {
      socket.emit('message:send', { chatId: chat.id, content }, (ack) => {
        setSending(false);
        if (ack?.error) {
          setError(ack.error);
        } else {
          setDraft('');
        }
        focusDraftInput();
      });
      return;
    }

    // si el socket esta caido, cae a REST para que el usuario no quede bloqueado
    try {
      const data = await api.sendMessage(token, chat.id, content);
      setMessages((prev) => [...prev, data.message]);
      setDraft('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
      focusDraftInput();
    }
  }

  async function handleSendAttachment() {
    const content = draft.trim();
    setSending(true);
    setError('');

    try {
      const data = await api.sendAttachment(token, chat.id, { content, file: pendingFile });
      // si nuestro propio socket esta en la sala tambien le va a llegar por
      // message:new; solo lo agregamos nosotros mismos cuando eso no vaya a
      // pasar, la misma regla que usa el fallback de REST de arriba para mensajes de texto
      if (!(socket && connected)) {
        setMessages((prev) => [...prev, data.message]);
      }
      setDraft('');
      clearPendingFile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar el archivo');
    } finally {
      setSending(false);
      focusDraftInput();
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 bg-brand-600 px-5 py-3">
        <Avatar name={chat.name} size="sm" isGroup={chat.isGroup} />
        <h2 className="text-sm font-semibold text-white">{chat.name}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <MessagesSkeleton />
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} isOwn={m.senderId === user.id} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && <p className="px-5 pt-2 text-sm text-red-600">{error}</p>}

      {pendingFile && (
        <div className="flex items-center gap-3 border-t border-stone-200 bg-stone-50 px-5 py-2.5">
          {filePreviewUrl ? (
            <img src={filePreviewUrl} alt={pendingFile.name} className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <span className="text-2xl">📄</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-900">{pendingFile.name}</p>
            <p className="text-xs text-stone-500">
              {sending ? 'Subiendo...' : formatFileSize(pendingFile.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={clearPendingFile}
            disabled={sending}
            className="text-sm text-stone-400 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="relative flex gap-2 border-t border-stone-200 bg-white p-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          aria-label="Adjuntar archivo"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-stone-300 text-stone-500 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32a1.5 1.5 0 01-2.122-2.122l7.693-7.693"
            />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept={Array.from(ALLOWED_MIME_TYPES).join(',')}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => setShowEmoji((prev) => !prev)}
          disabled={sending}
          aria-label="Insertar emoji"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-stone-300 text-lg transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          😊
        </button>
        {showEmoji && (
          <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
        )}
        <input
          ref={draftInputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={sending}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-900 transition-shadow focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:bg-stone-100"
        />
        <button
          type="submit"
          disabled={sending || (!draft.trim() && !pendingFile)}
          className="flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {sending && <Spinner size="sm" />}
          {sending && pendingFile ? 'Subiendo...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
