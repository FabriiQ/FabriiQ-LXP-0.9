import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { LearningTimeService } from '@/server/api/services/learning-time.service';
import { TRPCError } from '@trpc/server';

export const learningTimeRouter = createTRPCRouter({
  // Record time spent on an activity
  recordTimeSpent: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        timeSpentMinutes: z.number().min(0),
        startedAt: z.date().optional(),
        completedAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const learningTimeService = new LearningTimeService({ prisma: ctx.prisma });
      return learningTimeService.recordTimeSpent({
        studentId: ctx.session.user.id,
        activityId: input.activityId,
        timeSpentMinutes: input.timeSpentMinutes,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
      });
    }),

  // Batch record time spent on activities
  batchRecordTimeSpent: protectedProcedure
    .input(
      z.object({
        records: z.array(
          z.object({
            activityId: z.string(),
            timeSpentMinutes: z.number().min(0),
            startedAt: z.number(),
            completedAt: z.number(),
          })
        )
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const learningTimeService = new LearningTimeService({ prisma: ctx.prisma });
      return learningTimeService.batchRecordTimeSpent({
        studentId: ctx.session.user.id,
        records: input.records,
      });
    }),

  // Get learning time statistics
  getLearningTimeStats: protectedProcedure
    .input(
      z.object({
        classId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const learningTimeService = new LearningTimeService({ prisma: ctx.prisma });
      return learningTimeService.getLearningTimeStats({
        studentId: ctx.session.user.id,
        classId: input.classId,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),
});
