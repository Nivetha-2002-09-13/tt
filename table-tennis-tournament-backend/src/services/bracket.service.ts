import prisma from '../config/database';
import { AppError } from '../utils/AppError';

interface SeededPlayer {
  id: string;
  firstName: string;
  lastName: string;
  seed: number;
  skillScore: number;
}

export class BracketService {

  async generateBracket(adminId: string, tournamentId: string, categoryId: string) {
    const admin = await prisma.adminProfile.findUnique({ where: { userId: adminId } });
    if (!admin) throw new AppError('Only admins can generate brackets', 403);

    // ── Fetch category with registrations (cast to any to avoid Prisma type issues) ──
    const category = await (prisma.category.findUnique as any)({
      where: { id: categoryId },
      include: {
        registrations: {
          where: { status: 'APPROVED' },
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                playerProfile: {
                  select: {
                    skillLevel: true,
                    ranking: true,
                    // ranking will be included after migration runs
                  },
                },
              },
            },
          },
        },
      },
    }) as any;

    if (!category) throw new AppError('Category not found', 404);

    // ── Fetch tournament separately for startDate ─────────────────────────────
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { startDate: true },
    });

    if (!tournament) throw new AppError('Tournament not found', 404);

    const players = (category.registrations as any[]).map((r: any) => r.player);
    if (players.length < 2) {
      throw new AppError('Need at least 2 approved players to generate bracket', 400);
    }

    const seededPlayers = await this.seedPlayers(players);

    console.log('\n🏆 SEEDED DRAW:');
    seededPlayers.forEach(p => {
      console.log(`  Seed ${p.seed}: ${p.firstName} ${p.lastName} (score: ${p.skillScore})`);
    });

    // Delete existing matches
    const existingMatches = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      select: { id: true },
    });
    if (existingMatches.length > 0) {
      await prisma.game.deleteMany({
        where: { matchId: { in: existingMatches.map(m => m.id) } },
      });
      await prisma.match.deleteMany({ where: { tournamentId, categoryId } });
    }

    const bracketSize = this.nextPowerOfTwo(seededPlayers.length);
    const byes        = bracketSize - seededPlayers.length;
    const totalSlots  = bracketSize;

    console.log(`📐 Players: ${seededPlayers.length}, Bracket size: ${bracketSize}, Byes: ${byes}`);

    const positions = this.getSeededPositions(totalSlots);
    const slots: (SeededPlayer | null)[] = Array(totalSlots).fill(null);
    positions.forEach((pos, idx) => {
      slots[pos - 1] = seededPlayers[idx] ?? null;
    });

    const matches: any[] = [];
    let matchNumber = 1;

    const roundName = bracketSize <= 4  ? 'Semi-final'
      : bracketSize <= 8  ? 'Quarter-final'
      : bracketSize <= 16 ? 'Round of 16'
      : 'Round of 32';

    const startDate = new Date(tournament.startDate);

    for (let i = 0; i < totalSlots; i += 2) {
      const player1 = slots[i];
      const player2 = slots[i + 1];

      if (!player1 && !player2) continue;

      if (player1 && !player2) {
          matches.push({
            tournamentId,
            categoryId,
            matchType: 'SINGLES',
          player1Id: player1.id,
          player2Id: null,
          round: roundName,
          matchNumber: matchNumber++,
          scheduledTime: startDate,
            status: 'WALKOVER',
          winnerId: player1.id,
          score: 'BYE',
        });
        continue;
      }

      matches.push({
        tournamentId,
        categoryId,
        matchType: 'SINGLES',
        player1Id: player1?.id ?? null,
        player2Id: player2?.id ?? null,
        round: roundName,
        matchNumber: matchNumber++,
        scheduledTime: startDate,
        status: 'SCHEDULED',
      });
    }

    const roundMatches = this.buildRoundStructure(
      tournamentId, categoryId, bracketSize, matchNumber, startDate,
    );

    const allMatchData = [...matches, ...roundMatches];
    if (allMatchData.length > 0) {
      await Promise.all(allMatchData.map((m) => prisma.match.create({ data: m })));
    }

    const createdMatches = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      include: {
        player1: { select: { firstName: true, lastName: true } },
        player2: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
    });

    return {
      message: 'Seeded bracket generated successfully',
      totalPlayers: seededPlayers.length,
      bracketSize,
      byes,
      totalMatches: createdMatches.length,
      seeding: seededPlayers.map(p => ({
        seed: p.seed,
        name: `${p.firstName} ${p.lastName}`,
        skillScore: p.skillScore,
      })),
      matches: createdMatches.map(m => ({
        id: m.id,
        matchNumber: m.matchNumber,
        round: m.round,
        player1: m.player1 ? `${m.player1.firstName} ${m.player1.lastName}` : 'BYE',
        player2: m.player2 ? `${m.player2.firstName} ${m.player2.lastName}` : 'BYE',
        status: m.status,
      })),
    };
  }

  // ── Seeding — win rate + points + opponent quality + recent form ──────────
  private async seedPlayers(
    players: { id: string; firstName: string; lastName: string; playerProfile: any }[],
  ): Promise<SeededPlayer[]> {

    const playerStats = await Promise.all(
      players.map(async player => {

        // Check for admin-set ranking first
        const profileWithRanking = await (prisma.playerProfile.findUnique as any)({
          where: { userId: player.id },
          select: { ranking: true },
        }).catch(() => null) as any;

        const adminRanking = profileWithRanking?.ranking ?? null;

        // Fetch match history
        const matches = await prisma.match.findMany({
          where: {
            OR: [{ player1Id: player.id }, { player2Id: player.id }],
            status: 'COMPLETED',
          },
          include: {
            games: true,
            player1: { select: { id: true, playerProfile: { select: { skillLevel: true } } } },
            player2: { select: { id: true, playerProfile: { select: { skillLevel: true } } } },
          },
          orderBy: { endTime: 'desc' },
        });

        const totalMatches = matches.length;
        const wins = matches.filter(m => m.winnerId === player.id).length;

        // Win rate (sample-weighted)
        const rawWinRate      = totalMatches > 0 ? wins / totalMatches : 0;
        const sampleWeight    = Math.min(totalMatches / 10, 1);
        const weightedWinRate = rawWinRate * sampleWeight;

        // Points per game
        let totalPointsScored = 0, totalGames = 0;
        for (const match of matches) {
          const isP1 = match.player1Id === player.id;
          for (const game of match.games) {
            totalPointsScored += isP1 ? game.player1Score : game.player2Score;
            totalGames++;
          }
        }
        const avgPts  = totalGames > 0 ? totalPointsScored / totalGames : 0;
        const normPts = Math.min(avgPts / 11, 1);

        // Opponent quality
        const skillMap: Record<string, number> = {
          PROFESSIONAL: 1.0, ADVANCED: 0.75, INTERMEDIATE: 0.5, BEGINNER: 0.25,
        };
        let oppQualitySum = 0;
        for (const match of matches) {
          if (match.winnerId !== player.id) continue;
          const opp = match.player1Id === player.id ? match.player2 : match.player1;
          const sk  = (opp as any)?.playerProfile?.skillLevel?.toUpperCase() ?? 'INTERMEDIATE';
          oppQualitySum += skillMap[sk] ?? 0.5;
        }
        const oppBonus = wins > 0 ? oppQualitySum / wins : 0;

        // Recent form (last 5 matches)
        const recentWins = matches.slice(0, 5).filter(m => m.winnerId === player.id).length;
        const recentForm = matches.length > 0
          ? recentWins / Math.min(matches.length, 5)
          : 0;

        // Skill level base
        const skillLevelMap: Record<string, number> = {
          PROFESSIONAL: 1.0, ADVANCED: 0.75, INTERMEDIATE: 0.5, BEGINNER: 0.25,
        };
        const skillBase = skillLevelMap[
          player.playerProfile?.skillLevel?.toUpperCase() ?? 'INTERMEDIATE'
        ] ?? 0.5;

        // ── Priority: admin ranking > computed > skill level ──────────────────
        let finalScore: number;

        if (adminRanking) {
          // Admin-set ranking — most trusted. Rank 1 = best = highest score
          finalScore = 10000 - adminRanking;
          console.log(`✅ ${player.firstName} ${player.lastName}: Admin ranking #${adminRanking}`);
        } else if (totalMatches === 0) {
          // New player — use skill level + small random tiebreaker
          finalScore = (skillBase * 100) + (Math.random() * 5);
          console.log(`🆕 ${player.firstName} ${player.lastName}: No history, skill=${player.playerProfile?.skillLevel}`);
        } else {
          // Compute from match history
          finalScore =
            (weightedWinRate * 35) +
            (normPts         * 25) +
            (oppBonus        * 25) +
            (recentForm      * 15);
          finalScore = finalScore * 100;
          finalScore += skillBase * 5;
          console.log(`📊 ${player.firstName} ${player.lastName}: computed score=${finalScore.toFixed(1)}, wins=${wins}/${totalMatches}`);
        }

        return {
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          skillScore: Math.round(finalScore),
          seed: 0,
        };
      })
    );

    // Sort descending — highest score = Seed 1
    playerStats.sort((a, b) => b.skillScore - a.skillScore);
    return playerStats.map((p, idx) => ({ ...p, seed: idx + 1 }));
  }

  private getSeededPositions(size: number): number[] {
    if (size === 2)  return [1, 2];
    if (size === 4)  return [1, 4, 3, 2];
    if (size === 8)  return [1, 8, 5, 4, 3, 6, 7, 2];
    if (size === 16) return [1, 16, 9, 8, 5, 12, 13, 4, 3, 14, 11, 6, 7, 10, 15, 2];
    if (size === 32) return [
      1, 32, 17, 16, 9, 24, 25, 8, 5, 28, 21, 12, 13, 20, 29, 4,
      3, 30, 19, 14, 11, 22, 27, 6, 7, 26, 23, 10, 15, 18, 31, 2,
    ];
    return Array.from({ length: size }, (_, i) => i + 1);
  }

  private buildRoundStructure(
    tournamentId: string,
    categoryId: string,
    bracketSize: number,
    startMatchNumber: number,
    scheduledTime: Date,
  ): object[] {
    const rounds: object[] = [];
    let matchNumber = startMatchNumber;
    let currentSize = bracketSize / 2;

    const roundNames: Record<number, string> = {
      2: 'Final', 4: 'Semi-final', 8: 'Quarter-final',
      16: 'Round of 16', 32: 'Round of 32',
    };

    while (currentSize >= 2) {
      const matchesInRound = currentSize / 2;
      const roundName = roundNames[currentSize] ?? `Round of ${currentSize}`;
      for (let i = 0; i < matchesInRound; i++) {
        rounds.push({
          tournamentId, categoryId,
          matchType: 'SINGLES',
          player1Id: null, player2Id: null,
          round: roundName,
          matchNumber: matchNumber++,
          scheduledTime,
          status: 'SCHEDULED',
        });
      }
      currentSize = currentSize / 2;
    }

    // 3rd place match
    rounds.push({
      tournamentId, categoryId,
      matchType: 'SINGLES',
      player1Id: null, player2Id: null,
      round: '3rd Place',
      matchNumber: matchNumber++,
      scheduledTime,
      status: 'SCHEDULED',
    });

    return rounds;
  }

  async getBracket(tournamentId: string, categoryId: string) {
    const matches = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      include: {
        player1: { select: { firstName: true, lastName: true } },
        player2: { select: { firstName: true, lastName: true } },
      },
      orderBy: { matchNumber: 'asc' },
    });

    const rounds: any = {};
    matches.forEach(match => {
      if (!rounds[match.round]) rounds[match.round] = [];
      rounds[match.round].push(match);
    });

    return { tournamentId, categoryId, rounds, totalMatches: matches.length };
  }

  private nextPowerOfTwo(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }
}