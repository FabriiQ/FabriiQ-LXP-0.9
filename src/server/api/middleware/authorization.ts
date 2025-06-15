/**
 * Authorization Middleware
 * Provides granular permission-based access control for the application
 * Updated to work with Auth.js
 */

import { TRPCError } from "@trpc/server";
import { type Context } from "../trpc";
import { PermissionService } from "../services/permission.service";
import { UserType, AccessScope, EntityType, SystemStatus } from "@prisma/client";
import { logger } from "../utils/logger";
import type { PermissionCheck } from "../types";
import { ACADEMIC_CYCLE_PERMISSIONS, ROLE_PERMISSIONS } from '../constants/permissions';
import { Session } from "next-auth";

// Define types for permissions
type PermissionArray = readonly string[];

interface UserPermission {
  permission: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    status: SystemStatus;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    scope: AccessScope;
    entityType: EntityType | null;
  };
  campusId?: string | null;
}

interface ActiveCampus {
  campusId: string;
}

/**
 * Basic permission check function
 */
export const checkPermission = (userType: UserType, permission: string) => {
  if (userType === 'SYSTEM_ADMIN') {
    return true;
  }
  
  const rolePermissions = (ROLE_PERMISSIONS[userType as keyof typeof ROLE_PERMISSIONS] || []) as PermissionArray;
  return rolePermissions.includes(permission);
};

/**
 * Ensures user is authenticated
 * This middleware is now handled directly in the protectedProcedure in trpc.ts
 * Keeping this for backward compatibility
 */
export const isAuthenticated = async ({ ctx, next }: { ctx: Context; next: () => Promise<any> }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  
  return next();
};

/**
 * Middleware to require a specific permission
 */
export const requirePermission = (permission: string) => {
  return async ({ ctx, next }: { ctx: Context; next: () => Promise<any> }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    
    const userType = ctx.session.user.userType as UserType;
    
    // System admins have all permissions
    if (userType === 'SYSTEM_ADMIN') {
      return next();
    }
    
    // Check if the user has the required permission
    const hasPermission = checkPermission(userType, permission);
    
    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing required permission: ${permission}`,
      });
    }
    
    return next();
  };
};

/**
 * Middleware to check if user has a specific permission
 */
export const hasPermission = (permissionCode: string) => {
  return async ({ ctx, next }: { ctx: Context; next: () => Promise<any> }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    
    const userType = ctx.session.user.userType as UserType;
    
    // System admins have all permissions
    if (userType === 'SYSTEM_ADMIN') {
      // Create a new context with permission check result
      const result = await next();
      return {
        ...result,
        permissionCheck: { hasPermission: true }
      };
    }
    
    // Check if the user has the required permission
    const hasRequiredPermission = checkPermission(userType, permissionCode);
    
    // Create a new context with permission check result
    const result = await next();
    return {
      ...result,
      permissionCheck: { hasPermission: hasRequiredPermission }
    };
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 */
export const hasAnyPermission = (permissionCodes: string[]) => {
  return async ({ ctx, next }: { ctx: Context; next: () => Promise<any> }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    
    const userType = ctx.session.user.userType as UserType;
    
    // System admins have all permissions
    if (userType === 'SYSTEM_ADMIN') {
      // Create a new context with permission check result
      const result = await next();
      return {
        ...result,
        permissionCheck: { hasPermission: true }
      };
    }
    
    // Check if the user has any of the required permissions
    const hasAnyRequiredPermission = permissionCodes.some(code => 
      checkPermission(userType, code)
    );
    
    // Create a new context with permission check result
    const result = await next();
    return {
      ...result,
      permissionCheck: { hasPermission: hasAnyRequiredPermission }
    };
  };
};

/**
 * Middleware to check if user has all of the specified permissions
 */
export const hasAllPermissions = (permissionCodes: string[]) => {
  return async ({ ctx, next }: { ctx: Context; next: () => Promise<any> }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    
    const userType = ctx.session.user.userType as UserType;
    
    // System admins have all permissions
    if (userType === 'SYSTEM_ADMIN') {
      // Create a new context with permission check result
      const result = await next();
      return {
        ...result,
        permissionCheck: { hasPermission: true }
      };
    }
    
    // Check if the user has all of the required permissions
    const hasAllRequiredPermissions = permissionCodes.every(code => 
      checkPermission(userType, code)
    );
    
    // Create a new context with permission check result
    const result = await next();
    return {
      ...result,
      permissionCheck: { hasPermission: hasAllRequiredPermissions }
    };
  };
};

/**
 * Middleware to check if user has a specific role
 */
export const hasRole = (role: UserType) => {
  return async ({ ctx, next }: { ctx: Context; next: () => Promise<any> }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    
    const userType = ctx.session.user.userType as UserType;
    
    // Check if the user has the required role
    const hasRequiredRole = userType === role;
    
    if (!hasRequiredRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Required role: ${role}, but user has role: ${userType}`,
      });
    }
    
    return next();
  };
};

