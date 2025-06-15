import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "@prisma/client";
import { JourneyEventService } from "../services/journey-event.service";

// Define the event type enum
const JourneyEventTypeEnum = z.enum([
  'achievement',
  'level',
  'activity',
  'enrollment',
  'milestone'
]);

export const journeyEventRouter = createTRPCRouter({
  // Create a new journey event
  createJourneyEvent: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        title: z.string(),
        description: z.string(),
        date: z.date(),
        type: JourneyEventTypeEnum,
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        icon: z.string().optional(),
        metadata: z.record(z.any()).optional(),
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

      const journeyEventService = new JourneyEventService({ prisma: ctx.prisma });
      return journeyEventService.createJourneyEvent(input);
    }),

  // Get journey events for a student
  getStudentJourneyEvents: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        type: JourneyEventTypeEnum.optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
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

      const journeyEventService = new JourneyEventService({ prisma: ctx.prisma });
      return journeyEventService.getStudentJourneyEvents(
        input.studentId,
        {
          classId: input.classId,
          subjectId: input.subjectId,
          type: input.type,
          startDate: input.startDate,
          endDate: input.endDate,
          limit: input.limit,
        }
      );
    }),

  // Delete a journey event
  deleteJourneyEvent: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const journeyEventService = new JourneyEventService({ prisma: ctx.prisma });
      return journeyEventService.deleteJourneyEvent(input);
    }),
});
