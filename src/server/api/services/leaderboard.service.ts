/**
 * Leaderboard Service
 * Handles calculations and data retrieval for student leaderboards
 * Fully integrated with the reward system
 */

import { PrismaClient, SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ServiceBase } from "./service-base";
import { LeaderboardPeriod, LeaderboardEntry, LeaderboardFilters } from "../types/leaderboard";
import { subDays, subMonths } from "date-fns";
import { startOfMonth } from "date-fns/startOfMonth";
import { endOfMonth } from "date-fns/endOfMonth";
import { startOfWeek } from "date-fns/startOfWeek";
import { endOfWeek } from "date-fns/endOfWeek";
import { logger } from "../utils/logger";

export class LeaderboardService extends ServiceBase {
  /**
   * Get date range for a specific period
   * @param period The period to get date range for
   * @returns Object with start and end dates
   */
  private getDateRangeForPeriod(period: LeaderboardPeriod): { startDate: Date; endDate: Date } {
    const now = new Date();

    switch (period) {
      case LeaderboardPeriod.CURRENT_WEEK:
        return {
          startDate: startOfWeek(now),
          endDate: endOfWeek(now)
        };
      case LeaderboardPeriod.CURRENT_MONTH:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        };
      case LeaderboardPeriod.CURRENT_TERM:
        // For term, we'll use the last 3 months as an approximation
        return {
          startDate: subMonths(now, 3),
          endDate: now
        };
      case LeaderboardPeriod.ALL_TIME:
      default:
        // For all time, we'll use a very old start date
        return {
          startDate: new Date(2000, 0, 1),
          endDate: now
        };
    }
  }

  /**
   * Get previous period date range
   * @param period The current period
   * @returns Object with start and end dates for the previous period
   */
  private getPreviousPeriodDateRange(period: LeaderboardPeriod): { startDate: Date; endDate: Date } {
    const now = new Date();

    switch (period) {
      case LeaderboardPeriod.CURRENT_WEEK:
        // Previous week
        const currentWeekStart = startOfWeek(now);
        return {
          startDate: subDays(currentWeekStart, 7),
          endDate: subDays(currentWeekStart, 1)
        };
      case LeaderboardPeriod.CURRENT_MONTH:
        // Previous month
        const currentMonthStart = startOfMonth(now);
        return {
          startDate: startOfMonth(subMonths(now, 1)),
          endDate: subDays(currentMonthStart, 1)
        };
      case LeaderboardPeriod.CURRENT_TERM:
        // Previous term (approximated as previous 3 months)
        return {
          startDate: subMonths(now, 6),
          endDate: subMonths(now, 3)
        };
      case LeaderboardPeriod.ALL_TIME:
      default:
        // For all time, we'll compare with the first half of the available data
        // This is a rough approximation
        return {
          startDate: new Date(2000, 0, 1),
          endDate: subMonths(now, 6)
        };
    }
  }

  /**
   * Calculate improvement metrics for students
   * @param currentPeriodData Current period leaderboard entries
   * @param previousPeriodData Previous period leaderboard entries
   * @returns Leaderboard entries with improvement metrics
   */
  private calculateImprovementMetrics(
    currentPeriodData: LeaderboardEntry[],
    previousPeriodData: LeaderboardEntry[]
  ): LeaderboardEntry[] {
    // Create a map of previous period scores by student ID
    const previousScoresMap = new Map<string, number>();
    previousPeriodData.forEach(entry => {
      previousScoresMap.set(entry.studentId, entry.score);
    });

    // Calculate improvement for each student
    const entriesWithImprovement = currentPeriodData.map(entry => {
      const previousScore = previousScoresMap.get(entry.studentId) || 0;
      const improvement = previousScore > 0
        ? ((entry.score - previousScore) / previousScore) * 100
        : entry.score > 0 ? 100 : 0; // If no previous score but current score exists, count as 100% improvement

      return {
        ...entry,
        previousScore,
        improvement
      };
    });

    // Sort by improvement (descending) and add improvement rank
    const sortedByImprovement = [...entriesWithImprovement]
      .sort((a, b) => (b.improvement || 0) - (a.improvement || 0));

    // Add improvement rank
    sortedByImprovement.forEach((entry, index) => {
      entry.improvementRank = index + 1;
    });

    return entriesWithImprovement;
  }

  /**
   * Get student grades for a specific period
   * @param studentIds Array of student IDs
   * @param startDate Start date of the period
   * @param endDate End date of the period
   * @returns Map of student grades by student ID
   */
  private async getStudentGradesForPeriod(
    studentIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, { totalPoints: number; totalMaxPoints: number; completedActivities: number; totalActivities: number }>> {
    // Get activity grades for the period
    const activityGrades = await this.prisma.activityGrade.findMany({
      where: {
        studentId: { in: studentIds },
        activity: {
          isGradable: true,
          status: "ACTIVE" as SystemStatus,
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        activity: {
          select: {
            id: true,
            maxScore: true,
          },
        },
      },
    });

    // Get assessment submissions for the period
    const assessmentSubmissions = await this.prisma.assessmentSubmission.findMany({
      where: {
        studentId: { in: studentIds },
        assessment: {
          status: "ACTIVE" as SystemStatus,
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        assessment: {
          select: {
            id: true,
            maxScore: true,
          },
        },
      },
    });

    // Initialize student grades map
    const studentGrades = new Map<string, { totalPoints: number; totalMaxPoints: number; completedActivities: number; totalActivities: number }>();

    // Initialize for all students
    studentIds.forEach(studentId => {
      studentGrades.set(studentId, {
        totalPoints: 0,
        totalMaxPoints: 0,
        completedActivities: 0,
        totalActivities: 0
      });
    });

    // Add activity grades
    activityGrades.forEach(grade => {
      const studentData = studentGrades.get(grade.studentId);
      if (studentData) {
        studentData.totalActivities += 1;

        if (grade.score !== null) {
          studentData.totalPoints += grade.score;
          studentData.totalMaxPoints += grade.activity.maxScore || 100;
          studentData.completedActivities += 1;
        }
      }
    });

    // Add assessment submissions
    assessmentSubmissions.forEach(submission => {
      const studentData = studentGrades.get(submission.studentId);
      if (studentData) {
        studentData.totalActivities += 1;

        if (submission.score !== null) {
          studentData.totalPoints += submission.score;
          studentData.totalMaxPoints += submission.assessment.maxScore || 100;
          studentData.completedActivities += 1;
        }
      }
    });

    return studentGrades;
  }
  /**
   * Get class leaderboard
   * @param classId The class ID
   * @param filters Optional filters
   * @returns Leaderboard data for the class
   */
  async getClassLeaderboard(classId: string, filters?: LeaderboardFilters): Promise<LeaderboardEntry[]> {
    try {
      // Validate class exists
      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
        include: {
          students: {
            where: { status: "ACTIVE" as SystemStatus },
            include: {
              student: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Get date ranges for current period
      const period = filters?.period || LeaderboardPeriod.ALL_TIME;
      const { startDate: currentStartDate, endDate: currentEndDate } = this.getDateRangeForPeriod(period);

      // Get date ranges for previous period (for improvement calculation)
      const { startDate: previousStartDate, endDate: previousEndDate } = this.getPreviousPeriodDateRange(period);

      // Get all student IDs in this class
      const studentIds = classEntity.students.map(enrollment => enrollment.studentId);

      // Get student info map for easy access
      const studentInfoMap = new Map<string, { name: string; enrollmentNumber: string }>();
      classEntity.students.forEach(enrollment => {
        studentInfoMap.set(enrollment.studentId, {
          name: enrollment.student.user.name || "Unknown",
          enrollmentNumber: enrollment.student.enrollmentNumber
        });
      });

      // Get grades for current period
      const currentPeriodGrades = await this.getStudentGradesForPeriod(
        studentIds,
        currentStartDate,
        currentEndDate
      );

      // Get grades for previous period (for improvement calculation)
      const previousPeriodGrades = await this.getStudentGradesForPeriod(
        studentIds,
        previousStartDate,
        previousEndDate
      );

      // Calculate current period leaderboard entries
      const currentPeriodEntries: LeaderboardEntry[] = [];

      studentIds.forEach(studentId => {
        const studentInfo = studentInfoMap.get(studentId);
        if (!studentInfo) return;

        const currentGrades = currentPeriodGrades.get(studentId);
        if (!currentGrades) return;

        const gradePercentage = currentGrades.totalMaxPoints > 0
          ? (currentGrades.totalPoints / currentGrades.totalMaxPoints) * 100
          : 0;

        const completionRate = currentGrades.totalActivities > 0
          ? (currentGrades.completedActivities / currentGrades.totalActivities) * 100
          : 0;

        currentPeriodEntries.push({
          studentId,
          studentName: studentInfo.name,
          enrollmentNumber: studentInfo.enrollmentNumber,
          score: gradePercentage,
          totalPoints: currentGrades.totalPoints,
          totalMaxPoints: currentGrades.totalMaxPoints,
          completionRate,
          totalActivities: currentGrades.totalActivities,
          completedActivities: currentGrades.completedActivities,
        });
      });

      // Calculate previous period leaderboard entries
      const previousPeriodEntries: LeaderboardEntry[] = [];

      studentIds.forEach(studentId => {
        const studentInfo = studentInfoMap.get(studentId);
        if (!studentInfo) return;

        const previousGrades = previousPeriodGrades.get(studentId);
        if (!previousGrades) return;

        const gradePercentage = previousGrades.totalMaxPoints > 0
          ? (previousGrades.totalPoints / previousGrades.totalMaxPoints) * 100
          : 0;

        previousPeriodEntries.push({
          studentId,
          studentName: studentInfo.name,
          enrollmentNumber: studentInfo.enrollmentNumber,
          score: gradePercentage,
          totalPoints: previousGrades.totalPoints,
          totalMaxPoints: previousGrades.totalMaxPoints,
          completionRate: 0, // Not needed for previous period
          totalActivities: previousGrades.totalActivities,
          completedActivities: previousGrades.completedActivities,
        });
      });

      // Calculate improvement metrics
      const leaderboardWithImprovement = this.calculateImprovementMetrics(
        currentPeriodEntries,
        previousPeriodEntries
      );

      // Sort by score (descending)
      leaderboardWithImprovement.sort((a, b) => b.score - a.score);

      // Add rank
      leaderboardWithImprovement.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboardWithImprovement;
    } catch (error) {
      logger.error("Error getting class leaderboard", { error, classId });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get class leaderboard",
      });
    }
  }

  /**
   * Get subject leaderboard
   * @param subjectId The subject ID
   * @param filters Optional filters
   * @returns Leaderboard data for the subject
   */
  async getSubjectLeaderboard(subjectId: string, filters?: LeaderboardFilters): Promise<LeaderboardEntry[]> {
    try {
      // Validate subject exists
      const subject = await this.prisma.subject.findUnique({
        where: { id: subjectId },
      });

      if (!subject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found",
        });
      }

      // Get all classes for this subject
      const classes = await this.prisma.class.findMany({
        where: {
          courseCampus: {
            course: {
              subjects: {
                some: {
                  id: subjectId,
                },
              },
            },
          },
          status: "ACTIVE" as SystemStatus,
        },
        include: {
          students: {
            where: { status: "ACTIVE" as SystemStatus },
            include: {
              student: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (classes.length === 0) {
        return [];
      }

      const classIds = classes.map((c) => c.id);

      // Get all activity grades for this subject
      const activityGrades = await this.prisma.activityGrade.findMany({
        where: {
          activity: {
            subjectId,
            isGradable: true,
            status: "ACTIVE" as SystemStatus,
            classId: { in: classIds },
            ...(filters?.period === "CURRENT_TERM" && {
              class: {
                term: {
                  status: "ACTIVE" as SystemStatus,
                },
              },
            }),
            ...(filters?.period === "CURRENT_MONTH" && {
              createdAt: {
                gte: new Date(new Date().setDate(1)), // First day of current month
              },
            }),
            ...(filters?.period === "CURRENT_WEEK" && {
              createdAt: {
                gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), // First day of current week
              },
            }),
          },
        },
        include: {
          activity: {
            select: {
              id: true,
              title: true,
              maxScore: true,
              weightage: true,
            },
          },
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // Get all assessment submissions for this subject
      const assessmentSubmissions = await this.prisma.assessmentSubmission.findMany({
        where: {
          assessment: {
            subjectId,
            status: "ACTIVE" as SystemStatus,
            classId: { in: classIds },
            ...(filters?.period === "CURRENT_TERM" && {
              class: {
                term: {
                  status: "ACTIVE" as SystemStatus,
                },
              },
            }),
            ...(filters?.period === "CURRENT_MONTH" && {
              createdAt: {
                gte: new Date(new Date().setDate(1)), // First day of current month
              },
            }),
            ...(filters?.period === "CURRENT_WEEK" && {
              createdAt: {
                gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), // First day of current week
              },
            }),
          },
        },
        include: {
          assessment: {
            select: {
              id: true,
              title: true,
              maxScore: true,
              weightage: true,
            },
          },
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // Get all students enrolled in these classes
      const students: Record<string, {
        studentId: string;
        studentName: string;
        enrollmentNumber: string;
      }> = {};

      classes.forEach((classEntity) => {
        classEntity.students.forEach((enrollment) => {
          const studentId = enrollment.studentId;
          students[studentId] = {
            studentId,
            studentName: enrollment.student.user.name || "Unknown",
            enrollmentNumber: enrollment.student.enrollmentNumber,
          };
        });
      });

      // Group grades by student
      const studentGrades: Record<string, {
        studentId: string;
        studentName: string;
        enrollmentNumber: string;
        totalPoints: number;
        totalMaxPoints: number;
        totalActivities: number;
        completedActivities: number;
      }> = {};

      // Initialize student grades
      Object.values(students).forEach((student) => {
        studentGrades[student.studentId] = {
          studentId: student.studentId,
          studentName: student.studentName,
          enrollmentNumber: student.enrollmentNumber,
          totalPoints: 0,
          totalMaxPoints: 0,
          totalActivities: 0,
          completedActivities: 0,
        };
      });

      // Add activity grades
      activityGrades.forEach((grade) => {
        const studentId = grade.studentId;
        if (studentGrades[studentId]) {
          studentGrades[studentId].totalActivities += 1;

          if (grade.score !== null) {
            studentGrades[studentId].totalPoints += grade.score;
            studentGrades[studentId].totalMaxPoints += grade.activity.maxScore || 100;
            studentGrades[studentId].completedActivities += 1;
          }
        }
      });

      // Add assessment submissions
      assessmentSubmissions.forEach((submission) => {
        const studentId = submission.studentId;
        if (studentGrades[studentId]) {
          studentGrades[studentId].totalActivities += 1;

          if (submission.score !== null) {
            studentGrades[studentId].totalPoints += submission.score;
            studentGrades[studentId].totalMaxPoints += submission.assessment.maxScore || 100;
            studentGrades[studentId].completedActivities += 1;
          }
        }
      });

      // Calculate leaderboard entries
      const leaderboard: LeaderboardEntry[] = Object.values(studentGrades)
        .filter(student => student.totalActivities > 0) // Only include students with activities
        .map((student) => {
          const gradePercentage = student.totalMaxPoints > 0
            ? (student.totalPoints / student.totalMaxPoints) * 100
            : 0;

          const completionRate = student.totalActivities > 0
            ? (student.completedActivities / student.totalActivities) * 100
            : 0;

          return {
            studentId: student.studentId,
            studentName: student.studentName,
            enrollmentNumber: student.enrollmentNumber,
            score: gradePercentage,
            totalPoints: student.totalPoints,
            totalMaxPoints: student.totalMaxPoints,
            completionRate,
            totalActivities: student.totalActivities,
            completedActivities: student.completedActivities,
          };
        });

      // Sort by score (descending)
      leaderboard.sort((a, b) => b.score - a.score);

      // Add rank
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboard;
    } catch (error) {
      logger.error("Error getting subject leaderboard", { error, subjectId });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get subject leaderboard",
      });
    }
  }

  /**
   * Get course leaderboard
   * @param courseId The course ID
   * @param filters Optional filters
   * @returns Leaderboard data for the course
   */
  async getCourseLeaderboard(courseId: string, filters?: LeaderboardFilters): Promise<LeaderboardEntry[]> {
    try {
      // Validate course exists
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Get all classes for this course
      const classes = await this.prisma.class.findMany({
        where: {
          courseCampus: {
            courseId,
          },
          status: "ACTIVE" as SystemStatus,
        },
        include: {
          students: {
            where: { status: "ACTIVE" as SystemStatus },
            include: {
              student: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (classes.length === 0) {
        return [];
      }

      const classIds = classes.map((c) => c.id);

      // Get all activity grades for this course
      const activityGrades = await this.prisma.activityGrade.findMany({
        where: {
          activity: {
            class: {
              courseCampus: {
                courseId,
              },
            },
            isGradable: true,
            status: "ACTIVE" as SystemStatus,
            ...(filters?.period === "CURRENT_TERM" && {
              class: {
                term: {
                  status: "ACTIVE" as SystemStatus,
                },
              },
            }),
            ...(filters?.period === "CURRENT_MONTH" && {
              createdAt: {
                gte: new Date(new Date().setDate(1)), // First day of current month
              },
            }),
            ...(filters?.period === "CURRENT_WEEK" && {
              createdAt: {
                gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), // First day of current week
              },
            }),
          },
        },
        include: {
          activity: {
            select: {
              id: true,
              title: true,
              maxScore: true,
              weightage: true,
            },
          },
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // Get all assessment submissions for this course
      const assessmentSubmissions = await this.prisma.assessmentSubmission.findMany({
        where: {
          assessment: {
            class: {
              courseCampus: {
                courseId,
              },
            },
            status: "ACTIVE" as SystemStatus,
            ...(filters?.period === "CURRENT_TERM" && {
              class: {
                term: {
                  status: "ACTIVE" as SystemStatus,
                },
              },
            }),
            ...(filters?.period === "CURRENT_MONTH" && {
              createdAt: {
                gte: new Date(new Date().setDate(1)), // First day of current month
              },
            }),
            ...(filters?.period === "CURRENT_WEEK" && {
              createdAt: {
                gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), // First day of current week
              },
            }),
          },
        },
        include: {
          assessment: {
            select: {
              id: true,
              title: true,
              maxScore: true,
              weightage: true,
            },
          },
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // Get all students enrolled in these classes
      const students: Record<string, {
        studentId: string;
        studentName: string;
        enrollmentNumber: string;
      }> = {};

      classes.forEach((classEntity) => {
        classEntity.students.forEach((enrollment) => {
          const studentId = enrollment.studentId;
          students[studentId] = {
            studentId,
            studentName: enrollment.student.user.name || "Unknown",
            enrollmentNumber: enrollment.student.enrollmentNumber,
          };
        });
      });

      // Group grades by student
      const studentGrades: Record<string, {
        studentId: string;
        studentName: string;
        enrollmentNumber: string;
        totalPoints: number;
        totalMaxPoints: number;
        totalActivities: number;
        completedActivities: number;
      }> = {};

      // Initialize student grades
      Object.values(students).forEach((student) => {
        studentGrades[student.studentId] = {
          studentId: student.studentId,
          studentName: student.studentName,
          enrollmentNumber: student.enrollmentNumber,
          totalPoints: 0,
          totalMaxPoints: 0,
          totalActivities: 0,
          completedActivities: 0,
        };
      });

      // Add activity grades
      activityGrades.forEach((grade) => {
        const studentId = grade.studentId;
        if (studentGrades[studentId]) {
          studentGrades[studentId].totalActivities += 1;

          if (grade.score !== null) {
            studentGrades[studentId].totalPoints += grade.score;
            studentGrades[studentId].totalMaxPoints += grade.activity.maxScore || 100;
            studentGrades[studentId].completedActivities += 1;
          }
        }
      });

      // Add assessment submissions
      assessmentSubmissions.forEach((submission) => {
        const studentId = submission.studentId;
        if (studentGrades[studentId]) {
          studentGrades[studentId].totalActivities += 1;

          if (submission.score !== null) {
            studentGrades[studentId].totalPoints += submission.score;
            studentGrades[studentId].totalMaxPoints += submission.assessment.maxScore || 100;
            studentGrades[studentId].completedActivities += 1;
          }
        }
      });

      // Calculate leaderboard entries
      const leaderboard: LeaderboardEntry[] = Object.values(studentGrades)
        .filter(student => student.totalActivities > 0) // Only include students with activities
        .map((student) => {
          const gradePercentage = student.totalMaxPoints > 0
            ? (student.totalPoints / student.totalMaxPoints) * 100
            : 0;

          const completionRate = student.totalActivities > 0
            ? (student.completedActivities / student.totalActivities) * 100
            : 0;

          return {
            studentId: student.studentId,
            studentName: student.studentName,
            enrollmentNumber: student.enrollmentNumber,
            score: gradePercentage,
            totalPoints: student.totalPoints,
            totalMaxPoints: student.totalMaxPoints,
            completionRate,
            totalActivities: student.totalActivities,
            completedActivities: student.completedActivities,
          };
        });

      // Sort by score (descending)
      leaderboard.sort((a, b) => b.score - a.score);

      // Add rank
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboard;
    } catch (error) {
      logger.error("Error getting course leaderboard", { error, courseId });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get course leaderboard",
      });
    }
  }

  /**
   * Get overall leaderboard for a campus
   * @param campusId The campus ID
   * @param filters Optional filters
   * @returns Leaderboard data for the campus
   */
  async getOverallLeaderboard(campusId: string, filters?: LeaderboardFilters): Promise<LeaderboardEntry[]> {
    try {
      // Validate campus exists
      const campus = await this.prisma.campus.findUnique({
        where: { id: campusId },
      });

      if (!campus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campus not found",
        });
      }

      // Get all students in this campus
      const students = await this.prisma.studentProfile.findMany({
        where: {
          user: {
            activeCampuses: {
              some: {
                campusId,
                status: "ACTIVE" as SystemStatus,
              },
            },
          },
        },
        include: {
          user: true,
        },
      });

      if (students.length === 0) {
        return [];
      }

      const studentIds = students.map((s) => s.id);

      // Get all activity grades for these students
      const activityGrades = await this.prisma.activityGrade.findMany({
        where: {
          studentId: { in: studentIds },
          activity: {
            isGradable: true,
            status: "ACTIVE" as SystemStatus,
            class: {
              campusId,
            },
            ...(filters?.period === "CURRENT_TERM" && {
              class: {
                term: {
                  status: "ACTIVE" as SystemStatus,
                },
              },
            }),
            ...(filters?.period === "CURRENT_MONTH" && {
              createdAt: {
                gte: new Date(new Date().setDate(1)), // First day of current month
              },
            }),
            ...(filters?.period === "CURRENT_WEEK" && {
              createdAt: {
                gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), // First day of current week
              },
            }),
          },
        },
        include: {
          activity: {
            select: {
              id: true,
              title: true,
              maxScore: true,
              weightage: true,
            },
          },
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // Get all assessment submissions for these students
      const assessmentSubmissions = await this.prisma.assessmentSubmission.findMany({
        where: {
          studentId: { in: studentIds },
          assessment: {
            status: "ACTIVE" as SystemStatus,
            class: {
              campusId,
            },
            ...(filters?.period === "CURRENT_TERM" && {
              class: {
                term: {
                  status: "ACTIVE" as SystemStatus,
                },
              },
            }),
            ...(filters?.period === "CURRENT_MONTH" && {
              createdAt: {
                gte: new Date(new Date().setDate(1)), // First day of current month
              },
            }),
            ...(filters?.period === "CURRENT_WEEK" && {
              createdAt: {
                gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), // First day of current week
              },
            }),
          },
        },
        include: {
          assessment: {
            select: {
              id: true,
              title: true,
              maxScore: true,
              weightage: true,
            },
          },
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // Group grades by student
      const studentGrades: Record<string, {
        studentId: string;
        studentName: string;
        enrollmentNumber: string;
        totalPoints: number;
        totalMaxPoints: number;
        totalActivities: number;
        completedActivities: number;
      }> = {};

      // Initialize student grades
      students.forEach((student) => {
        studentGrades[student.id] = {
          studentId: student.id,
          studentName: student.user.name || "Unknown",
          enrollmentNumber: student.enrollmentNumber,
          totalPoints: 0,
          totalMaxPoints: 0,
          totalActivities: 0,
          completedActivities: 0,
        };
      });

      // Add activity grades
      activityGrades.forEach((grade) => {
        const studentId = grade.studentId;
        if (studentGrades[studentId]) {
          studentGrades[studentId].totalActivities += 1;

          if (grade.score !== null) {
            studentGrades[studentId].totalPoints += grade.score;
            studentGrades[studentId].totalMaxPoints += grade.activity.maxScore || 100;
            studentGrades[studentId].completedActivities += 1;
          }
        }
      });

      // Add assessment submissions
      assessmentSubmissions.forEach((submission) => {
        const studentId = submission.studentId;
        if (studentGrades[studentId]) {
          studentGrades[studentId].totalActivities += 1;

          if (submission.score !== null) {
            studentGrades[studentId].totalPoints += submission.score;
            studentGrades[studentId].totalMaxPoints += submission.assessment.maxScore || 100;
            studentGrades[studentId].completedActivities += 1;
          }
        }
      });

      // Calculate leaderboard entries
      const leaderboard: LeaderboardEntry[] = Object.values(studentGrades)
        .filter(student => student.totalActivities > 0) // Only include students with activities
        .map((student) => {
          const gradePercentage = student.totalMaxPoints > 0
            ? (student.totalPoints / student.totalMaxPoints) * 100
            : 0;

          const completionRate = student.totalActivities > 0
            ? (student.completedActivities / student.totalActivities) * 100
            : 0;

          return {
            studentId: student.studentId,
            studentName: student.studentName,
            enrollmentNumber: student.enrollmentNumber,
            score: gradePercentage,
            totalPoints: student.totalPoints,
            totalMaxPoints: student.totalMaxPoints,
            completionRate,
            totalActivities: student.totalActivities,
            completedActivities: student.completedActivities,
          };
        });

      // Sort by score (descending)
      leaderboard.sort((a, b) => b.score - a.score);

      // Add rank
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboard;
    } catch (error) {
      this.logger.error("Error getting overall leaderboard", { error, campusId });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get overall leaderboard",
      });
    }
  }
}
