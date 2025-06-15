import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { AchievementService } from "../services/achievement.service";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "@prisma/client";

export const achievementRouter = createTRPCRouter({
  // Create a new achievement
  createAchievement: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        title: z.string(),
        description: z.string(),
        type: z.string(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        progress: z.number().default(0),
        total: z.number(),
        icon: z.string().optional(),
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

      const achievementService = new AchievementService({ prisma: ctx.prisma });
      return achievementService.createAchievement(input);
    }),

  // Update achievement progress
  updateAchievementProgress: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        progress: z.number(),
        unlocked: z.boolean().optional(),
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

      const achievementService = new AchievementService({ prisma: ctx.prisma });
      return achievementService.updateAchievementProgress(input);
    }),

  // Get achievements for a student
  getStudentAchievements: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        type: z.string().optional(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        unlocked: z.boolean().optional(),
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

      const achievementService = new AchievementService({ prisma: ctx.prisma });
      return achievementService.getStudentAchievements(
        input.studentId,
        {
          type: input.type,
          classId: input.classId,
          subjectId: input.subjectId,
          unlocked: input.unlocked,
        }
      );
    }),

  // Get a specific achievement by ID
  getAchievementById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const achievementService = new AchievementService({ prisma: ctx.prisma });
      return achievementService.getAchievementById(input);
    }),

  // Check and update achievement progress
  checkAndUpdateProgress: protectedProcedure
    .input(
      z.object({
        achievementId: z.string(),
        progressIncrement: z.number().default(1),
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

      const achievementService = new AchievementService({ prisma: ctx.prisma });
      return achievementService.checkAndUpdateProgress(
        input.achievementId,
        input.progressIncrement
      );
    }),

  // Delete an achievement
  deleteAchievement: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const achievementService = new AchievementService({ prisma: ctx.prisma });
      return achievementService.deleteAchievement(input);
    }),
});
