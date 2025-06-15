import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { PointsService } from "../services/points.service";
import { OptimizedLeaderboardService } from "../services/leaderboard.service.optimized";
import { LeaderboardPeriod } from "../services/optimized-queries";
import { TRPCError } from "@trpc/server";

/**
 * Consolidated rewards router that combines multiple endpoints
 * to reduce the number of API calls needed for the rewards page
 */
export const rewardsRouter = createTRPCRouter({
  // Get consolidated class rewards data
  getClassRewardsData: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        includeStudents: z.boolean().optional().default(true),
        includeLeaderboard: z.boolean().optional().default(true),
        leaderboardPeriod: z.nativeEnum(LeaderboardPeriod).optional().default(LeaderboardPeriod.WEEKLY),
        leaderboardLimit: z.number().min(1).max(100).optional().default(8),
        page: z.number().min(1).optional().default(1),
        pageSize: z.number().min(1).max(100).optional().default(50),
        searchTerm: z.string().optional().default(""),
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

      const {
        classId,
        includeStudents,
        includeLeaderboard,
        leaderboardPeriod,
        leaderboardLimit,
        page,
        pageSize,
        searchTerm
      } = input;

      // Get class details
      const classDetails = await ctx.prisma.class.findUnique({
        where: { id: classId },
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
        },
      });

      if (!classDetails) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Initialize services
      const pointsService = new PointsService({ prisma: ctx.prisma });
      const leaderboardService = new OptimizedLeaderboardService(ctx.prisma);

      // Prepare result object
      const result: any = {
        class: classDetails,
      };

      // Get students if requested
      if (includeStudents) {
        // Calculate pagination
        const skip = (page - 1) * pageSize;

        // Get students with their points data
        const studentsWithEnrollments = await ctx.prisma.studentEnrollment.findMany({
          where: {
            classId,
            status: "ACTIVE",
            student: {
              user: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
          },
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
          skip,
          take: pageSize,
        });

        // Get total count for pagination
        const totalStudents = await ctx.prisma.studentEnrollment.count({
          where: {
            classId,
            status: "ACTIVE",
            student: {
              user: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            },
          },
        });

        // Get points data for all students in one batch
        const studentIds = studentsWithEnrollments.map(enrollment => enrollment.student.id);
        let pointsData = [];

        try {
          pointsData = await pointsService.getAllStudentsPointsSummary(classId) || [];
        } catch (error) {
          console.error("Error fetching points summary:", error);
          // Continue with empty points data
        }

        // Map students with their points data
        const students = studentsWithEnrollments.map(enrollment => {
          const studentId = enrollment.student.id;
          const studentPointsData = pointsData.find(p => p.studentId === studentId) || {
            totalPoints: 0,
            weeklyPoints: 0,
            monthlyPoints: 0,
            level: 1,
          };

          return {
            id: studentId,
            name: enrollment.student.user.name || 'Unknown Student',
            profileImage: enrollment.student.user.profileData &&
              typeof enrollment.student.user.profileData === 'object' &&
              'profileImage' in enrollment.student.user.profileData
                ? enrollment.student.user.profileData.profileImage
                : undefined,
            totalPoints: studentPointsData.totalPoints || 0,
            weeklyPoints: studentPointsData.weeklyPoints || 0,
            monthlyPoints: studentPointsData.monthlyPoints || 0,
            level: studentPointsData.level || 1,
            lastAward: studentPointsData.lastAward,
          };
        });

        // Add students data to result
        result.students = {
          items: students,
          totalCount: totalStudents,
          page,
          pageSize,
          totalPages: Math.ceil(totalStudents / pageSize),
        };

        // Calculate class summary stats
        result.stats = {
          totalPoints: students.reduce((sum, student) => sum + student.totalPoints, 0),
          weeklyPoints: students.reduce((sum, student) => sum + student.weeklyPoints, 0),
          teacherBonusPoints: 0, // Will be calculated if leaderboard is included
        };
      }

      // Get leaderboard if requested
      if (includeLeaderboard) {
        try {
          const leaderboard = await leaderboardService.getClassLeaderboard(
            classId,
            {
              period: leaderboardPeriod,
              limit: leaderboardLimit,
            }
          );

          result.leaderboard = leaderboard || [];

          // Calculate teacher bonus points
          // This is a simplified calculation - in a real app, you'd query the database
          // to get the actual teacher bonus points
          if (result.stats) {
            // Get points that were awarded by teachers (source: 'teacher')
            try {
              const teacherBonusPoints = await ctx.prisma.studentPoints.aggregate({
                where: {
                  classId,
                  source: 'teacher',
                  status: 'ACTIVE',
                },
                _sum: {
                  amount: true,
                },
              });

              result.stats.teacherBonusPoints = teacherBonusPoints._sum.amount || 0;
            } catch (error) {
              console.error("Error calculating teacher bonus points:", error);
              result.stats.teacherBonusPoints = 0;
            }
          }
        } catch (error) {
          console.error("Error fetching leaderboard:", error);
          result.leaderboard = [];
        }
      }

      return result;
    }),
});
