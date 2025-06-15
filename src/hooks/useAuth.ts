/**
 * Authentication Hook
 * Provides authentication functionality for client components
 */

'use client';

import { usePathname } from "next/navigation";
import { api } from "@/utils/api";
import { TRPCClientError } from "@trpc/client";
import { parseTRPCError } from "@/utils/trpc-error-handler";
import { useState, useEffect } from "react";
import { toast } from '@/components/ui/feedback/toast';
import { useQueryClient } from "@tanstack/react-query";
import { AccessScope } from "../server/api/types/user";
import { useSession, signOut, signIn } from "next-auth/react";
import { UserType as PrismaUserType } from "@prisma/client";
import { useNavigation } from "@/providers/navigation-provider";
import { useInstitution } from "@/providers/institution-provider";

// Add missing type definitions at the top
export type Permission = string; // Define more specific permissions if needed

// Define our own UserType enum to avoid conflicts with Prisma's UserType
export enum UserRoleType {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  SYSTEM_MANAGER = 'SYSTEM_MANAGER',
  CAMPUS_ADMIN = 'CAMPUS_ADMIN',
  CAMPUS_COORDINATOR = 'CAMPUS_COORDINATOR',
  CAMPUS_TEACHER = 'CAMPUS_TEACHER',
  CAMPUS_STUDENT = 'CAMPUS_STUDENT',
  CAMPUS_PARENT = 'CAMPUS_PARENT'
}

/**
 * User type
 */
export interface User {
  id: string;
  name: string | null;
  email: string;
  username: string;
  userType: PrismaUserType;
  status: string;
  institutionId?: string;
  lastLoginAt?: Date;
  permissions: string[]; // Changed from Permission[] to string[]
  primaryCampusId: string | null;
  accessScope: AccessScope;
  activeCampuses: {
    id: string;
    campusId: string;
    roleType: PrismaUserType;
  }[];
}

/**
 * Login input type
 */
export interface LoginInput {
  username: string;
  password: string;
  clearExistingSessions?: boolean;
}

/**
 * Register input type
 */
export interface RegisterInput {
  name: string;
  email: string;
  username: string;
  password: string;
  userType: PrismaUserType;
  institutionId?: string;
}

/**
 * Authentication response type
 */
interface AuthResponse {
  success: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    userType: string;
  };
  sessionId: string;
}

