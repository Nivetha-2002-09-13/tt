import prisma from '../config/database';
import { AppError } from '../utils/AppError';

// ── Shared type so knockout + group matches can live in the same array ─────────
interface NormalizedMatch {
  id: string;
  round: string;
  matchNumber: number;
  scheduledTime: Date;
  status: string;
  score: string | null;
  winnerId: string | null;
  player1: { id: string; firstName: string; lastName: string } | null;
  player2: { id: string; firstName: string; lastName: string } | null;
  tournament: { id: string; name: string; venue: string };
  category: { name: string; type: string };
}

export class MatchService {
  // Create match (Admin only)
  async createMatch(adminId: string, data: {
    tournamentId: string;
    categoryId: string;
    matchType: 'SINGLES' | 'DOUBLES' | 'TEAM';
    player1Id?: string;
    player2Id?: string;
    team1Id?: string;
    team2Id?: string;
    refereeId?: string;
    round: string;
    matchNumber: number;
    scheduledTime: Date;
  }) {
    const admin = await prisma.adminProfile.findUnique({ where: { userId: adminId } });
    if (!admin) throw new AppError('Only admins can create matches', 403);

    const tournament = await prisma.tournament.findUnique({ where: { id: data.tournamentId } });
    if (!tournament) throw new AppError('Tournament not found', 404);

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new AppError('Category not found', 404);

    if (data.matchType !== 'TEAM') {
      if (data.player1Id) {
        const player1 = await prisma.user.findFirst({ where: { id: data.player1Id, role: 'PLAYER' } });
        if (!player1) throw new AppError('Player 1 not found', 404);
      }
      if (data.player2Id) {
        const player2 = await prisma.user.findFirst({ where: { id: data.player2Id, role: 'PLAYER' } });
        if (!player2) throw new AppError('Player 2 not found', 404);
      }
    }

    if (data.matchType === 'TEAM') {
      if (data.team1Id) {
        const team1 = await prisma.team.findUnique({ where: { id: data.team1Id } });
        if (!team1) throw new AppError('Team 1 not found', 404);
      }
      if (data.team2Id) {
        const team2 = await prisma.team.findUnique({ where: { id: data.team2Id } });
        if (!team2) throw new AppError('Team 2 not found', 404);
      }
    }

    if (data.refereeId) {
      const referee = await prisma.refereeProfile.findUnique({ where: { id: data.refereeId } });
      if (!referee) throw new AppError('Referee not found', 404);
    }

    const match = await prisma.match.create({
      data,
      include: {
        player1: { select: { firstName: true, lastName: true } },
        player2: { select: { firstName: true, lastName: true } },
        team1: { select: { name: true } },
        team2: { select: { name: true } },
        referee: { include: { user: { select: { firstName: true, lastName: true } } } },
        tournament: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    return match;
  }

  // Get player performance stats
  async getPlayerPerformanceStats(playerId: string) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
        status: 'COMPLETED',
      },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true } },
        player2: { select: { id: true, firstName: true, lastName: true } },
        tournament: { select: { id: true, name: true } },
        category: { select: { name: true } },
        games: true,
      },
      orderBy: { endTime: 'desc' },
    });

    const groupMatches = await prisma.groupMatch.findMany({
    where: {
      OR: [{ player1Id: playerId }, { player2Id: playerId }],
      status: 'COMPLETED',
    },
  }) as any[];

    let wins = 0;
    let losses = 0;
    let totalGamesWon = 0;
    let totalGamesLost = 0;
    let totalPointsScored = 0;
    let totalPointsConceded = 0;

    for (const match of matches) {
      if (match.winnerId === playerId) {
        wins++;
      } else {
        losses++;
      }

      for (const game of match.games) {
        const isPlayer1 = match.player1Id === playerId;
        const playerScore = isPlayer1 ? game.player1Score : game.player2Score;
        const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;

        totalPointsScored += playerScore;
        totalPointsConceded += opponentScore;

        if (playerScore > opponentScore) {
          totalGamesWon++;
        } else {
          totalGamesLost++;
        }
      }
    }
    for (const gm of groupMatches){
      if(gm.winnerId === playerId){
        wins++;
      }
      else{
        losses++;
      }
      const isPlayer1 = gm.player1Id === playerId;
      for (let i = 1; i<= 5; i++){
        const Player1Score = gm[`game${i}player1`];
        const Player2Score = gm[`game${i}player2`];
        if(Player1Score === null || Player2Score === null) continue;
        const playerScore = isPlayer1 ? Player1Score : Player2Score;
        const opponentScore = isPlayer1 ? Player2Score : Player1Score;
        totalPointsScored += playerScore;
        totalPointsConceded += opponentScore;
        if(playerScore > opponentScore){
          totalGamesWon++;
        }
        else{
          totalGamesLost++;
        }
      }
    }

    const totalMatches = matches.length + groupMatches.length;
    const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0';
    const averagePointsPerGame =
      totalGamesWon + totalGamesLost > 0
        ? (totalPointsScored / (totalGamesWon + totalGamesLost)).toFixed(1)
        : '0';

    const recentMatches = matches.slice(0, 5).map(match => ({
      id: match.id,
      tournamentName: match.tournament.name,
      categoryName: match.category.name,
      opponent:
        match.player1Id === playerId
          ? `${match.player2?.firstName ?? ''} ${match.player2?.lastName ?? ''}`
          : `${match.player1?.firstName ?? ''} ${match.player1?.lastName ?? ''}`,
      result: match.winnerId === playerId ? 'Win' : 'Loss',
      score: match.score ?? null,
      date: match.endTime,
    }));

    return {
      totalMatches,
      wins,
      losses,
      winRate: `${winRate}%`,
      gamesStats: {
        won: totalGamesWon,
        lost: totalGamesLost,
        total: totalGamesWon + totalGamesLost,
      },
      pointsStats: {
        scored: totalPointsScored,
        conceded: totalPointsConceded,
        averagePerGame: averagePointsPerGame,
      },
      recentMatches,
      allMatches: matches,
    };
  }

  // Get all matches for a tournament
  async getTournamentMatches(tournamentId: string, status?: string) {
    const whereClause: any = { tournamentId };
    if (status) whereClause.status = status;

    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        player1: { select: { id: true, firstName: true, lastName: true } },
        player2: { select: { id: true, firstName: true, lastName: true } },
        team1: { select: { id: true, name: true } },
        team2: { select: { id: true, name: true } },
        referee: { include: { user: { select: { firstName: true, lastName: true } } } },
        category: { select: { name: true, type: true } },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    return matches;
  }

  // Get matches for a specific player (knockout + group stage combined)
  async getPlayerMatches(playerId: string): Promise<NormalizedMatch[]> {
    // ── Knockout matches ────────────────────────────────────────────────────────
    const knockoutMatches = await prisma.match.findMany({
      where: {
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
      },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true } },
        player2: { select: { id: true, firstName: true, lastName: true } },
        tournament: { select: { id: true, name: true, venue: true } },
        category: { select: { name: true, type: true } },
        referee: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    // ── Group stage matches ─────────────────────────────────────────────────────
    const groupMatches = await prisma.groupMatch.findMany({
  where: {
    OR: [{ player1Id: playerId }, { player2Id: playerId }],
  },
  include: {                                          // ← use include not select
    player1: { select: { id: true, firstName: true, lastName: true } },
    player2: { select: { id: true, firstName: true, lastName: true } },
    group: {
      include: {                                      // ← include inside group too
        tournament: { select: { id: true, name: true, venue: true } },
        category: { select: { name: true, type: true } },
      },
    },
  },
});

    // ── Normalize knockout matches ───────────────────────────────────────────────
    const normalizedKnockout: NormalizedMatch[] = knockoutMatches.map(match => ({
      id: match.id,
      round: match.round,
      matchNumber: match.matchNumber,
      scheduledTime: match.scheduledTime,
      status: match.status,
      score: match.score ?? null,
      winnerId: match.winnerId ?? null,
      player1: match.player1
        ? { id: match.player1.id, firstName: match.player1.firstName, lastName: match.player1.lastName }
        : null,
      player2: match.player2
        ? { id: match.player2.id, firstName: match.player2.firstName, lastName: match.player2.lastName }
        : null,
      tournament: match.tournament ?? { id: '', name: '', venue: '' },
      category: match.category ?? { name: '', type: '' },
    }));

    // ── Normalize group matches ─────────────────────────────────────────────────
   const normalizedGroup: NormalizedMatch[] = groupMatches.map((match: any) => ({
  id: match.id,
  round: `Group Stage - ${match.group?.name ?? ''}`,
  matchNumber: match.round ?? 1,
  scheduledTime: match.scheduledTime,
  status: match.status,
  score:
    match.player1Score !== null && match.player2Score !== null
      ? `${match.player1Score} - ${match.player2Score}`
      : null,
  winnerId: match.winnerId ?? null,
  player1: match.player1
    ? { id: match.player1.id, firstName: match.player1.firstName, lastName: match.player1.lastName }
    : null,
  player2: match.player2
    ? { id: match.player2.id, firstName: match.player2.firstName, lastName: match.player2.lastName }
    : null,
  tournament: match.group?.tournament ?? { id: '', name: '', venue: '' },
  category: match.group?.category ?? { name: '', type: '' },
}));
    // ── Combine and sort descending by date ─────────────────────────────────────
    const allMatches: NormalizedMatch[] = [...normalizedKnockout, ...normalizedGroup];
    allMatches.sort(
      (a, b) =>
        new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime(),
    );

    return allMatches;
  }

  // Get matches for a specific referee
  async getRefereeMatches(refereeUserId: string) {
    const referee = await prisma.refereeProfile.findUnique({
      where: { userId: refereeUserId },
    });
    if (!referee) throw new AppError('Referee profile not found', 404);

    const matches = await prisma.match.findMany({
      where: { refereeId: referee.id },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true } },
        player2: { select: { id: true, firstName: true, lastName: true } },
        team1: { select: { id: true, name: true } },
        team2: { select: { id: true, name: true } },
        tournament: { select: { id: true, name: true, venue: true } },
        category: { select: { name: true, type: true } },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    return matches;
  }

  // Get match by ID
  async getMatchById(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true, email: true } },
        player2: { select: { id: true, firstName: true, lastName: true, email: true } },
        team1: {
          include: {
            members: { include: { player: { select: { firstName: true, lastName: true } } } },
          },
        },
        team2: {
          include: {
            members: { include: { player: { select: { firstName: true, lastName: true } } } },
          },
        },
        referee: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        tournament: true,
        category: true,
        games: { orderBy: { gameNumber: 'asc' } },
      },
    });

    if (!match) throw new AppError('Match not found', 404);
    return match;
  }

  // Update match status (Admin/Referee)
  async updateMatchStatus(
    userId: string,
    userRole: string,
    matchId: string,
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'WALKOVER',
  ) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { referee: true },
    });
    if (!match) throw new AppError('Match not found', 404);

    if (userRole === 'REFEREE' && match.referee?.userId !== userId) {
      throw new AppError('You can only update matches assigned to you', 403);
    } else if (userRole !== 'ADMIN' && userRole !== 'REFEREE') {
      throw new AppError('Only admins and referees can update match status', 403);
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status,
        startTime: status === 'ONGOING' ? new Date() : undefined,
        endTime: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    return updatedMatch;
  }

  // Assign referee to match (Admin only)
  async assignReferee(adminId: string, matchId: string, refereeUserId: string) {
    const admin = await prisma.adminProfile.findUnique({ where: { userId: adminId } });
    if (!admin) throw new AppError('Only admins can assign referees', 403);

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new AppError('Match not found', 404);

    const referee = await prisma.refereeProfile.findUnique({ where: { userId: refereeUserId } });
    if (!referee) throw new AppError('Referee not found', 404);

    return await prisma.match.update({
      where: { id: matchId },
      data: { refereeId: referee.id },
    });
  }

  // Record game scores (Admin/Referee)
  async recordGameScores(
    userId: string,
    userRole: string,
    matchId: string,
    games: { gameNumber: number; player1Score: number; player2Score: number }[],
  ) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { referee: true },
    });
    if (!match) throw new AppError('Match not found', 404);

    if (userRole === 'REFEREE' && match.referee?.userId !== userId) {
      throw new AppError('You can only record scores for matches assigned to you', 403);
    } else if (userRole !== 'ADMIN' && userRole !== 'REFEREE') {
      throw new AppError('Only admins and referees can record match scores', 403);
    }

    if (match.status !== 'ONGOING' && match.status !== 'SCHEDULED') {
      throw new AppError('Can only record scores for scheduled or ongoing matches', 400);
    }

    // Null-guard player IDs — required for game winner assignment
    if (!match.player1Id || !match.player2Id) {
      throw new AppError('Match is missing player assignments', 400);
    }

    const player1Id = match.player1Id;
    const player2Id = match.player2Id;

    // Replace existing games
    await prisma.game.deleteMany({ where: { matchId } });

    await Promise.all(
      games.map((game) =>
        prisma.game.create({
          data: {
            matchId,
            gameNumber: game.gameNumber,
            player1Score: game.player1Score,
            player2Score: game.player2Score,
            winnerId: game.player1Score > game.player2Score ? player1Id : player2Id,
          },
        })
      )
    );

    // Determine match winner
    let player1Wins = 0;
    let player2Wins = 0;
    for (const game of games) {
      if (game.player1Score > game.player2Score) player1Wins++;
      else player2Wins++;
    }

    const winnerId = player1Wins > player2Wins ? player1Id : player2Id;
    const scoreString = games.map(g => `${g.player1Score}-${g.player2Score}`).join(', ');

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        score: scoreString,
        status: 'COMPLETED',
        endTime: new Date(),
        resultDetails: JSON.stringify({ games, player1Wins, player2Wins, totalGames: games.length }),
      },
      include: {
        player1: { select: { firstName: true, lastName: true } },
        player2: { select: { firstName: true, lastName: true } },
      },
    });

    // Notify both players
    await Promise.all(
      [
        {
          userId: player1Id,
          type: 'MATCH_RESULT',
          title: 'Match Result Available',
          message: `Your match against ${((updatedMatch as any).player2?.firstName) ?? ''} ${((updatedMatch as any).player2?.lastName) ?? ''} has been completed. Result: ${scoreString}`,
        },
        {
          userId: player2Id,
          type: 'MATCH_RESULT',
          title: 'Match Result Available',
          message: `Your match against ${((updatedMatch as any).player1?.firstName) ?? ''} ${((updatedMatch as any).player1?.lastName) ?? ''} has been completed. Result: ${scoreString}`,
        },
      ].map((n) => prisma.notification.create({ data: n }))
    );

    return updatedMatch;
  }

  // Get match results
  async getMatchResults(matchId: string, userId: string, userRole: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true, email: true } },
        player2: { select: { id: true, firstName: true, lastName: true, email: true } },
        team1: { select: { id: true, name: true } },
        team2: { select: { id: true, name: true } },
        referee: { include: { user: { select: { firstName: true, lastName: true } } } },
        tournament: { select: { name: true } },
        category: { select: { name: true } },
        games: { orderBy: { gameNumber: 'asc' } },
      },
    });

    if (!match) throw new AppError('Match not found', 404);

    const isParticipant = match.player1Id === userId || match.player2Id === userId;
    const isReferee = match.referee?.userId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isParticipant && !isReferee && !isAdmin) {
      throw new AppError('You do not have permission to view this match', 403);
    }

    if (match.status !== 'COMPLETED') {
      // Return without game details if not yet completed
      const { games: _games, ...basicInfo } = match;
      return {
        ...basicInfo,
        message: 'Match is not yet completed. Results will be available after the match.',
      };
    }

    return match;
  }

  // Get player match history
  async getPlayerMatchHistory(playerId: string) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
        status: 'COMPLETED',
      },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true } },
        player2: { select: { id: true, firstName: true, lastName: true } },
        tournament: { select: { name: true } },
        category: { select: { name: true } },
        games: true,
      },
      orderBy: { endTime: 'desc' },
    });

    let wins = 0;
    let losses = 0;
    let totalGamesWon = 0;
    let totalGamesLost = 0;

    for (const match of matches) {
      if (match.winnerId === playerId) {
        wins++;
      } else {
        losses++;
      }

      for (const game of match.games) {
        const isPlayer1 = match.player1Id === playerId;
        const playerScore = isPlayer1 ? game.player1Score : game.player2Score;
        const opponentScore = isPlayer1 ? game.player2Score : game.player1Score;

        if (playerScore > opponentScore) totalGamesWon++;
        else totalGamesLost++;
      }
    }

    return {
      matches,
      statistics: {
        totalMatches: matches.length,
        wins,
        losses,
        winRate: matches.length > 0 ? ((wins / matches.length) * 100).toFixed(2) : '0',
        totalGamesWon,
        totalGamesLost,
      },
    };
  }
}