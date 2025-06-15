/**
 * Attendance Service
 * Handles operations related to student attendance tracking
 */

import { AttendanceStatusType, SystemStatus, Class, Attendance, AcademicEventType, TimetablePeriod, DayOfWeek } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";
import { PrismaClient } from '@prisma/client';
import { HolidayService } from './holiday.service';
import { AcademicCalendarService } from './academic-calendar.service';
import { eachDayOfInterval, isSameDay } from 'date-fns';
import { NotificationService } from './notification.service';

// Attendance creation schema
export const createAttendanceSchema = z.object({
  studentId: z.string(),
  classId: z.string(),
  date: z.date(),
  status: z.nativeEnum(AttendanceStatusType),
  remarks: z.string().optional(),
});

// Attendance update schema
export const updateAttendanceSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(AttendanceStatusType).optional(),
  remarks: z.string().optional(),
});

// Attendance query schema
export const attendanceQuerySchema = z.object({
  classId: z.string(),
  date: z.date().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  studentId: z.string().optional(),
  status: z.nativeEnum(AttendanceStatusType).optional(),
});

interface AttendanceServiceContext {
  prisma: PrismaClient;
}

export class AttendanceService extends ServiceBase {
  private holidayService: HolidayService;
  private academicCalendarService: AcademicCalendarService;
  private notificationService: NotificationService;

  constructor(context: AttendanceServiceContext) {
    super({ prisma: context.prisma });
    this.holidayService = new HolidayService({ prisma: context.prisma });
    this.academicCalendarService = new AcademicCalendarService({ prisma: context.prisma });
    this.notificationService = new NotificationService({ prisma: context.prisma });
  }

