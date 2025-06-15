import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { LevelService } from "../services/level.service";
import { TRPCError } from "@trpc/server";

export const levelRouter = createTRPCRouter({
  // Initialize a student's level
  initializeStudentLevel: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        classId: z.string().optional(),
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

      const levelService = new LevelService({ prisma: ctx.prisma });
      return levelService.initializeStudentLevel(input.studentId, input.classId);
    }),

  // Add experience points to a student
  addExperience: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        expPoints: z.number(),
        classId: z.string().optional(),
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

      const levelService = new LevelService({ prisma: ctx.prisma });
      return levelService.addExperience(input.studentId, input.expPoints, input.classId);
    }),

  // Get a student's level
  getStudentLevel: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        classId: z.string().optional(),
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

      const levelService = new LevelService({ prisma: ctx.prisma });
      return levelService.getStudentLevel(input.studentId, input.classId);
    }),

  // Get all levels for a student
  getAllStudentLevels: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const levelService = new LevelService({ prisma: ctx.prisma });
      return levelService.getAllStudentLevels(input);
    }),

  // Get level thresholds for reference
  getLevelThresholds: protectedProcedure
    .input(z.number().optional())
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const levelService = new LevelService({ prisma: ctx.prisma });
      return levelService.getLevelThresholds(input);
    }),
});