/**
 * Validates if a user belongs to a specific campus
 * @param campusIdField - The field in the input that contains the campus ID
 */
export const belongsToCampus = (campusIdField: string) => {
  return async ({ ctx, next, rawInput }: { ctx: Context; next: () => Promise<any>; rawInput: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const userId = ctx.session.user?.id;
    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User ID is required",
      });
    }

    // System admins can access any campus
    if (ctx.session.user?.userType === 'SYSTEM_ADMIN') {
      return next();
    }

    const input = rawInput as Record<string, unknown>;
    const campusId = input[campusIdField] as string;

    if (!campusId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Campus ID is required in field: ${campusIdField}`,
      });
    }

    // Check if user belongs to the campus
    const userCampusAccess = await ctx.prisma.userCampusAccess.findFirst({
      where: {
        userId,
        campusId,
        status: 'ACTIVE'
      }
    });

    if (!userCampusAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this campus",
      });
    }

    return next();
  };
};

/**
 * Validates if a user belongs to a specific institution
 * @param institutionIdField - The field in the input that contains the institution ID
 */
export const belongsToInstitution = (institutionIdField: string) => {
  return async ({ ctx, next, rawInput }: { ctx: Context; next: () => Promise<any>; rawInput: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const userId = ctx.session.user?.id;
    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User ID is required",
      });
    }

    // System admins can access any institution
    if (ctx.session.user?.userType === 'SYSTEM_ADMIN') {
      return next();
    }

    const input = rawInput as Record<string, unknown>;
    const institutionId = input[institutionIdField] as string;

    if (!institutionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Institution ID is required in field: ${institutionIdField}`,
      });
    }

    // Check if user belongs to the institution
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { institutionId: true }
    });

    if (!user || user.institutionId !== institutionId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this institution",
      });
    }

    return next();
  };
};

/**
 * Validates if a user is the owner of a resource
 * @param resourceIdField - The field in the input that contains the resource ID
 * @param resourceType - The type of resource to check ownership for
 */
export const isResourceOwner = (resourceIdField: string, resourceType: string) => {
  return async ({ ctx, next, rawInput }: { ctx: Context; next: () => Promise<any>; rawInput: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const userId = ctx.session.user?.id;
    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User ID is required",
      });
    }

    // System admins can access any resource
    if (ctx.session.user?.userType === 'SYSTEM_ADMIN') {
      return next();
    }

    const input = rawInput as Record<string, unknown>;
    const resourceId = input[resourceIdField] as string;

    if (!resourceId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Resource ID is required in field: ${resourceIdField}`,
      });
    }

    // Check resource ownership based on resource type
    let isOwner = false;

    // Since we don't have a clear view of all models and their relationships,
    // we'll implement a simplified version that can be expanded later
    switch (resourceType) {
      case 'resource':
        const resource = await ctx.prisma.resource.findUnique({
          where: { id: resourceId },
          select: { ownerId: true }
        });
        isOwner = resource?.ownerId === userId;
        break;
      
      // Add more resource types as needed
      
      default:
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported resource type: ${resourceType}`,
        });
    }

    if (!isOwner) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not the owner of this resource",
      });
    }

    return next();
  };
};