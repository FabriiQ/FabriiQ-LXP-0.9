import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { PermissionService } from "../services/permission.service";
import { AccessScope, SystemStatus, UserType } from "../types/user";
import { TRPCError } from "@trpc/server";

// Input validation schemas
const createPermissionSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  scope: z.enum(["SYSTEM", "MULTI_CAMPUS", "SINGLE_CAMPUS"]).transform(val => val as AccessScope),
  entityType: z.enum([
    "PROGRAM", "COURSE", "SUBJECT", "CLASS",
    "ASSESSMENT", "ACTIVITY", "FACILITY"
  ]).optional()
});

const updatePermissionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  scope: z.enum(["SYSTEM", "MULTI_CAMPUS", "SINGLE_CAMPUS"]).transform(val => val as AccessScope).optional(),
  entityType: z.enum([
    "PROGRAM", "COURSE", "SUBJECT", "CLASS",
    "ASSESSMENT", "ACTIVITY", "FACILITY"
  ]).optional(),
  status: z.enum([
    "ACTIVE", "INACTIVE", "ARCHIVED", "DELETED",
    "ARCHIVED_CURRENT_YEAR", "ARCHIVED_PREVIOUS_YEAR", "ARCHIVED_HISTORICAL"
  ]).transform(val => val as SystemStatus).optional()
});

const assignPermissionSchema = z.object({
  userId: z.string(),
  permissionId: z.string(),
  campusId: z.string().optional()
});

const revokePermissionSchema = z.object({
  userId: z.string(),
  permissionId: z.string(),
  campusId: z.string().optional()
});

const listPermissionsSchema = z.object({
  scope: z.enum(["SYSTEM", "MULTI_CAMPUS", "SINGLE_CAMPUS"]).transform(val => val as AccessScope).optional(),
  entityType: z.enum([
    "PROGRAM", "COURSE", "SUBJECT", "CLASS",
    "ASSESSMENT", "ACTIVITY", "FACILITY"
  ]).optional(),
  status: z.enum([
    "ACTIVE", "INACTIVE", "ARCHIVED", "DELETED",
    "ARCHIVED_CURRENT_YEAR", "ARCHIVED_PREVIOUS_YEAR", "ARCHIVED_HISTORICAL"
  ]).transform(val => val as SystemStatus).optional(),
  search: z.string().optional(),
  skip: z.number().optional(),
  take: z.number().optional()
});

const listUserPermissionsSchema = z.object({
  userId: z.string().optional(),
  permissionId: z.string().optional(),
  campusId: z.string().optional(),
  status: z.enum([
    "ACTIVE", "INACTIVE", "ARCHIVED", "DELETED",
    "ARCHIVED_CURRENT_YEAR", "ARCHIVED_PREVIOUS_YEAR", "ARCHIVED_HISTORICAL"
  ]).transform(val => val as SystemStatus).optional(),
  skip: z.number().optional(),
  take: z.number().optional()
});

const setupRolePermissionsSchema = z.object({
  userId: z.string(),
  userType: z.enum([
    "SYSTEM_ADMIN", "SYSTEM_MANAGER",
    "CAMPUS_ADMIN", "CAMPUS_COORDINATOR", "CAMPUS_PRINCIPAL",
    "CAMPUS_TEACHER", "CAMPUS_STUDENT",
    "CAMPUS_PARENT"
  ]).transform(val => val as UserType),
  campusId: z.string().optional()
});

const validatePermissionSchema = z.object({
  permissionCode: z.string(),
  campusId: z.string().optional()
});

export const permissionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createPermissionSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new PermissionService({ prisma: ctx.prisma });
      return service.createPermission(input);
    }),

  get: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const service = new PermissionService({ prisma: ctx.prisma });
      return service.getPermission(input);
    }),

  update: protectedProcedure
    .input(updatePermissionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const service = new PermissionService({ prisma: ctx.prisma });
      return service.updatePermission(id, data);
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const service = new PermissionService({ prisma: ctx.prisma });
      return service.deletePermission(input);
    }),

  list: protectedProcedure
    .input(listPermissionsSchema)
    .query(async ({ ctx, input }) => {
      const { skip, take, ...filters } = input;
      const service = new PermissionService({ prisma: ctx.prisma });
      return service.listPermissions(filters, skip, take);
    }),

  assign: protectedProcedure
    .input(assignPermissionSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new PermissionService({ prisma: ctx.prisma });
      return service.assignPermission(input);
    }),

  revoke: protectedProcedure
    .input(revokePermissionSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new PermissionService({ prisma: ctx.prisma });
      return service.revokePermission(input);
    }),

  listUserPermissions: protectedProcedure
    .input(listUserPermissionsSchema)
    .query(async ({ ctx, input }) => {
      const { skip, take, ...filters } = input;
      const service = new PermissionService({ prisma: ctx.prisma });
      return service.listUserPermissions(filters, skip, take);
    }),

  setupRolePermissions: protectedProcedure
    .input(setupRolePermissionsSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new PermissionService({ prisma: ctx.prisma });
      return service.setupDefaultRolePermissions(input.userId, input.userType, input.campusId);
    }),

  validate: protectedProcedure
    .input(validatePermissionSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found in session",
        });
      }

      const service = new PermissionService({ prisma: ctx.prisma });
      return service.validatePermission(
        ctx.session.userId,
        input.permissionCode,
        input.campusId || undefined
      );
    })
});