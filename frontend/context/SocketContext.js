'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const instance = io(SOCKET_URL, { auth: { token } });

    instance.on('connect', () => {
      setConnected(true);
      setReconnecting(false);
    });
    instance.on('disconnect', () => setConnected(false));
    instance.on('reconnect_attempt', () => setReconnecting(true));
    instance.on('reconnect', () => setReconnecting(false));
    instance.on('connect_error', () => setConnected(false));

    setSocket(instance);

    return () => {
      instance.close();
      setSocket(null);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected, reconnecting }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return ctx;
}
