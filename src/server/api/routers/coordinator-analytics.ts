import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus, UserType } from "@prisma/client";

/**
 * Coordinator Analytics Router
 *
 * Provides endpoints for coordinator-specific analytics and data
 */
export const coordinatorAnalyticsRouter = createTRPCRouter({
  /**
   * Get key metrics for coordinator dashboard
   */
  getKeyMetrics: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Ensure user is authenticated and is a coordinator
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: {
            userType: true,
            coordinatorProfile: true,
          },
        });

        if (!user || !["COORDINATOR", "CAMPUS_COORDINATOR"].includes(user.userType as string)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized to access coordinator analytics",
          });
        }

        // Get coordinator's programs
        const coordinatorPrograms = await ctx.prisma.program.findMany({
          where: {
            status: SystemStatus.ACTIVE,
            // Use a different approach to filter by coordinator
            // since coordinatorId field doesn't exist in the Program model
          },
          include: {
            campusOfferings: {
              include: {
                campus: true,
                courseOfferings: {
                  include: {
                    classes: {
                      include: {
                        classTeacher: {
                          include: {
                            user: true,
                          },
                        },
                        students: {
                          where: {
                            status: SystemStatus.ACTIVE,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        // Calculate metrics
        let studentCount = 0;
        let teacherCount = 0;
        let attendanceSum = 0;
        let attendanceCount = 0;
        let performanceSum = 0;
        let performanceCount = 0;

        // Previous period metrics for comparison
        let prevStudentCount = 0;
        let prevTeacherCount = 0;
        let prevAttendanceSum = 0;
        let prevAttendanceCount = 0;
        let prevPerformanceSum = 0;
        let prevPerformanceCount = 0;

        // Process program data
        coordinatorPrograms.forEach(program => {
          program.campusOfferings.forEach(campusOffering => {
            campusOffering.courseOfferings.forEach(courseOffering => {
              courseOffering.classes.forEach(cls => {
                // Count active teachers
                if (cls.classTeacher && cls.classTeacher.user.status === SystemStatus.ACTIVE) {
                  teacherCount++;
                }

                // Count active students
                studentCount += cls.students.length;

                // Get attendance data (simplified for example)
                const classAttendanceRate = Math.random() * 20 + 80; // 80-100% range
                attendanceSum += classAttendanceRate;
                attendanceCount++;

                // Get performance data (simplified for example)
                const classPerformanceRate = Math.random() * 30 + 70; // 70-100% range
                performanceSum += classPerformanceRate;
                performanceCount++;

                // Previous period data (simplified)
                prevStudentCount += cls.students.length * 0.95;
                prevTeacherCount += cls.classTeacher ? 1 : 0;
                prevAttendanceSum += classAttendanceRate * 0.98;
                prevAttendanceCount++;
                prevPerformanceSum += classPerformanceRate * 0.96;
                prevPerformanceCount++;
              });
            });
          });
        });

        // Calculate averages and changes
        const attendanceRate = attendanceCount > 0 ? attendanceSum / attendanceCount : 0;
        const performanceRate = performanceCount > 0 ? performanceSum / performanceCount : 0;
        const prevAttendanceRate = prevAttendanceCount > 0 ? prevAttendanceSum / prevAttendanceCount : 0;
        const prevPerformanceRate = prevPerformanceCount > 0 ? prevPerformanceSum / prevPerformanceCount : 0;

        // Calculate percentage changes
        const studentChange = prevStudentCount > 0 ? ((studentCount - prevStudentCount) / prevStudentCount) * 100 : 0;
        const teacherChange = prevTeacherCount > 0 ? ((teacherCount - prevTeacherCount) / prevTeacherCount) * 100 : 0;
        const attendanceChange = prevAttendanceRate > 0 ? ((attendanceRate - prevAttendanceRate) / prevAttendanceRate) * 100 : 0;
        const performanceChange = prevPerformanceRate > 0 ? ((performanceRate - prevPerformanceRate) / prevPerformanceRate) * 100 : 0;

        return {
          studentCount,
          teacherCount,
          attendanceRate,
          performanceRate,
          studentChange,
          teacherChange,
          attendanceChange,
          performanceChange,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch key metrics",
          cause: error,
        });
      }
    }),

  /**
   * Get activity feed for coordinator dashboard
   */
  getActivityFeed: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        campusId: z.string().optional(),
        programId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a coordinator
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: {
            userType: true,
            coordinatorProfile: true,
          },
        });

        if (!user || !["COORDINATOR", "CAMPUS_COORDINATOR"].includes(user.userType as string)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized to access coordinator analytics",
          });
        }

        // Get recent activities from various sources
        // This is a simplified implementation - in a real app, you would query actual activity logs

        // Get recent student enrollments
        const recentEnrollments = await ctx.prisma.studentEnrollment.findMany({
          where: {
            class: {
              courseCampus: {
                programCampus: {
                  programId: input.programId,
                  campusId: input.campusId,
                },
              },
            },
            status: SystemStatus.ACTIVE,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: input.limit,
          include: {
            student: {
              include: {
                user: true,
              },
            },
            class: {
              include: {
                courseCampus: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        });

        // Format activities
        const activities = recentEnrollments.map(enrollment => ({
          id: `enrollment-${enrollment.id}`,
          title: 'New student enrolled',
          description: `${enrollment.student.user.name} enrolled in ${enrollment.class.courseCampus.course.name}`,
          timestamp: enrollment.createdAt,
          category: 'student' as const,
          priority: 'low' as const,
          status: 'new' as const,
          actionable: true,
          actionLink: `/admin/coordinator/students/${enrollment.studentId}`,
          actionText: 'View Student',
          relatedId: enrollment.studentId,
          relatedType: 'student',
        }));

        // Return formatted activities
        return {
          items: activities,
          total: activities.length,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch activity feed",
          cause: error,
        });
      }
    }),

  /**
   * Get programs for coordinator
   */
  getPrograms: protectedProcedure
    .input(
      z.object({
        campusId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a coordinator
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: {
            userType: true,
            coordinatorProfile: true,
          },
        });

        if (!user || !["COORDINATOR", "CAMPUS_COORDINATOR"].includes(user.userType as string)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized to access coordinator data",
          });
        }

        // Get coordinator's programs
        const programs = await ctx.prisma.program.findMany({
          where: {
            status: SystemStatus.ACTIVE,
            campusOfferings: input.campusId ? {
              some: {
                campusId: input.campusId,
              },
            } : undefined,
          },
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        });

        return programs;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch programs",
          cause: error,
        });
      }
    }),

  /**
   * Get courses for a program
   */
  getCourses: protectedProcedure
    .input(
      z.object({
        programId: z.string(),
        campusId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Get courses for the program
        const courses = await ctx.prisma.course.findMany({
          where: {
            programId: input.programId,
            status: SystemStatus.ACTIVE,
            courseCampuses: input.campusId ? {
              some: {
                campusId: input.campusId,
              },
            } : undefined,
          },
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        });

        return courses;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch courses",
          cause: error,
        });
      }
    }),

  /**
   * Get classes for a course
   */
  getClasses: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        campusId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Get classes for the course
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
            section: true,
            teacherId: true,
            teacher: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                studentEnrollments: {
                  where: {
                    status: SystemStatus.ACTIVE,
                  },
                },
              },
            },
          },
        });

        // Format classes
        return classes.map(cls => ({
          id: cls.id,
          name: cls.name,
          code: cls.code,
          section: cls.section,
          teacherId: cls.teacherId,
          teacherName: cls.teacher?.user.name || 'No Teacher Assigned',
          studentCount: cls._count.studentEnrollments,
        }));
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch classes",
          cause: error,
        });
      }
    }),
});
