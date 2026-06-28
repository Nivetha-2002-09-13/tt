import { z } from 'zod';

// Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number
const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

// Registration validation schema
export const registerSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: passwordSchema,
        firstName: z.string().min(2, 'First name must be at least 2 characters'),
        lastName: z.string().min(2, 'Last name must be at least 2 characters'),
        phone: z.string().optional(),
        role: z.enum(['ADMIN', 'REFEREE', 'PLAYER']),

        // Role-specific profiles (optional based on role)
        playerProfile: z.object({
            dateOfBirth: z.string().datetime().optional(),
            skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Professional']).optional(),
            clubAffiliation: z.string().optional(),
        }).optional(),

        refereeProfile: z.object({
            certification: z.string().optional(),
            experienceYears: z.number().int().min(0).optional(),
        }).optional(),

        adminProfile: z.object({
            department: z.string().optional(),
        }).optional(),
    }).refine(data => {
        // If role is PLAYER, playerProfile should be provided
        if (data.role === 'PLAYER' && !data.playerProfile) {
            return false;
        }
        // If role is REFEREE, refereeProfile should be provided
        if (data.role === 'REFEREE' && !data.refereeProfile) {
            return false;
        }
        return true;
    }, {
        message: 'Role-specific profile is required',
        path: ['role'],
    }),
});

// Login validation schema
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
    }),
});

// Forgot password validation
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

// Reset password validation
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});