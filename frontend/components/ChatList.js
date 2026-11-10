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
  emptyMessage,
}) {
  const [openMenu, setOpenMenu] = useState(null);

  if (loading) {
    return <ListSkeleton />;
  }

  if (chats.length === 0) {
    return (
      <p className="p-4 text-sm text-slate-400">
        {emptyMessage || 'Todavia no tienes conversaciones. Crea una con el boton de arriba.'}
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
      left: rect.right - 176,
    });
  }

  function handleAction(e, chat, action) {
    e.stopPropagation();
    setOpenMenu(null);
    action(chat);
  }

  // separacion real (no decorativa): isGroup viene del backend, no se finge
  const directs = chats.filter((c) => !c.isGroup);
  const groups = chats.filter((c) => c.isGroup);

  function renderRow(chat) {
    return (
      <li key={chat.id} className="relative px-2">
        {chat.id === activeChatId && (
          <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-300" />
        )}
        <button
          onClick={() => onSelect(chat.id)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5 ${
            chat.id === activeChatId ? 'bg-white/10' : ''
          }`}
        >
          <Avatar name={chat.name} isGroup={chat.isGroup} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-100">{chat.name}</p>
            <p className="truncate text-sm text-slate-400">
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
            className="rounded-full px-2 py-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
          >
            &#8942;
          </span>
        </button>
      </li>
    );
  }

  return (
    <>
      <ul className="overflow-y-auto py-1">
        {directs.length > 0 && (
          <p className="px-4 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Directos
          </p>
        )}
        {directs.map(renderRow)}

        {groups.length > 0 && (
          <p className="px-4 pb-1 pt-3 font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Grupos
          </p>
        )}
        {groups.map(renderRow)}
      </ul>

      {openMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
          <div
            style={{ position: 'fixed', top: openMenu.top, left: openMenu.left }}
            className="z-20 w-44 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg shadow-stone-900/10"
          >
            <button
              onClick={(e) => handleAction(e, openMenu.chat, onViewProfile)}
              className="block w-full px-3.5 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
            >
              Ver perfil
            </button>
            {openMenu.chat.isGroup && (
              <button
                onClick={(e) => handleAction(e, openMenu.chat, onRenameRequest)}
                className="block w-full px-3.5 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
              >
                Editar nombre
              </button>
            )}
            <button
              onClick={(e) => handleAction(e, openMenu.chat, onDeleteRequest)}
              className="block w-full px-3.5 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Eliminar chat
            </button>
          </div>
        </>
      )}
    </>
  );
}
