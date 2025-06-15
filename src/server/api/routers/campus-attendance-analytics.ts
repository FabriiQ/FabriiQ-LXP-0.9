import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { UserType } from "../constants";
import { AttendanceService } from "../services/attendance.service";
import { AttendanceStatusType } from "@prisma/client";

/**
 * Calculate attendance rate from status counts
 * @param statusCounts Record of attendance status counts
 * @returns Attendance rate as a percentage
 */
function calculateAttendanceRate(statusCounts?: Partial<Record<AttendanceStatusType, number>>): number {
  if (!statusCounts) return 0;
  const presentCount = statusCounts.PRESENT || 0;
  const totalCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  return totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
}

/**
 * Campus Attendance Analytics Router
 * Provides endpoints for retrieving campus-specific attendance analytics data
 */
export const campusAttendanceAnalyticsRouter = createTRPCRouter({
  // Get course attendance statistics
  getCourseAttendanceStats: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      period: z.enum(["week", "month", "term", "year"]).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          "COORDINATOR", // Add plain COORDINATOR type
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Calculate date range based on period or use provided dates
        let endDate = input.endDate ? new Date(input.endDate) : new Date();
        let startDate = input.startDate ? new Date(input.startDate) : new Date();

        // If dates are not provided, calculate based on period
        if (!input.startDate && input.period) {
          switch (input.period) {
            case "week":
              startDate.setDate(startDate.getDate() - 7);
              break;
            case "month":
              startDate.setDate(startDate.getDate() - 30);
              break;
            case "term":
              startDate.setMonth(startDate.getMonth() - 4);
              break;
            case "year":
              startDate.setFullYear(startDate.getFullYear() - 1);
              break;
            default:
              // Default to month if no period specified
              startDate.setDate(startDate.getDate() - 30);
          }
        } else if (!input.startDate && !input.period) {
          // Default to month if neither period nor dates are specified
          startDate.setDate(startDate.getDate() - 30);
        }

        // Get all course campuses for this campus
        const courseCampuses = await ctx.prisma.courseCampus.findMany({
          where: {
            campusId: input.campusId,
            status: 'ACTIVE',
          },
          include: {
            course: {
              include: {
                program: true,
              },
            },
            _count: {
              select: {
                classes: {
                  where: {
                    status: 'ACTIVE',
                  },
                },
              },
            },
          },
        });

        // Get attendance stats for each course
        const courseStats = await Promise.all(
          courseCampuses.map(async (courseCampus) => {
            // Get classes for this course
            const classes = await ctx.prisma.class.findMany({
              where: {
                courseCampusId: courseCampus.id,
                status: 'ACTIVE',
              },
              select: {
                id: true,
              },
            });

            const classIds = classes.map(c => c.id);

            if (classIds.length === 0) {
              return {
                courseCampusId: courseCampus.id,
                courseId: courseCampus.courseId,
                courseName: courseCampus.course.name,
                courseCode: courseCampus.course.code,
                programName: courseCampus.course.program.name,
                classCount: 0,
                studentCount: 0,
                attendanceRate: 0,
                statistics: {
                  present: 0,
                  absent: 0,
                  late: 0,
                  excused: 0,
                },
              };
            }

            // Get attendance records for these classes
            const attendanceRecords = await ctx.prisma.attendance.findMany({
              where: {
                classId: {
                  in: classIds,
                },
                date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              select: {
                status: true,
              },
            });

            // Count by status
            let present = 0;
            let absent = 0;
            let late = 0;
            let excused = 0;

            attendanceRecords.forEach(record => {
              switch (record.status) {
                case 'PRESENT':
                  present += 1;
                  break;
                case 'ABSENT':
                  absent += 1;
                  break;
                case 'LATE':
                  late += 1;
                  break;
                case 'EXCUSED':
                  excused += 1;
                  break;
              }
            });

            // Calculate attendance rate
            const total = present + absent + late + excused;
            const attendanceRate = total > 0 ? (present / total) * 100 : 0;

            // Get student count
            const studentCount = await ctx.prisma.studentEnrollment.count({
              where: {
                classId: {
                  in: classIds,
                },
                status: 'ACTIVE',
              },
            });

            return {
              courseCampusId: courseCampus.id,
              courseId: courseCampus.courseId,
              courseName: courseCampus.course.name,
              courseCode: courseCampus.course.code,
              programName: courseCampus.course.program.name,
              classCount: courseCampus._count.classes,
              studentCount,
              attendanceRate,
              statistics: {
                present,
                absent,
                late,
                excused,
              },
            };
          })
        );

        // Sort by attendance rate
        courseStats.sort((a, b) => b.attendanceRate - a.attendanceRate);

        return {
          period: input.period,
          courseStats,
        };
      } catch (error) {
        console.error('Error in getCourseAttendanceStats:', error);

        // Return default data instead of throwing an error
        return {
          period: input.period,
          courseStats: [],
        };
      }
    }),
  // Get campus attendance overview
  getAttendanceOverview: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      period: z.enum(["week", "month", "term", "year"]).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          "COORDINATOR", // Add plain COORDINATOR type
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Calculate date range based on period or use provided dates
        let endDate = input.endDate ? new Date(input.endDate) : new Date();
        let startDate = input.startDate ? new Date(input.startDate) : new Date();

        // If dates are not provided, calculate based on period
        if (!input.startDate && input.period) {
          switch (input.period) {
            case "week":
              startDate.setDate(startDate.getDate() - 7);
              break;
            case "month":
              startDate.setDate(startDate.getDate() - 30);
              break;
            case "term":
              startDate.setMonth(startDate.getMonth() - 4);
              break;
            case "year":
              startDate.setFullYear(startDate.getFullYear() - 1);
              break;
            default:
              // Default to month if no period specified
              startDate.setDate(startDate.getDate() - 30);
          }
        } else if (!input.startDate && !input.period) {
          // Default to month if neither period nor dates are specified
          startDate.setDate(startDate.getDate() - 30);
        }

        // Get all classes for this campus
        const classes = await ctx.prisma.class.findMany({
          where: {
            courseCampus: {
              campusId: input.campusId
            },
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            code: true,
          }
        });

        // We'll use the classes array directly instead of just the IDs

        // Get attendance records for all classes in the campus
        const attendanceService = new AttendanceService({ prisma: ctx.prisma });

        // Calculate overall attendance statistics
        let totalStudents = 0;
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;
        let totalExcused = 0;

        // Get attendance stats for each class
        const classStats = await Promise.all(
          classes.map(async (classItem) => {
            try {
              const stats = await attendanceService.getClassAttendanceStats(
                classItem.id,
                startDate,
                endDate
              );

              // Add to totals
              totalStudents += stats.stats.totalStudents || 0;
              totalPresent += stats.stats.statusCounts?.PRESENT || 0;
              totalAbsent += stats.stats.statusCounts?.ABSENT || 0;
              totalLate += stats.stats.statusCounts?.LATE || 0;
              totalExcused += stats.stats.statusCounts?.EXCUSED || 0;

              return {
                classId: classItem.id,
                className: classItem.name,
                classCode: classItem.code,
                // Calculate attendance rate from status counts
                attendanceRate: calculateAttendanceRate(stats.stats.statusCounts),
                studentCount: stats.stats.totalStudents || 0,
                statistics: {
                  present: stats.stats.statusCounts?.PRESENT || 0,
                  absent: stats.stats.statusCounts?.ABSENT || 0,
                  late: stats.stats.statusCounts?.LATE || 0,
                  excused: stats.stats.statusCounts?.EXCUSED || 0,
                  leave: stats.stats.statusCounts?.LEAVE || 0
                }
              };
            } catch (error) {
              console.error(`Error getting stats for class ${classItem.id}:`, error);
              return {
                classId: classItem.id,
                className: classItem.name,
                classCode: classItem.code,
                attendanceRate: 0,
                studentCount: 0,
                statistics: {
                  present: 0,
                  absent: 0,
                  late: 0,
                  excused: 0,
                  leave: 0
                }
              };
            }
          })
        );

        // Calculate overall attendance rate
        const totalRecords = totalPresent + totalAbsent + totalLate + totalExcused;
        const overallAttendanceRate = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

        // Sort classes by attendance rate
        classStats.sort((a, b) => b.attendanceRate - a.attendanceRate);

        return {
          period: input.period,
          overallAttendanceRate,
          totalStudents,
          totalRecords,
          statistics: {
            present: totalPresent,
            absent: totalAbsent,
            late: totalLate,
            excused: totalExcused
          },
          classStats: classStats,
          topClasses: classStats.slice(0, 5),
          bottomClasses: [...classStats].sort((a, b) => a.attendanceRate - b.attendanceRate).slice(0, 5)
        };
      } catch (error) {
        console.error('Error in getAttendanceOverview:', error);

        // Return default data instead of throwing an error
        return {
          period: input.period,
          overallAttendanceRate: 0,
          totalStudents: 0,
          totalRecords: 0,
          statistics: {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
          },
          classStats: [],
          topClasses: [],
          bottomClasses: []
        };
      }
    }),

  // Get attendance trends
  getAttendanceTrends: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      period: z.enum(["week", "month", "term", "year"]).optional().default("month"),
      classId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          "COORDINATOR", // Add plain COORDINATOR type
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Calculate date range based on period
        const endDate = new Date();
        let startDate = new Date();
        let interval = "day";

        switch (input.period) {
          case "week":
            startDate.setDate(startDate.getDate() - 7);
            interval = "day";
            break;
          case "month":
            startDate.setMonth(startDate.getMonth() - 1);
            interval = "day";
            break;
          case "term":
            startDate.setMonth(startDate.getMonth() - 4);
            interval = "week";
            break;
          case "year":
            startDate.setFullYear(startDate.getFullYear() - 1);
            interval = "month";
            break;
        }

        // Get classes for this campus
        const whereClause: any = {
          courseCampus: {
            campusId: input.campusId
          },
          status: 'ACTIVE'
        };

        if (input.classId) {
          whereClause.id = input.classId;
        }

        const classes = await ctx.prisma.class.findMany({
          where: whereClause,
          select: {
            id: true
          }
        });

        const classIds = classes.map(c => c.id);

        // Get attendance records for the date range
        const attendanceRecords = await ctx.prisma.attendance.findMany({
          where: {
            classId: {
              in: classIds
            },
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            date: true,
            status: true
          }
        });

        // Group records by date and status
        const recordsByDate = new Map();

        attendanceRecords.forEach(record => {
          const dateKey = record.date.toISOString().split('T')[0];

          if (!recordsByDate.has(dateKey)) {
            recordsByDate.set(dateKey, {
              date: dateKey,
              present: 0,
              absent: 0,
              late: 0,
              excused: 0
            });
          }

          const dateStats = recordsByDate.get(dateKey);

          switch (record.status) {
            case 'PRESENT':
              dateStats.present += 1;
              break;
            case 'ABSENT':
              dateStats.absent += 1;
              break;
            case 'LATE':
              dateStats.late += 1;
              break;
            case 'EXCUSED':
              dateStats.excused += 1;
              break;
          }
        });

        // Convert to array and sort by date
        const trendsData = Array.from(recordsByDate.values()).sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Calculate attendance rates for each date
        trendsData.forEach(day => {
          const total = day.present + day.absent + day.late + day.excused;
          day.attendanceRate = total > 0 ? (day.present / total) * 100 : 0;
        });

        return {
          period: input.period,
          interval,
          trends: trendsData
        };
      } catch (error) {
        console.error('Error in getAttendanceTrends:', error);

        // Return default data instead of throwing an error
        return {
          period: input.period,
          interval: 'day',
          trends: []
        };
      }
    }),

  // Get program attendance comparison
  getProgramAttendanceComparison: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      period: z.enum(["week", "month", "term", "year"]).optional().default("month"),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        console.log('Starting getProgramAttendanceComparison with campusId:', input.campusId);

        // Calculate date range based on period
        const endDate = new Date();
        let startDate = new Date();

        switch (input.period) {
          case "week":
            startDate.setDate(startDate.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case "term":
            startDate.setMonth(startDate.getMonth() - 4);
            break;
          case "year":
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        }

        console.log('Date range:', { startDate, endDate });

        // Get programs for this campus
        const programs = await ctx.prisma.programCampus.findMany({
          where: {
            campusId: input.campusId,
            status: 'ACTIVE'
          },
          include: {
            program: true
          }
        });

        console.log('Found programs:', programs.length);

        // Get attendance stats for each program
        const programStats = await Promise.all(
          programs.map(async (programCampus) => {
            // Get classes for this program - simplified query
            const classes = await ctx.prisma.class.findMany({
              where: {
                courseCampus: {
                  campusId: input.campusId
                },
                status: 'ACTIVE'
              },
              select: {
                id: true
              }
            });

            const classIds = classes.map(c => c.id);

            if (classIds.length === 0) {
              return {
                programId: programCampus.programId,
                programName: programCampus.program.name,
                attendanceRate: 0,
                classCount: 0,
                studentCount: 0,
                statistics: {
                  present: 0,
                  absent: 0,
                  late: 0,
                  excused: 0
                }
              };
            }

            // Get attendance records for these classes
            const attendanceRecords = await ctx.prisma.attendance.findMany({
              where: {
                classId: {
                  in: classIds
                },
                date: {
                  gte: startDate,
                  lte: endDate
                }
              },
              select: {
                status: true
              }
            });

            // Count by status
            let present = 0;
            let absent = 0;
            let late = 0;
            let excused = 0;

            attendanceRecords.forEach(record => {
              switch (record.status) {
                case 'PRESENT':
                  present += 1;
                  break;
                case 'ABSENT':
                  absent += 1;
                  break;
                case 'LATE':
                  late += 1;
                  break;
                case 'EXCUSED':
                  excused += 1;
                  break;
              }
            });

            // Calculate attendance rate
            const total = present + absent + late + excused;
            const attendanceRate = total > 0 ? (present / total) * 100 : 0;

            // Get student count - simplified query
            const studentCount = await ctx.prisma.studentEnrollment.count({
              where: {
                classId: {
                  in: classIds
                },
                status: 'ACTIVE'
              }
            });

            return {
              programId: programCampus.programId,
              programName: programCampus.program.name,
              attendanceRate,
              classCount: classIds.length,
              studentCount,
              statistics: {
                present,
                absent,
                late,
                excused
              }
            };
          })
        );

        // Sort by attendance rate
        programStats.sort((a, b) => b.attendanceRate - a.attendanceRate);

        return {
          period: input.period,
          programStats
        };
      } catch (error) {
        console.error('Error in getProgramAttendanceComparison:', error);

        // Return empty data instead of throwing an error
        return {
          period: input.period,
          programStats: []
        };
      }
    }),
});
