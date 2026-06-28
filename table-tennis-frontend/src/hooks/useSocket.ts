import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

export const useSocket = (tournamentId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (tournamentId) {
        socketInstance.emit('joinTournament', tournamentId);
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      if (tournamentId) {
        socketInstance.emit('leaveTournament', tournamentId);
      }
      socketInstance.disconnect();
    };
  }, [tournamentId]);

  return { socket, isConnected };
};
