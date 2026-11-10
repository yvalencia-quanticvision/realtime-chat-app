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
      <div className="w-full max-w-md animate-fade-in rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isGroup ? 'Nuevo grupo' : 'Nuevo chat'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {isGroup && (
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Nombre del grupo (opcional)"
            maxLength={80}
            className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        )}

        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-100">
          {loadingUsers ? (
            <ListSkeleton rows={3} />
          ) : users.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">No hay otros usuarios registrados todavia.</p>
          ) : (
            users.map((u) => (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-3 border-b border-gray-50 px-3 py-2 last:border-0 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(u.id)}
                  onChange={() => toggle(u.id)}
                  className="h-4 w-4"
                />
                <Avatar name={u.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="truncate text-xs text-gray-500">{u.email}</p>
                </div>
              </label>
            ))
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={selected.length === 0 || submitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting && <Spinner size="sm" />}
          {submitting ? 'Creando...' : isGroup ? 'Crear grupo' : 'Crear chat'}
        </button>
      </div>
    </div>
  );
}
