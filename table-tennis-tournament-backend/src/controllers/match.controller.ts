import { Request, Response } from 'express';
import { MatchService } from '../services/match.service';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { getIO } from '../utils/socket';

const matchService = new MatchService();

// Create match (Admin only)
export const createMatch = catchAsync(async (req: Request, res: Response) => {
  const match = await matchService.createMatch(req.user!.id, req.body);
  sendResponse(res, 201, 'Match created successfully', match);
});

// Get tournament matches
export const getTournamentMatches = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId } = req.params;
  const { status } = req.query;
  const matches = await matchService.getTournamentMatches(tournamentId, status as string);
  sendResponse(res, 200, 'Matches retrieved successfully', matches);
});

// Get my matches (for players)
export const getMyMatches = catchAsync(async (req: Request, res: Response) => {
  const matches = await matchService.getPlayerMatches(req.user!.id);
  sendResponse(res, 200, 'Your matches retrieved successfully', matches);
});

// Get referee matches
export const getRefereeMatches = catchAsync(async (req: Request, res: Response) => {
  const matches = await matchService.getRefereeMatches(req.user!.id);
  sendResponse(res, 200, 'Your assigned matches retrieved successfully', matches);
});

// Get match by ID
export const getMatchById = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const match = await matchService.getMatchById(matchId);
  sendResponse(res, 200, 'Match retrieved successfully', match);
});

// Update match status (Admin/Referee)
export const updateMatchStatus = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { status, player2Id, winnerId } = req.body;
  
  const updateData: any = { status };
  if (player2Id !== undefined) updateData.player2Id = player2Id;
  if (winnerId !== undefined) updateData.winnerId = winnerId;
  
  const match = await matchService.updateMatchStatus(req.user!.id, req.user!.role, matchId, status);
  
  // If we need to update player2Id as well
  if (player2Id !== undefined) {
    await prisma.match.update({
      where: { id: matchId },
      data: { player2Id }
    });
  }
  
  sendResponse(res, 200, 'Match status updated successfully', match);
});

// Assign referee to match (Admin only)
export const assignReferee = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { refereeUserId } = req.body;
  const match = await matchService.assignReferee(req.user!.id, matchId, refereeUserId);
  sendResponse(res, 200, 'Referee assigned successfully', match);
});

// Add these to the existing MatchController

// Record game scores (Referee only)
export const recordGameScores = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { games } = req.body;
  const match = await matchService.recordGameScores(req.user!.id, req.user!.role, matchId, games);
  sendResponse(res, 200, 'Game scores recorded successfully', match);
});

// Get match results
export const getMatchResults = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const results = await matchService.getMatchResults(matchId, req.user!.id, req.user!.role);
  sendResponse(res, 200, 'Match results retrieved successfully', results);
});

// Get player match history
export const getMyMatchHistory = catchAsync(async (req: Request, res: Response) => {
  const history = await matchService.getPlayerMatchHistory(req.user!.id);
  sendResponse(res, 200, 'Match history retrieved successfully', history);
});

// Get player performance statistics
export const getPlayerPerformanceStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await matchService.getPlayerPerformanceStats(req.user!.id);
  sendResponse(res, 200, 'Player statistics retrieved successfully', stats);
});
// Get player performance stats for public profile
export const getPlayerPerformanceStatsById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const stats = await matchService.getPlayerPerformanceStats(userId);
  sendResponse(res, 200, 'Player statistics retrieved successfully', stats);
});

