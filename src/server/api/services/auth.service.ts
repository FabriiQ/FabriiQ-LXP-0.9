/**
 * Authentication Service
 * Handles user authentication, registration, and password management
 * Updated to work with Auth.js
 */

import { TRPCError } from "@trpc/server";
import { hash, compare } from "bcryptjs";
import { randomBytes } from 'crypto';
import { PrismaClient } from "@prisma/client";
import { UserType, AccessScope, SystemStatus, SYSTEM_CONFIG } from "../constants";
import { hashPassword, verifyPassword } from "../utils/auth";
import crypto from "crypto";
import { logger } from '../utils/logger';
import { 
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema
} from '../schemas/auth';
import { z } from "zod";
import { randomUUID } from 'crypto';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Define input types based on the schemas
type LoginInput = z.infer<typeof loginSchema>;
type RegisterInput = z.infer<typeof registerSchema>;
type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

interface AuthServiceConfig {
  prisma: PrismaClient;
  saltRounds?: number;
  resetTokenExpiryHours?: number;
}

interface Permission {
  id: string;
  code: string;
  scope: AccessScope;
}

interface AuthenticatedUser {
  id: string;
  name: string | null;
  email: string;
  username: string;
  userType: UserType;
  institutionId: string;
  permissions: Permission[];
  primaryCampusId: string | null;
  accessScope: AccessScope;
  activeCampuses: { id: string; campusId: string; roleType: UserType }[];
}

export class AuthService {
  private prisma: PrismaClient;
  private saltRounds: number;
  private resetTokenExpiryHours: number;

  constructor(config: AuthServiceConfig) {
    this.prisma = config.prisma;
    this.saltRounds = config.saltRounds ?? 10;
    this.resetTokenExpiryHours = config.resetTokenExpiryHours ?? 24;
  }

  /**
   * Get the current session using Auth.js
   */
  async getSession() {
    try {
      const session = await getServerSession(authOptions);
      return session;
    } catch (error) {
      logger.error('Error getting session', { error });
      return null;
    }
  }

