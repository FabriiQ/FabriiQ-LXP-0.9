/**
 * AI Content Studio Router
 * Handles API routes for AI-generated content (worksheets, activities, assessments)
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus, ActivityPurpose } from "@prisma/client";
import { AIContentStudioService } from "../services/ai-content-studio.service";
import { cacheWorksheetQuery, CACHE_CONFIG } from "../cache";

// Define the input types to match the service interfaces
interface CreateWorksheetInput {
  title: string;
  content: any;
  teacherId: string;
  subjectId?: string;
  topicId?: string;
}

interface UpdateWorksheetInput {
  id: string;
  title?: string;
  content?: any;
  subjectId?: string;
  topicId?: string;
  status?: SystemStatus;
}

interface ConvertToActivityInput {
  worksheetId: string;
  classId: string;
  activityType: ActivityPurpose;
  isGradable?: boolean;
  maxScore?: number;
  passingScore?: number;
  lessonPlanId?: string; // Add lessonPlanId for linking to lesson plan
}

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
  lessonPlanId: z.string().optional(), // Add lessonPlanId for linking to lesson plan
});

export const aiContentStudioRouter = createTRPCRouter({
  createWorksheet: protectedProcedure
    .input(createWorksheetSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = new AIContentStudioService({ prisma: ctx.prisma });
        return await service.createWorksheet(input as CreateWorksheetInput);
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

  getWorksheetById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const service = new AIContentStudioService({ prisma: ctx.prisma });

        // Use the caching utility to cache the worksheet query
        const getWorksheetCached = cacheWorksheetQuery(
          async (id: string) => await service.getWorksheet(id)
        );

        return await getWorksheetCached(input.id);
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

  listWorksheetsByTeacher: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      status: z.nativeEnum(SystemStatus).optional().default(SystemStatus.ACTIVE),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const service = new AIContentStudioService({ prisma: ctx.prisma });

        // Use the caching utility to cache the worksheets query
        const getWorksheetsByTeacherCached = cacheWorksheetQuery(
          async (teacherId: string, status: SystemStatus) =>
            await service.getWorksheetsByTeacher(teacherId, status)
        );

        return await getWorksheetsByTeacherCached(input.teacherId, input.status);
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

  updateWorksheet: protectedProcedure
    .input(updateWorksheetSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = new AIContentStudioService({ prisma: ctx.prisma });
        return await service.updateWorksheet(input as UpdateWorksheetInput);
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

  deleteWorksheet: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const service = new AIContentStudioService({ prisma: ctx.prisma });
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
        const service = new AIContentStudioService({ prisma: ctx.prisma });
        return await service.convertToActivity(input as ConvertToActivityInput);
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
