'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import Avatar from './Avatar';
import { ListSkeleton } from './Skeleton';
import Spinner from './Spinner';

export default function NewChatModal({ onClose, onCreated }) {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isGroup = selected.length > 1;

  useEffect(() => {
    api
      .listUsers(token)
      .then((data) => setUsers(data.users))
      .catch(() => setError('No se pudieron cargar los usuarios'))
      .finally(() => setLoadingUsers(false));
  }, [token]);

  function toggle(userId) {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleCreate() {
    if (selected.length === 0 || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await api.createChat(token, selected, isGroup ? groupName.trim() : undefined);
      onCreated(data.chat);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear el chat');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-stone-900">{isGroup ? 'Nuevo grupo' : 'Nuevo chat'}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
            &times;
          </button>
        </div>

        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {isGroup && (
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Nombre del grupo (opcional)"
            maxLength={80}
            className="mb-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 transition-shadow focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        )}

        <div className="max-h-64 overflow-y-auto rounded-xl border border-stone-200">
          {loadingUsers ? (
            <ListSkeleton rows={3} />
          ) : users.length === 0 ? (
            <p className="p-3 text-sm text-stone-500">No hay otros usuarios registrados todavia.</p>
          ) : (
            users.map((u) => (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-3 border-b border-stone-100 px-3 py-2.5 last:border-0 hover:bg-stone-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(u.id)}
                  onChange={() => toggle(u.id)}
                  className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                <Avatar name={u.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-900">{u.name}</p>
                  <p className="truncate text-xs text-stone-500">{u.email}</p>
                </div>
              </label>
            ))
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={selected.length === 0 || submitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {submitting && <Spinner size="sm" />}
          {submitting ? 'Creando...' : isGroup ? 'Crear grupo' : 'Crear chat'}
        </button>
      </div>
    </div>
  );
}
