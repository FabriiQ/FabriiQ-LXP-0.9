/**
 * Authentication Schemas
 * Validation schemas for authentication-related operations
 */

import { z } from "zod";
import { UserType } from "../constants";
import { SYSTEM_CONFIG } from "../constants";

/**
 * Registration schema
 * Validates user registration input
 */
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(SYSTEM_CONFIG.SECURITY.PASSWORD_MIN_LENGTH),
  name: z.string(),
  username: z.string(),
  userType: z.nativeEnum(UserType),
  institutionId: z.string(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.date().optional(),
  profileData: z.record(z.unknown()).optional(),
});

/**
 * Login schema
 * Validates user login input
 */
export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

/**
 * Update profile schema
 * Validates profile update input
 */
export const updateProfileSchema = z.object({
  name: z.string().optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.date().optional(),
  profileData: z.record(z.unknown()).optional(),
});

/**
 * Change password schema
 * Validates password change input
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(SYSTEM_CONFIG.SECURITY.PASSWORD_MIN_LENGTH),
});

/**
 * Forgot password schema
 * Validates forgot password input
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

/**
 * Reset password schema
 * Validates password reset input
 */
export const resetPasswordSchema = z.object({
  resetToken: z.string(),
  newPassword: z.string().min(SYSTEM_CONFIG.SECURITY.PASSWORD_MIN_LENGTH),
}); 