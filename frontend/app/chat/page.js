'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import ConnectionBanner from '../../components/ConnectionBanner';
import ChatList from '../../components/ChatList';
import ChatWindow from '../../components/ChatWindow';
import NewChatModal from '../../components/NewChatModal';
import Avatar from '../../components/Avatar';
import ConfirmDialog from '../../components/ConfirmDialog';
import ProfileModal from '../../components/ProfileModal';
import RenameChatModal from '../../components/RenameChatModal';
import { api, ApiError } from '../../lib/api';

const ACTIVE_CHAT_KEY = 'chat_active_id';

function ChatPageContent() {
  const { user, token, logout } = useAuth();
  const { socket } = useSocket();
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [profileChat, setProfileChat] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [renameTarget, setRenameTarget] = useState(null);

  // un recargo de pagina borra el estado de react, asi que el chat activo se
  // guarda aparte y se restaura aqui, solo si ese chat sigue existiendo
  useEffect(() => {
    api
      .listChats(token)
      .then((data) => {
        setChats(data.chats);
        const stored = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_CHAT_KEY) : null;
        if (stored && data.chats.some((c) => c.id === stored)) {
          setActiveChatId(stored);
        }
      })
      .finally(() => setLoadingChats(false));
  }, [token]);

  // guarda la seleccion apenas ocurre, en vez de con un efecto reactivo sobre
  // activeChatId: ese efecto correria tambien en el montaje inicial (con el
  // valor vacio de arranque) y borraria lo guardado antes de que el bloque de
  // arriba alcanzara a leerlo
  function selectChat(chatId) {
    setActiveChatId(chatId);
    if (typeof window === 'undefined') return;
    if (chatId) {
      localStorage.setItem(ACTIVE_CHAT_KEY, chatId);
    } else {
      localStorage.removeItem(ACTIVE_CHAT_KEY);
    }
  }

  // una conexion caida puede significar que se creo un chat o llego un
  // mensaje en otro lado mientras estabamos desconectados, asi que se
  // resincroniza la lista al reconectar
  useEffect(() => {
    if (!socket) return undefined;
    function handleReconnect() {
      api.listChats(token).then((data) => setChats(data.chats));
    }
    socket.on('connect', handleReconnect);
    return () => socket.off('connect', handleReconnect);
  }, [socket, token]);

  // alguien mas puede iniciar un chat con nosotros mientras ya estamos
  // conectados; el servidor lo empuja aqui en vez de esperar a que reconectemos
  useEffect(() => {
    if (!socket) return undefined;
    function handleNewChat(chat) {
      setChats((prev) => {
        const exists = prev.some((c) => c.id === chat.id);
        return exists ? prev : [chat, ...prev];
      });
      socket.emit('chat:join', chat.id);
    }
    socket.on('chat:new', handleNewChat);
    return () => socket.off('chat:new', handleNewChat);
  }, [socket]);

  // ChatWindow solo escucha message:new mientras su chat es el activo, asi
  // que sin esto el preview (y el orden) de un chat que el usuario no ha
  // abierto nunca se actualiza cuando le llega un mensaje
  useEffect(() => {
    if (!socket) return undefined;
    function handleMessage(message) {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.id === message.chatId);
        if (idx === -1) return prev;
        const updated = { ...prev[idx], lastMessage: message };
        return [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      });
    }
    socket.on('message:new', handleMessage);
    return () => socket.off('message:new', handleMessage);
  }, [socket]);

  // un chat puede ser eliminado por otro participante, o desde otro de
  // nuestros propios dispositivos, asi que se reacciona en vivo y no solo con nuestro propio clic
  useEffect(() => {
    if (!socket) return undefined;
    function handleDeleted({ chatId }) {
      removeChat(chatId);
    }
    socket.on('chat:deleted', handleDeleted);
    return () => socket.off('chat:deleted', handleDeleted);
  }, [socket]);

  // el nombre de un grupo lo puede cambiar cualquier participante, asi que
  // se refleja en vivo para todos, no solo para quien le dio "guardar"
  useEffect(() => {
    if (!socket) return undefined;
    function handleUpdated({ chatId, name }) {
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, name } : c)));
    }
    socket.on('chat:updated', handleUpdated);
    return () => socket.off('chat:updated', handleUpdated);
  }, [socket]);

  function removeChat(chatId) {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setActiveChatId((prev) => {
      if (prev !== chatId) return prev;
      if (typeof window !== 'undefined') localStorage.removeItem(ACTIVE_CHAT_KEY);
      return null;
    });
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.deleteChat(token, deleteTarget.id);
      removeChat(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'No se pudo eliminar el chat');
    } finally {
      setDeleting(false);
    }
  }

  async function handleConfirmRename(name) {
    const data = await api.renameChat(token, renameTarget.id, name);
    setChats((prev) => prev.map((c) => (c.id === data.chat.id ? { ...c, name: data.chat.name } : c)));
    setRenameTarget(null);
  }

  function handleCreated(chat) {
    setChats((prev) => {
      const exists = prev.some((c) => c.id === chat.id);
      return exists ? prev : [chat, ...prev];
    });
    selectChat(chat.id);
    setShowNewChat(false);
  }

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="flex h-screen flex-col">
      <ConnectionBanner />

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 flex-shrink-0 flex-col border-r border-stone-200 bg-white">
          <div className="flex items-center justify-between bg-brand-600 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={user.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="truncate text-xs text-brand-100">{user.email}</p>
              </div>
            </div>
            <button onClick={logout} className="rounded-md px-2 py-1 text-sm text-brand-100 transition-colors hover:bg-white/10 hover:text-white">
              Salir
            </button>
          </div>

          <div className="p-3">
            <button
              onClick={() => setShowNewChat(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
              </svg>
              Nuevo chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ChatList
              chats={chats}
              loading={loadingChats}
              activeChatId={activeChatId}
              onSelect={selectChat}
              onViewProfile={setProfileChat}
              onDeleteRequest={(chat) => {
                setDeleteError('');
                setDeleteTarget(chat);
              }}
              onRenameRequest={setRenameTarget}
            />
          </div>
        </aside>

        <main className="flex-1 bg-stone-50 transition-opacity duration-150">
          {activeChat ? (
            <ChatWindow key={activeChat.id} chat={activeChat} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-stone-400">
              Selecciona una conversacion o crea una nueva
            </div>
          )}
        </main>
      </div>

      {showNewChat && (
        <NewChatModal onClose={() => setShowNewChat(false)} onCreated={handleCreated} />
      )}

      {profileChat && (
        <ProfileModal
          chat={profileChat}
          currentUserId={user.id}
          onClose={() => setProfileChat(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar chat"
          message={
            deleteError ||
            'Se eliminara la conversacion y todos sus mensajes para todos los participantes. Esta accion no se puede deshacer.'
          }
          confirmLabel="Eliminar"
          pending={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {renameTarget && (
        <RenameChatModal
          chat={renameTarget}
          onConfirm={handleConfirmRename}
          onCancel={() => setRenameTarget(null)}
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}
