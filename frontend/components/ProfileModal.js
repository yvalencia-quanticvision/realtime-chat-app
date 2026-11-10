'use client';

import Avatar from './Avatar';

export default function ProfileModal({ chat, currentUserId, onClose }) {
  const others = chat.participants.filter((p) => p.id !== currentUserId);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm animate-fade-in rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {others.map((person) => (
            <div key={person.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
              <Avatar name={person.name} />
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{person.name}</p>
                <p className="truncate text-sm text-gray-500">{person.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
