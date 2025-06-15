import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { TeacherPointsService } from "@/server/api/services/teacher-points.service";
// Import necessary types

/**
 * Teacher Points Router
 *
 * Provides endpoints for awarding and managing teacher points
 */
export const teacherPointsRouter = createTRPCRouter({
  /**
   * Award points to a teacher
   */
  awardPoints: protectedProcedure
    .input(
      z.object({
        teacherId: z.string(),
        amount: z.number().min(1).max(100),
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

      // Check if user has permission to award points to teachers
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          userType: true,
          coordinatorProfile: true
        }
      });

      const allowedRoles = [
        "SYSTEM_ADMIN",
        "SYSTEM_MANAGER",
        "ADMINISTRATOR",
        "CAMPUS_ADMIN",
        "CAMPUS_COORDINATOR",
        "COORDINATOR"
      ] as const;

      if (!user || !allowedRoles.includes(user.userType as any)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to award points to teachers",
        });
      }

      // Create teacher points service
      const teacherPointsService = new TeacherPointsService({ prisma: ctx.prisma });

      // Award points to teacher
      const result = await teacherPointsService.awardPoints({
        ...input,
        awardedBy: ctx.session.user.id,
      });

      return {
        success: true,
        pointsAwarded: input.amount,
        pointsRecord: result
      };
    }),

  /**
   * Get teacher points history
   */
  getTeacherPointsHistory: protectedProcedure
    .input(
      z.object({
        teacherId: z.string(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        source: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { teacherId, classId, subjectId, source, startDate, endDate, limit, offset } = input;

      // Create teacher points service
      const teacherPointsService = new TeacherPointsService({ prisma: ctx.prisma });

      // Get teacher points history
      const { history, total } = await teacherPointsService.getTeacherPointsHistory({
        teacherId,
        classId,
        subjectId,
        source,
        startDate,
        endDate,
        limit,
        offset,
      });

      return {
        history,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),
});