  /**
   * Get user by ID with permissions and active campuses
   */
  async getUserById(userId: string): Promise<AuthenticatedUser | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          activeCampuses: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email || "",
        username: user.username,
        userType: user.userType as UserType,
        institutionId: user.institutionId || '',
        permissions: user.permissions.map(p => ({
          id: p.permission.id,
          code: p.permission.code,
          scope: p.permission.scope as AccessScope,
        })),
        primaryCampusId: user.primaryCampusId,
        accessScope: user.accessScope as AccessScope,
        activeCampuses: user.activeCampuses.map(c => ({
          id: c.id,
          campusId: c.campusId,
          roleType: c.roleType as UserType,
        })),
      };
    } catch (error) {
      logger.error('Error getting user by ID', { error, userId });
      return null;
    }
  }

  /**
   * Register a new user
   */
  async register(input: RegisterInput) {
    try {
      logger.debug('Registering new user', { email: input.email });
      
      // Check if username or email already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username: input.username },
            { email: input.email },
          ],
          institutionId: input.institutionId,
        },
      });

      if (existingUser) {
        if (existingUser.email === input.email) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Email already in use'
          });
        } else {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Username already taken'
          });
        }
      }

      // Hash password
      const hashedPassword = await hash(input.password, this.saltRounds);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          username: input.username,
          password: hashedPassword,
          phoneNumber: input.phoneNumber,
          userType: input.userType as UserType,
          institution: {
            connect: {
              id: input.institutionId
            }
          },
          profileData: input.profileData as any,
          status: SystemStatus.ACTIVE,
          accessScope: AccessScope.SINGLE_CAMPUS,
        },
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      
      logger.info('User registered successfully', { 
        userId: user.id,
        email: user.email
      });
      
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      logger.error('Error registering user', { error, email: input.email });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to register user'
      });
    }
  }

  /**
   * Create a new user (for Auth.js integration)
   */
  async createUser(userData: {
    name: string;
    email: string;
    username: string;
    password: string;
    userType: UserType;
    institutionId?: string;
    phoneNumber?: string;
    profileData?: Record<string, any>;
  }) {
    try {
      // Hash password
      const hashedPassword = await hash(userData.password, this.saltRounds);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          username: userData.username,
          password: hashedPassword,
          phoneNumber: userData.phoneNumber || '',
          userType: userData.userType,
          institutionId: userData.institutionId || '',
          profileData: userData.profileData || {},
          status: SystemStatus.ACTIVE,
          accessScope: AccessScope.SINGLE_CAMPUS,
        },
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      
      logger.info('User created successfully', { 
        userId: user.id,
        email: user.email
      });
      
      return userWithoutPassword;
    } catch (error) {
      logger.error('Error creating user', { error, email: userData.email });
      throw new Error('Failed to create user');
    }
  }

  /**
   * Login a user - Auth.js now handles this, but keeping for backward compatibility
   */
  async login(input: LoginInput) {
    try {
      logger.debug('User login attempt', { username: input.username });
      
      // For development, check if this is a mock user
      if (process.env.NODE_ENV === 'development') {
        // Check for mock users in development mode
        const mockUsers: Record<string, { password: string; userType: string }> = {
          "sysadmin": { password: "password123", userType: "SYSTEM_ADMIN" },
          "manager": { password: "password123", userType: "SYSTEM_MANAGER" },
          "admin": { password: "password123", userType: "CAMPUS_ADMIN" },
          "teacher": { password: "password123", userType: "CAMPUS_TEACHER" },
          "student": { password: "password123", userType: "CAMPUS_STUDENT" },
          "parent": { password: "password123", userType: "CAMPUS_PARENT" }
        };
        
        const mockUser = mockUsers[input.username.toLowerCase()];
        if (mockUser && mockUser.password === input.password) {
          logger.info('Using mock user for development', { username: input.username });
          
          // Create a test user if it doesn't exist already
          let user = await this.prisma.user.findFirst({
            where: { username: input.username }
          });
          
          if (!user) {
            user = await this.prisma.user.create({
              data: {
                username: input.username,
                email: `${input.username}@example.com`,
                name: input.username.charAt(0).toUpperCase() + input.username.slice(1),
                password: await hash(input.password, this.saltRounds),
                userType: mockUser.userType as UserType,
                institutionId: "dev-institution",
                status: SystemStatus.ACTIVE,
                accessScope: AccessScope.SINGLE_CAMPUS
              }
            });
            logger.info('Created mock development user', { userId: user.id, username: user.username });
          }
          
          // Return authenticated user info
          const authUser: AuthenticatedUser = {
            id: user.id,
            name: user.name,
            email: user.email || "",
            username: user.username,
            userType: user.userType as UserType,
            institutionId: user.institutionId,
            permissions: [],
            activeCampuses: [],
            primaryCampusId: null,
            accessScope: user.accessScope as AccessScope,
          };
          
          return {
            user: authUser,
            sessionId: randomUUID(), // Generate a temporary session ID
          };
        }
      }
      
      // Real user validation for non-mock users
      try {
        const user = await this.validateCredentials(input);
        
        // Update last login timestamp
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
        
        logger.info('User validated successfully', { 
          userId: user.id
        });
        
        return {
          user,
          sessionId: randomUUID(), // Generate a temporary session ID for backward compatibility
        };
      } catch (validationError) {
        // Pass through authentication errors directly
        if (validationError instanceof TRPCError) {
          throw validationError;
        }
        
        // Log and throw validation errors
        logger.error('User validation error', { error: validationError, username: input.username });
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        });
      }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      logger.error('Error during login', { error, username: input.username });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Login failed'
      });
    }
  }

  /**
   * Validate user credentials
   */
  private async validateCredentials(credentials: LoginInput): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findFirst({
      where: {
        username: credentials.username,
        status: SystemStatus.ACTIVE,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        activeCampuses: true,
      },
    });

    if (!user) {
      logger.debug('User not found or inactive', { username: credentials.username });
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });
    }

    if (!user.password) {
      logger.debug('User has no password set', { username: credentials.username, userId: user.id });
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });
    }

    try {
      const isPasswordValid = await verifyPassword(credentials.password, user.password);
      if (!isPasswordValid) {
        logger.debug('Password validation failed', { username: credentials.username });
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }
    } catch (error) {
      logger.error('Error verifying password', { 
        error, 
        username: credentials.username,
        userId: user.id 
      });
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email || "",
      username: user.username,
      userType: user.userType as UserType,
      institutionId: user.institutionId,
      permissions: user.permissions.map((p: any) => ({
        id: p.permission.id,
        code: p.permission.code,
        scope: p.permission.scope as AccessScope,
      })),
      activeCampuses: user.activeCampuses.map((c: any) => ({
        id: c.id,
        campusId: c.campusId,
        roleType: c.roleType as UserType,
      })),
      primaryCampusId: user.primaryCampusId,
      accessScope: user.accessScope as AccessScope,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        updatedAt: new Date(),
        name: input.name,
        phoneNumber: input.phoneNumber,
        dateOfBirth: input.dateOfBirth,
        profileData: input.profileData as any,
      },
    });

    return updatedUser;
  }

  /**
   * Change user password
   */
  async changePassword(params: { 
    userId: string; 
    currentPassword: string; 
    newPassword: string 
  }) {
    try {
      const { userId, currentPassword, newPassword } = params;
      
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.password) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Verify current password
      const isPasswordValid = await compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const hashedPassword = await hash(newPassword, this.saltRounds);

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      logger.info('Password changed successfully', { userId });

      return true;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      logger.error('Error changing password', { error, userId: params.userId });
      throw new Error('Failed to change password');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    try {
      // Find user by email
      const user = await this.prisma.user.findFirst({
        where: { email, status: SystemStatus.ACTIVE },
      });

      if (!user) {
        logger.debug('User not found for password reset', { email });
        // Don't throw error for security reasons
        return;
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + this.resetTokenExpiryHours * 60 * 60 * 1000);

      // Save reset token to database
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      logger.info('Password reset requested', { userId: user.id, email });

      // In a real application, you would send an email with the reset link
      // For now, we'll just log it
      logger.info('Reset link:', { 
        resetLink: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`,
        userId: user.id
      });

      return;
    } catch (error) {
      logger.error('Error requesting password reset', { error, email });
      throw new Error('Failed to request password reset');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(params: { resetToken: string; newPassword: string }) {
    try {
      const { resetToken, newPassword } = params;
      
      // Find user by reset token
      const user = await this.prisma.user.findFirst({
        where: {
          resetToken,
          resetTokenExpiry: {
            gt: new Date(),
          },
          status: SystemStatus.ACTIVE,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      // Hash new password
      const hashedPassword = await hash(newPassword, this.saltRounds);

      // Update password and clear reset token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      logger.info('Password reset successfully', { userId: user.id });

      return true;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      logger.error('Error resetting password', { error, resetToken: params.resetToken });
      throw new Error('Failed to reset password');
    }
  }

  /**
   * Logs out a user - Auth.js now handles this, but keeping for backward compatibility
   */
  async logout(userId: string) {
    try {
      logger.debug('User logout', { userId });
      logger.info('User logged out successfully', { userId });
      return true;
    } catch (error) {
      logger.error('Error during logout', { error, userId });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Logout failed'
      });
    }
  }
} 

