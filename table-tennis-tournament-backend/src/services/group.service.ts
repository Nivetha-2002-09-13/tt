import prisma from '../config/database';
import { AppError } from '../utils/AppError';

export class GroupService {
  // Create groups and assign players
  async createGroups(adminId: string, tournamentId: string, categoryId: string, numberOfGroups: number) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can create groups', 403);
    }

    const registrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId, categoryId, status: 'APPROVED' },
      include: { player: true },
    });

    const players = registrations.map(r => r.player);

    if (players.length < 2) {
      throw new AppError('Need at least 2 players to create groups', 400);
    }

    // Delete existing groups and knockout matches
    const existingGroups = await prisma.group.findMany({
      where: { tournamentId, categoryId },
      select: { id: true },
    });

    if (existingGroups.length > 0) {
      const groupIds = existingGroups.map(g => g.id);
      await prisma.groupPlayer.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.groupMatch.deleteMany({ where: { groupId: { in: groupIds } } });
      await prisma.group.deleteMany({ where: { tournamentId, categoryId } });
      await prisma.match.deleteMany({
        where: {
          tournamentId,
          categoryId,
          round: { in: ['Quarter-final', 'Semi-final', 'Final'] },
        },
      });
    }

    const shuffledPlayers = this.shuffleArray([...players]);
    const playersPerGroup = Math.ceil(players.length / numberOfGroups);

    const groups = [];
    for (let i = 0; i < numberOfGroups; i++) {
      const groupName = String.fromCharCode(65 + i);
      const startIdx = i * playersPerGroup;
      const endIdx = Math.min(startIdx + playersPerGroup, players.length);
      const groupPlayers = shuffledPlayers.slice(startIdx, endIdx);

      if (groupPlayers.length === 0) continue;

      const group = await prisma.group.create({
        data: {
          name: `Group ${groupName}`,
          tournamentId,
          categoryId,
          players: {
            create: groupPlayers.map((player: { id: string }) => ({ playerId: player.id })),
          },
        },
        include: { players: { include: { player: true } } },
      });
      groups.push(group);
    }

    return groups;
  }

  // Generate league matches for all groups
  async generateGroupMatches(adminId: string, tournamentId: string, categoryId: string) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can generate group matches', 403);
    }

    const groups = await prisma.group.findMany({
      where: { tournamentId, categoryId },
      include: { players: { include: { player: true } } },
    });

    if (groups.length === 0) {
      throw new AppError('No groups found. Create groups first.', 400);
    }
    

    const existingMatches = await prisma.groupMatch.findMany({
      where: { group: { tournamentId, categoryId } },
      select: { id: true },
    });

    if (existingMatches.length > 0) {
      await prisma.groupMatch.deleteMany({
        where: { id: { in: existingMatches.map(m => m.id) } },
      });
    }

    const allMatches = [];

    for (const group of groups) {
      const players = group.players.map(p => p.player);

      for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
          const match = await prisma.groupMatch.create({
            data: {
              groupId: group.id,
              player1Id: players[i].id,
              player2Id: players[j].id,
              scheduledTime: new Date(),
              status: 'SCHEDULED',
              round: 1,
            },
          });
          allMatches.push(match);
        }
      }
    }

    return {
      message: `Generated ${allMatches.length} group matches`,
      totalMatches: allMatches.length,
      groups: groups.length,
    };
  }

  // Record group match score
  // Record group match score — best of 3 or best of 5 with per-game scores
