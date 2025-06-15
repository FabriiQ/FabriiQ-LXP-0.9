/**
 * Worksheet Router
 * Handles API routes for AI-generated worksheets
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus, ActivityPurpose } from "@prisma/client";
import { WorksheetService } from "../services/worksheet.service";

// Create worksheet schema
const createWorksheetSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.any(),
  teacherId: z.string(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
});

// Update worksheet schema
const updateWorksheetSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required").optional(),
  content: z.any().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Convert to activity schema
const convertToActivitySchema = z.object({
  worksheetId: z.string(),
  classId: z.string(),
  activityType: z.nativeEnum(ActivityPurpose),
  isGradable: z.boolean().optional(),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
});

export const worksheetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createWorksheetSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = new WorksheetService({ prisma: ctx.prisma });
        return await service.createWorksheet(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create worksheet: ${(error as Error).message}`,
        });
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const service = new WorksheetService({ prisma: ctx.prisma });
        return await service.getWorksheet(input.id);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get worksheet: ${(error as Error).message}`,
        });
      }
    }),

  listByTeacher: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      status: z.nativeEnum(SystemStatus).optional().default(SystemStatus.ACTIVE),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const service = new WorksheetService({ prisma: ctx.prisma });
        return await service.getWorksheetsByTeacher(input.teacherId, input.status);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get worksheets: ${(error as Error).message}`,
        });
      }
    }),

  update: protectedProcedure
    .input(updateWorksheetSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = new WorksheetService({ prisma: ctx.prisma });
        return await service.updateWorksheet(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update worksheet: ${(error as Error).message}`,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const service = new WorksheetService({ prisma: ctx.prisma });
        return await service.deleteWorksheet(input.id);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete worksheet: ${(error as Error).message}`,
        });
      }
    }),

  convertToActivity: protectedProcedure
    .input(convertToActivitySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = new WorksheetService({ prisma: ctx.prisma });
        return await service.convertToActivity(input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to convert worksheet to activity: ${(error as Error).message}`,
        });
      }
    }),
});
