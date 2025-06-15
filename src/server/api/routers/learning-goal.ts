import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "@prisma/client";
import { LearningGoalService } from "../services/learning-goal.service";

export const learningGoalRouter = createTRPCRouter({
  // Create a new learning goal
  createLearningGoal: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        progress: z.number().default(0),
        total: z.number().default(100),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        isCustom: z.boolean().default(true),
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

      const learningGoalService = new LearningGoalService({ prisma: ctx.prisma });
      return learningGoalService.createLearningGoal(input);
    }),

  // Update learning goal progress
  updateLearningGoal: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        progress: z.number().optional(),
        total: z.number().optional(),
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

      const learningGoalService = new LearningGoalService({ prisma: ctx.prisma });
      return learningGoalService.updateLearningGoal(input);
    }),

  // Get learning goals for a student
  getStudentLearningGoals: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        isCustom: z.boolean().optional(),
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

      const learningGoalService = new LearningGoalService({ prisma: ctx.prisma });
      return learningGoalService.getStudentLearningGoals(
        input.studentId,
        {
          classId: input.classId,
          subjectId: input.subjectId,
          isCustom: input.isCustom,
        }
      );
    }),

  // Delete a learning goal
  deleteLearningGoal: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const learningGoalService = new LearningGoalService({ prisma: ctx.prisma });
      return learningGoalService.deleteLearningGoal(input);
    }),
});
