/**
 * Resource Service
 * Handles operations related to educational resources
 */

import { ResourceAccess, ResourceType, SystemStatus, UserType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";

// Resource creation schema
export const createResourceSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.nativeEnum(ResourceType),
  url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  access: z.nativeEnum(ResourceAccess).default(ResourceAccess.PRIVATE),
  settings: z.record(z.any()).optional(),
  ownerId: z.string(),
  parentId: z.string().optional(),
});

// Resource update schema
export const updateResourceSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  access: z.nativeEnum(ResourceAccess).optional(),
  settings: z.record(z.any()).optional(),
  parentId: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Resource permission schema
export const resourcePermissionSchema = z.object({
  resourceId: z.string(),
  userId: z.string(),
  access: z.nativeEnum(ResourceAccess),
  settings: z.record(z.any()).optional(),
});

export class ResourceService extends ServiceBase {
  /**
   * Creates a new resource
   * @param data Resource data
   * @returns Created resource
   */
  async createResource(data: z.infer<typeof createResourceSchema>) {
    try {
      // Check if parent resource exists if parentId is provided
      if (data.parentId) {
        const parentResource = await this.prisma.resource.findUnique({
          where: { id: data.parentId },
        });

        if (!parentResource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent resource not found",
          });
        }

        // Ensure parent is a folder
        if (parentResource.type !== ResourceType.FOLDER) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Parent resource must be a folder",
          });
        }
      }

      // Create the resource
      const resource = await this.prisma.resource.create({
        data: {
          title: data.title,
          description: data.description,
          type: data.type,
          url: data.url,
          tags: data.tags || [],
          access: data.access,
          settings: data.settings || {},
          owner: {
            connect: { id: data.ownerId },
          },
          parent: data.parentId
            ? {
                connect: { id: data.parentId },
              }
            : undefined,
          status: SystemStatus.ACTIVE,
        },
      });

      return {
        success: true,
        resource,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create resource",
        cause: error,
      });
    }
  }

  /**
   * Gets a resource by ID
   * @param id Resource ID
   * @returns Resource
   */
  async getResource(id: string) {
    try {
      const resource = await this.prisma.resource.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          parent: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
          children: {
            where: {
              status: SystemStatus.ACTIVE,
            },
            select: {
              id: true,
              title: true,
              type: true,
              access: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          permissions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        });
      }

      return {
        success: true,
        resource,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get resource",
        cause: error,
      });
    }
  }

  /**
   * Updates a resource
   * @param data Resource update data
   * @returns Updated resource
   */
  async updateResource(data: z.infer<typeof updateResourceSchema>) {
    try {
      // Check if resource exists
      const existingResource = await this.prisma.resource.findUnique({
        where: { id: data.id },
      });

      if (!existingResource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        });
      }

      // Check if parent resource exists if parentId is provided
      if (data.parentId) {
        // Prevent circular references
        if (data.parentId === data.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Resource cannot be its own parent",
          });
        }

        const parentResource = await this.prisma.resource.findUnique({
          where: { id: data.parentId },
        });

        if (!parentResource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent resource not found",
          });
        }

        // Ensure parent is a folder
        if (parentResource.type !== ResourceType.FOLDER) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Parent resource must be a folder",
          });
        }
      }

      // Update the resource
      const resource = await this.prisma.resource.update({
        where: { id: data.id },
        data: {
          title: data.title,
          description: data.description,
          url: data.url,
          tags: data.tags,
          access: data.access,
          settings: data.settings,
          parentId: data.parentId,
          status: data.status,
        },
      });

      return {
        success: true,
        resource,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update resource",
        cause: error,
      });
    }
  }

  /**
   * Deletes a resource
   * @param id Resource ID
   * @returns Success status
   */
  async deleteResource(id: string) {
    try {
      // Check if resource exists
      const existingResource = await this.prisma.resource.findUnique({
        where: { id },
        include: {
          children: true,
        },
      });

      if (!existingResource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        });
      }

      // If it's a folder with children, soft delete all children
      if (existingResource.type === ResourceType.FOLDER && existingResource.children.length > 0) {
        await this.prisma.resource.updateMany({
          where: {
            parentId: id,
          },
          data: {
            status: SystemStatus.DELETED,
            deletedAt: new Date(),
          },
        });
      }

      // Soft delete the resource
      await this.prisma.resource.update({
        where: { id },
        data: {
          status: SystemStatus.DELETED,
          deletedAt: new Date(),
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete resource",
        cause: error,
      });
    }
  }

  /**
   * Gets resources by owner ID
   * @param ownerId Owner ID
   * @returns Resources
   */
  async getResourcesByOwner(ownerId: string) {
    try {
      const resources = await this.prisma.resource.findMany({
        where: {
          ownerId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          parent: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return {
        success: true,
        resources,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get resources by owner",
        cause: error,
      });
    }
  }

  /**
   * Adds a permission to a resource
   * @param data Permission data
   * @returns Created permission
   */
  async addResourcePermission(data: z.infer<typeof resourcePermissionSchema>) {
    try {
      // Check if resource exists
      const existingResource = await this.prisma.resource.findUnique({
        where: { id: data.resourceId },
      });

      if (!existingResource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        });
      }

      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      
      // Check if permission already exists
      const existingPermission = await this.prisma.resourcePermission.findFirst({
        where: {
          resourceId: data.resourceId,
          userId: data.userId,
        },
      });

      if (existingPermission) {
        // Update existing permission
        const permission = await this.prisma.resourcePermission.update({
          where: { id: existingPermission.id },
          data: {
            access: data.access,
            settings: data.settings || {},
          },
        });

        return {
          success: true,
          permission,
        };
      }

      // Create new permission
      const permission = await this.prisma.resourcePermission.create({
        data: {
          resource: {
            connect: { id: data.resourceId },
          },
          user: {
            connect: { id: data.userId },
          },
          access: data.access,
          settings: data.settings || {},
        },
      });

      return {
        success: true,
        permission,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add resource permission",
        cause: error,
      });
    }
  }

  /**
   * Removes a permission from a resource
   * @param resourceId Resource ID
   * @param userId User ID
   * @returns Success status
   */
  async removeResourcePermission(resourceId: string, userId: string) {
    try {
      // Check if permission exists
      const existingPermission = await this.prisma.resourcePermission.findFirst({
        where: {
          resourceId,
          userId,
        },
      });

      if (!existingPermission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource permission not found",
        });
      }

      // Delete the permission
      await this.prisma.resourcePermission.delete({
        where: { id: existingPermission.id },
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove resource permission",
        cause: error,
      });
    }
  }

  /**
   * Gets resources shared with a user
   * @param userId User ID
   * @returns Shared resources
   */
  async getSharedResources(userId: string) {
    try {
      const permissions = await this.prisma.resourcePermission.findMany({
        where: {
          userId,
        },
        include: {
          resource: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Filter out deleted resources
      const activeResources = permissions.filter(
        (p) => p.resource.status === SystemStatus.ACTIVE
      );

      return {
        success: true,
        resources: activeResources.map((p) => p.resource),
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get shared resources",
        cause: error,
      });
    }
  }
} 