import prisma from '../config/database';

export class SearchService {
  // Search tournaments
  async searchTournaments(query: string, status?: string) {
    const whereClause: any = {
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
        { venue: { contains: query } },
      ],
    };

    if (status) {
      whereClause.status = status;
    }

    const tournaments = await prisma.tournament.findMany({
      where: whereClause,
      include: {
        categories: true,
        _count: {
          select: { registrations: true, matches: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return tournaments;
  }

  // Search players
  async searchPlayers(query: string) {
    const players = await prisma.user.findMany({
      where: {
        role: 'PLAYER',
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { email: { contains: query } },
        ],
      },
      include: {
        playerProfile: true,
      },
    });

    return players;
  }

  // Search matches
  async searchMatches(tournamentId?: string, playerId?: string, status?: string) {
    const whereClause: any = {};

    if (tournamentId) {
      whereClause.tournamentId = tournamentId;
    }

    if (playerId) {
      whereClause.OR = [
        { player1Id: playerId },
        { player2Id: playerId },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        tournament: { select: { name: true } },
        player1: { select: { firstName: true, lastName: true } },
        player2: { select: { firstName: true, lastName: true } },
        category: { select: { name: true } },
      },
      orderBy: { scheduledTime: 'desc' },
    });

    return matches;
  }
}