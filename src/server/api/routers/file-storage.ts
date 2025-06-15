import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { 
  FileStorageService, 
  createFileSchema, 
  updateFileSchema, 
  fileQuerySchema 
} from "../services/file-storage.service";

export const fileStorageRouter = createTRPCRouter({
  // Save file metadata
  saveFileMetadata: protectedProcedure
    .input(createFileSchema)
    .mutation(async ({ ctx, input }) => {
      const fileStorageService = new FileStorageService({ prisma: ctx.prisma });
      return fileStorageService.createFile(input);
    }),

  // Get file by ID
  getFile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const fileStorageService = new FileStorageService({ prisma: ctx.prisma });
      return fileStorageService.getFile(input.id);
    }),

  // Update file
  updateFile: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateFileSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const fileStorageService = new FileStorageService({ prisma: ctx.prisma });
      return fileStorageService.updateFile(input.id, input.data);
    }),

  // Delete file
  deleteFile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const fileStorageService = new FileStorageService({ prisma: ctx.prisma });
      return fileStorageService.deleteFile(input.id);
    }),

  // Get files by query
  getFiles: protectedProcedure
    .input(fileQuerySchema)
    .query(async ({ ctx, input }) => {
      const fileStorageService = new FileStorageService({ prisma: ctx.prisma });
      return fileStorageService.getFilesByQuery(input);
    }),

  // Get files by entity
  getFilesByEntity: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const fileStorageService = new FileStorageService({ prisma: ctx.prisma });
      return fileStorageService.getFilesByEntity(input.entityType, input.entityId);
    }),

  // Get files by owner
  getFilesByOwner: protectedProcedure
    .input(z.object({ ownerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const fileStorageService = new FileStorageService({ prisma: ctx.prisma });
      return fileStorageService.getFilesByOwner(input.ownerId);
    }),
}); 