import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { LeaderboardEntityType, TimeGranularity, StandardLeaderboardEntry } from "@/features/leaderboard/types/standard-leaderboard";
import { UnifiedLeaderboardService } from "@/features/leaderboard/services/unified-leaderboard.service";

// Define analytics event schema
const trackEventSchema = z.object({
  eventType: z.string(),
  category: z.string(),
  userId: z.string(),
  metadata: z.record(z.any()).optional(),
});

// Define UserType and SystemStatus enums since they're not exported from @prisma/client
enum UserType {
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  SYSTEM_MANAGER = "SYSTEM_MANAGER",
  ADMINISTRATOR = "ADMINISTRATOR",
  CAMPUS_ADMIN = "CAMPUS_ADMIN",
  CAMPUS_COORDINATOR = "CAMPUS_COORDINATOR",
  COORDINATOR = "COORDINATOR",
  TEACHER = "TEACHER",
  CAMPUS_TEACHER = "CAMPUS_TEACHER",
  STUDENT = "STUDENT",
  CAMPUS_STUDENT = "CAMPUS_STUDENT",
  CAMPUS_PARENT = "CAMPUS_PARENT"
}

enum SystemStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DELETED = "DELETED",
  PENDING = "PENDING"
}

// Helper function to get previous time period
function getPreviousPeriod(currentPeriod: TimeGranularity): TimeGranularity {
  switch (currentPeriod) {
    case TimeGranularity.DAILY:
      return TimeGranularity.DAILY; // Still daily, but would be previous day in implementation
    case TimeGranularity.WEEKLY:
      return TimeGranularity.WEEKLY; // Previous week
    case TimeGranularity.MONTHLY:
      return TimeGranularity.MONTHLY; // Previous month
    case TimeGranularity.TERM:
      return TimeGranularity.MONTHLY; // Fall back to monthly if we're in term view
    case TimeGranularity.ALL_TIME:
      return TimeGranularity.TERM; // Fall back to term if we're in all-time view
    default:
      return TimeGranularity.MONTHLY;
  }
}

// Input validation schemas
const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

const userAnalyticsSchema = z.object({
  userId: z.string().optional(),
  ...dateRangeSchema.shape,
});

const courseAnalyticsSchema = z.object({
  courseId: z.string(),
  ...dateRangeSchema.shape,
});

const classAnalyticsSchema = z.object({
  classId: z.string(),
  ...dateRangeSchema.shape,
});

const institutionAnalyticsSchema = z.object({
  institutionId: z.string().optional(),
  ...dateRangeSchema.shape,
});

/**
 * Analytics Router
 * Provides endpoints for retrieving analytics data across the platform
 */
