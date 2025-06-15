import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { UserType, SystemStatus } from "@prisma/client";
import { ActivityAnalyticsService } from "../services/activity-analytics.service";

/**
 * Activities Router
 * Provides endpoints for retrieving activity analytics data
 */
export const activitiesRouter = createTRPCRouter({
  // Get class activities analytics
  getClassActivitiesAnalytics: protectedProcedure
    .input(z.object({
      classId: z.string(),
      includeTimeTracking: z.boolean().optional().default(false),
      timeframe: z.enum(['week', 'month', 'term', 'all']).optional().default('all'),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.COORDINATOR,
          UserType.TEACHER,
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const analyticsService = new ActivityAnalyticsService(ctx.prisma);
        
        // Get activities for the class
        const activities = await ctx.prisma.activity.findMany({
          where: {
            classId: input.classId,
            status: SystemStatus.ACTIVE,
          },
          select: {
            id: true,
            title: true,
            learningType: true,
            content: true,
            isGradable: true,
            maxScore: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        });

        // Get student count for the class
        const studentCount = await ctx.prisma.studentEnrollment.count({
          where: {
            classId: input.classId,
            status: SystemStatus.ACTIVE,
          },
        });

        // Get activity grades for analytics
        const activityGrades = await ctx.prisma.activityGrade.findMany({
          where: {
            activity: {
              classId: input.classId,
            },
            status: SystemStatus.ACTIVE,
          },
          include: {
            activity: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        // Process activity analytics
        const activityAnalytics = activities.map(activity => {
          const grades = activityGrades.filter(grade => grade.activityId === activity.id);
          const uniqueUsers = new Set(grades.map(grade => grade.studentId)).size;
          const completedGrades = grades.filter(grade => grade.status === 'COMPLETED');
          const completionRate = uniqueUsers > 0 ? (completedGrades.length / uniqueUsers) * 100 : 0;
          const averageScore = grades.length > 0 
            ? grades.reduce((sum, grade) => sum + (grade.score || 0), 0) / grades.length 
            : 0;
          
          return {
            activityId: activity.id,
            title: activity.title,
            activityType: activity.learningType?.toString().toLowerCase() || 'unknown',
            totalAttempts: grades.length,
            uniqueUsers,
            completionRate,
            averageScore,
            averageTimeSpent: 0, // Placeholder for time tracking data
            updatedAt: activity.updatedAt,
          };
        });

        return {
          activities: activityAnalytics,
          totalActivities: activities.length,
          totalStudents: studentCount,
          totalAttempts: activityGrades.length,
        };
      } catch (error) {
        console.error('Error getting class activities analytics:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve class activities analytics",
        });
      }
    }),
});
