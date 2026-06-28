import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { config } from '../config/env';
import { sendWelcomeEmail } from './email.service';

export class AuthService {
    // Register new user with Admin Approval Workflow
    async register(userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        role: 'ADMIN' | 'REFEREE' | 'PLAYER';
        adminRequestReason?: string;
        playerProfile?: {
            dateOfBirth?: Date;
            skillLevel?: string;
            clubAffiliation?: string;
            paymentReceiptUrl?: string;
        };
        refereeProfile?: {
            certification?: string;
            experienceYears?: number;
        };
        adminProfile?: {
            department?: string;
        };
    }) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (existingUser) {
            throw new AppError('Email already exists', 400);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, config.BCRYPT_SALT_ROUNDS);

        // Create user with role-specific profile in a transaction
        const user = await prisma.$transaction(async (tx: any) => {
            // Set admin request status if registering as ADMIN
            let adminRequestStatus = 'NONE';
            let adminRequestedAt = null;
            let finalRole = userData.role;
            
            if (userData.role === 'ADMIN') {
                adminRequestStatus = 'PENDING';
                adminRequestedAt = new Date();
                finalRole = 'PLAYER'; // Temporarily set as PLAYER until approved
            }

            // Create base user
            const newUser = await tx.user.create({
                data: {
                    email: userData.email,
                    password: hashedPassword,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    phone: userData.phone,
                    role: finalRole,
                    adminRequestStatus,
                    adminRequestedAt,
                },
            });

            // Create role-specific profile (NOT for ADMIN yet - wait for approval)
            if (userData.role === 'PLAYER' && userData.playerProfile) {
                await tx.playerProfile.create({
                    data: {
                        userId: newUser.id,
                        dateOfBirth: userData.playerProfile.dateOfBirth,
                        skillLevel: userData.playerProfile.skillLevel,
                        clubAffiliation: userData.playerProfile.clubAffiliation,
                        paymentReceiptUrl: userData.playerProfile.paymentReceiptUrl,
                    },
                });
            } else if (userData.role === 'REFEREE' && userData.refereeProfile) {
                await tx.refereeProfile.create({
                    data: {
                        userId: newUser.id,
                        certification: userData.refereeProfile.certification,
                        experienceYears: userData.refereeProfile.experienceYears,
                    },
                });
            }
            // DO NOT create AdminProfile here - it will be created after approval

            return newUser;
        });

        // NOTIFY EXISTING ADMINS ABOUT NEW ADMIN REQUEST
        if (userData.role === 'ADMIN') {
            try {
                // Get all existing admins
                const existingAdmins = await prisma.user.findMany({
                    where: { role: 'ADMIN' },
                    select: { id: true },
                });

                // Create notifications for all admins
                if (existingAdmins.length > 0) {
                    await Promise.all(
                        existingAdmins.map((admin: any) =>
                            prisma.notification.create({
                                data: {
                                    userId: admin.id,
                                    type: 'NEW_ADMIN_REQUEST',
                                    title: '👑 New Admin Request',
                                    message: `${userData.firstName} ${userData.lastName} (${userData.email}) has requested to become an administrator. Go to Admin Requests to review.`,
                                    createdAt: new Date(),
                                },
                            })
                        )
                    );
                    console.log(`📧 Notified ${existingAdmins.length} admin(s) about new request`);
                }
            } catch (error) {
                console.error('Failed to notify admins:', error);
            }
        }
        
        // Send automated welcome email alert
        sendWelcomeEmail(userData.email, userData.firstName).catch(console.error);

        // Generate JWT token
        const token = this.generateToken(user.id);

        // Return user without password
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: userData.role === 'ADMIN' ? 'PENDING_ADMIN' : user.role,
                adminRequestStatus: user.adminRequestStatus,
                isEmailVerified: true,
            } as any,
            token,
            message: 'Registration successful! Please check your email to verify your account.',
        };
    }

    // Login user
    async login(email: string, password: string) {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                playerProfile: true,
                refereeProfile: true,
                adminProfile: true,
            },
        });

        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        /*if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }
        if (!user.isEmailVerified) {
  throw new AppError(
    'Please verify your email address before logging in. Check your inbox for the verification link.',
    403
  );
}*/

        // Generate token
        const token = this.generateToken(user.id);

        // Get role-specific profile
        let profile = null;
        if (user.role === 'PLAYER') profile = user.playerProfile;
        else if (user.role === 'REFEREE') profile = user.refereeProfile;
        else if (user.role === 'ADMIN') profile = user.adminProfile;

        // Return user without password
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                adminRequestStatus: user.adminRequestStatus,
                isSuperAdmin: user.isSuperAdmin ?? false,
                profile,
            },
            token,
        };
    }

    // Generate JWT token
    private generateToken(userId: string): string {
        try {
            const payload = { userId };
            const secret: string = config.JWT_SECRET;
            return jwt.sign(payload, secret, { expiresIn: '7d' });
        } catch (error) {
            console.error('Token generation error:', error);
            throw new AppError('Error generating authentication token', 500);
        }
    }

    // Verify token and get user
    async verifyToken(token: string) {
        try {
            const secret: string = config.JWT_SECRET;
            const decoded = jwt.verify(token, secret) as { userId: string };

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    adminRequestStatus: true,
                    isSuperAdmin: true,
                },
            });

            if (!user) {
                throw new AppError('User not found', 401);
            }

            return user;
        } catch (error) {
            throw new AppError('Invalid token', 401);
        }
    }

    // Forgot password - generate reset token
    /*async forgotPassword(email: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { message: 'If your email is registered, you will receive a reset link.' };
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000);

        await prisma.user.update({
            where: { email },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpiry: resetTokenExpiry,
            },
        });

        try {
            await sendPasswordResetEmail(email, resetToken);
            return { message: 'Password reset link sent to your email.' };
        } catch (error) {
            console.error('Email sending failed:', error);
            return { message: 'Failed to send reset email. Please try again later.' };
        }
    }*/

    // Reset password - verify token and set new password
    async resetPassword(token: string, newPassword: string) {
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            throw new AppError('Invalid or expired reset token', 400);
        }

        const hashedPassword = await bcrypt.hash(newPassword, config.BCRYPT_SALT_ROUNDS);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpiry: null,
            },
        });

        return { message: 'Password reset successful. You can now login with your new password.' };
    }
    /*async verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token },
  });

  if (!user) {
    throw new AppError('Invalid or expired verification link', 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
    },
  });

  return {
    message: 'Email verified successfully! You can now log in.',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  };
}

// Resend verification email
async resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { message: 'If that email is registered, a verification link has been sent.' };
  }

  if (user.isEmailVerified) {
    throw new AppError('This email is already verified.', 400);
  }

  const token = crypto.randomBytes(32).toString('hex');

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerificationToken: token },
  });

  await sendVerificationEmail(email, token, user.firstName);
  return { message: 'Verification email sent! Please check your inbox.' };
}*/
}