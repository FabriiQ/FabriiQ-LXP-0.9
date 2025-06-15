import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "@prisma/client";
import { PersonalBestService } from "../services/personal-best.service";

export const personalBestRouter = createTRPCRouter({
  // Create a new personal best
  createPersonalBest: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        title: z.string(),
        value: z.union([z.string(), z.number()]),
        date: z.date(),
        type: z.string(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        activityId: z.string().optional(),
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

      const personalBestService = new PersonalBestService({ prisma: ctx.prisma });
      return personalBestService.createPersonalBest(input);
    }),

  // Get personal bests for a student
  getStudentPersonalBests: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        type: z.string().optional(),
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

      const personalBestService = new PersonalBestService({ prisma: ctx.prisma });
      return personalBestService.getStudentPersonalBests(
        input.studentId,
        {
          classId: input.classId,
          subjectId: input.subjectId,
          type: input.type,
        }
      );
    }),

  // Delete a personal best
  deletePersonalBest: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const personalBestService = new PersonalBestService({ prisma: ctx.prisma });
      return personalBestService.deletePersonalBest(input);
    }),

  // Check and update personal best
  checkAndUpdatePersonalBest: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        title: z.string(),
        value: z.union([z.string(), z.number()]),
        type: z.string(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        activityId: z.string().optional(),
        icon: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        compareFunction: z.enum(['greater', 'lesser', 'equal']).default('greater'),
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

      const personalBestService = new PersonalBestService({ prisma: ctx.prisma });
      return personalBestService.checkAndUpdatePersonalBest(input);
    }),
});
