/**
 * Enhanced Leaderboard Service
 * Handles calculations and data retrieval for student leaderboards
 * Fully integrated with the reward system
 */

import { PrismaClient, SystemStatus, UserType, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ServiceBase } from "./service-base";
import { LeaderboardType, LeaderboardPeriod, LeaderboardEntry, LeaderboardFilters } from "../types/leaderboard";
import { addDays, subDays, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { startOfDay } from "date-fns/startOfDay";
import { startOfMonth } from "date-fns/startOfMonth";
import { endOfMonth } from "date-fns/endOfMonth";
import { logger } from "../utils/logger";
import { RewardSystem } from "@/features/rewards";
import { LeaderboardPartitioningService, TimeGranularity, EntityType } from "./leaderboard-partitioning.service";

export interface LeaderboardServiceContext {
  prisma: PrismaClient;
}

export class LeaderboardService extends ServiceBase {
  // Add logger property
  protected logger = logger;
  private rewardSystem: RewardSystem;
  private partitioningService: LeaderboardPartitioningService;

  constructor({ prisma }: LeaderboardServiceContext) {
    super({ prisma });
    this.rewardSystem = new RewardSystem({ prisma });
    this.partitioningService = new LeaderboardPartitioningService(prisma);
  }

  /**
   * Get class leaderboard with reward system integration
   * @param classId The class ID
   * @param filters Optional filters
   * @returns Leaderboard data for the class
   */
  async getClassLeaderboard(classId: string, filters?: LeaderboardFilters): Promise<LeaderboardEntry[]> {
    try {
      // Validate class exists
      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Get student enrollments for this class
      const studentEnrollments = await this.prisma.studentEnrollment.findMany({
        where: {
          classId,
          status: "ACTIVE" as SystemStatus
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // Get student levels for this class
      // Use type assertion for Prisma model that might not be recognized by TypeScript
      const studentLevels = await (this.prisma as any).studentLevel.findMany({
        where: {
          classId,
          status: "ACTIVE" as SystemStatus,
        },
      });

      // Create a map of student levels
      const studentLevelsMap = new Map<string, number>();
      studentLevels.forEach((level: { studentId: string; level: number }) => {
        studentLevelsMap.set(level.studentId, level.level);
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Get date range based on period filter
      const { startDate, endDate } = this.getDateRangeFromPeriod(filters?.period || LeaderboardPeriod.ALL_TIME);

      // Get student points for this class within the date range
      // Use type assertion for Prisma model that might not be recognized by TypeScript
      const studentPoints = await (this.prisma as any).studentPoints.groupBy({
        by: ['studentId'],
        where: {
          classId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: "ACTIVE" as SystemStatus,
        },
        _sum: {
          amount: true,
        },
      });

      // Create a map of student points
      const studentPointsMap = new Map<string, number>();
      studentPoints.forEach((points: { studentId: string; _sum: { amount: number | null } }) => {
        studentPointsMap.set(points.studentId, points._sum.amount || 0);
      });

      // Get student activity grades for this class within the date range
      const studentGrades = await this.prisma.activityGrade.findMany({
        where: {
          activity: {
            classId,
          },
          submittedAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: ["GRADED", "SUBMITTED"] as any[],
          },
          isArchived: false,
        },
        include: {
          activity: true,
        },
      });

      // Create a map of student grades
      const studentGradesMap = new Map<string, { totalPoints: number; totalMaxPoints: number; totalActivities: number; completedActivities: number }>();
      studentGrades.forEach((grade) => {
        const studentId = grade.studentId;
        const points = grade.score || 0;
        const maxPoints = grade.activity.maxScore || 100;
        const isCompleted = grade.status === "GRADED";

        const studentData = studentGradesMap.get(studentId) || { totalPoints: 0, totalMaxPoints: 0, totalActivities: 0, completedActivities: 0 };
        studentData.totalPoints += points;
        studentData.totalMaxPoints += maxPoints;
        studentData.totalActivities += 1;
        studentData.completedActivities += isCompleted ? 1 : 0;
        studentGradesMap.set(studentId, studentData);
      });

      // Create leaderboard entries
      const leaderboard: LeaderboardEntry[] = studentEnrollments
        .map((enrollment) => {
          const student = enrollment.student;
          const studentId = student.id;
          const gradeData = studentGradesMap.get(studentId) || { totalPoints: 0, totalMaxPoints: 0, totalActivities: 0, completedActivities: 0 };
          const rewardPoints = studentPointsMap.get(studentId) || 0;

          // Calculate grade percentage
          const gradePercentage = gradeData.totalMaxPoints > 0
            ? (gradeData.totalPoints / gradeData.totalMaxPoints) * 100
            : 0;

          // Calculate completion rate
          const completionRate = gradeData.totalActivities > 0
            ? (gradeData.completedActivities / gradeData.totalActivities) * 100
            : 0;

          // Get student level
          const studentLevel = studentLevelsMap.get(studentId) || 1;

          return {
            studentId: student.id,
            studentName: student.user.name || "Student",
            enrollmentNumber: student.enrollmentNumber,
            score: gradePercentage,
            totalPoints: gradeData.totalPoints,
            totalMaxPoints: gradeData.totalMaxPoints,
            completionRate,
            totalActivities: gradeData.totalActivities,
            completedActivities: gradeData.completedActivities,
            rewardPoints, // New field for reward points
            level: studentLevel, // New field for student level
          };
        });

      // Get previous period data for improvement calculation
      const previousPeriod = this.getPreviousPeriod(filters?.period || LeaderboardPeriod.ALL_TIME);
      const { startDate: prevStartDate, endDate: prevEndDate } = this.getDateRangeFromPeriod(previousPeriod);

      // Get previous period grades
      const previousGrades = await this.prisma.activityGrade.findMany({
        where: {
          activity: {
            classId,
          },
          submittedAt: {
            gte: prevStartDate,
            lte: prevEndDate,
          },
          status: {
            in: ["GRADED", "SUBMITTED"] as any[],
          },
          isArchived: false,
        },
        include: {
          activity: true,
        },
      });

      // Create a map of previous period student grades
      const prevStudentGradesMap = new Map<string, { totalPoints: number; totalMaxPoints: number }>();
      previousGrades.forEach((grade) => {
        const studentId = grade.studentId;
        const points = grade.score || 0;
        const maxPoints = grade.activity.maxScore || 100;

        const studentData = prevStudentGradesMap.get(studentId) || { totalPoints: 0, totalMaxPoints: 0 };
        studentData.totalPoints += points;
        studentData.totalMaxPoints += maxPoints;
        prevStudentGradesMap.set(studentId, studentData);
      });

      // Calculate previous period scores
      const previousPeriodEntries = leaderboard.map((entry) => {
        const prevGradeData = prevStudentGradesMap.get(entry.studentId) || { totalPoints: 0, totalMaxPoints: 0 };
        const prevGradePercentage = prevGradeData.totalMaxPoints > 0
          ? (prevGradeData.totalPoints / prevGradeData.totalMaxPoints) * 100
          : 0;

        return {
          ...entry,
          previousScore: prevGradePercentage,
        };
      });

      // Calculate improvement metrics
      const leaderboardWithImprovement = this.calculateImprovementMetrics(
        leaderboard,
        previousPeriodEntries
      );

      // Sort by reward points first, then by score
      leaderboardWithImprovement.sort((a, b) => {
        const bPoints = b.rewardPoints || 0;
        const aPoints = a.rewardPoints || 0;
        if (bPoints !== aPoints) {
          return bPoints - aPoints;
        }
        return b.score - a.score;
      });

      // Add rank
      leaderboardWithImprovement.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboardWithImprovement;
    } catch (error) {
      this.logger.error("Error getting class leaderboard", { error, classId });
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
   * Get subject leaderboard with reward system integration
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

      // Get date range based on period filter
      const { startDate, endDate } = this.getDateRangeFromPeriod(filters?.period || LeaderboardPeriod.ALL_TIME);

      // Get student points for this subject within the date range
      // Use type assertion for Prisma model that might not be recognized by TypeScript
      const studentPoints = await (this.prisma as any).studentPoints.groupBy({
        by: ['studentId'],
        where: {
          subjectId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: "ACTIVE" as SystemStatus,
        },
        _sum: {
          amount: true,
        },
      });

      // Create a map of student points
      const studentPointsMap = new Map<string, number>();
      studentPoints.forEach((points: { studentId: string; _sum: { amount: number | null } }) => {
        studentPointsMap.set(points.studentId, points._sum.amount || 0);
      });

      // Get student activity grades for this subject within the date range
      const studentGrades = await this.prisma.activityGrade.findMany({
        where: {
          activity: {
            subjectId,
          },
          submittedAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: ["GRADED", "SUBMITTED"] as any[],
          },
          isArchived: false,
        },
        include: {
          activity: true,
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // Group grades by student
      const studentGradesMap = new Map<string, {
        studentId: string;
        studentName: string;
        enrollmentNumber: string;
        totalPoints: number;
        totalMaxPoints: number;
        totalActivities: number;
        completedActivities: number;
      }>();

      studentGrades.forEach((grade) => {
        const studentId = grade.studentId;
        const points = grade.score || 0;
        const maxPoints = grade.activity.maxScore || 100;
        const isCompleted = grade.status === "GRADED";

        if (!studentGradesMap.has(studentId)) {
          studentGradesMap.set(studentId, {
            studentId,
            studentName: grade.student.user.name || "Student",
            enrollmentNumber: grade.student.enrollmentNumber,
            totalPoints: 0,
            totalMaxPoints: 0,
            totalActivities: 0,
            completedActivities: 0,
          });
        }

        const studentData = studentGradesMap.get(studentId)!;
        studentData.totalPoints += points;
        studentData.totalMaxPoints += maxPoints;
        studentData.totalActivities += 1;
        studentData.completedActivities += isCompleted ? 1 : 0;
      });

      // Get student levels
      // Use type assertion for Prisma model that might not be recognized by TypeScript
      const studentLevels = await (this.prisma as any).studentLevel.findMany({
        where: {
          student: {
            ActivityGrade: {
              some: {
                activity: {
                  subjectId,
                },
              },
            },
          },
          status: "ACTIVE" as SystemStatus,
        },
      });

      // Create a map of student levels
      const studentLevelsMap = new Map<string, number>();
      studentLevels.forEach((level: { studentId: string; level: number }) => {
        studentLevelsMap.set(level.studentId, level.level);
      });

      // Create leaderboard entries
      const leaderboard: LeaderboardEntry[] = Array.from(studentGradesMap.values())
        .map((student) => {
          const rewardPoints = studentPointsMap.get(student.studentId) || 0;
          const studentLevel = studentLevelsMap.get(student.studentId) || 1;

          // Calculate grade percentage
          const gradePercentage = student.totalMaxPoints > 0
            ? (student.totalPoints / student.totalMaxPoints) * 100
            : 0;

          // Calculate completion rate
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
            rewardPoints, // New field for reward points
            level: studentLevel, // New field for student level
          };
        });

      // Sort by reward points first, then by score
      leaderboard.sort((a, b) => {
        const bPoints = b.rewardPoints || 0;
        const aPoints = a.rewardPoints || 0;
        if (bPoints !== aPoints) {
          return bPoints - aPoints;
        }
        return b.score - a.score;
      });

      // Add rank
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboard;
    } catch (error) {
      this.logger.error("Error getting subject leaderboard", { error, subjectId });
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
   * Calculate improvement metrics for leaderboard entries
   */
  private calculateImprovementMetrics(
    currentPeriodEntries: LeaderboardEntry[],
    previousPeriodEntries: LeaderboardEntry[]
  ): LeaderboardEntry[] {
    // Create a map of previous period scores
    const prevScoreMap = new Map<string, number>();
    previousPeriodEntries.forEach((entry) => {
      prevScoreMap.set(entry.studentId, entry.previousScore || 0);
    });

    // Calculate improvement for each entry
    const entriesWithImprovement = currentPeriodEntries.map((entry) => {
      const prevScore = prevScoreMap.get(entry.studentId) || 0;
      const improvement = prevScore > 0 ? ((entry.score - prevScore) / prevScore) * 100 : 0;

      return {
        ...entry,
        previousScore: prevScore,
        improvement,
      };
    });

    // Calculate improvement rank
    const sortedByImprovement = [...entriesWithImprovement].sort((a, b) => (b.improvement || 0) - (a.improvement || 0));
    sortedByImprovement.forEach((entry, index) => {
      const originalEntry = entriesWithImprovement.find((e) => e.studentId === entry.studentId);
      if (originalEntry) {
        originalEntry.improvementRank = index + 1;
      }
    });

    return entriesWithImprovement;
  }

  /**
   * Get date range from period filter
   */
  private getDateRangeFromPeriod(period: LeaderboardPeriod): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = now;
    let startDate: Date;

    switch (period) {
      case LeaderboardPeriod.DAILY:
        startDate = startOfDay(now);
        break;
      case LeaderboardPeriod.WEEKLY:
        startDate = startOfWeek(now);
        break;
      case LeaderboardPeriod.MONTHLY:
        startDate = startOfMonth(now);
        break;
      case LeaderboardPeriod.TERM:
        // Simplified - in a real app, would get the actual term start date
        startDate = subMonths(now, 3);
        break;
      case LeaderboardPeriod.ALL_TIME:
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Get previous period for comparison
   */
  private getPreviousPeriod(currentPeriod: LeaderboardPeriod): LeaderboardPeriod {
    switch (currentPeriod) {
      case LeaderboardPeriod.DAILY:
        return LeaderboardPeriod.DAILY; // Previous day
      case LeaderboardPeriod.WEEKLY:
        return LeaderboardPeriod.WEEKLY; // Previous week
      case LeaderboardPeriod.MONTHLY:
        return LeaderboardPeriod.MONTHLY; // Previous month
      case LeaderboardPeriod.TERM:
        return LeaderboardPeriod.TERM; // Previous term
      case LeaderboardPeriod.ALL_TIME:
      default:
        return LeaderboardPeriod.ALL_TIME; // All time
    }
  }

  /**
   * Get leaderboard using the reward system
   * This method uses the new reward system to get leaderboard data
   * @param options Options for the leaderboard
   * @returns Leaderboard entries
   */
  async getRewardLeaderboard(options: {
    type: 'class' | 'subject' | 'overall';
    referenceId?: string;
    period: LeaderboardPeriod;
    limit?: number;
    offset?: number;
  }): Promise<LeaderboardEntry[]> {
    try {
      // Map period to timeframe
      let timeframe: 'daily' | 'weekly' | 'monthly' | 'term' | 'all-time' = 'all-time';
      switch (options.period) {
        case LeaderboardPeriod.DAILY:
          timeframe = 'daily';
          break;
        case LeaderboardPeriod.WEEKLY:
          timeframe = 'weekly';
          break;
        case LeaderboardPeriod.MONTHLY:
          timeframe = 'monthly';
          break;
        case LeaderboardPeriod.TERM:
          timeframe = 'term';
          break;
        case LeaderboardPeriod.ALL_TIME:
        default:
          timeframe = 'all-time';
          break;
      }

      // Get leaderboard data from reward system
      const leaderboardData = await this.rewardSystem.getLeaderboard({
        type: options.type,
        referenceId: options.referenceId,
        timeframe,
        limit: options.limit,
        offset: options.offset,
      });

      // Map to LeaderboardEntry format
      return leaderboardData.map(entry => ({
        rank: entry.rank,
        studentId: entry.studentId,
        studentName: entry.studentName || 'Student',
        enrollmentNumber: '', // Add empty enrollment number to satisfy type
        score: entry.points, // Use points as score
        rewardPoints: entry.points,
        level: entry.level,
        achievements: entry.achievements,
        // Add default values for required fields
        totalPoints: entry.points,
        totalMaxPoints: entry.points,
        completionRate: 100,
        totalActivities: 0,
        completedActivities: 0,
      }));
    } catch (error) {
      this.logger.error('Error getting reward leaderboard', { error, options });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get leaderboard data',
      });
    }
  }

  /**
   * Get class leaderboard using the reward system
   * @param classId The class ID
   * @param filters Optional filters
   * @returns Leaderboard data for the class
   */
  async getClassLeaderboardWithRewards(classId: string, filters?: LeaderboardFilters): Promise<LeaderboardEntry[]> {
    try {
      // Validate class exists
      const classEntity = await this.prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Get leaderboard using reward system
      return this.getRewardLeaderboard({
        type: 'class',
        referenceId: classId,
        period: filters?.period || LeaderboardPeriod.ALL_TIME,
        limit: filters?.limit,
        offset: filters?.offset,
      });
    } catch (error) {
      this.logger.error("Error getting class leaderboard with rewards", { error, classId });
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
   * Get subject leaderboard using the reward system
   * @param subjectId The subject ID
   * @param filters Optional filters
   * @returns Leaderboard data for the subject
   */
  async getSubjectLeaderboardWithRewards(subjectId: string, filters?: LeaderboardFilters): Promise<LeaderboardEntry[]> {
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

      // Get leaderboard using reward system
      return this.getRewardLeaderboard({
        type: 'subject',
        referenceId: subjectId,
        period: filters?.period || LeaderboardPeriod.ALL_TIME,
        limit: filters?.limit,
        offset: filters?.offset,
      });
    } catch (error) {
      this.logger.error("Error getting subject leaderboard with rewards", { error, subjectId });
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
   * Create a snapshot of the current leaderboard
   * @param type The type of leaderboard (CLASS, SUBJECT, CAMPUS)
   * @param referenceId The ID of the reference entity
   * @param limit The maximum number of entries to include
   * @param timeGranularity Optional time granularity (daily, weekly, monthly, term, all-time)
   * @returns Success status
   */
  async createLeaderboardSnapshot(
    type: string,
    referenceId: string,
    limit: number = 100,
    timeGranularity?: string
  ): Promise<boolean> {
    try {
      // Map type to EntityType
      let entityType: EntityType;
      switch (type) {
        case 'CLASS':
          entityType = EntityType.CLASS;
          break;
        case 'SUBJECT':
          entityType = EntityType.SUBJECT;
          break;
        case 'CAMPUS':
        case 'OVERALL':
          entityType = EntityType.CAMPUS;
          break;
        default:
          entityType = EntityType.CLASS;
      }

      // Map timeGranularity to TimeGranularity
      let granularity: TimeGranularity = TimeGranularity.ALL_TIME;
      if (timeGranularity) {
        switch (timeGranularity.toLowerCase()) {
          case 'daily':
            granularity = TimeGranularity.DAILY;
            break;
          case 'weekly':
            granularity = TimeGranularity.WEEKLY;
            break;
          case 'monthly':
            granularity = TimeGranularity.MONTHLY;
            break;
          case 'term':
            granularity = TimeGranularity.TERM;
            break;
        }
      }

      // Get the institution ID based on the entity type
      let institutionId: string;

      if (entityType === EntityType.CLASS) {
        // Get institution ID from class
        const classEntity = await this.prisma.class.findUnique({
          where: { id: referenceId },
          include: {
            courseCampus: {
              include: {
                campus: true
              }
            }
          }
        });

        if (!classEntity || !classEntity.courseCampus.campus.institutionId) {
          throw new Error(`Could not find institution ID for class ${referenceId}`);
        }

        institutionId = classEntity.courseCampus.campus.institutionId;
      } else if (entityType === EntityType.SUBJECT) {
        // Get institution ID from subject
        const subject = await this.prisma.subject.findUnique({
          where: { id: referenceId },
          include: {
            course: {
              include: {
                program: true
              }
            }
          }
        });

        if (!subject || !subject.course.program.institutionId) {
          throw new Error(`Could not find institution ID for subject ${referenceId}`);
        }

        institutionId = subject.course.program.institutionId;
      } else {
        // For campus, get institution ID directly
        const campus = await this.prisma.campus.findUnique({
          where: { id: referenceId }
        });

        if (!campus) {
          throw new Error(`Could not find campus ${referenceId}`);
        }

        institutionId = campus.institutionId;
      }

      // Create partitioned snapshot
      await this.partitioningService.createPartitionedSnapshot({
        type: entityType,
        referenceId,
        institutionId,
        timeGranularity: granularity,
        limit,
      });

      return true;
    } catch (error) {
      this.logger.error("Error creating leaderboard snapshot", { error, type, referenceId });
      return false;
    }
  }

  /**
   * Get historical leaderboard data with partitioning support
   * @param type The type of leaderboard (CLASS, SUBJECT, CAMPUS)
   * @param referenceId The ID of the reference entity
   * @param options Optional parameters for filtering
   * @returns Historical leaderboard data
   */
  async getHistoricalLeaderboard(
    type: string,
    referenceId: string,
    options: {
      timeGranularity?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    try {
      // Map type to EntityType
      let entityType: EntityType;
      switch (type) {
        case 'CLASS':
          entityType = EntityType.CLASS;
          break;
        case 'SUBJECT':
          entityType = EntityType.SUBJECT;
          break;
        case 'CAMPUS':
        case 'OVERALL':
          entityType = EntityType.CAMPUS;
          break;
        default:
          entityType = EntityType.CLASS;
      }

      // Map timeGranularity to TimeGranularity
      let granularity: TimeGranularity = TimeGranularity.ALL_TIME;
      if (options.timeGranularity) {
        switch (options.timeGranularity.toLowerCase()) {
          case 'daily':
            granularity = TimeGranularity.DAILY;
            break;
          case 'weekly':
            granularity = TimeGranularity.WEEKLY;
            break;
          case 'monthly':
            granularity = TimeGranularity.MONTHLY;
            break;
          case 'term':
            granularity = TimeGranularity.TERM;
            break;
        }
      }

      // Get the institution ID based on the entity type
      let institutionId: string;

      if (entityType === EntityType.CLASS) {
        // Get institution ID from class
        const classEntity = await this.prisma.class.findUnique({
          where: { id: referenceId },
          include: {
            courseCampus: {
              include: {
                campus: true
              }
            }
          }
        });

        if (!classEntity || !classEntity.courseCampus.campus.institutionId) {
          throw new Error(`Could not find institution ID for class ${referenceId}`);
        }

        institutionId = classEntity.courseCampus.campus.institutionId;
      } else if (entityType === EntityType.SUBJECT) {
        // Get institution ID from subject
        const subject = await this.prisma.subject.findUnique({
          where: { id: referenceId },
          include: {
            course: {
              include: {
                program: true
              }
            }
          }
        });

        if (!subject || !subject.course.program.institutionId) {
          throw new Error(`Could not find institution ID for subject ${referenceId}`);
        }

        institutionId = subject.course.program.institutionId;
      } else {
        // For campus, get institution ID directly
        const campus = await this.prisma.campus.findUnique({
          where: { id: referenceId }
        });

        if (!campus) {
          throw new Error(`Could not find campus ${referenceId}`);
        }

        institutionId = campus.institutionId;
      }

      // Get historical data
      return this.partitioningService.getHistoricalLeaderboard({
        type: entityType,
        referenceId,
        institutionId,
        timeGranularity: granularity,
        startDate: options.startDate,
        endDate: options.endDate,
        limit: options.limit,
      });
    } catch (error) {
      this.logger.error("Error getting historical leaderboard data", { error, type, referenceId, options });
      return [];
    }
  }

  /**
   * Get leaderboard trends over time
   * @param type The type of leaderboard (CLASS, SUBJECT, CAMPUS)
   * @param referenceId The ID of the reference entity
   * @param options Optional parameters for filtering
   * @returns Trend data for the leaderboard
   */
  async getLeaderboardTrends(
    type: string,
    referenceId: string,
    options: {
      timeGranularity?: string;
      months?: number;
      studentId?: string;
    } = {}
  ): Promise<any> {
    try {
      // Map type to EntityType
      let entityType: EntityType;
      switch (type) {
        case 'CLASS':
          entityType = EntityType.CLASS;
          break;
        case 'SUBJECT':
          entityType = EntityType.SUBJECT;
          break;
        case 'CAMPUS':
        case 'OVERALL':
          entityType = EntityType.CAMPUS;
          break;
        default:
          entityType = EntityType.CLASS;
      }

      // Map timeGranularity to TimeGranularity
      let granularity: TimeGranularity = TimeGranularity.MONTHLY; // Default to monthly for trends
      if (options.timeGranularity) {
        switch (options.timeGranularity.toLowerCase()) {
          case 'daily':
            granularity = TimeGranularity.DAILY;
            break;
          case 'weekly':
            granularity = TimeGranularity.WEEKLY;
            break;
          case 'monthly':
            granularity = TimeGranularity.MONTHLY;
            break;
          case 'term':
            granularity = TimeGranularity.TERM;
            break;
        }
      }

      // Get the institution ID based on the entity type
      let institutionId: string;

      if (entityType === EntityType.CLASS) {
        // Get institution ID from class
        const classEntity = await this.prisma.class.findUnique({
          where: { id: referenceId },
          include: {
            courseCampus: {
              include: {
                campus: true
              }
            }
          }
        });

        if (!classEntity || !classEntity.courseCampus.campus.institutionId) {
          throw new Error(`Could not find institution ID for class ${referenceId}`);
        }

        institutionId = classEntity.courseCampus.campus.institutionId;
      } else if (entityType === EntityType.SUBJECT) {
        // Get institution ID from subject
        const subject = await this.prisma.subject.findUnique({
          where: { id: referenceId },
          include: {
            course: {
              include: {
                program: true
              }
            }
          }
        });

        if (!subject || !subject.course.program.institutionId) {
          throw new Error(`Could not find institution ID for subject ${referenceId}`);
        }

        institutionId = subject.course.program.institutionId;
      } else {
        // For campus, get institution ID directly
        const campus = await this.prisma.campus.findUnique({
          where: { id: referenceId }
        });

        if (!campus) {
          throw new Error(`Could not find campus ${referenceId}`);
        }

        institutionId = campus.institutionId;
      }

      // Get trend data
      return this.partitioningService.getLeaderboardTrends({
        type: entityType,
        referenceId,
        institutionId,
        timeGranularity: granularity,
        months: options.months,
        studentId: options.studentId,
      });
    } catch (error) {
      this.logger.error("Error getting leaderboard trends", { error, type, referenceId, options });
      return { trends: [] };
    }
  }
}
