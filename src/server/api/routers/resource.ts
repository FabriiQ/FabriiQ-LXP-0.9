import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ResourceService } from "../services/resource.service";
import { SystemStatus } from "../types/user";
import { ResourceAccess, ResourceType } from "../types/resource";
import { TRPCError } from "@trpc/server";

// Input validation schemas
const createResourceSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.nativeEnum(ResourceType),
  url: z.string(),
  access: z.nativeEnum(ResourceAccess),
  ownerId: z.string(),
  parentId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  settings: z.record(z.unknown()).optional(),
});

const updateResourceSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  type: z.nativeEnum(ResourceType).optional(),
  url: z.string().optional(),
  access: z.nativeEnum(ResourceAccess).optional(),
  parentId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  settings: z.record(z.unknown()).optional(),
  status: z.enum([
    "ACTIVE",
    "INACTIVE",
    "ARCHIVED",
    "DELETED",
    "ARCHIVED_CURRENT_YEAR",
    "ARCHIVED_PREVIOUS_YEAR",
    "ARCHIVED_HISTORICAL",
  ]).transform(val => val as SystemStatus).optional(),
});

const listResourcesSchema = z.object({
  type: z.nativeEnum(ResourceType).optional(),
  access: z.nativeEnum(ResourceAccess).optional(),
  ownerId: z.string().optional(),
  parentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum([
    "ACTIVE",
    "INACTIVE",
    "ARCHIVED",
    "DELETED",
    "ARCHIVED_CURRENT_YEAR",
    "ARCHIVED_PREVIOUS_YEAR",
    "ARCHIVED_HISTORICAL",
  ]).transform(val => val as SystemStatus).optional(),
  search: z.string().optional(),
  skip: z.number().optional(),
  take: z.number().optional(),
});

const resourcePermissionSchema = z.object({
  resourceId: z.string(),
  userId: z.string(),
  access: z.nativeEnum(ResourceAccess),
  settings: z.record(z.unknown()).optional(),
});

const bulkCreateSchema = z.object({
  resources: z.array(createResourceSchema),
});

export const resourceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createResourceSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ResourceService({ prisma: ctx.prisma });
      return service.createResource(input);
    }),

  get: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const service = new ResourceService({ prisma: ctx.prisma });
      return service.getResource(input);
    }),

  update: protectedProcedure
    .input(updateResourceSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ResourceService({ prisma: ctx.prisma });
      return service.updateResource(input);
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const service = new ResourceService({ prisma: ctx.prisma });
      return service.deleteResource(input);
    }),

  list: protectedProcedure
    .input(listResourcesSchema)
    .query(async ({ ctx, input }) => {
      const { ownerId } = input;
      const service = new ResourceService({ prisma: ctx.prisma });
      
      if (ownerId) {
        return service.getResourcesByOwner(ownerId);
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Owner ID is required for listing resources"
        });
      }
    }),

  setPermission: protectedProcedure
    .input(resourcePermissionSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ResourceService({ prisma: ctx.prisma });
      return service.addResourcePermission(input);
    }),

  removePermission: protectedProcedure
    .input(z.object({
      resourceId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new ResourceService({ prisma: ctx.prisma });
      return service.removeResourcePermission(input.resourceId, input.userId);
    }),

  bulkCreate: protectedProcedure
    .input(bulkCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Handle bulk creation by creating resources one by one
      const service = new ResourceService({ prisma: ctx.prisma });
      const results = [];
      
      for (const resource of input.resources) {
        try {
          const result = await service.createResource(resource);
          results.push(result);
        } catch (error) {
          results.push({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
      }
      
      return { results };
    }),

  getStats: protectedProcedure
    .input(z.string().optional())
    .query(async ({ ctx, input }) => {
      const service = new ResourceService({ prisma: ctx.prisma });
      const userId = input || ctx.session.userId;
      
      if (!userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User ID is required for resource statistics"
        });
      }
      
      // Get resources by owner as a simple stat
      const result = await service.getResourcesByOwner(userId);
      
      if (!result.success || !result.resources) {
        return {
          totalResources: 0,
          byType: {},
          byAccess: {}
        };
      }
      
      const resources = result.resources;
      
      return {
        totalResources: resources.length,
        byType: resources.reduce((acc: Record<string, number>, resource: any) => {
          const type = resource.type as string;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
        byAccess: resources.reduce((acc: Record<string, number>, resource: any) => {
          const access = resource.access as string;
          acc[access] = (acc[access] || 0) + 1;
          return acc;
        }, {})
      };
    }),
}); 