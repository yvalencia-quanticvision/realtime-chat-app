'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import Spinner from './Spinner';

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// el endpoint de descarga exige autenticacion, asi que se pide como blob con
// el token en un header y se convierte en una url de objeto, en vez de poner
// el token en la url del <img>/<a> como parametro de consulta
function AttachmentView({ attachment, isOwn }) {
  const { token } = useAuth();
  const [blobUrl, setBlobUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const isImage = attachment.mimeType.startsWith('image/');

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    api
      .fetchAttachmentBlob(token, attachment.url)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.url, token]);

  if (isImage) {
    return (
      <a
        href={blobUrl || undefined}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-lg bg-black/5"
        onClick={(e) => {
          if (!blobUrl) e.preventDefault();
        }}
      >
        {blobUrl ? (
          <img
            src={blobUrl}
            alt={attachment.filename}
            className="max-h-60 w-full max-w-xs object-cover"
          />
        ) : (
          <div className="flex h-32 w-48 items-center justify-center">
            {failed ? (
              <span className="px-2 text-xs text-red-500">No se pudo cargar la imagen</span>
            ) : (
              <Spinner size="sm" />
            )}
          </div>
        )}
      </a>
    );
  }

  return (
    <a
      href={blobUrl || undefined}
      download={attachment.filename}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        if (!blobUrl) e.preventDefault();
      }}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
        isOwn ? 'border-blue-400 bg-blue-500/30' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <span className="text-xl">📄</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{attachment.filename}</p>
        <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
          {failed ? 'No se pudo cargar el archivo' : formatFileSize(attachment.size)}
          {!blobUrl && !failed ? ' · cargando...' : ''}
        </p>
      </div>
    </a>
  );
}

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex animate-fade-in ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
          isOwn ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {!isOwn && (
          <p className="mb-0.5 text-xs font-semibold text-gray-500">{message.sender?.name}</p>
        )}
        {message.attachment && (
          <div className={message.content ? 'mb-2' : ''}>
            <AttachmentView attachment={message.attachment} isOwn={isOwn} />
          </div>
        )}
        {message.content && (
          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
        )}
        <p className={`mt-1 text-right text-[10px] ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
