import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { PointsService } from "../services/points.service";
import { TRPCError } from "@trpc/server";

export const pointsRouter = createTRPCRouter({
  // Award points to a student
  awardPoints: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        amount: z.number(),
        source: z.string(),
        sourceId: z.string().optional(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const pointsService = new PointsService({ prisma: ctx.prisma });
      return pointsService.awardPoints(input);
    }),

  // Get points history for a student
  getPointsHistory: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        source: z.string().optional(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const pointsService = new PointsService({ prisma: ctx.prisma });
      return pointsService.getPointsHistory(input.studentId, {
        source: input.source,
        classId: input.classId,
        subjectId: input.subjectId,
        startDate: input.startDate,
        endDate: input.endDate,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  // Get points summary for a student
  getPointsSummary: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const pointsService = new PointsService({ prisma: ctx.prisma });
      return pointsService.getPointsSummary(input.studentId, {
        classId: input.classId,
        subjectId: input.subjectId,
      });
    }),

  // Get leaderboard data
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        type: z.enum(['class', 'subject', 'overall']),
        referenceId: z.string().optional(),
        timeframe: z.enum(['daily', 'weekly', 'monthly', 'term', 'all-time']).default('all-time'),
        limit: z.number().min(1).max(100).optional().default(10),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const pointsService = new PointsService({ prisma: ctx.prisma });
      return pointsService.getLeaderboard({
        type: input.type,
        referenceId: input.referenceId,
        timeframe: input.timeframe,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  // Create a leaderboard snapshot
  createLeaderboardSnapshot: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        referenceId: z.string(),
        limit: z.number().min(1).max(1000).optional().default(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const pointsService = new PointsService({ prisma: ctx.prisma });
      await pointsService.createLeaderboardSnapshot({
        type: input.type,
        referenceId: input.referenceId,
        limit: input.limit,
      });

      return { success: true };
    }),

  // Get historical leaderboard data
  getHistoricalLeaderboard: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        referenceId: z.string(),
        date: z.date().optional(),
        limit: z.number().min(1).max(100).optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const pointsService = new PointsService({ prisma: ctx.prisma });
      return pointsService.getHistoricalLeaderboard({
        type: input.type,
        referenceId: input.referenceId,
        date: input.date,
        limit: input.limit,
      });
    }),
});
