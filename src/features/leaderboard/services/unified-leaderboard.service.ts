/**
 * Unified Leaderboard Service
 *
 * This service provides a single source of truth for leaderboard data across all portals.
 * It implements clear separation between academic performance metrics and reward points.
 */

import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { logger } from '@/server/api/utils/logger';
import {
  StandardLeaderboardEntry,
  StandardLeaderboardResponse,
  LeaderboardEntityType,
  TimeGranularity,
  LeaderboardMetadata,
  StudentPositionInfo,
  LeaderboardFilterOptions
} from '../types/standard-leaderboard';
import { OptimizedLeaderboardService } from '@/server/api/services/leaderboard.service.optimized';
import { LeaderboardPeriod } from '@/server/api/services/optimized-queries';

export interface UnifiedLeaderboardServiceContext {
  prisma: PrismaClient;
}

/**
 * Unified Leaderboard Service class
 */
export class UnifiedLeaderboardService {
  private prisma: PrismaClient;
  private optimizedService: OptimizedLeaderboardService;

  constructor({ prisma }: UnifiedLeaderboardServiceContext) {
    this.prisma = prisma;
    this.optimizedService = new OptimizedLeaderboardService({ prisma });
  }

  /**
   * Get leaderboard data for any entity type and timeframe
   */
  async getLeaderboard(options: {
    type: LeaderboardEntityType | string;
    referenceId: string;
    timeGranularity?: TimeGranularity;
    filterOptions?: LeaderboardFilterOptions;
  }): Promise<StandardLeaderboardResponse> {
    try {
      const {
        type,
        referenceId,
        timeGranularity = TimeGranularity.ALL_TIME,
        filterOptions = {}
      } = options;

      const {
        limit = 50,
        offset = 0,
        includeCurrentStudent = false,
        currentStudentId
      } = filterOptions;

      // Map the entity type to the format expected by the existing service
      let entityType: string;
      let entityId = referenceId;

      switch (type) {
        case LeaderboardEntityType.CLASS:
          entityType = 'class';
          break;
        case LeaderboardEntityType.SUBJECT:
          entityType = 'subject';
          break;
        case LeaderboardEntityType.COURSE:
          entityType = 'course';
          break;
        case LeaderboardEntityType.CAMPUS:
          entityType = 'campus';
          break;
        default:
          entityType = 'class';
      }

      // Map time granularity to period
      let period: LeaderboardPeriod;
      switch (timeGranularity) {
        case TimeGranularity.DAILY:
          period = LeaderboardPeriod.DAILY;
          break;
        case TimeGranularity.WEEKLY:
          period = LeaderboardPeriod.WEEKLY;
          break;
        case TimeGranularity.MONTHLY:
          period = LeaderboardPeriod.MONTHLY;
          break;
        case TimeGranularity.TERM:
          period = LeaderboardPeriod.TERM;
          break;
        case TimeGranularity.ALL_TIME:
        default:
          period = LeaderboardPeriod.ALL_TIME;
          break;
      }

      // Use the existing service to get leaderboard data
      let leaderboardData: any[] = [];
      let metadata: any = {};
      let totalStudents = 0;

      if (entityType === 'class') {
        const result = await this.optimizedService.getClassLeaderboard(entityId, {
          period,
          limit
        });
        leaderboardData = result;

        const classEntity = await this.prisma.class.findUnique({
          where: { id: entityId },
          include: {
            courseCampus: {
              include: {
                course: true,
                campus: true
              }
            }
          }
        });

        if (classEntity) {
          metadata = {
            classId: classEntity.id,
            className: classEntity.name,
            courseId: classEntity.courseCampus.courseId,
            courseName: classEntity.courseCampus.course.name,
            campusId: classEntity.courseCampus.campusId,
            campusName: classEntity.courseCampus.campus.name
          };

          // Get total students count
          const studentsCount = await this.prisma.studentEnrollment.count({
            where: {
              classId: entityId,
              status: 'ACTIVE'
            }
          });
          totalStudents = studentsCount;
        }
      } else if (entityType === 'subject') {
        // Handle subject leaderboard specifically
        const result = await this.optimizedService.getSubjectLeaderboard(entityId, {
          period,
          limit
        });
        leaderboardData = result;

        const subject = await this.prisma.subject.findUnique({
          where: { id: entityId },
          include: {
            course: true
          }
        });

        if (subject) {
          metadata = {
            subjectId: subject.id,
            subjectName: subject.name,
            courseId: subject.courseId,
            courseName: subject.course.name
          };

          // Get total students count for this subject
          // Count students enrolled in classes that have this subject
          const studentsCount = await this.prisma.studentEnrollment.count({
            where: {
              class: {
                courseCampus: {
                  course: {
                    subjects: {
                      some: {
                        id: entityId
                      }
                    }
                  }
                }
              },
              status: 'ACTIVE'
            }
          });
          totalStudents = studentsCount;
        }
      } else if (entityType === 'course') {
        const result = await this.optimizedService.getCourseLeaderboard(entityId, {
          period,
          limit
        });
        leaderboardData = result;

        const course = await this.prisma.course.findUnique({
          where: { id: entityId }
        });

        if (course) {
          metadata = {
            courseId: course.id,
            courseName: course.name
          };

          // Get total students count
          const studentsCount = await this.prisma.studentEnrollment.count({
            where: {
              class: {
                courseCampus: {
                  courseId: entityId
                }
              },
              status: 'ACTIVE'
            }
          });
          totalStudents = studentsCount;
        }
      } else if (entityType === 'campus') {
        // Campus leaderboard
        const result = await this.optimizedService.getOverallLeaderboard(entityId, {
          period,
          limit
        });
        leaderboardData = result;

        const campus = await this.prisma.campus.findUnique({
          where: { id: entityId }
        });

        if (campus) {
          metadata = {
            campusId: campus.id,
            campusName: campus.name
          };

          // Get total students count
          const studentsCount = await this.prisma.studentEnrollment.count({
            where: {
              class: {
                courseCampus: {
                  campusId: entityId
                }
              },
              status: 'ACTIVE'
            }
          });
          totalStudents = studentsCount;
        }
      } else {
        // Default to campus leaderboard if entity type is not recognized
        const result = await this.optimizedService.getOverallLeaderboard(entityId, {
          period,
          limit
        });
        leaderboardData = result;

        const campus = await this.prisma.campus.findUnique({
          where: { id: entityId }
        });

        if (campus) {
          metadata = {
            campusId: campus.id,
            campusName: campus.name
          };

          // Get total students count
          const studentsCount = await this.prisma.studentEnrollment.count({
            where: {
              class: {
                courseCampus: {
                  campusId: entityId
                }
              },
              status: 'ACTIVE'
            }
          });
          totalStudents = studentsCount;
        }
      }

      // Transform the data to match the StandardLeaderboardEntry format
      // First, ensure we have unique student IDs by creating a map
      const uniqueEntries = new Map<string, any>();

      leaderboardData.forEach((entry: any, index: number) => {
        // If the entry doesn't have a studentId, generate one
        const studentId = entry.studentId || `student-${index + 1}`;

        // Only add the entry if it's not already in the map
        if (!uniqueEntries.has(studentId)) {
          uniqueEntries.set(studentId, entry);
        }
      });

      // Convert the map to an array and transform the data
      const entries = Array.from(uniqueEntries.values()).map((entry: any, index: number) => {
        return {
          studentId: entry.studentId || `student-${index + 1}`,
          studentName: entry.studentName || `Student ${index + 1}`,
          studentAvatar: entry.avatar || undefined,

          // Academic performance
          academicScore: entry.academicScore || 0,
          totalGradePoints: entry.totalPoints || 0,
          totalMaxGradePoints: entry.maxPoints || 100,

          // Reward system
          rewardPoints: entry.points || 0,
          level: entry.level || 1,
          achievements: entry.achievements || 0,

          // Progress tracking
          completionRate: entry.completionRate || 0,
          totalActivities: entry.totalActivities || 0,
          completedActivities: entry.completedActivities || 0,

          // Ranking
          rank: entry.rank || index + 1,
          previousRank: entry.previousRank || (entry.rank || index + 1),
          rankChange: entry.rankChange || 0,
        } as StandardLeaderboardEntry;
      });

      // Create a standardized metadata object
      const leaderboardMetadata: LeaderboardMetadata = {
        entityType: type as LeaderboardEntityType,
        entityId: referenceId,
        entityName: metadata.className || metadata.subjectName || metadata.courseName || metadata.campusName,
        timeGranularity,
        generatedAt: new Date(),
        institutionId: 'inst-123', // Mock value
        institutionName: 'Sample Institution', // Mock value
        academicYear: '2023-2024', // Mock value
        termId: 'term-123', // Mock value
        termName: 'Spring 2024' // Mock value
      };

      // Create a mock current student position if requested
      let currentStudentPosition: StudentPositionInfo | undefined;
      if (includeCurrentStudent && currentStudentId) {
        // Find the student in the leaderboard
        const studentEntry = entries.find(entry => entry.studentId === currentStudentId);

        if (studentEntry) {
          currentStudentPosition = {
            studentId: currentStudentId,
            rank: studentEntry.rank,
            previousRank: studentEntry.previousRank,
            rankChange: studentEntry.rankChange,
            rewardPoints: studentEntry.rewardPoints,
            academicScore: studentEntry.academicScore,
            isInTopRanks: studentEntry.rank <= 10,
            distanceToNextRank: 50, // Mock value
            distanceToPreviousRank: 30 // Mock value
          };
        } else {
          // If student not in top entries, create a mock position
          currentStudentPosition = {
            studentId: currentStudentId,
            rank: totalStudents > 50 ? Math.floor(Math.random() * (totalStudents - 50)) + 51 : totalStudents,
            previousRank: totalStudents > 50 ? Math.floor(Math.random() * (totalStudents - 50)) + 51 : totalStudents,
            rankChange: Math.floor(Math.random() * 5) * (Math.random() > 0.5 ? 1 : -1),
            rewardPoints: Math.floor(Math.random() * 1000),
            academicScore: Math.floor(Math.random() * 100),
            isInTopRanks: false,
            distanceToNextRank: Math.floor(Math.random() * 100),
            distanceToPreviousRank: Math.floor(Math.random() * 100)
          };
        }
      }

      // Return standardized response
      return {
        leaderboard: entries,
        metadata: leaderboardMetadata,
        currentStudentPosition,
        totalStudents
      };
    } catch (error: any) {
      logger.error('Error getting leaderboard', {
        error,
        entityType: options.type,
        referenceId: options.referenceId,
        timeGranularity: options.timeGranularity
      });

      // Provide more specific error message for debugging
      if (error.code === 'NOT_FOUND') {
        if (error.message.includes('Class not found')) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Class with ID ${options.referenceId} not found`
          });
        } else if (error.message.includes('Subject not found')) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Subject with ID ${options.referenceId} not found`
          });
        } else if (error.message.includes('Course not found')) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Course with ID ${options.referenceId} not found`
          });
        } else if (error.message.includes('Campus not found')) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Campus with ID ${options.referenceId} not found`
          });
        }
      }

      // If not a specific error we can enhance, just rethrow
      throw error;
    }
  }
}
