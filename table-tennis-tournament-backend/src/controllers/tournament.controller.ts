import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';

// Create tournament (Admin only)
export const createTournament = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user!.id;
  
  
  // Verify admin
  const admin = await prisma.adminProfile.findUnique({
    where: { userId: adminId },
  });

  if (!admin) {
    throw new AppError('Only admins can create tournaments', 403);
  }

  const { name, description, venue, startDate, endDate, registrationDeadline, maxPlayers,tournamentType } = req.body;

  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
    throw new AppError('End date must be after start date', 400);
  }

  if (new Date(registrationDeadline) >= new Date(startDate)) {
    throw new AppError('Registration deadline must be before tournament start', 400);
  }

  const tournament = await prisma.tournament.create({
    data: {
      name,
      description,
      venue,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadline: new Date(registrationDeadline),
      maxPlayers,
      tournamentType: tournamentType === 'GROUP_KNOCKOUT' ? 'GROUP_KNOCKOUT' : 'KNOCKOUT', // ← ADD THIS LINE
    },
  });

  sendResponse(res, 201, 'Tournament created successfully', tournament);
});

// Get all tournaments
export const getAllTournaments = catchAsync(async (req: Request, res: Response) => {
  const tournaments = await prisma.tournament.findMany({
    include: {
      categories: {
        select: {
          id: true,
          name: true,
          type: true,
          maxParticipants: true,
          currentParticipants: true,
        },
      },
      _count: {
        select: { registrations: true },
      },
    },
    orderBy: { startDate: 'asc' },
  });

  sendResponse(res, 200, 'Tournaments retrieved successfully', tournaments);
});

// Get tournament by ID
export const getTournamentById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      categories: {
        include: {
          _count: {
            select: { registrations: true },
          },
        },
      },
      registrations: {
        where: { status: 'APPROVED' },
        take: 20,
        include: {
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      matches: {
        take: 10,
        orderBy: { scheduledTime: 'asc' },
        include: {
          player1: { select: { firstName: true, lastName: true } },
          player2: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!tournament) {
    throw new AppError('Tournament not found', 404);
  }

  sendResponse(res, 200, 'Tournament retrieved successfully', tournament);
});

// Update tournament (Admin only)
export const updateTournament = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user!.id;
  const { id } = req.params;

  // Verify admin
  const admin = await prisma.adminProfile.findUnique({
    where: { userId: adminId },
  });

  if (!admin) {
    throw new AppError('Only admins can update tournaments', 403);
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id },
  });

  if (!tournament) {
    throw new AppError('Tournament not found', 404);
  }

  const { name, description, venue, startDate, endDate, registrationDeadline, status, maxPlayers } = req.body;

  const updatedTournament = await prisma.tournament.update({
    where: { id },
    data: {
      name: name || undefined,
      description: description !== undefined ? description : undefined,
      venue: venue || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      status: status || undefined,
      maxPlayers: maxPlayers !== undefined ? maxPlayers : undefined,
    },
  });

  sendResponse(res, 200, 'Tournament updated successfully', updatedTournament);
});

// Delete tournament (Admin only)
export const deleteTournament = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user!.id;
  const { id } = req.params;

  // Verify admin
  const admin = await prisma.adminProfile.findUnique({
    where: { userId: adminId },
  });

  if (!admin) {
    throw new AppError('Only admins can delete tournaments', 403);
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id },
  });

  if (!tournament) {
    throw new AppError('Tournament not found', 404);
  }

  // Delete tournament (cascade will handle related records if configured)
  await prisma.tournament.delete({
    where: { id },
  });

  sendResponse(res, 200, 'Tournament deleted successfully');
});

// Add category to tournament (Admin only)
export const addCategory = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user!.id;
  const { tournamentId } = req.params;

  // Verify admin
  const admin = await prisma.adminProfile.findUnique({
    where: { userId: adminId },
  });

  if (!admin) {
    throw new AppError('Only admins can add categories', 403);
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) {
    throw new AppError('Tournament not found', 404);
  }

  const { name, type, minAge, maxAge, gender, maxParticipants } = req.body;

  const category = await prisma.category.create({
    data: {
      tournamentId,
      name,
      type,
      minAge,
      maxAge,
      gender,
      maxParticipants,
    },
  });

  sendResponse(res, 201, 'Category added successfully', category);
});

// Get tournament categories
export const getTournamentCategories = catchAsync(async (req: Request, res: Response) => {
  const { tournamentId } = req.params;

  const categories = await prisma.category.findMany({
    where: { tournamentId },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  });

  sendResponse(res, 200, 'Categories retrieved successfully', categories);
});

// Update category (Admin only)
export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user!.id;
  const { categoryId } = req.params;

  // Verify admin
  const admin = await prisma.adminProfile.findUnique({
    where: { userId: adminId },
  });

  if (!admin) {
    throw new AppError('Only admins can update categories', 403);
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  const { name, type, minAge, maxAge, gender, maxParticipants } = req.body;

  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: name || undefined,
      type: type || undefined,
      minAge: minAge !== undefined ? minAge : undefined,
      maxAge: maxAge !== undefined ? maxAge : undefined,
      gender: gender || undefined,
      maxParticipants: maxParticipants !== undefined ? maxParticipants : undefined,
    },
  });

  sendResponse(res, 200, 'Category updated successfully', updatedCategory);
});

// Delete category (Admin only)
export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user!.id;
  const { categoryId } = req.params;

  // Verify admin
  const admin = await prisma.adminProfile.findUnique({
    where: { userId: adminId },
  });

  if (!admin) {
    throw new AppError('Only admins can delete categories', 403);
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  sendResponse(res, 200, 'Category deleted successfully');
});

export const generateDraws = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const categories = await prisma.category.findMany({
    where: { tournamentId: id }
  });

  for (const category of categories) {
    await prisma.group.deleteMany({
      where: { tournamentId: id, categoryId: category.id }
    });

    const regs = await prisma.tournamentRegistration.findMany({
      where: { tournamentId: id, categoryId: category.id, status: 'APPROVED' },
      include: { player: true }
    });
    
    regs.sort(() => Math.random() - 0.5);
    
    const groupSize = 4;
    const numGroups = Math.ceil(regs.length / groupSize);
    
    for (let i=0; i<numGroups; i++) {
      const groupPlayers = regs.slice(i * groupSize, (i+1) * groupSize);
      if (groupPlayers.length < 2) continue;
      
      const group = await prisma.group.create({
        data: {
          name: 'Group ' + String.fromCharCode(65 + i),
          tournamentId: id,
          categoryId: category.id
        }
      });
      
      for (const p of groupPlayers) {
        await prisma.groupPlayer.create({
          data: { groupId: group.id, playerId: p.playerId }
        });
      }
      
      for (let j=0; j<groupPlayers.length; j++) {
        for (let k=j+1; k<groupPlayers.length; k++) {
          await prisma.groupMatch.create({
            data: {
              groupId: group.id,
              player1Id: groupPlayers[j].playerId,
              player2Id: groupPlayers[k].playerId,
              scheduledTime: new Date()
            }
          });
        }
      }
    }
  }

  sendResponse(res, 200, 'Draws generated successfully');
});
