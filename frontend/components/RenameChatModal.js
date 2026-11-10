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
        className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-stone-900">Editar nombre del grupo</h2>

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          maxLength={80}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 transition-shadow focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:bg-stone-100"
        />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {pending && <Spinner size="sm" />}
            {pending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
