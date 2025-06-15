import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "@prisma/client";
import { UserType } from "../constants";

// Create learning time record schema
const createLearningTimeRecordSchema = z.object({
  studentId: z.string(),
  activityId: z.string(),
  classId: z.string(),
  activityGradeId: z.string().optional(),
  timeSpentMinutes: z.number().min(1),
  startedAt: z.date(),
  completedAt: z.date(),
});

// Update learning time record schema
const updateLearningTimeRecordSchema = z.object({
  id: z.string(),
  timeSpentMinutes: z.number().min(1).optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  activityGradeId: z.string().optional(),
});

export const learningTimeRecordRouter = createTRPCRouter({
  // Create a new learning time record
  create: protectedProcedure
    .input(createLearningTimeRecordSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Create the learning time record
        const learningTimeRecord = await ctx.prisma.learningTimeRecord.create({
          data: {
            studentId: input.studentId,
            activityId: input.activityId,
            classId: input.classId,
            activityGradeId: input.activityGradeId,
            timeSpentMinutes: input.timeSpentMinutes,
            startedAt: input.startedAt,
            completedAt: input.completedAt,
          },
        });

        return learningTimeRecord;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create learning time record: ${(error as Error).message}`,
        });
      }
    }),

  // Update a learning time record
  update: protectedProcedure
    .input(updateLearningTimeRecordSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Update the learning time record
        const learningTimeRecord = await ctx.prisma.learningTimeRecord.update({
          where: { id: input.id },
          data: {
            timeSpentMinutes: input.timeSpentMinutes,
            startedAt: input.startedAt,
            completedAt: input.completedAt,
            activityGradeId: input.activityGradeId,
          },
        });

        return learningTimeRecord;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update learning time record: ${(error as Error).message}`,
        });
      }
    }),

  // Get learning time records for a student
  getByStudent: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      classId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Build where condition
        const whereCondition: any = {
          studentId: input.studentId,
        };

        // Add class filter if provided
        if (input.classId) {
          whereCondition.classId = input.classId;
        }

        // Get learning time records
        const learningTimeRecords = await ctx.prisma.learningTimeRecord.findMany({
          where: whereCondition,
          include: {
            activity: {
              include: {
                subject: true,
                topic: true,
              },
            },
            activityGrade: true,
          },
          orderBy: {
            completedAt: "desc",
          },
        });

        return learningTimeRecords;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get learning time records: ${(error as Error).message}`,
        });
      }
    }),

  // Get learning time records for an activity
  getByActivity: protectedProcedure
    .input(z.object({
      activityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get learning time records
        const learningTimeRecords = await ctx.prisma.learningTimeRecord.findMany({
          where: {
            activityId: input.activityId,
          },
          include: {
            student: {
              include: {
                user: true,
              },
            },
            activityGrade: true,
          },
          orderBy: {
            completedAt: "desc",
          },
        });

        return learningTimeRecords;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get learning time records: ${(error as Error).message}`,
        });
      }
    }),
});
