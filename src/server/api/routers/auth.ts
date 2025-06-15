import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { AuthService } from "../services/auth.service";
import { logger } from "../utils/logger";
import { z } from "zod";
import { withRateLimit } from "../middleware/rate-limit.middleware";
import { UserType } from "../constants";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ensureUserPrimaryCampus } from "../utils/user-helpers";

/**
 * Authentication Router
 * Handles authentication-related API endpoints
 * Note: Most authentication is now handled by Auth.js directly
 * This router provides additional functionality and backward compatibility
 */

// Input validation schemas
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  userType: z.enum(["USER", "ADMIN", "TEACHER", "STUDENT", "PARENT"]),
  institutionId: z.string().optional()
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address")
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters")
});

export const authRouter = createTRPCRouter({
  /**
   * Get the current session
   * This is a wrapper around Auth.js getServerSession
   */
  getSession: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const session = await getServerSession(authOptions);
        
        if (!session) {
          return { user: null };
        }
        
        // Get additional user data from the database if needed
        const user = await ctx.prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            userType: true,
            status: true,
            institutionId: true,
            primaryCampusId: true,
            lastLoginAt: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    code: true
                  }
                }
              }
            },
            activeCampuses: {
              where: { status: 'ACTIVE' },
              select: {
                campusId: true,
                roleType: true,
                status: true
              }
            }
          }
        });
        
        if (!user) {
          logger.warn("Session user not found in database", { userId: session.user.id });
          return { user: null };
        }
        
        // For CAMPUS_ADMIN users, ensure they have a primary campus
        let primaryCampusId = user.primaryCampusId;
        if (user.userType === "CAMPUS_ADMIN" && !primaryCampusId) {
          primaryCampusId = await ensureUserPrimaryCampus(user.id);
        }
        
        // Transform permissions to string array
        const permissions = user.permissions.map(p => p.permission.code);
        
        // Get campus access
        const campuses = user.activeCampuses.map(access => access.campusId);
        
        // Get institution access if applicable
        let institutions: string[] = [];
        if (user.institutionId) {
          institutions.push(user.institutionId);
        }
        
        // Return the user with session data
        return {
          user: {
            ...user,
            primaryCampusId,
            permissions,
            accessScope: { 
              global: user.userType === "SYSTEM_ADMIN",
              institutions,
              campuses
            }
          }
        };
      } catch (error) {
        logger.error("Error getting session", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get session"
        });
      }
    }),

  /**
   * Register a new user
   * This is still handled by our API since Auth.js doesn't provide registration
   */
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const authService = new AuthService({ prisma: ctx.prisma });
        
        // Check if username or email already exists
        const existingUser = await ctx.prisma.user.findFirst({
          where: {
            OR: [
              { username: input.username },
              { email: input.email }
            ]
          }
        });
        
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: existingUser.username === input.username
              ? "Username already exists"
              : "Email already exists"
          });
        }
        
        // Create the user with institutionId as empty string if undefined
        const result = await authService.createUser({
          name: input.name,
          email: input.email,
          username: input.username,
          password: input.password,
          userType: input.userType as UserType,
          institutionId: input.institutionId || ""
        });
        
        return {
          success: true,
          user: {
            id: result.id,
            name: result.name,
            email: result.email,
            username: result.username,
            userType: result.userType
          }
        };
      } catch (error) {
        logger.error("Registration error", { error, input: { ...input, password: "REDACTED" } });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to register user"
        });
      }
    }),

  /**
   * Request password reset
   */
  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const authService = new AuthService({ prisma: ctx.prisma });
        await authService.requestPasswordReset(input.email);
        
        return {
          success: true,
          message: "If an account with that email exists, a password reset link has been sent."
        };
      } catch (error) {
        logger.error("Forgot password error", { error, email: input.email });
        
        // Always return success for security reasons
        return {
          success: true,
          message: "If an account with that email exists, a password reset link has been sent."
        };
      }
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const authService = new AuthService({ prisma: ctx.prisma });
        await authService.resetPassword({
          resetToken: input.token,
          newPassword: input.password
        });
        
        return {
          success: true,
          message: "Password has been reset successfully."
        };
      } catch (error) {
        logger.error("Reset password error", { error, token: input.token });
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token."
        });
      }
    }),

  /**
   * Change password (authenticated)
   */
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to change your password."
          });
        }
        
        const authService = new AuthService({ prisma: ctx.prisma });
        await authService.changePassword({
          userId: ctx.session.user.id,
          currentPassword: input.currentPassword,
          newPassword: input.newPassword
        });
        
        return {
          success: true,
          message: "Password changed successfully."
        };
      } catch (error) {
        logger.error("Change password error", { error, userId: ctx.session?.user?.id });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to change password."
        });
      }
    }),

  /**
   * Get the current user profile
   * This is a wrapper around Auth.js getServerSession with additional user data
   */
  getProfile: publicProcedure
    .query(async ({ ctx }) => {
      try {
        const session = await getServerSession(authOptions);
        
        if (!session || !session.user) {
          return { user: null };
        }
        
        // Get the user from the database with additional data
        const user = await ctx.prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            userType: true,
            status: true,
            institutionId: true,
            lastLoginAt: true
          }
        });
        
        if (!user) {
          logger.warn("User from session not found in database", { userId: session.user.id });
          return { user: null };
        }
        
        // Get user permissions
        const permissions = await ctx.prisma.userPermission.findMany({
          where: { userId: user.id }
        });
        
        // Get user campus access
        const activeCampuses = await ctx.prisma.userCampusAccess.findMany({
          where: { userId: user.id }
        });
        
        // Return the user with additional data
        return {
          user: {
            ...user,
            permissions: permissions.map(p => p.permissionId),
            accessScope: { 
              global: user.userType === "SYSTEM_ADMIN", 
              institutions: [], 
              campuses: activeCampuses.map(c => c.campusId) 
            },
            activeCampuses,
            primaryCampusId: null
          }
        };
      } catch (error) {
        logger.error('Error getting user profile', { error });
        // Return null instead of throwing an error to prevent client-side crashes
        return { user: null };
      }
    })
}); 
