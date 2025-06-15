import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { ActivityJourneyService } from "../services/activity-journey.service";

export const activityJourneyRouter = createTRPCRouter({
  // Create a journey event for a completed activity
  createActivityJourneyEvent: protectedProcedure
    .input(z.object({
      activityGradeId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const activityJourneyService = new ActivityJourneyService({ prisma: ctx.prisma });
      return activityJourneyService.createActivityJourneyEvent(input.activityGradeId);
    }),

  // Generate journey events for all completed activities for a student
  generateJourneyEventsForStudent: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      classId: z.string().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const activityJourneyService = new ActivityJourneyService({ prisma: ctx.prisma });
      return activityJourneyService.generateJourneyEventsForStudent(
        input.studentId,
        input.classId,
        input.limit
      );
    }),
});
