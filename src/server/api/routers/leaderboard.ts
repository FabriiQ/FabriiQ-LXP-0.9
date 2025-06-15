import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { LeaderboardEntityType, TimeGranularity } from "@/features/leaderboard/types/standard-leaderboard";
import { LeaderboardPeriod } from "@/server/api/types/leaderboard";
import { OptimizedLeaderboardService } from "@/server/api/services/leaderboard.service.optimized";

// Helper function to get time periods based on granularity
interface TimePeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

function getTimePeriods(timeGranularity: TimeGranularity, months: number = 6): {
  startDate: Date;
  endDate: Date;
  periods: TimePeriod[];
} {
  const now = new Date();
  const endDate = new Date(now);
  let startDate: Date;
  let periods: TimePeriod[] = [];

  switch (timeGranularity) {
    case TimeGranularity.WEEKLY:
      // Start date is X months ago
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - months);

      // Create weekly periods
      for (let i = 0; i < months * 4; i++) { // Approximately 4 weeks per month
        const weekEndDate = new Date(startDate);
        weekEndDate.setDate(weekEndDate.getDate() + 7 * (i + 1));
        if (weekEndDate > now) break;

        const weekStartDate = new Date(startDate);
        weekStartDate.setDate(weekStartDate.getDate() + 7 * i);

        periods.push({
          startDate: weekStartDate,
          endDate: weekEndDate,
          label: `Week ${i + 1}`
        });
      }
      break;

    case TimeGranularity.MONTHLY:
      // Start date is X months ago
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - months);

      // Create monthly periods
      for (let i = 0; i < months; i++) {
        const monthStartDate = new Date(startDate);
        monthStartDate.setMonth(monthStartDate.getMonth() + i);

        const monthEndDate = new Date(monthStartDate);
        monthEndDate.setMonth(monthEndDate.getMonth() + 1);

        const monthName = monthStartDate.toLocaleString('default', { month: 'long' });

        periods.push({
          startDate: monthStartDate,
          endDate: monthEndDate,
          label: monthName
        });
      }
      break;

    case TimeGranularity.TERM:
      // Assuming a term is 4 months
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 4);

      // Just one period for the term
      periods.push({
        startDate,
        endDate,
        label: 'Current Term'
      });
      break;

    case TimeGranularity.ALL_TIME:
    default:
      // Start date is 1 year ago
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);

      // Just one period for all time
      periods.push({
        startDate,
        endDate,
        label: 'All Time'
      });
      break;
  }

  return { startDate, endDate, periods };
}

