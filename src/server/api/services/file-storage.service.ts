/**
 * File Storage Service
 * Handles operations related to file storage and management
 */

import { SystemStatus, Prisma, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";

// File creation schema
export const createFileSchema = z.object({
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  path: z.string(),
  bucket: z.string().optional(),
  key: z.string().optional(),
  url: z.string().optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  ownerId: z.string(),
});

// File update schema
export const updateFileSchema = z.object({
  filename: z.string().optional(),
  originalName: z.string().optional(),
  mimeType: z.string().optional(),
  size: z.number().optional(),
  path: z.string().optional(),
  bucket: z.string().optional(),
  key: z.string().optional(),
  url: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// File query schema
export const fileQuerySchema = z.object({
  ownerId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mimeType: z.string().optional(),
  isPublic: z.boolean().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

export class FileStorageService extends ServiceBase {
  /**
   * Creates a new file record
   * @param data File data
   * @returns Created file
   */
  async createFile(data: z.infer<typeof createFileSchema>) {
    try {
      const file = await this.prisma.$transaction(async (tx) => {
        // Create file record
        return (tx as any).file.create({
          data: {
            ...data,
            tags: data.tags || [],
            status: SystemStatus.ACTIVE,
          },
        });
      });

      return {
        success: true,
        file,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create file record",
        cause: error,
      });
    }
  }

  /**
   * Gets a file by ID
   * @param id File ID
   * @returns File
   */
  async getFile(id: string) {
    try {
      const file = await (this.prisma as any).file.findUnique({
        where: { id },
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      return {
        success: true,
        file,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get file",
        cause: error,
      });
    }
  }

  /**
   * Updates a file
   * @param id File ID
   * @param data Update data
   * @returns Updated file
   */
  async updateFile(id: string, data: z.infer<typeof updateFileSchema>) {
    try {
      // Check if file exists
      const existingFile = await (this.prisma as any).file.findUnique({
        where: { id },
      });

      if (!existingFile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      // Update file
      const updatedFile = await (this.prisma as any).file.update({
        where: { id },
        data,
      });

      return {
        success: true,
        file: updatedFile,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update file",
        cause: error,
      });
    }
  }

  /**
   * Deletes a file (soft delete)
   * @param id File ID
   * @returns Success status
   */
  async deleteFile(id: string) {
    try {
      // Check if file exists
      const file = await (this.prisma as any).file.findUnique({
        where: { id },
      });

      if (!file) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "File not found",
        });
      }

      // Delete file (soft delete)
      await (this.prisma as any).file.update({
        where: { id },
        data: {
          status: SystemStatus.DELETED,
        },
      });

      return {
        success: true,
        message: "File deleted successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete file",
        cause: error,
      });
    }
  }

  /**
   * Gets files by query
   * @param query Query parameters
   * @returns Files
   */
  async getFilesByQuery(query: z.infer<typeof fileQuerySchema>) {
    try {
      const whereClause: any = {
        status: query.status || SystemStatus.ACTIVE,
      };

      if (query.ownerId) {
        whereClause.ownerId = query.ownerId;
      }

      if (query.entityType) {
        whereClause.entityType = query.entityType;
      }

      if (query.entityId) {
        whereClause.entityId = query.entityId;
      }

      if (query.mimeType) {
        whereClause.mimeType = query.mimeType;
      }

      if (query.isPublic !== undefined) {
        whereClause.isPublic = query.isPublic;
      }

      if (query.tags && query.tags.length > 0) {
        whereClause.tags = {
          hasSome: query.tags,
        };
      }

      const files = await (this.prisma as any).file.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        files,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get files",
        cause: error,
      });
    }
  }

  /**
   * Gets files by owner
   * @param ownerId Owner ID
   * @returns Files
   */
  async getFilesByOwner(ownerId: string) {
    try {
      const files = await (this.prisma as any).file.findMany({
        where: {
          ownerId,
          status: SystemStatus.ACTIVE,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        files,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get files by owner",
        cause: error,
      });
    }
  }

  /**
   * Gets files by entity
   * @param entityType Entity type
   * @param entityId Entity ID
   * @returns Files
   */
  async getFilesByEntity(entityType: string, entityId: string) {
    try {
      const files = await (this.prisma as any).file.findMany({
        where: {
          entityType,
          entityId,
          status: SystemStatus.ACTIVE,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        files,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get files by entity",
        cause: error,
      });
    }
  }
} 