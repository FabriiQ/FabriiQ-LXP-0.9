import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { UserType, SystemStatus } from "@prisma/client";
import { CourseAnalyticsService } from "../services/course-analytics.service";

// Course analytics query schema
const courseAnalyticsQuerySchema = z.object({
  courseCampusId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

// Course analytics for coordinator query schema
const coordinatorCourseAnalyticsQuerySchema = z.object({
  programId: z.string(),
  campusId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

/**
 * Course Analytics Router
 * Provides endpoints for retrieving course analytics data
 */
export const courseAnalyticsRouter = createTRPCRouter({
  // Get course analytics for a specific course campus
  getCourseAnalytics: protectedProcedure
    .input(courseAnalyticsQuerySchema)
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Check if user has permission to access course analytics
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          userType: true,
          coordinatorProfile: true,
        },
      });

      // Check if user is authorized to access course analytics
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          "COORDINATOR", // Add plain COORDINATOR type
        ].includes(user?.userType as UserType)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to access course analytics",
        });
      }

      // For coordinators, check if they are assigned to this course
      if (user?.userType === UserType.CAMPUS_COORDINATOR) {
        if (!user.coordinatorProfile) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Coordinator profile not found",
          });
        }

        // Get course campus to check permissions
        const courseCampus = await ctx.prisma.courseCampus.findUnique({
          where: { id: input.courseCampusId },
          include: {
            course: true,
          },
        });

        if (!courseCampus) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Course campus not found",
          });
        }

        // Check if coordinator is assigned to this course or program
        const managedCourses = user.coordinatorProfile.managedCourses as any[];
        const managedPrograms = user.coordinatorProfile.managedPrograms as any[];

        const isAssignedToCourse = managedCourses.some(
          (c) => c.courseCampusId === input.courseCampusId
        );

        const isAssignedToProgram = managedPrograms.some(
          (p) =>
            p.programId === courseCampus.course.programId &&
            p.campusId === courseCampus.campusId
        );

        if (!isAssignedToCourse && !isAssignedToProgram) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to access this course's analytics",
          });
        }
      }

      // Create analytics service and get course analytics
      const analyticsService = new CourseAnalyticsService({ prisma: ctx.prisma });
      return analyticsService.getCourseAnalytics(
        input.courseCampusId,
        input.startDate,
        input.endDate
      );
    }),

  // Get all course analytics for a coordinator by program and campus
  getCoordinatorCourseAnalytics: protectedProcedure
    .input(coordinatorCourseAnalyticsQuerySchema)
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get user details
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          userType: true,
          coordinatorProfile: true,
        },
      });

      // Check if user is authorized to access course analytics
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          "COORDINATOR", // Add plain COORDINATOR type
        ].includes(user?.userType as UserType)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to access course analytics",
        });
      }

      // For coordinators, check if they are assigned to this program and campus
      if (user?.userType === UserType.CAMPUS_COORDINATOR) {
        if (!user.coordinatorProfile) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Coordinator profile not found",
          });
        }

        const managedPrograms = user.coordinatorProfile.managedPrograms as any[];
        const isAssigned = managedPrograms.some(
          (p) => p.programId === input.programId && p.campusId === input.campusId
        );

        if (!isAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to access this program's course analytics",
          });
        }
      }

      // Get all course campuses for this program and campus
      const courseCampuses = await ctx.prisma.courseCampus.findMany({
        where: {
          programCampus: {
            programId: input.programId,
            campusId: input.campusId,
          },
          status: "ACTIVE",
        },
        include: {
          course: {
            include: {
              program: true,
            },
          },
          campus: true,
          _count: {
            select: {
              classes: true,
            },
          },
        },
      });

      // Create analytics service
      const analyticsService = new CourseAnalyticsService({ prisma: ctx.prisma });

      // Get analytics for each course campus
      const courseAnalytics = await Promise.all(
        courseCampuses.map((courseCampus) =>
          analyticsService.getCourseAnalytics(
            courseCampus.id,
            input.startDate,
            input.endDate
          )
        )
      );

      return courseAnalytics;
    }),

  /**
   * Get class comparison data for a course
   */
  getClassComparison: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        campusId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        // Get basic class data for the course
        const classes = await ctx.prisma.class.findMany({
          where: {
            courseCampus: {
              courseId: input.courseId,
              campusId: input.campusId,
            },
            status: SystemStatus.ACTIVE,
          },
          select: {
            id: true,
            name: true,
            code: true,
          },
        });

        // Generate mock class comparison data
        const classComparisons = classes.map((cls) => {
          // Generate random metrics for demonstration
          const attendanceRate = 75 + Math.random() * 20; // 75-95% range
          const averageGrade = 65 + Math.random() * 25; // 65-90 range
          const completionRate = 80 + Math.random() * 20; // 80-100% range
          const performanceChange = Math.random() * 10 - 3; // -3 to +7 range
          const teacherImpactScore = 3 + Math.random() * 2; // 3-5 range
          const studentCount = 15 + Math.floor(Math.random() * 15); // 15-30 students

          return {
            id: cls.id,
            name: cls.name,
            code: cls.code || '',
            teacherName: `Teacher ${cls.id.substring(0, 4)}`,
            teacherId: `teacher-${cls.id.substring(0, 4)}`,
            studentCount: studentCount,
            attendanceRate: Math.round(attendanceRate),
            averageGrade: Math.round(averageGrade),
            completionRate: Math.round(completionRate),
            performanceChange: parseFloat(performanceChange.toFixed(1)),
            teacherImpactScore: parseFloat(teacherImpactScore.toFixed(1)),
          };
        });

        return classComparisons;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch class comparison data",
          cause: error,
        });
      }
    }),

  /**
   * Get student performance data for a course
   */
  getCourseStudentPerformance: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        campusId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        // Get basic class data for the course
        const classes = await ctx.prisma.class.findMany({
          where: {
            courseCampus: {
              courseId: input.courseId,
              campusId: input.campusId,
            },
            status: SystemStatus.ACTIVE,
          },
          select: {
            id: true,
            name: true,
            code: true,
          },
        });

        // Generate mock student performance data
        const studentPerformances: Array<{
          id: string;
          name: string;
          avatar: string | null;
          enrollmentNumber: string;
          grade: number;
          attendance: number;
          completionRate: number;
          participationScore: number;
          improvementRate: number;
          performanceTrend: 'improving' | 'declining' | 'stable';
          needsIntervention: boolean;
          strengths: string[];
          weaknesses: string[];
          classId: string;
          className: string;
        }> = [];

        // Generate 5-10 students per class
        for (const cls of classes) {
          const studentCount = 5 + Math.floor(Math.random() * 5);

          for (let i = 0; i < studentCount; i++) {
            // Generate random metrics
            const averageGrade = 60 + Math.random() * 35; // 60-95 range
            const attendanceRate = 70 + Math.random() * 30; // 70-100% range
            const completionRate = 65 + Math.random() * 35; // 65-100% range
            const participationScore = 60 + Math.random() * 40; // 60-100% range
            const improvementRate = Math.random() * 10 - 3; // -3 to +7 range

            // Determine performance trend
            let performanceTrend: 'improving' | 'declining' | 'stable';
            if (improvementRate > 1) {
              performanceTrend = 'improving';
            } else if (improvementRate < -1) {
              performanceTrend = 'declining';
            } else {
              performanceTrend = 'stable';
            }

            // Determine if intervention is needed
            const needsIntervention =
              attendanceRate < 80 ||
              averageGrade < 70 ||
              completionRate < 75 ||
              performanceTrend === 'declining';

            // Determine strengths and weaknesses
            const strengths: string[] = [];
            const weaknesses: string[] = [];

            if (averageGrade > 85) strengths.push('Academic performance');
            if (attendanceRate > 90) strengths.push('Consistent attendance');
            if (participationScore > 85) strengths.push('Active participation');
            if (completionRate > 90) strengths.push('Assignment completion');
            if (improvementRate > 3) strengths.push('Rapid improvement');

            if (averageGrade < 70) weaknesses.push('Academic performance');
            if (attendanceRate < 80) weaknesses.push('Attendance issues');
            if (participationScore < 70) weaknesses.push('Low participation');
            if (completionRate < 75) weaknesses.push('Assignment completion');
            if (improvementRate < -2) weaknesses.push('Declining performance');

            // Create a unique student ID
            const studentId = `student-${cls.id.substring(0, 4)}-${i}`;

            studentPerformances.push({
              id: studentId,
              name: `Student ${i + 1}`,
              avatar: null,
              enrollmentNumber: `S${studentId.substring(0, 6)}`,
              grade: Math.round(averageGrade),
              attendance: Math.round(attendanceRate),
              completionRate: Math.round(completionRate),
              participationScore: Math.round(participationScore),
              improvementRate: parseFloat(improvementRate.toFixed(1)),
              performanceTrend,
              needsIntervention,
              strengths,
              weaknesses,
              classId: cls.id,
              className: cls.name,
            });
          }
        }

        return studentPerformances;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch student performance data",
          cause: error,
        });
      }
    }),
});