export const leaderboardRouter = createTRPCRouter({
  // Get class leaderboard
  getClassLeaderboard: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        period: z.nativeEnum(LeaderboardPeriod).optional().default(LeaderboardPeriod.ALL_TIME),
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

      // Check if user has permission to view leaderboards
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true }
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      // Get the class details
      const classEntity = await ctx.prisma.class.findUnique({
        where: { id: input.classId },
        select: {
          id: true,
          name: true,
          campusId: true,
          campus: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      const leaderboardService = new OptimizedLeaderboardService({ prisma: ctx.prisma });
      const leaderboard = await leaderboardService.getClassLeaderboard(input.classId, {
        period: input.period as any,
      });

      return {
        leaderboard: leaderboard.slice(0, input.limit),
        totalStudents: leaderboard.length,
        filters: {
          period: input.period,
          limit: input.limit,
        },
        metadata: {
          classId: classEntity.id,
          className: classEntity.name,
          campusId: classEntity.campusId,
          campusName: classEntity.campus.name,
        },
      };
    }),

  // Get subject leaderboard
  getSubjectLeaderboard: protectedProcedure
    .input(
      z.object({
        subjectId: z.string(),
        period: z.nativeEnum(LeaderboardPeriod).optional().default(LeaderboardPeriod.ALL_TIME),
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

      // Check if user has permission to view leaderboards
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true }
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      // Get the subject details
      const subject = await ctx.prisma.subject.findUnique({
        where: { id: input.subjectId },
        select: { id: true, name: true, code: true }
      });

      if (!subject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found",
        });
      }

      const leaderboardService = new OptimizedLeaderboardService({ prisma: ctx.prisma });
      const leaderboard = await leaderboardService.getSubjectLeaderboard(input.subjectId, {
        period: input.period as any,
      });

      return {
        leaderboard: leaderboard.slice(0, input.limit),
        totalStudents: leaderboard.length,
        filters: {
          period: input.period,
          limit: input.limit,
        },
        metadata: {
          subjectId: subject.id,
          subjectName: subject.name,
        },
      };
    }),

  // Get course leaderboard
  getCourseLeaderboard: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        period: z.nativeEnum(LeaderboardPeriod).optional().default(LeaderboardPeriod.ALL_TIME),
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

      // Check if user has permission to view leaderboards
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true }
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      // Get the course details
      const course = await ctx.prisma.course.findUnique({
        where: { id: input.courseId },
        select: { id: true, name: true, code: true }
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      const leaderboardService = new OptimizedLeaderboardService({ prisma: ctx.prisma });
      const leaderboard = await leaderboardService.getCourseLeaderboard(input.courseId, {
        period: input.period as any,
      });

      return {
        leaderboard: leaderboard.slice(0, input.limit),
        totalStudents: leaderboard.length,
        filters: {
          period: input.period,
          limit: input.limit,
        },
        metadata: {
          courseId: course.id,
          courseName: course.name,
        },
      };
    }),

  // Get overall leaderboard
  getOverallLeaderboard: protectedProcedure
    .input(
      z.object({
        campusId: z.string(),
        period: z.nativeEnum(LeaderboardPeriod).optional().default(LeaderboardPeriod.ALL_TIME),
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

      // Check if user has permission to view leaderboards
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true }
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      // Get the campus details
      const campus = await ctx.prisma.campus.findUnique({
        where: { id: input.campusId },
        select: { id: true, name: true, code: true }
      });

      if (!campus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campus not found",
        });
      }

      const leaderboardService = new OptimizedLeaderboardService({ prisma: ctx.prisma });
      const leaderboard = await leaderboardService.getOverallLeaderboard(input.campusId, {
        period: input.period as any,
      });

      return {
        leaderboard: leaderboard.slice(0, input.limit),
        totalStudents: leaderboard.length,
        filters: {
          period: input.period,
          limit: input.limit,
        },
        metadata: {
          campusId: campus.id,
          campusName: campus.name,
        },
      };
    }),

  // Get leaderboard trends over time
  getLeaderboardTrends: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          LeaderboardEntityType.CLASS,
          LeaderboardEntityType.SUBJECT,
          LeaderboardEntityType.COURSE,
          LeaderboardEntityType.CAMPUS,
          LeaderboardEntityType.CUSTOM_GROUP
        ]),
        referenceId: z.string(),
        timeGranularity: z.nativeEnum(TimeGranularity).optional().default(TimeGranularity.ALL_TIME),
        months: z.number().min(1).max(12).optional().default(6),
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

      try {
        // Get the appropriate time periods based on the timeGranularity
        const { startDate, endDate, periods } = getTimePeriods(input.timeGranularity, input.months);

        // Get the entity type and ID
        const { entityType, entityId } = { entityType: input.type, entityId: input.referenceId };

        // Get the leaderboard data from the unified leaderboard service
        const unifiedLeaderboardService = ctx.prisma.unifiedLeaderboard;

        // Get historical leaderboard data
        // Commented out as it's not being used
        /*
        const leaderboardHistories = await unifiedLeaderboardService.getHistoricalData({
          entityType,
          entityId,
          startDate,
          endDate
        });
        */

        // Get the trends data from the unified leaderboard service
        const trendsData = await ctx.prisma.analytics.getLeaderboardTrends({
          entityType,
          entityId,
          timeGranularity: input.timeGranularity,
          periods: periods.map(p => ({
            startDate: p.startDate,
            endDate: p.endDate,
            label: p.label
          }))
        });

        // Map the trends data to the expected format
        const trends = trendsData.map((trend: any) => ({
          period: trend.period,
          averageRank: trend.averageRank || 0,
          averageScore: trend.averageScore || 0,
          averageAcademicScore: trend.averageAcademicScore || 0,
          averageAttendance: trend.averageAttendance || 0,
          averageParticipation: trend.averageParticipation || 0,
          averageImprovement: trend.averageImprovement || 0
        }));

        return { trends };
      } catch (error) {
        console.error("Error fetching leaderboard trends:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch leaderboard trends",
          cause: error,
        });
      }
    }),
});
