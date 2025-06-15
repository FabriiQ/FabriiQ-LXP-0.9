/**
 * Course Analytics Service
 * Handles operations related to course analytics for coordinators
 */

import { PrismaClient, SystemStatus, AttendanceStatusType, SubmissionStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

interface CourseAnalyticsServiceConfig {
  prisma: PrismaClient;
}

export class CourseAnalyticsService {
  private prisma: PrismaClient;

  constructor(config: CourseAnalyticsServiceConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Get course analytics for a specific course on a campus
   * Consolidates analytics from all classes in the course
   */
  async getCourseAnalytics(courseCampusId: string, startDate?: Date, endDate?: Date) {
    try {
      // Get course campus with related data
      const courseCampus = await this.prisma.courseCampus.findUnique({
        where: { id: courseCampusId },
        include: {
          course: {
            include: {
              program: true,
            },
          },
          campus: true,
          classes: {
            where: {
              status: SystemStatus.ACTIVE,
            },
          },
        },
      });

      if (!courseCampus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course campus not found",
        });
      }

      // Get all class IDs for this course campus
      const classIds = courseCampus.classes.map((cls) => cls.id);

      if (classIds.length === 0) {
        return {
          courseCampusId,
          courseId: courseCampus.courseId,
          courseName: courseCampus.course.name,
          courseCode: courseCampus.course.code,
          campusId: courseCampus.campusId,
          campusName: courseCampus.campus.name,
          programId: courseCampus.course.programId,
          programName: courseCampus.course.program.name,
          classCount: 0,
          studentCount: 0,
          attendanceRate: 0,
          averageGrade: 0,
          completionRate: 0,
          statistics: {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
          },
          classPerformance: [],
        };
      }

      // Get attendance data for all classes
      const attendanceWhere: any = {
        classId: {
          in: classIds,
        },
      };

      // Add date range if provided
      if (startDate && endDate) {
        attendanceWhere.date = {
          gte: startDate,
          lte: endDate,
        };
      }

      // Get attendance records
      const attendanceRecords = await this.prisma.attendance.findMany({
        where: attendanceWhere,
      });

      // Calculate attendance statistics
      const present = attendanceRecords.filter(
        (record) => record.status === AttendanceStatusType.PRESENT
      ).length;
      const absent = attendanceRecords.filter(
        (record) => record.status === AttendanceStatusType.ABSENT
      ).length;
      const late = attendanceRecords.filter(
        (record) => record.status === AttendanceStatusType.LATE
      ).length;
      const excused = attendanceRecords.filter(
        (record) => record.status === AttendanceStatusType.EXCUSED
      ).length;

      const total = present + absent + late + excused;
      const attendanceRate = total > 0 ? (present / total) * 100 : 0;

      // Get assessment data for all classes
      const assessments = await this.prisma.assessment.findMany({
        where: {
          classId: {
            in: classIds,
          },
          status: SystemStatus.ACTIVE,
        },
        include: {
          submissions: true,
        },
      });

      // Calculate average grade
      let totalScore = 0;
      let totalMaxScore = 0;
      let submissionCount = 0;

      assessments.forEach((assessment) => {
        assessment.submissions.forEach((submission) => {
          if (submission.score !== null && assessment.maxScore) {
            totalScore += submission.score;
            totalMaxScore += assessment.maxScore;
            submissionCount++;
          }
        });
      });

      const averageGrade = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

      // Calculate completion rate
      const totalAssessments = assessments.length;
      const completedAssessments = assessments.filter((assessment) =>
        assessment.submissions.some(
          (submission) => submission.status === SubmissionStatus.GRADED
        )
      ).length;

      const completionRate = totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0;

      // Get student count
      const studentCount = await this.prisma.studentEnrollment.count({
        where: {
          classId: {
            in: classIds,
          },
          status: SystemStatus.ACTIVE,
        },
      });

      // Get performance data for each class
      const classPerformance = await Promise.all(
        courseCampus.classes.map(async (cls) => {
          // Get class attendance data
          const classAttendance = attendanceRecords.filter(
            (record) => record.classId === cls.id
          );

          const classPresent = classAttendance.filter(
            (record) => record.status === AttendanceStatusType.PRESENT
          ).length;
          const classTotal = classAttendance.length;
          const classAttendanceRate = classTotal > 0 ? (classPresent / classTotal) * 100 : 0;

          // Get class assessment data
          const classAssessments = assessments.filter(
            (assessment) => assessment.classId === cls.id
          );

          let classScore = 0;
          let classMaxScore = 0;

          classAssessments.forEach((assessment) => {
            assessment.submissions.forEach((submission) => {
              if (submission.score !== null && assessment.maxScore) {
                classScore += submission.score;
                classMaxScore += assessment.maxScore;
              }
            });
          });

          const classAverageGrade = classMaxScore > 0 ? (classScore / classMaxScore) * 100 : 0;

          // Get class student count
          const classStudentCount = await this.prisma.studentEnrollment.count({
            where: {
              classId: cls.id,
              status: SystemStatus.ACTIVE,
            },
          });

          return {
            classId: cls.id,
            className: cls.name,
            classCode: cls.code,
            studentCount: classStudentCount,
            attendanceRate: classAttendanceRate,
            averageGrade: classAverageGrade,
          };
        })
      );

      return {
        courseCampusId,
        courseId: courseCampus.courseId,
        courseName: courseCampus.course.name,
        courseCode: courseCampus.course.code,
        campusId: courseCampus.campusId,
        campusName: courseCampus.campus.name,
        programId: courseCampus.course.programId,
        programName: courseCampus.course.program.name,
        classCount: classIds.length,
        studentCount,
        attendanceRate,
        averageGrade,
        completionRate,
        statistics: {
          present,
          absent,
          late,
          excused,
        },
        classPerformance,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve course analytics",
        cause: error,
      });
    }
  }
}
