import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

// Helper function to get date based on timeframe
function getTimeframeDate(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case 'daily':
      // 24 hours ago
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'weekly':
      // 7 days ago
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      // 30 days ago
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'term':
      // 120 days ago (approximately a semester)
      return new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
    default:
      // All time - 10 years ago
      return new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Teacher Leaderboard Router
 *
 * Provides endpoints for teacher leaderboards, points, and achievements
 */
export const teacherLeaderboardRouter = createTRPCRouter({
  /**
   * Get teacher leaderboard
   */
  getTeacherLeaderboard: protectedProcedure
    .input(
      z.object({
        courseId: z.string().optional(),
        classId: z.string().optional(),
        programId: z.string().optional(),
        campusId: z.string().optional(),
        timeframe: z.enum(["daily", "weekly", "monthly", "term", "all"]).default("all"),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
        sortBy: z.enum([
          "points",
          "activityCreation",
          "studentPerformance",
          "attendance",
          "feedback"
        ]).default("points"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { courseId, classId, programId, campusId, timeframe, limit, offset, sortBy } = input;

      try {
        // Build query to get teachers based on filters
        const whereClause: any = {};

        // Filter by campus if provided
        if (campusId) {
          whereClause.user = {
            activeCampuses: {
              some: {
                campusId: campusId,
                status: 'ACTIVE'
              }
            }
          };
        }

        // Filter by program if provided
        if (programId) {
          whereClause.assignments = {
            some: {
              class: {
                courseCampus: {
                  course: {
                    programId: programId
                  }
                }
              }
            }
          };
        }

        // Filter by course if provided
        if (courseId) {
          whereClause.assignments = {
            some: {
              class: {
                courseCampus: {
                  courseId: courseId
                }
              }
            }
          };
        }

        // Filter by class if provided
        if (classId) {
          whereClause.assignments = {
            some: {
              classId: classId
            }
          };
        }

        // Get teachers from database
        const teachers = await ctx.prisma.teacherProfile.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileData: true
              }
            },
            assignments: {
              include: {
                class: true
              }
            }
          },
          skip: offset,
          take: limit
        });

        // Count total teachers matching the filter
        const totalTeachers = await ctx.prisma.teacherProfile.count({
          where: whereClause
        });

        // Get teacher points data separately
        const teacherIds = teachers.map(teacher => teacher.id);
        const teacherPoints = await ctx.prisma.teacherPoints.findMany({
          where: {
            teacherId: { in: teacherIds },
            ...(timeframe !== 'all' ? {
              createdAt: {
                gte: getTimeframeDate(timeframe)
              }
            } : {})
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Group points by teacher ID
        const pointsByTeacher: Record<string, any[]> = {};
        teacherPoints.forEach((point: { teacherId: string, amount: number, source: string }) => {
          if (!pointsByTeacher[point.teacherId]) {
            pointsByTeacher[point.teacherId] = [];
          }
          pointsByTeacher[point.teacherId].push(point);
        });

        // Transform teacher data
        const teacherData = teachers.map(teacher => {
          // Get points for this teacher
          const points = pointsByTeacher[teacher.id] || [];

          // Calculate total points
          const totalPoints = points.reduce((sum: number, point: any) => sum + point.amount, 0);

          // Calculate metrics
          const metrics = {
            studentPerformance: Math.floor(Math.random() * 15) + 80, // Replace with real data when available
            attendanceRate: Math.floor(Math.random() * 10) + 90,
            feedbackTime: Math.floor(Math.random() * 48) + 12,
            activityCreation: points.filter((p: any) => p.source === 'activity_creation').length,
            activityEngagement: Math.floor(Math.random() * 20) + 80,
            classPerformance: Math.floor(Math.random() * 15) + 80,
            overallRating: Math.floor(Math.random() * 15) + 80
          };

          return {
            id: teacher.id,
            name: teacher.user?.name || 'Unnamed Teacher',
            avatar: teacher.user?.profileData && typeof teacher.user.profileData === 'object' ?
              (teacher.user.profileData as any).avatar : null,
            metrics,
            classes: teacher.assignments?.length || 0,
            points: totalPoints || Math.floor(Math.random() * 1000) + 500 // Fallback to random if no points
          };
        });

        // Sort based on sortBy parameter
        const sortedTeachers = [...teacherData].sort((a, b) => {
          if (sortBy === "points") {
            return b.points - a.points;
          } else if (sortBy === "activityCreation") {
            return b.metrics.activityCreation - a.metrics.activityCreation;
          } else if (sortBy === "studentPerformance") {
            return b.metrics.studentPerformance - a.metrics.studentPerformance;
          } else if (sortBy === "attendance") {
            return b.metrics.attendanceRate - a.metrics.attendanceRate;
          } else {
            // feedback - lower is better
            return a.metrics.feedbackTime - b.metrics.feedbackTime;
          }
        });

        // Format the response
        const formattedLeaderboard = sortedTeachers.map((teacher, index) => ({
          position: offset + index + 1,
          teacherId: teacher.id,
          name: teacher.name,
          avatar: teacher.avatar,
          points: teacher.points,
          classCount: teacher.classes,
          metrics: teacher.metrics,
          rankChange: Math.floor(Math.random() * 5) - 2, // Random rank change for demo - will be replaced with real data later
        }));

        return {
          leaderboard: formattedLeaderboard,
          pagination: {
            total: totalTeachers,
            limit,
            offset,
            hasMore: offset + limit < totalTeachers,
          }
        };
      } catch (error) {
        console.error("Error fetching teacher leaderboard:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch teacher leaderboard",
        });
      }
    }),

  /**
   * Get teacher achievements
   */
  getTeacherAchievements: protectedProcedure
    .input(
      z.object({
        teacherId: z.string(),
        classId: z.string().optional(),
        type: z.string().optional(),
        includeUnlocked: z.boolean().default(true),
        includeLocked: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const { teacherId, classId, type, includeUnlocked, includeLocked } = input;

      try {
        // Mock data for teacher achievements
        const mockAchievements = [
          {
            id: "achievement-1",
            teacherId,
            title: "Master Educator",
            description: "Achieve an overall rating of 90% or higher for a full term",
            type: "performance",
            progress: 100,
            total: 100,
            unlocked: true,
            unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            icon: "award"
          },
          {
            id: "achievement-2",
            teacherId,
            title: "Content Creator",
            description: "Create 50 learning activities",
            type: "activity_creation",
            progress: 42,
            total: 50,
            unlocked: false,
            icon: "book"
          },
          {
            id: "achievement-3",
            teacherId,
            title: "Perfect Attendance",
            description: "Maintain 100% attendance for a full term",
            type: "attendance",
            progress: 95,
            total: 100,
            unlocked: false,
            icon: "calendar"
          },
          {
            id: "achievement-4",
            teacherId,
            title: "Feedback Champion",
            description: "Provide feedback on all student submissions within 24 hours for a month",
            type: "feedback",
            progress: 100,
            total: 100,
            unlocked: true,
            unlockedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
            icon: "message-circle"
          },
          {
            id: "achievement-5",
            teacherId,
            title: "Class Performance",
            description: "Have a class achieve an average grade of 85% or higher",
            type: "class",
            progress: 100,
            total: 100,
            unlocked: true,
            unlockedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
            icon: "users"
          }
        ];

        // Filter based on input parameters
        let filteredAchievements = mockAchievements;

        if (classId) {
          // In a real implementation, we would filter by classId
          filteredAchievements = filteredAchievements.filter(a => a.type === "class");
        }

        if (type) {
          filteredAchievements = filteredAchievements.filter(a => a.type === type);
        }

        if (!includeUnlocked) {
          filteredAchievements = filteredAchievements.filter(a => !a.unlocked);
        }

        if (!includeLocked) {
          filteredAchievements = filteredAchievements.filter(a => a.unlocked);
        }

        return filteredAchievements;
      } catch (error) {
        console.error("Error fetching teacher achievements:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch teacher achievements",
        });
      }
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
    .query(async ({ input }) => {
      const { teacherId, classId, subjectId, source, limit, offset } = input;

      try {
        // Mock data for teacher points history
        const mockPointsHistory = [
          {
            id: "points-1",
            teacherId,
            amount: 50,
            source: "activity_creation",
            sourceId: "activity-123",
            classId: "class-1",
            className: "Mathematics 101",
            subjectId: "subject-1",
            subjectName: "Algebra",
            description: "Created a new interactive quiz",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          },
          {
            id: "points-2",
            teacherId,
            amount: 30,
            source: "feedback",
            sourceId: "submission-456",
            classId: "class-1",
            className: "Mathematics 101",
            subjectId: "subject-1",
            subjectName: "Algebra",
            description: "Provided detailed feedback on student submissions",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
          },
          {
            id: "points-3",
            teacherId,
            amount: 20,
            source: "attendance",
            classId: "class-2",
            className: "Mathematics 102",
            subjectId: "subject-2",
            subjectName: "Geometry",
            description: "Perfect attendance for the week",
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          },
          {
            id: "points-4",
            teacherId,
            amount: 100,
            source: "student_performance",
            classId: "class-2",
            className: "Mathematics 102",
            subjectId: "subject-2",
            subjectName: "Geometry",
            description: "Class achieved 90% average on monthly assessment",
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
          },
          {
            id: "points-5",
            teacherId,
            amount: 25,
            source: "activity_creation",
            sourceId: "activity-789",
            classId: "class-3",
            className: "Mathematics 103",
            subjectId: "subject-3",
            subjectName: "Calculus",
            description: "Created a new lesson plan",
            createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) // 21 days ago
          }
        ];

        // Filter based on input parameters
        let filteredHistory = mockPointsHistory;

        if (classId) {
          filteredHistory = filteredHistory.filter(p => p.classId === classId);
        }

        if (subjectId) {
          filteredHistory = filteredHistory.filter(p => p.subjectId === subjectId);
        }

        if (source) {
          filteredHistory = filteredHistory.filter(p => p.source === source);
        }

        // Apply pagination
        const paginatedHistory = filteredHistory.slice(offset, offset + limit);

        return {
          history: paginatedHistory,
          pagination: {
            total: filteredHistory.length,
            limit,
            offset,
            hasMore: offset + limit < filteredHistory.length,
          }
        };
      } catch (error) {
        console.error("Error fetching teacher points history:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch teacher points history",
        });
      }
    }),
});