// Update match details (score, winner, etc.)
export const updateMatch = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { score, winnerId, status, player1Id, player2Id } = req.body;
  
  const updateData: any = {};
  if (score !== undefined) updateData.score = score;
  if (winnerId !== undefined) updateData.winnerId = winnerId;
  if (status !== undefined) updateData.status = status;
  if (player1Id !== undefined) updateData.player1Id = player1Id;
  if (player2Id !== undefined) updateData.player2Id = player2Id;  // ← ADD THIS
  if (status === 'COMPLETED') updateData.endTime = new Date();




  const match = await prisma.match.update({
    where: { id: matchId },
    data: updateData,

    include: {
      player1: { select: { id: true, firstName: true, lastName: true } },
      player2: { select: { id: true, firstName: true, lastName: true } },
      team1: true,
      team2: true,
      referee: { include: { user: true }},
    },
    
  });

  console.log("Updated match:", matchId, "| data:", updateData);
  
  // Emit WebSocket event for real-time live scoring
  getIO().to(`tournament_${match.tournamentId}`).emit('match:update', match);

  sendResponse(res, 200, 'Match updated successfully', match);
});
// Delete all knockout matches for a category
export const deleteKnockoutMatches = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId, categoryId } = req.params;

  console.log(`Deleting knockout matches for tournament ${tournamentId}, category ${categoryId}`);
  
  // Delete games first (due to foreign key constraints)
  const knockoutMatches = await prisma.match.findMany({
    where: {
      tournamentId,
      categoryId,
      round: { in: ['Quarter-final', 'Semi-final', 'Final'] },
    },
    select: { id: true },
  });

  let deletedCount = 0;
  
  if (knockoutMatches.length > 0) {
    const matchIds = knockoutMatches.map(m => m.id);
    
    // Delete games
    const deletedGames = await prisma.game.deleteMany({
      where: { matchId: { in: matchIds } },
    });
    console.log(`Deleted ${deletedGames.count} games`);

    
    // Delete matches
    const deletedMatches = await prisma.match.deleteMany({
      where: {
        tournamentId,
        categoryId,
        round: { in: ['Quarter-final', 'Semi-final', 'Final'] },
      },
    });
    deletedCount =  deletedMatches.count;

    console.log(`Deleted ${deletedCount} knockout matches for category ${categoryId}`);
  } else {
    console.log(`No knockout matches found for category ${categoryId}`);
  }

  sendResponse(res, 200, `Deleted ${knockoutMatches.length} knockout matches`);
});
// Update match and automatically advance winner to next round
export const updateMatchAndAdvance = catchAsync(async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { player1Score, player2Score } = req.body;
  
  // Update the current match
  const winnerId = player1Score > player2Score ? 
    (await prisma.match.findUnique({ where: { id: matchId } }))?.player1Id : 
    (await prisma.match.findUnique({ where: { id: matchId } }))?.player2Id;
  
  const updatedMatch = await prisma.match.update({
    where: { id: matchId },
    data: {
      score: `${player1Score} - ${player2Score}`,
      winnerId,
      status: 'COMPLETED',
      endTime: new Date(),
    },
  });
  
  // Get the current match to find its bracket position
  const currentMatch = updatedMatch;
  const tournamentId = currentMatch.tournamentId;
  const categoryId = currentMatch.categoryId;
  
  // Find the next round match
  let nextRoundMatch;
  
  if (currentMatch.round === 'Quarter-final') {
    // Find the corresponding Semi-final match
    // QF1 (matchNumber 1) → SF1 (matchNumber 3) as player2
    // QF2 (matchNumber 2) → SF2 (matchNumber 4) as player2
    const sfMatchNumber = currentMatch.matchNumber === 1 ? 3 : 4;
    nextRoundMatch = await prisma.match.findFirst({
      where: {
        tournamentId,
        categoryId,
        round: 'Semi-final',
        matchNumber: sfMatchNumber,
      },
    });
    
    if (nextRoundMatch) {
      await prisma.match.update({
        where: { id: nextRoundMatch.id },
        data: { player2Id: winnerId },
      });
    }
  } else if (currentMatch.round === 'Semi-final') {
    // Find the Final match
    // SF1 (matchNumber 3) → Final as player1
    // SF2 (matchNumber 4) → Final as player2
    const finalMatch = await prisma.match.findFirst({
      where: {
        tournamentId,
        categoryId,
        round: 'Final',
      },
    });
    
    if (finalMatch) {
      const updateData = currentMatch.matchNumber === 3 
        ? { player1Id: winnerId }
        : { player2Id: winnerId };
      
      await prisma.match.update({
        where: { id: finalMatch.id },
        data: updateData,
      });
    }
  }
  
  // Emit socket update
  getIO().to(`tournament_${updatedMatch.tournamentId}`).emit('match:update', updatedMatch);
  
  sendResponse(res, 200, 'Match updated and winner advanced', updatedMatch);
});
export const swapPlayers = catchAsync(async (req:any, res:any) => {
  const { match1Id, match2Id, slot1, slot2 } = req.body;
  const m1 = await prisma.match.findUnique({ where: { id: match1Id } });
  const m2 = await prisma.match.findUnique({ where: { id: match2Id } });
  if (!m1 || !m2) throw new AppError('Match not found', 404);

  const p1 = slot1 === 'player1' ? m1.player1Id : m1.player2Id;
  const p2 = slot2 === 'player1' ? m2.player1Id : m2.player2Id;

  await prisma.match.update({ where: { id: match1Id }, data: { [slot1 + 'Id']: p2 } });
  await prisma.match.update({ where: { id: match2Id }, data: { [slot2 + 'Id']: p1 } });

  sendResponse(res, 200, 'Players swapped', { match1Id, match2Id });
});