  /**
   * Creates a new attendance record
   * @param data Attendance data
   * @returns Created attendance record
   */
  async createAttendance(data: z.infer<typeof createAttendanceSchema>) {
    try {
      // Check if student exists
      const student = await this.prisma.studentProfile.findUnique({
        where: { id: data.studentId },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      // Check if class exists
      const classEntity = await this.prisma.class.findUnique({
        where: { id: data.classId },
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Check if student is enrolled in the class
      const enrollment = await this.prisma.studentEnrollment.findFirst({
        where: {
          studentId: data.studentId,
          classId: data.classId,
          status: SystemStatus.ACTIVE,
        },
      });

      if (!enrollment) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Student is not enrolled in this class",
        });
      }

      // Check if attendance record already exists for this date
      const existingAttendance = await this.prisma.attendance.findFirst({
        where: {
          studentId: data.studentId,
          classId: data.classId,
          date: data.date,
        },
      });

      if (existingAttendance) {
        // Update existing record
        const attendance = await this.prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            status: data.status,
            remarks: data.remarks,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          attendance,
        };
      }

      // Create new attendance record
      const attendance = await this.prisma.attendance.create({
        data: {
          student: {
            connect: { id: data.studentId },
          },
          class: {
            connect: { id: data.classId },
          },
          date: data.date,
          status: data.status,
          remarks: data.remarks,
        },
      });

      return {
        success: true,
        attendance,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create attendance record",
        cause: error,
      });
    }
  }

  /**
   * Gets an attendance record by ID
   * @param id Attendance ID
   * @returns Attendance record
   */
  async getAttendance(id: string) {
    try {
      const attendance = await this.prisma.attendance.findUnique({
        where: { id },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (!attendance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attendance record not found",
        });
      }

      return {
        success: true,
        attendance,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get attendance record",
        cause: error,
      });
    }
  }

  /**
   * Updates an attendance record
   * @param data Attendance update data
   * @returns Updated attendance record
   */
  async updateAttendance(data: z.infer<typeof updateAttendanceSchema>) {
    try {
      // Check if attendance record exists
      const existingAttendance = await this.prisma.attendance.findUnique({
        where: { id: data.id },
      });

      if (!existingAttendance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attendance record not found",
        });
      }

      // Update attendance record
      const attendance = await this.prisma.attendance.update({
        where: { id: data.id },
        data: {
          status: data.status,
          remarks: data.remarks,
        },
      });

      return {
        success: true,
        attendance,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update attendance record",
        cause: error,
      });
    }
  }

  /**
   * Deletes an attendance record
   * @param id Attendance ID
   * @returns Success status
   */
  async deleteAttendance(id: string) {
    try {
      // Check if attendance record exists
      const existingAttendance = await this.prisma.attendance.findUnique({
        where: { id },
      });

      if (!existingAttendance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attendance record not found",
        });
      }

      // Delete attendance record
      await this.prisma.attendance.delete({
        where: { id },
      });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete attendance record",
        cause: error,
      });
    }
  }

  /**
   * Gets attendance records by query
   * @param query Attendance query
   * @returns Attendance records
   */
  async getAttendanceByQuery(query: z.infer<typeof attendanceQuerySchema>) {
    try {
      const whereClause: any = {
        classId: query.classId,
      };

      if (query.date) {
        whereClause.date = query.date;
      } else if (query.startDate && query.endDate) {
        whereClause.date = {
          gte: query.startDate,
          lte: query.endDate,
        };
      }

      if (query.studentId) {
        whereClause.studentId = query.studentId;
      }

      if (query.status) {
        whereClause.status = query.status;
      }

      const attendanceRecords = await this.prisma.attendance.findMany({
        where: whereClause,
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      return {
        success: true,
        attendanceRecords,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get attendance records",
        cause: error,
      });
    }
  }

  /**
   * Gets attendance statistics for a class
   * @param classId Class ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Attendance statistics
   */
  async getClassAttendanceStats(classId: string, startDate?: Date, endDate?: Date) {
    try {
      // Check if class exists
      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      const whereClause: any = {
        classId,
      };

      if (startDate && endDate) {
        whereClause.date = {
          gte: startDate,
          lte: endDate,
        };
      }

      // Get all attendance records for the class
      const attendanceRecords = await this.prisma.attendance.findMany({
        where: whereClause,
      });

      // Get all students enrolled in the class
      const enrollments = await this.prisma.studentEnrollment.findMany({
        where: {
          classId,
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

      // Calculate statistics
      const totalStudents = enrollments.length;
      const totalDays = new Set(attendanceRecords.map(record => record.date.toISOString().split('T')[0])).size;

      // Count by status
      const statusCounts = attendanceRecords.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      }, {} as Record<AttendanceStatusType, number>);

      // Calculate per-student statistics
      const studentStats = enrollments.map(enrollment => {
        const studentRecords = attendanceRecords.filter(record => record.studentId === enrollment.studentId);
        
        const studentStatusCounts = studentRecords.reduce((acc, record) => {
          acc[record.status] = (acc[record.status] || 0) + 1;
          return acc;
        }, {} as Record<AttendanceStatusType, number>);

        const presentCount = studentStatusCounts[AttendanceStatusType.PRESENT] || 0;
        const totalRecords = studentRecords.length;
        const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

        return {
          studentId: enrollment.studentId,
          studentName: enrollment.student.user.name || 'Unknown',
          statusCounts: studentStatusCounts,
          attendanceRate,
          totalRecords,
        };
      });

      return {
        success: true,
        stats: {
          totalStudents,
          totalDays,
          statusCounts,
          studentStats,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get class attendance statistics",
        cause: error,
      });
    }
  }

  /**
   * Gets attendance statistics for a student
   * @param studentId Student ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Attendance statistics
   */
  async getStudentAttendanceStats(studentId: string, startDate?: Date, endDate?: Date) {
    try {
      // Check if student exists
      const student = await this.prisma.studentProfile.findUnique({
        where: { id: studentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      const whereClause: any = {
        studentId,
      };

      if (startDate && endDate) {
        whereClause.date = {
          gte: startDate,
          lte: endDate,
        };
      }

      // Get all attendance records for the student
      const attendanceRecords = await this.prisma.attendance.findMany({
        where: whereClause,
        include: {
          class: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Get all classes the student is enrolled in
      const enrollments = await this.prisma.studentEnrollment.findMany({
        where: {
          studentId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Count by status
      const statusCounts = attendanceRecords.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      }, {} as Record<AttendanceStatusType, number>);

      // Calculate per-class statistics
      const classStats = enrollments.map(enrollment => {
        const classRecords = attendanceRecords.filter(record => record.classId === enrollment.classId);
        
        const classStatusCounts = classRecords.reduce((acc, record) => {
          acc[record.status] = (acc[record.status] || 0) + 1;
          return acc;
        }, {} as Record<AttendanceStatusType, number>);

        const presentCount = classStatusCounts[AttendanceStatusType.PRESENT] || 0;
        const totalRecords = classRecords.length;
        const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

        return {
          classId: enrollment.classId,
          className: enrollment.class.name,
          classCode: enrollment.class.code,
          statusCounts: classStatusCounts,
          attendanceRate,
          totalRecords,
        };
      });

      // Calculate overall attendance rate
      const totalRecords = attendanceRecords.length;
      const presentCount = statusCounts[AttendanceStatusType.PRESENT] || 0;
      const overallAttendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

      return {
        success: true,
        stats: {
          studentId,
          studentName: student.user.name || 'Unknown',
          statusCounts,
          overallAttendanceRate,
          totalRecords,
          classStats,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get student attendance statistics",
        cause: error,
      });
    }
  }

  async calculateAttendance(classId: string, startDate: Date, endDate: Date) {
    // Get class details
    const classDetails = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        timetables: {
          include: {
            periods: true,
          },
        },
        courseCampus: {
          include: {
            campus: true,
          },
        },
      },
    });

    if (!classDetails) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Class not found',
      });
    }

    // Get holidays in the date range
    const holidays = await this.holidayService.getHolidaysInRange(
      startDate,
      endDate,
      classDetails.courseCampus.campusId
    );

    // Get academic events in the date range
    const academicEvents = await this.academicCalendarService.getEventsInRange(
      startDate,
      endDate,
      {
        campusId: classDetails.courseCampus.campusId,
      }
    );

    // Get all dates in the range
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });

    // Filter out holidays and event dates
    const effectiveSchoolDays = allDates.filter(date => {
      // Check if date is a holiday
      const isHoliday = holidays.some(holiday =>
        date >= holiday.startDate && date <= holiday.endDate
      );
      if (isHoliday) return false;

      // Check if date has a cancelling academic event
      const hasCancellingEvent = academicEvents.some(event =>
        event.type === AcademicEventType.EXAMINATION ||
        event.type === AcademicEventType.ORIENTATION ||
        event.type === AcademicEventType.GRADUATION
      );
      if (hasCancellingEvent) return false;

      // Check if there's a scheduled class on this date
      const hasScheduledClass = classDetails.timetables.some(timetable =>
        timetable.periods.some((period: TimetablePeriod) =>
          period.dayOfWeek && date.getDay() === getDayNumber(period.dayOfWeek)
        )
      );
      return hasScheduledClass;
    });

    // Get attendance records
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        classId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        student: true,
      },
    });

    // Calculate attendance statistics
    const stats = this.calculateAttendanceStatistics(
      attendanceRecords,
      effectiveSchoolDays
    );

    // Send notifications for students with low attendance
    if (stats.studentRecords.some(record => record.attendancePercentage < 75)) {
      await this.notificationService.sendLowAttendanceNotifications();
    }

    return {
      totalScheduledDays: allDates.length,
      holidays: holidays.length,
      effectiveSchoolDays: effectiveSchoolDays.length,
      ...stats,
    };
  }

  private calculateAttendanceStatistics(attendanceRecords: Array<Attendance & { student: { id: string } }>, effectiveSchoolDays: Date[]) {
    const studentAttendance = new Map<string, {
      present: number;
      absent: number;
      late: number;
      excused: number;
      leave: number;
    }>();

    // Initialize student records
    attendanceRecords.forEach(record => {
      if (!studentAttendance.has(record.studentId)) {
        studentAttendance.set(record.studentId, {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          leave: 0,
        });
      }

      const stats = studentAttendance.get(record.studentId)!;
      switch (record.status) {
        case AttendanceStatusType.PRESENT:
          stats.present++;
          break;
        case AttendanceStatusType.ABSENT:
          stats.absent++;
          break;
        case AttendanceStatusType.LATE:
          stats.late++;
          break;
        case AttendanceStatusType.EXCUSED:
          stats.excused++;
          break;
        case AttendanceStatusType.LEAVE:
          stats.leave++;
          break;
      }
    });

    // Calculate overall statistics
    const totalStudents = studentAttendance.size;
    const totalDays = effectiveSchoolDays.length;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalExcused = 0;
    let totalLeave = 0;

    studentAttendance.forEach(stats => {
      totalPresent += stats.present;
      totalAbsent += stats.absent;
      totalLate += stats.late;
      totalExcused += stats.excused;
      totalLeave += stats.leave;
    });

    return {
      totalStudents,
      totalDays,
      averageAttendance: totalDays > 0 ? (totalPresent / (totalStudents * totalDays)) * 100 : 0,
      statistics: {
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        excused: totalExcused,
        leave: totalLeave,
      },
      studentRecords: Array.from(studentAttendance.entries()).map(([studentId, stats]) => ({
        studentId,
        ...stats,
        attendancePercentage: totalDays > 0 ? (stats.present / totalDays) * 100 : 0,
      })),
    };
  }

  async markAttendance(data: {
    classId: string;
    date: Date;
    records: Array<{
      studentId: string;
      status: AttendanceStatusType;
      remarks?: string;
    }>;
  }) {
    const { classId, date, records } = data;

    // Check if date is a holiday
    const isHoliday = await this.holidayService.isHoliday(date);
    if (isHoliday) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot mark attendance on a holiday',
      });
    }

    // Check if date has a cancelling academic event
    const events = await this.academicCalendarService.getEventsInRange(date, date);
    const hasCancellingEvent = events.some(event =>
      event.type === AcademicEventType.EXAMINATION ||
      event.type === AcademicEventType.ORIENTATION ||
      event.type === AcademicEventType.GRADUATION
    );
    if (hasCancellingEvent) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot mark attendance on this date due to academic event',
      });
    }

    // Get existing attendance records for updates
    const existingRecords = await this.prisma.attendance.findMany({
      where: {
        classId,
        date,
        studentId: {
          in: records.map(r => r.studentId)
        }
      }
    });

    // Create or update attendance records
    const attendanceRecords = await Promise.all(
      records.map(async record => {
        const existing = existingRecords.find(r => r.studentId === record.studentId);
        
        if (existing) {
          // If status changed, prepare for notification
          if (existing.status !== record.status) {
            await this.notificationService.sendAttendanceStatusNotifications(
              classId,
              date,
              [{
                studentId: record.studentId,
                oldStatus: existing.status,
                newStatus: record.status,
                remarks: record.remarks
              }]
            );
          }
          
          return this.prisma.attendance.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              remarks: record.remarks
            }
          });
        }

        return this.prisma.attendance.create({
          data: {
            classId,
            studentId: record.studentId,
            date,
            status: record.status,
            remarks: record.remarks,
          },
        });
      })
    );

    // Check for low attendance after marking
    await this.notificationService.sendLowAttendanceNotifications();

    return attendanceRecords;
  }

  async getAttendanceReport(classId: string, startDate: Date, endDate: Date) {
    const attendanceStats = await this.calculateAttendance(classId, startDate, endDate);

    // Get class details
    const classDetails = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        courseCampus: {
          include: {
            course: true,
            campus: true,
          },
        },
        classTeacher: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!classDetails) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Class not found',
      });
    }

    // Get holidays and events for the report
    const holidays = await this.holidayService.getHolidaysInRange(
      startDate,
      endDate,
      classDetails.courseCampus.campusId
    );

    const events = await this.academicCalendarService.getEventsInRange(
      startDate,
      endDate,
      {
        campusId: classDetails.courseCampus.campusId,
      }
    );

    return {
      classDetails: {
        id: classDetails.id,
        name: classDetails.name,
        course: classDetails.courseCampus.course.name,
        campus: classDetails.courseCampus.campus.name,
        teacher: classDetails.classTeacher?.user.name,
      },
      dateRange: {
        start: startDate,
        end: endDate,
      },
      holidays: holidays.map(holiday => ({
        name: holiday.name,
        startDate: holiday.startDate,
        endDate: holiday.endDate,
        type: holiday.type,
      })),
      events: events.map(event => ({
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        type: event.type,
      })),
      attendance: attendanceStats,
    };
  }
}

function getDayNumber(day: DayOfWeek): number {
  const dayMap = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6
  };
  return dayMap[day];
} 