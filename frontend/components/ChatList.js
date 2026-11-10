'use client';

import { useState } from 'react';
import Avatar from './Avatar';
import { ListSkeleton } from './Skeleton';

export default function ChatList({
  chats,
  loading,
  activeChatId,
  onSelect,
  onViewProfile,
  onDeleteRequest,
  onRenameRequest,
}) {
  const [openMenu, setOpenMenu] = useState(null);

  if (loading) {
    return <ListSkeleton />;
  }

  if (chats.length === 0) {
    return (
      <p className="p-4 text-sm text-gray-500">
        Todavia no tienes conversaciones. Crea una con el boton de arriba.
      </p>
    );
  }

  // posicionado fijo respecto a la pantalla (calculado desde el boton donde
  // se hizo clic) para que un contenedor con scroll como esta lista no recorte el menu
  function toggleMenu(e, chat) {
    e.stopPropagation();
    if (openMenu?.chatId === chat.id) {
      setOpenMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setOpenMenu({
      chatId: chat.id,
      chat,
      top: rect.bottom + 4,
      left: rect.right - 160,
    });
  }

  function handleAction(e, chat, action) {
    e.stopPropagation();
    setOpenMenu(null);
    action(chat);
  }

  return (
    <>
      <ul className="divide-y divide-gray-100 overflow-y-auto">
        {chats.map((chat) => (
        <li key={chat.id}>
          <button
            onClick={() => onSelect(chat.id)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
              chat.id === activeChatId ? 'bg-blue-50' : ''
            }`}
          >
            <Avatar name={chat.name} isGroup={chat.isGroup} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{chat.name}</p>
              <p className="truncate text-sm text-gray-500">
                {chat.lastMessage
                  ? chat.lastMessage.content ||
                    (chat.lastMessage.attachment ? `📎 ${chat.lastMessage.attachment.filename}` : '')
                  : 'Sin mensajes todavia'}
              </p>
            </div>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => toggleMenu(e, chat)}
              className="rounded-full px-2 py-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
            >
              &#8942;
            </span>
          </button>
        </li>
        ))}
      </ul>

      {openMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
          <div
            style={{ position: 'fixed', top: openMenu.top, left: openMenu.left }}
            className="z-20 w-40 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg"
          >
            <button
              onClick={(e) => handleAction(e, openMenu.chat, onViewProfile)}
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Ver perfil
            </button>
            {openMenu.chat.isGroup && (
              <button
                onClick={(e) => handleAction(e, openMenu.chat, onRenameRequest)}
                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Editar nombre
              </button>
            )}
            <button
              onClick={(e) => handleAction(e, openMenu.chat, onDeleteRequest)}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Eliminar chat
            </button>
          </div>
        </>
      )}
    </>
  );
}
