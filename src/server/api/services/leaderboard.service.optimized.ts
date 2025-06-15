/**
 * Optimized Leaderboard Service
 *
 * This service provides optimized leaderboard functionality with caching and
 * efficient database queries for better performance with large datasets.
 *
 * @deprecated This service has been replaced by unified-leaderboard.service.ts in features/leaderboard/services
 * This file is kept for reference only and will be removed in a future update.
 */

import { PrismaClient, SystemStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { logger } from '@/server/api/utils/logger';
import {
  getOptimizedClassLeaderboard,
  getOptimizedSubjectLeaderboard,
  getOptimizedOverallLeaderboard,
  createOptimizedLeaderboardSnapshot,
  LeaderboardPeriod,
  PaginationParams,
  LeaderboardEntry
} from './optimized-queries';

// Leaderboard filters
export interface LeaderboardFilters {
  period?: LeaderboardPeriod;
  limit?: number;
  offset?: number;
}

/**
 * Optimized leaderboard service
 */
export class OptimizedLeaderboardService {
  private prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  /**
   * Get class leaderboard with optimized queries and caching
   */
  async getClassLeaderboard(
    classId: string,
    filters: LeaderboardFilters = {}
  ): Promise<LeaderboardEntry[]> {
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

      // Get leaderboard with optimized query
      return getOptimizedClassLeaderboard(
        this.prisma,
        classId,
        filters.period || LeaderboardPeriod.ALL_TIME,
        {
          take: filters.limit || 10,
          skip: filters.offset || 0,
        }
      );
    } catch (error) {
      logger.error('Error getting class leaderboard', { error, classId, filters });
      throw error;
    }
  }

  /**
   * Get subject leaderboard with optimized queries and caching
   */
  async getSubjectLeaderboard(
    subjectId: string,
    filters: LeaderboardFilters = {}
  ): Promise<LeaderboardEntry[]> {
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

      // Get leaderboard with optimized query
      return getOptimizedSubjectLeaderboard(
        this.prisma,
        subjectId,
        filters.period || LeaderboardPeriod.ALL_TIME,
        {
          take: filters.limit || 10,
          skip: filters.offset || 0,
        }
      );
    } catch (error) {
      logger.error('Error getting subject leaderboard', { error, subjectId, filters });
      throw error;
    }
  }

  /**
   * Get course leaderboard with optimized queries and caching
   */
  async getCourseLeaderboard(
    courseId: string,
    filters: LeaderboardFilters = {}
  ): Promise<LeaderboardEntry[]> {
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

      // Get all subjects for this course
      const subjects = await this.prisma.subject.findMany({
        where: {
          courseId,
          status: SystemStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      });

      const subjectIds = subjects.map(subject => subject.id);

      // Get leaderboard data for all subjects
      const leaderboardPromises = subjectIds.map(subjectId =>
        getOptimizedSubjectLeaderboard(
          this.prisma,
          subjectId,
          filters.period || LeaderboardPeriod.ALL_TIME,
          {
            take: 1000, // Get a large number to aggregate properly
            skip: 0,
          }
        )
      );

      const subjectLeaderboards = await Promise.all(leaderboardPromises);

      // Combine and aggregate the leaderboards
      const studentPointsMap = new Map<string, number>();
      const studentDataMap = new Map<string, {
        name: string;
        level: number;
        achievements: number;
      }>();

      // Combine data from all subject leaderboards
      subjectLeaderboards.flat().forEach(entry => {
        const currentPoints = studentPointsMap.get(entry.studentId) || 0;
        studentPointsMap.set(entry.studentId, currentPoints + entry.points);

        // Store student data if not already stored
        if (!studentDataMap.has(entry.studentId)) {
          studentDataMap.set(entry.studentId, {
            name: entry.studentName || 'Unknown',
            level: entry.level || 1,
            achievements: entry.achievements || 0,
          });
        }
      });

      // Convert to array and sort
      const combinedLeaderboard = Array.from(studentPointsMap.entries())
        .map(([studentId, points]) => {
          const studentData = studentDataMap.get(studentId) || {
            name: 'Unknown',
            level: 1,
            achievements: 0,
          };

          return {
            studentId,
            studentName: studentData.name,
            points,
            rank: 0, // Will be set after sorting
            level: studentData.level,
            achievements: studentData.achievements,
          };
        })
        .sort((a, b) => b.points - a.points);

      // Set ranks
      combinedLeaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      // Apply pagination
      const limit = filters.limit || 10;
      const offset = filters.offset || 0;
      return combinedLeaderboard.slice(offset, offset + limit);
    } catch (error) {
      logger.error('Error getting course leaderboard', { error, courseId, filters });
      throw error;
    }
  }

  /**
   * Get overall leaderboard with optimized queries and caching
   */
  async getOverallLeaderboard(
    campusId: string,
    filters: LeaderboardFilters = {}
  ): Promise<LeaderboardEntry[]> {
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

      // Get leaderboard with optimized query
      return getOptimizedOverallLeaderboard(
        this.prisma,
        campusId,
        filters.period || LeaderboardPeriod.ALL_TIME,
        {
          take: filters.limit || 10,
          skip: filters.offset || 0,
        }
      );
    } catch (error) {
      logger.error('Error getting overall leaderboard', { error, campusId, filters });
      throw error;
    }
  }

  /**
   * Get student rank in a leaderboard
   */
  async getStudentRank(
    studentId: string,
    options: {
      type: 'class' | 'subject' | 'overall';
      referenceId: string;
      period?: LeaderboardPeriod;
    }
  ): Promise<{ rank: number; totalStudents: number }> {
    try {
      const { type, referenceId, period = LeaderboardPeriod.ALL_TIME } = options;

      // Get full leaderboard (without pagination)
      let leaderboard: LeaderboardEntry[] = [];

      switch (type) {
        case 'class':
          leaderboard = await getOptimizedClassLeaderboard(
            this.prisma,
            referenceId,
            period,
            { take: 1000 } // Get a large number to find the student
          );
          break;
        case 'subject':
          leaderboard = await getOptimizedSubjectLeaderboard(
            this.prisma,
            referenceId,
            period,
            { take: 1000 }
          );
          break;
        case 'overall':
          leaderboard = await getOptimizedOverallLeaderboard(
            this.prisma,
            referenceId,
            period,
            { take: 1000 }
          );
          break;
      }

      // Find student in leaderboard
      const studentEntry = leaderboard.find(entry => entry.studentId === studentId);

      return {
        rank: studentEntry?.rank || 0,
        totalStudents: leaderboard.length,
      };
    } catch (error) {
      logger.error('Error getting student rank', { error, studentId, options });
      throw error;
    }
  }

  /**
   * Create a leaderboard snapshot
   */
  async createLeaderboardSnapshot(
    type: string,
    referenceId: string,
    limit: number = 100
  ): Promise<any> {
    try {
      return createOptimizedLeaderboardSnapshot(
        this.prisma,
        type,
        referenceId,
        limit
      );
    } catch (error) {
      logger.error('Error creating leaderboard snapshot', { error, type, referenceId });
      throw error;
    }
  }

  /**
   * Get historical leaderboard data
   */
  async getHistoricalLeaderboard(
    type: string,
    referenceId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    try {
      const { startDate, endDate, limit = 10 } = options;

      // Build where clause
      const whereClause: any = {
        type,
        referenceId,
        status: SystemStatus.ACTIVE,
      };

      if (startDate) {
        whereClause.snapshotDate = { gte: startDate };
      }

      if (endDate) {
        whereClause.snapshotDate = {
          ...whereClause.snapshotDate,
          lte: endDate
        };
      }

      // Get snapshots
      const snapshots = await (this.prisma as any).leaderboardSnapshot.findMany({
        where: whereClause,
        orderBy: {
          snapshotDate: 'desc',
        },
        take: limit,
      });

      return snapshots;
    } catch (error) {
      logger.error('Error getting historical leaderboard', { error, type, referenceId });
      throw error;
    }
  }
}