async recordGroupScore(
  matchId: string,
  games: { p1: number | null; p2: number | null }[],  // array of up to 5 games
  adminId: string,
  bestOf: 3 | 5 = 5
) {
  const existingMatch = await prisma.groupMatch.findUnique({
    where: { id: matchId },
    include: { group: { include: { players: true } } },
  }) as any;

  if (!existingMatch) throw new AppError('Match not found', 404);

  // Count games won per player
  const winsToWin = Math.ceil(bestOf / 2); // 2 for BO3, 3 for BO5
  let p1GamesWon = 0;
  let p2GamesWon = 0;

  for (const g of games) {
    if (g.p1 === null || g.p2 === null) continue;
    if (g.p1 > g.p2) p1GamesWon++;
    else if (g.p2 > g.p1) p2GamesWon++;
  }

  // Validate — must have a clear winner
  if (p1GamesWon < winsToWin && p2GamesWon < winsToWin) {
    throw new AppError(
      `Match not complete. Need ${winsToWin} game wins to win the match.`,
      400
    );
  }

  const player1Score = p1GamesWon;  // games won by player1
  const player2Score = p2GamesWon;  // games won by player2
  const winnerId = p1GamesWon > p2GamesWon
    ? existingMatch.player1Id
    : existingMatch.player2Id;

  // Revert old stats if this is an update
  const isUpdate = existingMatch.player1Score !== null;
  if (isUpdate && existingMatch.player1Score !== null && existingMatch.player2Score !== null) {
    await this.revertGroupPlayerStats(
      existingMatch.groupId,
      existingMatch.player1Id,
      existingMatch.player2Id,
      existingMatch.player1Score,
      existingMatch.player2Score
    );
  }

  // Save to DB
  const updatedMatch = await prisma.groupMatch.update({
    where: { id: matchId },
    data: {
      player1Score,
      player2Score,
      winnerId,
      bestOf,
      status: 'COMPLETED',
      completedAt: new Date(),
      game1player1: games[0]?.p1 ?? null,
      game1player2: games[0]?.p2 ?? null,
      game2player1: games[1]?.p1 ?? null,
      game2player2: games[1]?.p2 ?? null,
      game3player1: games[2]?.p1 ?? null,
      game3player2: games[2]?.p2 ?? null,
      game4player1: games[3]?.p1 ?? null,
      game4player2: games[3]?.p2 ?? null,
      game5player1: games[4]?.p1 ?? null,
      game5player2: games[4]?.p2 ?? null,
    },
  });

  await this.updateGroupPlayerStats(
    existingMatch.groupId,
    existingMatch.player1Id,
    existingMatch.player2Id,
    player1Score,
    player2Score
  );

  return updatedMatch;
}
  // Update player statistics in group
  private async updateGroupPlayerStats(
    groupId: string,
    player1Id: string,
    player2Id: string,
    player1Score: number,
    player2Score: number,
  ) {
    const isPlayer1Winner = player1Score > player2Score;

    await prisma.groupPlayer.update({
      where: { groupId_playerId: { groupId, playerId: player1Id } },
      data: {
        matchesPlayed: { increment: 1 },
        wins: { increment: isPlayer1Winner ? 1 : 0 },
        losses: { increment: isPlayer1Winner ? 0 : 1 },
        points: { increment: isPlayer1Winner ? 3 : 0 },
        pointsScored: { increment: player1Score },
        pointsConceded: { increment: player2Score },
        gamesWon: { increment: player1Score },
        gamesLost: { increment: player2Score },
      },
    });

    await prisma.groupPlayer.update({
      where: { groupId_playerId: { groupId, playerId: player2Id } },
      data: {
        matchesPlayed: { increment: 1 },
        wins: { increment: isPlayer1Winner ? 0 : 1 },
        losses: { increment: isPlayer1Winner ? 1 : 0 },
        points: { increment: isPlayer1Winner ? 0 : 3 },
        pointsScored: { increment: player2Score },
        pointsConceded: { increment: player1Score },
        gamesWon: { increment: player2Score },
        gamesLost: { increment: player1Score },
      },
    });
  }

  // Get group standings
  async getGroupStandings(tournamentId: string, categoryId: string) {
    const groups = await prisma.group.findMany({
      where: { tournamentId, categoryId },
      include: {
        players: {
          include: {
            player: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { points: 'desc' },
        },
        matches: {
          include: {
            player1: { select: { firstName: true, lastName: true } },
            player2: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return groups;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Generate knockout stage from group stage results
  //
  // Dynamic bracket logic:
  //   4 players  → Semi-final (×2) + Final (×1)          = 3 matches
  //   6 players  → Quarter-final (×2, 4 play) + BYE (×2) + SF (×2) + F (×1) = 5 matches
  //   8 players  → Quarter-final (×4) + SF (×2) + F (×1) = 7 matches
  // ─────────────────────────────────────────────────────────────────────────────
  async generateKnockoutStage(
    adminId: string,
    tournamentId: string,
    categoryId: string,
    topFromEachGroup: number = 2,
  ) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    if (!admin) {
      throw new AppError('Only admins can generate knockout stage', 403);
    }

    // ── 1. Fetch groups and collect qualified players ────────────────────────
    const groups = await prisma.group.findMany({
      where: { tournamentId, categoryId },
      include: {
        players: {
          orderBy: [
            { points: 'desc' },
            { gamesWon: 'desc' },
            { pointsScored: 'desc' },
          ],
        },
      },
    });

    if (groups.length === 0) {
      throw new AppError('No groups found. Create groups first.', 400);
    }

    const qualifiedPlayers: Array<{
      id: string;
      points: number;
      gamesWon: number;
      pointsScored: number;
      groupRank: number; // 1 = group winner, 2 = runner-up, etc.
    }> = [];

    for (const group of groups) {
      const topPlayers = group.players.slice(0, topFromEachGroup);
      topPlayers.forEach((player, rank) => {
        qualifiedPlayers.push({
          id: player.playerId,
          points: player.points,
          gamesWon: player.gamesWon,
          pointsScored: player.pointsScored,
          groupRank: rank + 1,
        });
      });
    }

    const totalPlayers = qualifiedPlayers.length;
    console.log(`\n📊 Qualified players: ${totalPlayers}`);

    if (totalPlayers < 2) {
      throw new AppError('Not enough players qualified for knockout stage', 400);
    }

    // ── 2. Delete existing knockout matches ──────────────────────────────────
    await prisma.match.deleteMany({
      where: {
        tournamentId,
        categoryId,
        round: { in: ['Quarter-final', 'Semi-final', 'Final', '3rd Place'] },
      },
    });

    // ── 3. Determine bracket structure dynamically ───────────────────────────
    //
    // nextPowerOfTwo gives us the bracket "slots" (e.g. 4 → 4, 5 → 8, 6 → 8)
    // byes = bracketSize - totalPlayers  (these players skip the first round)
    // firstRoundPlayers = totalPlayers - byes  (these play immediately)
    //
    const bracketSize = this.nextPowerOfTwo(totalPlayers); // 4 → 4, 5-8 → 8
    const byes = bracketSize - totalPlayers;               // 4 players → 0 byes
    const firstRoundPlayerCount = totalPlayers - byes;     // players who play QF

    console.log(`📐 Bracket size: ${bracketSize}, Byes: ${byes}, First-round players: ${firstRoundPlayerCount}`);

    // Separate group winners (seeded, get byes if needed) from runners-up
    const groupWinners  = qualifiedPlayers.filter(p => p.groupRank === 1); // seeds
    const groupRunnerUps = qualifiedPlayers.filter(p => p.groupRank > 1);  // play first

    const allMatches = [];
    let matchNumber = 1;

    // ── 4a. CASE: 4 players — skip straight to Semi-finals ──────────────────
    if (bracketSize === 4 && byes === 0) {
      // Seed the draw so group winners meet runners-up, not each other
      // SF1: Group A winner vs Group B runner-up
      // SF2: Group B winner vs Group A runner-up
      const [winner1, winner2]     = groupWinners;    // Group A winner, Group B winner
      const [runnerUp1, runnerUp2] = groupRunnerUps;  // Group A runner-up, Group B runner-up

      console.log('🏓 Creating Semi-finals (no Quarter-finals needed)');

      const sf1 = await prisma.match.create({
        data: {
          tournamentId,
          categoryId,
          matchType: 'SINGLES',
          player1Id: winner1?.id  ?? null,
          player2Id: runnerUp2?.id ?? null, // cross-seeding
          round: 'Semi-final',
          matchNumber: matchNumber++,
          scheduledTime: new Date(),
          status: 'SCHEDULED',
        },
      });
      allMatches.push(sf1);

      const sf2 = await prisma.match.create({
        data: {
          tournamentId,
          categoryId,
          matchType: 'SINGLES',
          player1Id: winner2?.id  ?? null,
          player2Id: runnerUp1?.id ?? null, // cross-seeding
          round: 'Semi-final',
          matchNumber: matchNumber++,
          scheduledTime: new Date(),
          status: 'SCHEDULED',
        },
      });
      allMatches.push(sf2);
    }

    // ── 4b. CASE: 8 players (or 5-8 with byes) — QF → SF → Final ───────────
    else {
      // Players who play in the first round (quarter-finals)
      const qfPlayers = this.shuffleArray([...groupRunnerUps]);
      // Players who get a bye straight to semi-finals
      const byePlayers = [...groupWinners];

      console.log(`🏓 Creating Quarter-finals with ${qfPlayers.length} players`);

      // Create QF matches in pairs
      for (let i = 0; i < firstRoundPlayerCount; i += 2) {
        const p1 = qfPlayers[i]     ?? null;
        const p2 = qfPlayers[i + 1] ?? null;

        const qf = await prisma.match.create({
          data: {
            tournamentId,
            categoryId,
            matchType: 'SINGLES',
            player1Id: p1?.id ?? null,
            player2Id: p2?.id ?? null,
            round: 'Quarter-final',
            matchNumber: matchNumber++,
            scheduledTime: new Date(),
            status: 'SCHEDULED',
          },
        });
        allMatches.push(qf);
      }

      // Create SF matches — bye players are pre-seeded, QF winner slots are null
      console.log(`🏓 Creating Semi-finals with ${byePlayers.length} seeded players`);

      const sf1 = await prisma.match.create({
        data: {
          tournamentId,
          categoryId,
          matchType: 'SINGLES',
          player1Id: byePlayers[0]?.id ?? null,
          player2Id: null, // filled when QF1 completes
          round: 'Semi-final',
          matchNumber: matchNumber++,
          scheduledTime: new Date(),
          status: 'SCHEDULED',
        },
      });
      allMatches.push(sf1);

      const sf2 = await prisma.match.create({
        data: {
          tournamentId,
          categoryId,
          matchType: 'SINGLES',
          player1Id: byePlayers[1]?.id ?? null,
          player2Id: null, // filled when QF2 completes
          round: 'Semi-final',
          matchNumber: matchNumber++,
          scheduledTime: new Date(),
          status: 'SCHEDULED',
        },
      });
      allMatches.push(sf2);
    }

    // ── 5. Always create the Final ───────────────────────────────────────────
    console.log('🏆 Creating Final');

    const finalMatch = await prisma.match.create({
      data: {
        tournamentId,
        categoryId,
        matchType: 'SINGLES',
        player1Id: null, // filled when SF1 completes
        player2Id: null, // filled when SF2 completes
        round: 'Final',
        matchNumber: matchNumber++,
        scheduledTime: new Date(),
        status: 'SCHEDULED',
      },
    });
    allMatches.push(finalMatch);

    const semiFinalMatches = await prisma.match.findMany({
    where: {
      tournamentId,
      categoryId,
      round: 'Semi-final',
    },
    orderBy: { matchNumber: 'asc' },
  });

  // Create 3rd place match if there are exactly 2 semi-finals
  if (semiFinalMatches.length === 2) {
    const thirdPlaceMatch = await prisma.match.create({
      data: {
        tournamentId,
        categoryId,
        matchType: 'SINGLES',
        player1Id: null, // Will be filled with loser of SF1
        player2Id: null, // Will be filled with loser of SF2
        round: '3rd Place',
        matchNumber: matchNumber++,
        scheduledTime: new Date(),
        status: 'SCHEDULED',
      },
    });
    //matches.push(thirdPlaceMatch);
    allMatches.push(thirdPlaceMatch);
  }

    // ── 6. Summary ───────────────────────────────────────────────────────────
    const qfCount = allMatches.filter(m => m.round === 'Quarter-final').length;
    const sfCount = allMatches.filter(m => m.round === 'Semi-final').length;
    const fCount  = allMatches.filter(m => m.round === 'Final').length;

    console.log(`\n✅ Generated ${allMatches.length} knockout matches`);
    console.log(`   Quarter-finals : ${qfCount}`);
    console.log(`   Semi-finals    : ${sfCount}`);
    console.log(`   Final          : ${fCount}`);

    return {
      message: `Generated ${allMatches.length} knockout matches`,
      totalPlayers,
      bracketSize,
      totalMatches: allMatches.length,
      breakdown: { quarterFinals: qfCount, semiFinals: sfCount, final: fCount },
      matches: allMatches.map(m => ({
        id: m.id,
        round: m.round,
        matchNumber: m.matchNumber,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        status: m.status,
      })),
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /** Returns the smallest power of 2 >= n (e.g. 4→4, 5→8, 6→8, 9→16) */
  private nextPowerOfTwo(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }

  // Add this method to revert old statistics when re-recording scores
private async revertGroupPlayerStats(groupId: string, player1Id: string, player2Id: string, player1Score: number, player2Score: number) {
  const isPlayer1Winner = player1Score > player2Score;

  await prisma.groupPlayer.update({
    where: { groupId_playerId: { groupId, playerId: player1Id } },
    data: {
      matchesPlayed: { decrement: 1 },
      wins: { decrement: isPlayer1Winner ? 1 : 0 },
      losses: { decrement: isPlayer1Winner ? 0 : 1 },
      points: { decrement: isPlayer1Winner ? 3 : 0 },
      pointsScored: { decrement: player1Score },
      pointsConceded: { decrement: player2Score },
      gamesWon: { decrement: player1Score },
      gamesLost: { decrement: player2Score },
    },
  });

  await prisma.groupPlayer.update({
    where: { groupId_playerId: { groupId, playerId: player2Id } },
    data: {
      matchesPlayed: { decrement: 1 },
      wins: { decrement: isPlayer1Winner ? 0 : 1 },
      losses: { decrement: isPlayer1Winner ? 1 : 0 },
      points: { decrement: isPlayer1Winner ? 0 : 3 },
      pointsScored: { decrement: player2Score },
      pointsConceded: { decrement: player1Score },
      gamesWon: { decrement: player2Score },
      gamesLost: { decrement: player1Score },
    },
  });
}
// Add this new method to GroupService class

async updateGroupMembers(
  adminId: string,
  tournamentId: string,
  categoryId: string,
  groupAssignments: { groupId: string; playerIds: string[] }[]
) {
  const admin = await prisma.adminProfile.findUnique({ where: { userId: adminId } });
  if (!admin) throw new AppError('Only admins can update group members', 403);

  // Verify no matches have been played yet (prevent editing mid-tournament)
  const playedMatches = await prisma.groupMatch.findMany({
    where: {
      group: { tournamentId, categoryId },
      status: 'COMPLETED',
    },
  });
  if (playedMatches.length > 0) {
    throw new AppError('Cannot reassign players after matches have been played', 400);
  }

  // Validate all playerIds are approved registrations for this tournament/category
  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId, categoryId, status: 'APPROVED' },
    select: { playerId: true },
  });
  const approvedIds = new Set(registrations.map(r => r.playerId));

  for (const { playerIds } of groupAssignments) {
    for (const pid of playerIds) {
      if (!approvedIds.has(pid)) {
        throw new AppError(`Player ${pid} is not an approved registrant`, 400);
      }
    }
  }

  // Rebuild GroupPlayer records for each group
  for (const { groupId, playerIds } of groupAssignments) {
    await prisma.groupPlayer.deleteMany({ where: { groupId } });
    await Promise.all(
      playerIds.map((playerId) => prisma.groupPlayer.create({ data: { groupId, playerId } }))
    );
  }

  // Regenerate group matches (wipes old unplayed ones)
  await prisma.groupMatch.deleteMany({
    where: {
      group: { tournamentId, categoryId },
      status: 'SCHEDULED',
    },
  });

  return await this.getGroupStandings(tournamentId, categoryId);
}
}
