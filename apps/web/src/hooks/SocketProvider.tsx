import { createContext, useContext, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

const SocketContext = createContext<Socket | null>(null);
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const socket = useMemo(() => {
    if (!user) return null;
    const url = import.meta.env.VITE_WS_URL || window.location.origin;
    return io(url, {
      auth: { token: localStorage.getItem('accessToken') },
      transports: ['websocket', 'polling'],
    });
  }, [user?.id]);

  useEffect(() => {
    if (!socket) return;
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ['work-items'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('work.updated', invalidate);
    socket.on('work.statusChanged', invalidate);
    socket.on('task.updated', invalidate);
    socket.on('document.uploaded', invalidate);
    socket.on('comment.created', invalidate);
    socket.on('notification.created', () => qc.invalidateQueries({ queryKey: ['notifications'] }));
    return () => {
      socket.removeAllListeners();
      socket.close();
    };
  }, [socket, qc]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