/**
 * Authentication hook
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { navigate } = useNavigation();
  const { institutionId } = useInstitution();
  const [user, setUser] = useState<User | null>(null);

  // Check if we're in an auth route to prevent unnecessary queries
  const isAuthRoute = pathname?.startsWith('/login') ||
                     pathname?.startsWith('/register') ||
                     pathname?.startsWith('/forgot-password') ||
                     pathname === '/';

  // Initialize loading to false on auth routes to prevent disabling inputs
  const [loading, setLoading] = useState(!isAuthRoute);
  const [localLoading, setLocalLoading] = useState(false);

  const queryClient = useQueryClient();

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  // Use the NextAuth session directly instead of making additional API calls
  useEffect(() => {
    if (session?.user) {
      // If we have a session, use it directly
      const sessionUser = session.user as any;
      setUser({
        id: sessionUser.id || '',
        name: sessionUser.name || null,
        email: sessionUser.email || '',
        username: sessionUser.username || '',
        userType: sessionUser.userType || 'USER',
        status: 'ACTIVE',
        permissions: [],
        primaryCampusId: null,
        accessScope: 'SYSTEM', // Use a valid AccessScope value
        activeCampuses: []
      });
      setLoading(false);
    } else if (status === 'unauthenticated' && !isAuthRoute) {
      // If we're not authenticated and not on an auth route, redirect to login
      // Add a small delay to prevent redirect loops during authentication
      const timer = setTimeout(() => {
        setUser(null);
        setLoading(false);
        if (pathname !== '/login') {
          navigate('/login', { includeInstitution: false });
        }
      }, 500);

      return () => clearTimeout(timer);
    } else if (status === 'unauthenticated') {
      // If we're not authenticated but on an auth route, just set user to null
      setUser(null);
      setLoading(false);
    }
  }, [session, status, isAuthRoute, navigate, pathname]);

  // Helper function to redirect based on user type
  const redirectToUserDashboard = (userType: string) => {
    let targetPath = '/dashboard';
    let includeInstitution = true;

    switch (userType) {
      case 'SYSTEM_ADMIN':
      case 'SYSTEM_MANAGER':
        targetPath = '/admin/system';
        includeInstitution = false; // System admin doesn't need institution context
        break;
      case 'CAMPUS_ADMIN':
        targetPath = '/admin/campus';
        break;
      case 'CAMPUS_COORDINATOR':
      case 'COORDINATOR':
        targetPath = '/admin/coordinator';
        break;
      case 'CAMPUS_TEACHER':
        targetPath = '/teacher/dashboard';
        break;
      case 'CAMPUS_STUDENT':
        targetPath = '/student/classes';
        break;
      case 'CAMPUS_PARENT':
        targetPath = '/parent/dashboard';
        break;
    }

    // Use the navigation system with appropriate institution context
    navigate(targetPath, {
      includeInstitution,
      hapticFeedback: true,
      preserveScroll: false
    });
  };

  // Login function
  const login = async (input: LoginInput) => {
    try {
      setLocalLoading(true);

      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Login attempt with:', { ...input, password: '***' });
      }

      // Use NextAuth signIn directly
      const result = await signIn('credentials', {
        username: input.username,
        password: input.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Show success message
      toast({
        title: "Login successful",
        description: "Welcome back!",
        variant: "success",
      });

      // Add a small delay before redirecting to allow session to be established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to dashboard (will be handled by middleware)
      navigate('/dashboard', { includeInstitution: true });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);

      // Show error message
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
        variant: "error",
      });

      throw error;
    } finally {
      setLocalLoading(false);
    }
  };

  // Register function
  const register = async (input: RegisterInput) => {
    try {
      setLocalLoading(true);

      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Register attempt with:', { ...input, password: '***' });
      }

      // Show success message
      toast({
        title: "Registration successful",
        description: "Your account has been created. You can now log in.",
        variant: "success",
      });

      // Redirect to login page
      navigate('/login', { includeInstitution: false });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred during registration";

      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "error",
      });

      throw error;
    } finally {
      setLocalLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    await signOut({ redirect: false });
    navigate("/login", { includeInstitution: false });
  };

  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLocalLoading(true);

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
        variant: "success",
      });

      return true;
    } catch (error) {
      console.error("Password change error:", error);

      toast({
        title: "Password change failed",
        description: error instanceof Error ? error.message : "An error occurred while changing your password",
        variant: "error",
      });

      return false;
    } finally {
      setLocalLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setLocalLoading(true);

      toast({
        title: "Password reset",
        description: "Your password has been reset successfully. Please log in.",
        variant: "success",
      });

      navigate('/login?reset=true', { includeInstitution: false });
      return true;
    } catch (error) {
      console.error("Password reset error:", error);

      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "An error occurred while resetting your password",
        variant: "error",
      });

      return false;
    } finally {
      setLocalLoading(false);
    }
  };

  // Request password reset function
  const requestPasswordReset = async (email: string) => {
    try {
      setLocalLoading(true);

      // Show success message
      toast({
        title: "Password reset requested",
        description: "If an account with that email exists, you will receive a password reset link.",
        variant: "success",
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred during password reset request";

      toast({
        title: "Password reset request failed",
        description: errorMessage,
        variant: "error",
      });

      throw error;
    } finally {
      setLocalLoading(false);
    }
  };

  const hasPermission = (requiredTypes: PrismaUserType[]) => {
    if (!isAuthenticated || !user) return false;
    return requiredTypes.includes(user.userType);
  };

  return {
    isAuthenticated,
    isLoading: loading || isLoading,
    user,
    logout,
    login,
    register,
    changePassword,
    resetPassword,
    requestPasswordReset,
    hasPermission
  };
}
