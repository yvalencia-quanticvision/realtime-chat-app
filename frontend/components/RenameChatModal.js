'use client';

import { useState } from 'react';
import Spinner from './Spinner';

export default function RenameChatModal({ chat, onConfirm, onCancel }) {
  const [name, setName] = useState(chat.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setError('');
    try {
      await onConfirm(trimmed);
    } catch (err) {
      setError(err.message || 'No se pudo renombrar el grupo');
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm animate-fade-in rounded-xl bg-white p-5 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Editar nombre del grupo</h2>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          maxLength={80}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
        />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {pending && <Spinner size="sm" />}
            {pending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
