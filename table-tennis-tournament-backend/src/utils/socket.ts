import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust this for production
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Allow clients to join specific tournament rooms
    socket.on('joinTournament', (tournamentId: string) => {
      socket.join(`tournament_${tournamentId}`);
      console.log(`Socket ${socket.id} joined room tournament_${tournamentId}`);
    });

    socket.on('leaveTournament', (tournamentId: string) => {
      socket.leave(`tournament_${tournamentId}`);
      console.log(`Socket ${socket.id} left room tournament_${tournamentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
