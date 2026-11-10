'use client';

import { useSocket } from '../context/SocketContext';

export default function ConnectionBanner() {
  const { connected, reconnecting } = useSocket();

  if (connected) return null;

  return (
    <div className="animate-slide-down bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white">
      {reconnecting ? 'Reconectando...' : 'Sin conexion. Intentando reconectar...'}
    </div>
  );
}
