import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/sendResponse';
import { UserService } from '../services/user.service';

const userService = new UserService();

// Get current user profile (authenticated users)
export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserProfile(req.user!.id);
  sendResponse(res, 200, 'Profile retrieved successfully', user);
});

// Update current user profile (authenticated users)
export const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const updatedUser = await userService.updateUserProfile(req.user!.id, req.body);
  sendResponse(res, 200, 'Profile updated successfully', updatedUser);
});

// Get all users (Admin only)
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  sendResponse(res, 200, 'Users retrieved successfully', users);
});

// Get user by ID (Admin only)
export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);
  sendResponse(res, 200, 'User retrieved successfully', user);
});

// Update user role (Admin only)
export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const updatedUser = await userService.updateUserRole(id, role);
  sendResponse(res, 200, 'User role updated successfully', updatedUser);
});

// Delete user (Admin only)
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await userService.deleteUser(id);
  sendResponse(res, 200, 'User deleted successfully');
});

// Upload profile image (Authenticated users)
export const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const imageUrl = `/uploads/files/${req.file.filename}`;

  // Update user's profile image
  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: { profileImage: imageUrl },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      profileImage: true,
    },
  });

  sendResponse(res, 200, 'Profile image uploaded successfully', updatedUser);
});

// Upload payment receipt (Authenticated users)
export const uploadPaymentReceipt = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const receiptUrl = `/uploads/files/${req.file.filename}`;

  // Update user's player profile with payment receipt
  const updatedProfile = await prisma.playerProfile.update({
    where: { userId: req.user!.id },
    data: { paymentReceiptUrl: receiptUrl },
  });

  sendResponse(res, 200, 'Payment receipt uploaded successfully', updatedProfile);
});

// Add this function
export const recordProfileView = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { viewerId, viewerName } = req.body;
  
  // Don't notify if viewing own profile
  if (viewerId === userId) {
    return sendResponse(res, 200, 'Own profile view - no notification needed');
  }
  
  // Create notification for the profile owner
  await prisma.notification.create({
    data: {
      userId: userId,
      type: 'PROFILE_VIEW' as any,
      title: '👀 Profile Viewed',
      message: `${viewerName} viewed your profile`,
      isRead: false,
    },
  });
  
  sendResponse(res, 200, 'Profile view recorded');
});
export const getPublicProfile = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      profileImage: true,
      createdAt: true,
      isSuperAdmin: true,
      // NO email, phone — keep private
      playerProfile: {
        select: {
          skillLevel: true,
          clubAffiliation: true,
          dateOfBirth: true,
          ranking: true,
          rankingNote: true,
        },
      },
    },
  });

  if (!user || user.role !== 'PLAYER') {
    throw new AppError('Player not found', 404);
  }

  sendResponse(res, 200, 'Public profile retrieved successfully', user);
});

export const getPublicPlayers = catchAsync(async (req: Request, res: Response) => {
  const players = await prisma.user.findMany({
    where: { role: 'PLAYER' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      createdAt: true,
      playerProfile: {
        select: {
          skillLevel: true,
          clubAffiliation: true,
          dateOfBirth: true,
        },
      },
    },
    orderBy: { firstName: 'asc' },
  });

  sendResponse(res, 200, 'Players retrieved successfully', players);
});
export const updatePlayerRanking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;                        // player userId
  const { ranking, rankingNote } = req.body;
  const adminId = req.user!.id;

  // Make sure target user is a player
  const user = await prisma.user.findUnique({
    where: { id },
    include: { playerProfile: true },
  });

  if (!user || user.role !== 'PLAYER') {
    throw new AppError('Player not found', 404);
  }

  if (!user.playerProfile) {
    throw new AppError('Player profile not found', 404);
  }

  // Validate ranking is a positive number
  if (ranking !== undefined && (ranking < 1 || !Number.isInteger(ranking))) {
    throw new AppError('Ranking must be a positive whole number', 400);
  }

  const updated = await prisma.playerProfile.update({
    where: { userId: id },
    data: {
      ranking:          ranking ?? null,
      rankingNote:      rankingNote ?? null,
      rankingUpdatedAt: new Date(),
      rankingUpdatedBy: adminId,
    } as any,
  });

  // Notify the player their ranking was updated
  if (ranking) {
    await prisma.notification.create({
      data: {
        userId: id,
        type: 'MATCH_RESULT' as any,
        title: '🏆 Ranking Updated',
        message: `Your ranking has been updated to #${ranking}${rankingNote ? ` — ${rankingNote}` : ''}.`,
      },
    });
  }

  sendResponse(res, 200, 'Player ranking updated successfully', updated);
});