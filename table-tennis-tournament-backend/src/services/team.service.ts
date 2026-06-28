import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcrypt';

export class TeamService {
  // Helper method to generate random password
  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + 'Aa1';
  }

  // Create team (Player can create for doubles, Admin can create any)
  async createTeam(adminId: string, data: {
    name: string;
    tournamentId?: string;
    categoryId?: string;
    captainId: string;
    memberIds: string[];
    partnerDetails?: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  }) {
    const admin = await prisma.adminProfile.findUnique({
      where: { userId: adminId },
    });

    const isPlayerCreatingTeam = !admin && data.partnerDetails;

    // Allow if user is admin OR if it's a player creating a doubles team (with partner details)
    if (!admin && !data.partnerDetails) {
      throw new AppError('You must provide partner details for doubles registration', 403);
    }

    let partnerUser = null;
    
    // If partner details provided, create or find partner
    if (data.partnerDetails) {
      // Check if partner already exists
      partnerUser = await prisma.user.findUnique({
        where: { email: data.partnerDetails.email },
      });
      
      if (!partnerUser) {
        // Create new user for partner
        const randomPassword = this.generateRandomPassword();
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        partnerUser = await prisma.user.create({
          data: {
            email: data.partnerDetails.email,
            password: hashedPassword,
            firstName: data.partnerDetails.firstName,
            lastName: data.partnerDetails.lastName,
            phone: data.partnerDetails.phone,
            role: 'PLAYER',
            playerProfile: {
              create: {
                skillLevel: 'Intermediate',
              },
            },
          },
        });
        
        // Log credentials (in production, send email)
        console.log(`========================================`);
        console.log(`🔐 New Partner Account Created`);
        console.log(`📧 Email: ${data.partnerDetails.email}`);
        console.log(`🔑 Password: ${randomPassword}`);
        console.log(`========================================`);
      }
      
      data.memberIds.push(partnerUser.id);
    }

    // Verify captain exists
    const captain = await prisma.user.findFirst({
      where: { id: data.captainId, role: 'PLAYER' },
    });

    if (!captain) {
      throw new AppError('Captain must be a registered player', 404);
    }

    // Ensure captain is in member list
    if (!data.memberIds.includes(data.captainId)) {
      data.memberIds.push(data.captainId);
    }

    // Remove duplicates (in case captain was added twice)
    const uniqueMemberIds = [...new Set(data.memberIds)];

    // Verify all members are players
    const members = await prisma.user.findMany({
      where: {
        id: { in: uniqueMemberIds },
        role: 'PLAYER',
      },
    });

    if (members.length !== uniqueMemberIds.length) {
      throw new AppError('All team members must be registered players', 400);
    }

    // Create team
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: data.name,
          tournamentId: data.tournamentId,
          captainId: data.captainId,
        },
      });

      await Promise.all(
        uniqueMemberIds.map((memberId) =>
          tx.teamMember.create({
            data: {
              teamId: newTeam.id,
              playerId: memberId,
            },
          })
        )
      );

      return newTeam;
    });

    // Create tournament registration for the team
    if (data.tournamentId && data.categoryId) {
      await prisma.tournamentRegistration.create({
        data: {
          tournamentId: data.tournamentId,
          categoryId: data.categoryId,
          playerId: data.captainId,
          teamId: team.id,
          status: 'PENDING',
        },
      });
    }

    return team;
  }

  // Get team by ID
  async getTeamById(teamId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        captain: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                playerProfile: true,
              },
            },
          },
        },
        tournament: true,
      },
    });

    if (!team) {
      throw new AppError('Team not found', 404);
    }

    return team;
  }

  // Get all teams for tournament
  async getTournamentTeams(tournamentId: string) {
    const teams = await prisma.team.findMany({
      where: { tournamentId },
      include: {
        captain: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        members: {
          include: {
            player: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return teams;
  }
}