export const analyticsRouter = createTRPCRouter({
  // Track an analytics event
  trackEvent: protectedProcedure
    .input(trackEventSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        // Create analytics event
        const event = await ctx.prisma.analyticsEvent.create({
          data: {
            eventType: input.eventType,
            category: input.category,
            userId: input.userId,
            metadata: input.metadata || {},
            timestamp: new Date(),
          }
        });

        // Update analytics metrics if needed
        if (input.category === 'teacher_assistant') {
          // Get or create metrics for this user and category
          const metrics = await ctx.prisma.analyticsMetric.upsert({
            where: {
              userId_category: {
                userId: input.userId,
                category: input.category
              }
            },
            update: {
              // Increment appropriate counters based on event type
              totalEvents: { increment: 1 },
              ...(input.eventType === 'message_sent' && {
                messageCount: { increment: 1 }
              }),
              ...(input.eventType === 'search_performed' && {
                searchCount: { increment: 1 }
              }),
              ...(input.eventType === 'feedback_given' && {
                feedbackCount: { increment: 1 }
              }),
              ...(input.eventType === 'voice_input_used' && {
                voiceInputCount: { increment: 1 }
              }),
              ...(input.eventType === 'voice_output_used' && {
                voiceOutputCount: { increment: 1 }
              }),
              lastUpdated: new Date()
            },
            create: {
              userId: input.userId,
              category: input.category,
              totalEvents: 1,
              messageCount: input.eventType === 'message_sent' ? 1 : 0,
              searchCount: input.eventType === 'search_performed' ? 1 : 0,
              feedbackCount: input.eventType === 'feedback_given' ? 1 : 0,
              voiceInputCount: input.eventType === 'voice_input_used' ? 1 : 0,
              voiceOutputCount: input.eventType === 'voice_output_used' ? 1 : 0,
              firstSeen: new Date(),
              lastUpdated: new Date()
            }
          });
        }

        return { success: true };
      } catch (error) {
        console.error('Error in trackEvent:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to track event: ${(error as Error).message}`,
        });
      }
    }),

  // Get teacher assistant analytics
  getTeacherAssistantAnalytics: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        // Parse date range
        const startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
        const endDate = input.endDate ? new Date(input.endDate) : new Date();

        // Get analytics events for this teacher
        const events = await ctx.prisma.analyticsEvent.findMany({
          where: {
            userId: input.teacherId,
            category: 'teacher_assistant',
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: {
            timestamp: 'asc'
          }
        });

        // Get metrics for this teacher
        const metrics = await ctx.prisma.analyticsMetric.findUnique({
          where: {
            userId_category: {
              userId: input.teacherId,
              category: 'teacher_assistant'
            }
          }
        });

        // Calculate daily usage
        const dailyUsage = new Map<string, number>();
        events.forEach(event => {
          const day = event.timestamp.toISOString().split('T')[0];
          dailyUsage.set(day, (dailyUsage.get(day) || 0) + 1);
        });

        // Calculate feature usage
        const featureUsage = {
          messages: events.filter(e => e.eventType === 'message_sent').length,
          searches: events.filter(e => e.eventType === 'search_performed').length,
          feedback: events.filter(e => e.eventType === 'feedback_given').length,
          voiceInput: events.filter(e => e.eventType === 'voice_input_used').length,
          voiceOutput: events.filter(e => e.eventType === 'voice_output_used').length
        };

        // Calculate most common intents
        const intentCounts = new Map<string, number>();
        events.forEach(event => {
          if (event.eventType === 'message_sent' && event.metadata?.intent) {
            const intent = event.metadata.intent as string;
            intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
          }
        });

        const topIntents = Array.from(intentCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([intent, count]) => ({ intent, count }));

        return {
          totalEvents: events.length,
          metrics,
          dailyUsage: Array.from(dailyUsage.entries()).map(([date, count]) => ({ date, count })),
          featureUsage,
          topIntents
        };
      } catch (error) {
        console.error('Error in getTeacherAssistantAnalytics:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get teacher assistant analytics: ${(error as Error).message}`,
        });
      }
    }),

  // Get time tracking analytics
  getTimeTrackingAnalytics: protectedProcedure
    .input(z.object({
      classId: z.string(),
      activityIds: z.array(z.string()).optional(),
      timeframe: z.enum(['week', 'month', 'term', 'all']).default('month'),
      groupBy: z.enum(['hour', 'day', 'week', 'activity']).default('day')
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          "SYSTEM_ADMIN",
          "SYSTEM_MANAGER",
          "ADMINISTRATOR",
          "CAMPUS_ADMIN",
          "CAMPUS_COORDINATOR",
          "COORDINATOR",
          "TEACHER",
          "CAMPUS_TEACHER",
        ].includes(ctx.session.user.userType as string)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Get time range based on timeframe
        const now = new Date();
        let startDate = new Date();

        switch (input.timeframe) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'term':
            startDate.setMonth(now.getMonth() - 4); // Assuming a term is ~4 months
            break;
          case 'all':
            startDate = new Date(0); // Beginning of time
            break;
        }

        // For now, return mock data that matches the expected structure
        // In a real implementation, you would query the database for time tracking data

        // Generate time distribution data
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const timeSlots = ['6am', '10am', '2pm', '6pm', '10pm', '2am'];

        const timeDistribution = days.flatMap(day =>
          timeSlots.map(time => ({
            day,
            time,
            value: Math.floor(Math.random() * 120) // 0-120 minutes
          }))
        );

        // Generate time efficiency data
        const timeEfficiency = Array(30).fill(0).map(() => ({
          timeSpent: Math.floor(Math.random() * 3600), // 0-60 minutes in seconds
          score: Math.floor(Math.random() * 100) // 0-100%
        }));

        // Generate focus duration data
        const focusDuration = Array(10).fill(0).map((_, i) => {
          let focusScore: number;
          if (i < 3) {
            focusScore = 30 + (i * 20); // Rising
          } else if (i < 7) {
            focusScore = 90 - (Math.random() * 10); // Plateau with small variations
          } else {
            focusScore = 90 - ((i - 6) * 25); // Falling
          }

          return {
            duration: i * 10, // 0-90 minutes
            focusScore
          };
        });

        return {
          timeDistribution,
          timeEfficiency,
          focusDuration,
          totalActivities: 25,
          totalTimeSpent: 12600, // 210 minutes
          averageTimePerActivity: 504, // 8.4 minutes
          peakActivityTime: '2pm',
          peakProductivityTime: '10am'
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve time tracking analytics",
          cause: error,
        });
      }
    }),
  // User engagement analytics
  getUserEngagement: protectedProcedure
    .input(userAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.ADMINISTRATOR,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.COORDINATOR,
          UserType.TEACHER,
          UserType.CAMPUS_TEACHER,
          UserType.STUDENT,
          UserType.CAMPUS_STUDENT,
          UserType.CAMPUS_PARENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Get user engagement data
      try {
        // This is a placeholder for actual implementation
        // In a real implementation, you would query the database for user engagement metrics
        return {
          totalLogins: 0,
          averageSessionDuration: 0,
          completedActivities: 0,
          submittedAssignments: 0,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve user engagement analytics",
          cause: error,
        });
      }
    }),

  // Course performance analytics
  getCoursePerformance: protectedProcedure
    .input(courseAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.ADMINISTRATOR,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.COORDINATOR,
          UserType.TEACHER,
          UserType.CAMPUS_TEACHER,
          UserType.STUDENT,
          UserType.CAMPUS_STUDENT,
          UserType.CAMPUS_PARENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Get course performance data
      try {
        // This is a placeholder for actual implementation
        return {
          averageGrade: 0,
          completionRate: 0,
          studentParticipation: 0,
          topPerformingStudents: [],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve course performance analytics",
          cause: error,
        });
      }
    }),

  getTeacherStats: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.ADMINISTRATOR,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.COORDINATOR,
          UserType.TEACHER,
          UserType.CAMPUS_TEACHER,
          UserType.STUDENT,
          UserType.CAMPUS_STUDENT,
          UserType.CAMPUS_PARENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Get teacher profile
        const teacher = await ctx.prisma.teacherProfile.findUnique({
          where: { id: input.teacherId },
          include: {
            user: true,
            assignments: {
              where: {
                status: SystemStatus.ACTIVE,
              },
              include: {
                class: true,
              },
            },
          },
        });

        if (!teacher) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher not found",
          });
        }

        // Get class IDs for this teacher
        const classIds = teacher.assignments.map((assignment: any) => assignment.classId);

        // Calculate metrics
        const classCount = teacher.assignments.length;

        // Get student count
        const students = await ctx.prisma.studentEnrollment.findMany({
          where: {
            classId: {
              in: classIds,
            },
            status: SystemStatus.ACTIVE,
          },
        });

        const studentCount = students.length;

        // Get attendance rate
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendanceRecords = await ctx.prisma.attendance.findMany({
          where: {
            classId: {
              in: classIds,
            },
            date: {
              gte: thirtyDaysAgo,
            },
          },
        });

        const totalRecords = attendanceRecords.length;
        const presentRecords = attendanceRecords.filter((record: any) => record.status === 'PRESENT').length;
        const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

        // Get assessments created by this teacher
        const assessments = await ctx.prisma.assessment.findMany({
          where: {
            createdById: input.teacherId,
            status: SystemStatus.ACTIVE,
          },
        });

        // Get grades for these assessments
        const assessmentIds = assessments.map((a: any) => a.id);
        const grades = await ctx.prisma.assessmentSubmission.findMany({
          where: {
            assessmentId: {
              in: assessmentIds
            }
          },
          include: {
            assessment: true
          }
        });

        // Calculate grading timeliness (average days between due date and grading date)
        let totalGradingDays = 0;
        let gradedAssessments = 0;

        grades.forEach((grade: any) => {
          if (grade.gradedAt && grade.assessment?.dueDate) {
            const dueDate = new Date(grade.assessment.dueDate);
            const gradedAt = new Date(grade.gradedAt);
            const daysDifference = Math.round((gradedAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            // Only count positive differences (graded after due date)
            if (daysDifference >= 0) {
              totalGradingDays += daysDifference;
              gradedAssessments++;
            }
          }
        });

        const gradingTimeliness = gradedAssessments > 0 ? parseFloat((totalGradingDays / gradedAssessments).toFixed(1)) : 0;

        // Calculate student performance in teacher's classes
        const studentGrades = await ctx.prisma.assessmentSubmission.findMany({
          where: {
            assessment: {
              classId: {
                in: classIds,
              },
            },
          },
          include: {
            assessment: true,
          },
        });

        let totalScore = 0;
        let totalPossible = 0;

        studentGrades.forEach((grade: any) => {
          if (grade.score !== null && grade.assessment?.totalScore) {
            totalScore += grade.score;
            totalPossible += grade.assessment.totalScore;
          }
        });

        const studentPerformance = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

        // Get feedback for this teacher
        const feedback = await ctx.prisma.teacherFeedback.count({
          where: {
            teacherId: input.teacherId,
            feedbackBase: {
              status: SystemStatus.ACTIVE,
            },
          },
        });

        // Calculate positive feedback percentage
        const positiveFeedback = await ctx.prisma.teacherFeedback.count({
          where: {
            teacherId: input.teacherId,
            feedbackBase: {
              status: SystemStatus.ACTIVE,
              severity: 'POSITIVE',
            },
          },
        });

        const positiveFeedbackPercentage = feedback > 0 ? Math.round((positiveFeedback / feedback) * 100) : 0;

        return {
          teacherId: input.teacherId,
          teacherName: teacher.user.name,
          classCount,
          studentCount,
          attendanceRate,
          gradingTimeliness,
          studentPerformance,
          feedbackCount: feedback,
          positiveFeedbackPercentage,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve teacher statistics",
          cause: error,
        });
      }
    }),

  // Class attendance analytics
  getClassAttendance: protectedProcedure
    .input(classAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.ADMINISTRATOR,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.COORDINATOR,
          UserType.TEACHER,
          UserType.CAMPUS_TEACHER,
          UserType.STUDENT,
          UserType.CAMPUS_STUDENT,
          UserType.CAMPUS_PARENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Get class attendance data
      try {
        // This is a placeholder for actual implementation
        return {
          overallAttendanceRate: 0,
          attendanceByDate: [],
          studentsWithLowAttendance: [],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve class attendance analytics",
          cause: error,
        });
      }
    }),

  // Get class leaderboard
  getClassLeaderboard: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get class details
        const classData = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
        });

        // Get student enrollments for this class
        const studentEnrollments = await ctx.prisma.studentEnrollment.findMany({
          where: {
            classId: input.classId,
            status: SystemStatus.ACTIVE,
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (!classData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        // Get all grades for this class
        const grades = await ctx.prisma.assessmentSubmission.findMany({
          where: {
            assessment: {
              classId: input.classId,
            },
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            assessment: true,
          },
        });

        // Calculate student scores
        const studentScores = new Map();

        grades.forEach((grade: any) => {
          const studentId = grade.studentId;
          const score = grade.score || 0;
          const totalScore = grade.assessment?.totalScore || 100;
          const weightedScore = (score / totalScore) * 100;

          if (!studentScores.has(studentId)) {
            studentScores.set(studentId, {
              studentId,
              userId: grade.student?.user?.id,
              name: grade.student?.user?.name || 'Unknown',
              image: grade.student?.user?.image,
              totalScore: 0,
              assessmentCount: 0,
              averageScore: 0,
            });
          }

          const currentStudent = studentScores.get(studentId);
          currentStudent.totalScore += weightedScore;
          currentStudent.assessmentCount += 1;
          currentStudent.averageScore = currentStudent.totalScore / currentStudent.assessmentCount;
          studentScores.set(studentId, currentStudent);
        });

        // Convert to array and sort by average score
        const leaderboard = Array.from(studentScores.values())
          .sort((a, b) => b.averageScore - a.averageScore)
          .map((student, index) => ({
            ...student,
            rank: index + 1,
            averageScore: Math.round(student.averageScore),
          }));

        // Add students with no grades
        studentEnrollments.forEach((enrollment: any) => {
          const studentId = enrollment.studentId;
          if (!studentScores.has(studentId)) {
            leaderboard.push({
              studentId,
              userId: enrollment.student.user.id,
              name: enrollment.student.user.name,
              image: null,
              totalScore: 0,
              assessmentCount: 0,
              averageScore: 0,
              rank: leaderboard.length + 1,
            });
          }
        });

        return {
          classId: input.classId,
          className: classData.name,
          leaderboard,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve class leaderboard",
          cause: error,
        });
      }
    }),

  // Institution-wide analytics
  getInstitutionOverview: protectedProcedure
    .input(institutionAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.ADMINISTRATOR,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.COORDINATOR,
          UserType.TEACHER,
          UserType.CAMPUS_TEACHER,
          UserType.STUDENT,
          UserType.CAMPUS_STUDENT,
          UserType.CAMPUS_PARENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Get institution overview data
      try {
        // This is a placeholder for actual implementation
        return {
          activeUsers: 0,
          totalCourses: 0,
          averageGrades: 0,
          completionRates: 0,
          topPerformingCourses: [],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve institution overview analytics",
          cause: error,
        });
      }
    }),

  // Get leaderboard correlation analysis
  getLeaderboardCorrelation: protectedProcedure
    .input(
      z.object({
        entityType: z.enum([
          LeaderboardEntityType.CLASS,
          LeaderboardEntityType.SUBJECT,
          LeaderboardEntityType.COURSE,
          LeaderboardEntityType.CAMPUS,
          LeaderboardEntityType.CUSTOM_GROUP
        ]),
        entityId: z.string(),
        timeframe: z.string().optional()
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
        // Get the entity type and ID
        const { entityType, entityId } = { entityType: input.entityType, entityId: input.entityId };

        // Create an instance of the UnifiedLeaderboardService
        const leaderboardService = new UnifiedLeaderboardService({ prisma: ctx.prisma });

        // Get leaderboard data
        const leaderboardData = await leaderboardService.getLeaderboard({
          type: entityType,
          referenceId: entityId,
          timeGranularity: input.timeframe as TimeGranularity || TimeGranularity.TERM,
          filterOptions: {
            limit: 50,
            includeCurrentStudent: false
          }
        });

        // Get student data for correlation analysis
        const students = await ctx.prisma.studentProfile.findMany({
          where: {
            enrollments: {
              some: {
                status: SystemStatus.ACTIVE,
                class: entityType === LeaderboardEntityType.CLASS
                  ? { id: entityId }
                  : entityType === LeaderboardEntityType.COURSE
                    ? { courseCampus: { courseId: entityId } }
                    : undefined
              }
            }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            },
            enrollments: {
              where: {
                status: SystemStatus.ACTIVE
              },
              include: {
                class: true
              }
            },
            assessmentSubmissions: {
              where: {
                status: {
                  in: ['SUBMITTED', 'GRADED']
                }
              },
              include: {
                assessment: true
              }
            },
            attendanceRecords: true
          }
        });

        // Calculate correlation data
        const correlations = students.map((student: any) => {
          // Find student in leaderboard
          const leaderboardEntry = leaderboardData.leaderboard.find(
            (entry: StandardLeaderboardEntry) => entry.studentId === student.id
          );

          // Calculate academic performance (average grade)
          let totalScore = 0;
          let totalMaxScore = 0;

          student.assessmentSubmissions.forEach((submission: any) => {
            if (submission.score !== null && submission.assessment?.maxScore) {
              totalScore += submission.score;
              totalMaxScore += submission.assessment.maxScore;
            }
          });

          const academicPerformance = totalMaxScore > 0
            ? Math.round((totalScore / totalMaxScore) * 100)
            : 0;

          // Calculate attendance rate
          const totalAttendance = student.attendanceRecords.length;
          const presentAttendance = student.attendanceRecords.filter(
            (record: any) => record.status === 'PRESENT'
          ).length;

          const attendance = totalAttendance > 0
            ? Math.round((presentAttendance / totalAttendance) * 100)
            : 0;

          return {
            studentName: student.user.name,
            leaderboardPosition: leaderboardEntry?.rank || 0,
            academicPerformance,
            attendance
          };
        });

        return { correlations };
      } catch (error) {
        console.error("Error fetching correlation data:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch correlation data",
          cause: error,
        });
      }
    }),

  // Get cohort comparison data
  getCohortComparison: protectedProcedure
    .input(
      z.object({
        entityType: z.enum([
          LeaderboardEntityType.CLASS,
          LeaderboardEntityType.SUBJECT,
          LeaderboardEntityType.COURSE,
          LeaderboardEntityType.CAMPUS,
          LeaderboardEntityType.CUSTOM_GROUP
        ]),
        entityId: z.string(),
        timeframe: z.string().optional()
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
        // Get the entity type and ID
        const { entityType, entityId } = { entityType: input.entityType, entityId: input.entityId };

        // Create an instance of the UnifiedLeaderboardService
        const leaderboardService = new UnifiedLeaderboardService({ prisma: ctx.prisma });

        // Get classes for comparison based on entity type
        let classes: { id: string; name: string }[] = [];

        if (entityType === LeaderboardEntityType.CLASS) {
          // For class entity, get other classes in the same course
          const currentClass = await ctx.prisma.class.findUnique({
            where: { id: entityId },
            include: {
              courseCampus: true
            }
          });

          if (currentClass && currentClass.courseCampus) {
            const courseClasses = await ctx.prisma.class.findMany({
              where: {
                courseCampusId: currentClass.courseCampusId,
                id: { not: entityId }, // Exclude current class
                status: SystemStatus.ACTIVE
              },
              select: {
                id: true,
                name: true
              }
            });

            classes = [
              { id: entityId, name: currentClass.name }, // Include current class
              ...courseClasses
            ];
          }
        } else if (entityType === LeaderboardEntityType.COURSE) {
          // For course entity, get classes in this course
          const courseClasses = await ctx.prisma.class.findMany({
            where: {
              courseCampus: {
                courseId: entityId
              },
              status: SystemStatus.ACTIVE
            },
            select: {
              id: true,
              name: true
            }
          });

          classes = courseClasses;
        } else if (entityType === LeaderboardEntityType.CAMPUS) {
          // For campus entity, get top classes by performance
          const topClasses = await ctx.prisma.class.findMany({
            where: {
              campusId: entityId,
              status: SystemStatus.ACTIVE
            },
            select: {
              id: true,
              name: true
            },
            take: 5 // Limit to top 5 classes
          });

          classes = topClasses;
        }

        // Get leaderboard data for each class
        const cohortData = await Promise.all(
          classes.map(async (cls) => {
            try {
              const leaderboardData = await leaderboardService.getLeaderboard({
                type: LeaderboardEntityType.CLASS,
                referenceId: cls.id,
                timeGranularity: input.timeframe as TimeGranularity || TimeGranularity.TERM
              });

              // Calculate average metrics
              let totalPosition = 0;
              let totalScore = 0;
              let totalGrade = 0;
              const entries = leaderboardData.leaderboard;

              entries.forEach((entry: StandardLeaderboardEntry) => {
                totalPosition += entry.rank || 0;
                // Use a different property since score doesn't exist
                totalScore += (entry as any).score || 0;
                totalGrade += entry.academicScore || 0;
              });

              const count = entries.length || 1; // Avoid division by zero

              return {
                name: cls.name,
                averagePosition: Math.round(totalPosition / count),
                averageScore: Math.round(totalScore / count),
                averageGrade: Math.round(totalGrade / count)
              };
            } catch (error) {
              console.error(`Error getting leaderboard for class ${cls.id}:`, error);
              return {
                name: cls.name,
                averagePosition: 0,
                averageScore: 0,
                averageGrade: 0
              };
            }
          })
        );

        return { cohorts: cohortData };
      } catch (error) {
        console.error("Error fetching cohort comparison data:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cohort comparison data",
          cause: error,
        });
      }
    }),

  // Get intervention suggestions
  getInterventionSuggestions: protectedProcedure
    .input(
      z.object({
        entityType: z.enum([
          LeaderboardEntityType.CLASS,
          LeaderboardEntityType.SUBJECT,
          LeaderboardEntityType.COURSE,
          LeaderboardEntityType.CAMPUS,
          LeaderboardEntityType.CUSTOM_GROUP
        ]),
        entityId: z.string(),
        timeframe: z.string().optional()
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
        // Get the entity type and ID
        const { entityType, entityId } = { entityType: input.entityType, entityId: input.entityId };

        // Create an instance of the UnifiedLeaderboardService
        const leaderboardService = new UnifiedLeaderboardService({ prisma: ctx.prisma });

        // Get current leaderboard data
        const currentLeaderboard = await leaderboardService.getLeaderboard({
          type: entityType,
          referenceId: entityId,
          timeGranularity: input.timeframe as TimeGranularity || TimeGranularity.TERM,
          filterOptions: {
            limit: 100 // Get a larger sample for analysis
          }
        });

        // Get previous leaderboard data (from previous period)
        const previousTimeGranularity = getPreviousPeriod(input.timeframe as TimeGranularity || TimeGranularity.TERM);
        const previousLeaderboard = await leaderboardService.getLeaderboard({
          type: entityType,
          referenceId: entityId,
          timeGranularity: previousTimeGranularity,
          filterOptions: {
            limit: 100
          }
        });

        // Get student data for additional context
        const studentIds = currentLeaderboard.leaderboard.map(entry => entry.studentId);

        const students = await ctx.prisma.studentProfile.findMany({
          where: {
            id: { in: studentIds }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            },
            assessmentSubmissions: {
              where: {
                status: {
                  in: ['SUBMITTED', 'GRADED']
                }
              },
              include: {
                assessment: true
              }
            },
            attendanceRecords: {
              orderBy: {
                date: 'desc'
              },
              take: 30 // Last 30 attendance records
            }
          }
        });

        // Generate intervention suggestions
        const interventions = studentIds.map((studentId) => {
          // Find student in current and previous leaderboards
          const currentEntry = currentLeaderboard.leaderboard.find((entry: StandardLeaderboardEntry) => entry.studentId === studentId);
          const previousEntry = previousLeaderboard.leaderboard.find((entry: StandardLeaderboardEntry) => entry.studentId === studentId);

          if (!currentEntry) return null;

          const student = students.find((s: any) => s.id === studentId);
          if (!student) return null;

          const currentPosition = currentEntry.rank || 0;
          const previousPosition = previousEntry?.rank || 0;
          const positionChange = previousPosition > 0 ? previousPosition - currentPosition : 0;

          // Calculate metrics for intervention analysis
          const attendanceRecords = student.attendanceRecords || [];
          const recentAbsences = attendanceRecords.filter((record: any) => record.status === 'ABSENT').length;
          const attendanceRate = attendanceRecords.length > 0
            ? (attendanceRecords.filter((record: any) => record.status === 'PRESENT').length / attendanceRecords.length) * 100
            : 0;

          const submissions = student.assessmentSubmissions || [];
          // Only use pendingSubmissions in the logic
          const pendingSubmissions = submissions.filter((sub: any) => sub.status === 'PENDING' || sub.status === 'SUBMITTED').length;

          let totalScore = 0;
          let totalMaxScore = 0;

          submissions.forEach((submission: any) => {
            if (submission.score !== null && submission.assessment?.maxScore) {
              totalScore += submission.score;
              totalMaxScore += submission.assessment.maxScore;
            }
          });

          const averageScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

          // Determine issues and suggestions
          let issue = '';
          let suggestion = '';
          let priority = 'medium';

          if (positionChange < -5) {
            // Significant drop in ranking
            issue = 'Significant drop in leaderboard position';
            suggestion = 'Schedule a one-on-one meeting to discuss recent performance challenges';
            priority = 'high';
          } else if (recentAbsences > 3) {
            // Attendance issues
            issue = 'Multiple recent absences affecting performance';
            suggestion = 'Follow up on attendance and provide catch-up resources';
            priority = 'high';
          } else if (pendingSubmissions > 3) {
            // Missing assignments
            issue = 'Multiple pending assignments';
            suggestion = 'Send reminder about pending assignments and offer extended office hours';
            priority = 'medium';
          } else if (averageScore < 60) {
            // Low academic performance
            issue = 'Below average academic performance';
            suggestion = 'Provide additional learning resources and consider tutoring options';
            priority = 'medium';
          } else if (attendanceRate < 70) {
            // Poor attendance overall
            issue = 'Poor overall attendance rate';
            suggestion = 'Discuss attendance importance and its impact on performance';
            priority = 'low';
          }

          // Only return interventions where there's an actual issue
          if (!issue) return null;

          return {
            id: `intervention-${studentId}-${Date.now()}`,
            studentName: student.user.name,
            currentPosition,
            previousPosition,
            positionChange,
            issue,
            suggestion,
            priority
          };
        }).filter(Boolean); // Remove null entries

        return { interventions };
      } catch (error) {
        console.error("Error generating intervention suggestions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate intervention suggestions",
          cause: error,
        });
      }
    }),
});