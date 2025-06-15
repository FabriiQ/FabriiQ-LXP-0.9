import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { TeacherMetricType, TimeframeType } from "@/types/analytics";

/**
 * Teacher Analytics Router
 * 
 * Provides endpoints for teacher performance analytics and comparisons
 */
export const teacherAnalyticsRouter = createTRPCRouter({
  /**
   * Get teacher performance metrics
   */
  getTeacherMetrics: protectedProcedure
    .input(
      z.object({
        teacherId: z.string().optional(),
        courseId: z.string().optional(),
        programId: z.string().optional(),
        timeframe: z.enum(["week", "month", "term", "year"]).default("term"),
        metricType: z.enum([
          "studentPerformance", 
          "attendanceRate", 
          "feedbackTime", 
          "classEngagement", 
          "contentQuality", 
          "overallRating"
        ]).default("overallRating"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { teacherId, courseId, programId, timeframe, metricType } = input;

      try {
        // If a specific teacher is requested
        if (teacherId) {
          const teacher = await prisma.teacher.findUnique({
            where: { id: teacherId },
            include: {
              user: {
                select: {
                  name: true,
                  image: true,
                }
              },
              classes: {
                select: {
                  id: true,
                  name: true,
                  students: {
                    select: { id: true }
                  },
                  course: {
                    select: { id: true, name: true }
                  }
                }
              },
              teacherMetrics: {
                where: {
                  timeframe: timeframe as TimeframeType,
                  ...(courseId && { courseId }),
                  ...(programId && { programId }),
                },
                orderBy: { createdAt: 'desc' },
                take: 1,
              }
            }
          });

          if (!teacher) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Teacher not found",
            });
          }

          return {
            id: teacher.id,
            name: teacher.user.name || "Unknown",
            avatar: teacher.user.image,
            metrics: teacher.teacherMetrics[0] || {
              studentPerformance: 0,
              attendanceRate: 0,
              feedbackTime: 0,
              classEngagement: 0,
              contentQuality: 0,
              overallRating: 0,
            },
            classes: teacher.classes.map(cls => ({
              id: cls.id,
              name: cls.name,
              studentCount: cls.students.length,
              courseName: cls.course.name,
            })),
          };
        }

        // Get all teachers with their metrics
        const teachers = await prisma.teacher.findMany({
          where: {
            ...(courseId && {
              classes: {
                some: {
                  courseId,
                }
              }
            }),
            ...(programId && {
              classes: {
                some: {
                  course: {
                    programId,
                  }
                }
              }
            }),
          },
          include: {
            user: {
              select: {
                name: true,
                image: true,
              }
            },
            classes: {
              select: {
                id: true,
                name: true,
                students: {
                  select: { id: true }
                },
                course: {
                  select: { id: true, name: true }
                }
              }
            },
            teacherMetrics: {
              where: {
                timeframe: timeframe as TimeframeType,
                ...(courseId && { courseId }),
                ...(programId && { programId }),
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            }
          }
        });

        return teachers.map(teacher => ({
          id: teacher.id,
          name: teacher.user.name || "Unknown",
          avatar: teacher.user.image,
          metrics: teacher.teacherMetrics[0] || {
            studentPerformance: 0,
            attendanceRate: 0,
            feedbackTime: 0,
            classEngagement: 0,
            contentQuality: 0,
            overallRating: 0,
          },
          classes: teacher.classes.map(cls => ({
            id: cls.id,
            name: cls.name,
            studentCount: cls.students.length,
            courseName: cls.course.name,
          })),
        }));
      } catch (error) {
        console.error("Error fetching teacher metrics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch teacher metrics",
        });
      }
    }),

  /**
   * Get teacher performance trends
   */
  getTeacherTrends: protectedProcedure
    .input(
      z.object({
        teacherIds: z.array(z.string()),
        courseId: z.string().optional(),
        programId: z.string().optional(),
        timeframe: z.enum(["week", "month", "term", "year"]).default("term"),
        metricType: z.enum([
          "studentPerformance", 
          "attendanceRate", 
          "feedbackTime", 
          "classEngagement", 
          "contentQuality", 
          "overallRating"
        ]).default("studentPerformance"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { teacherIds, courseId, programId, timeframe, metricType } = input;

      try {
        // Get historical metrics for the specified teachers
        const teacherTrends = await Promise.all(
          teacherIds.map(async (teacherId) => {
            const teacher = await prisma.teacher.findUnique({
              where: { id: teacherId },
              include: {
                user: {
                  select: {
                    name: true,
                  }
                },
                teacherMetricsHistory: {
                  where: {
                    timeframe: timeframe as TimeframeType,
                    ...(courseId && { courseId }),
                    ...(programId && { programId }),
                  },
                  orderBy: { date: 'asc' },
                  select: {
                    date: true,
                    [metricType]: true,
                  }
                }
              }
            });

            if (!teacher) {
              return {
                teacherId,
                teacherName: "Unknown",
                trends: [],
              };
            }

            return {
              teacherId,
              teacherName: teacher.user.name || "Unknown",
              trends: teacher.teacherMetricsHistory.map(history => ({
                date: history.date,
                value: history[metricType as keyof typeof history] as number,
              })),
            };
          })
        );

        return teacherTrends;
      } catch (error) {
        console.error("Error fetching teacher trends:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch teacher trends",
        });
      }
    }),

  /**
   * Get available courses for teacher analytics
   */
  getAvailableCourses: protectedProcedure
    .input(
      z.object({
        programId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { programId } = input;

      try {
        const courses = await prisma.course.findMany({
          where: {
            ...(programId && { programId }),
            status: "ACTIVE",
          },
          select: {
            id: true,
            name: true,
            code: true,
          },
          orderBy: {
            name: 'asc',
          },
        });

        return courses;
      } catch (error) {
        console.error("Error fetching available courses:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch available courses",
        });
      }
    }),
});
