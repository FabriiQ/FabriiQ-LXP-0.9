/**
 * Mastery Analytics Service
 *
 * This service provides analytics for topic mastery.
 */

import { PrismaClient } from '@prisma/client';
import {
  TopicMasteryData,
  StudentMasteryAnalytics,
  ClassMasteryAnalytics,
  BloomsTaxonomyLevel,
  MasteryLevel
} from '../../types';
import {
  DEFAULT_MASTERY_THRESHOLDS,
  BLOOMS_LEVEL_MASTERY_WEIGHTS
} from '../../constants/mastery-thresholds';
import {
  calculateStudentMasteryAnalytics,
  calculateClassMasteryAnalytics,
  getMasteryLevel
} from '../../utils/mastery-helpers';

export class MasteryAnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get student mastery analytics
   */
  public async getStudentAnalytics(
    studentId: string,
    subjectId?: string
  ): Promise<StudentMasteryAnalytics> {
    // Get student information
    const student = await this.prisma.user.findUnique({
      where: {
        id: studentId
      },
      select: {
        id: true,
        name: true
      }
    });

    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    // Get topic masteries for the student
    const topicMasteries = await this.prisma.topicMastery.findMany({
      where: {
        studentId,
        ...(subjectId ? { subjectId } : {})
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Convert to TopicMasteryData
    const masteryData: TopicMasteryData[] = topicMasteries.map(tm => ({
      id: tm.id,
      studentId: tm.studentId,
      topicId: tm.topicId,
      subjectId: tm.subjectId,
      [BloomsTaxonomyLevel.REMEMBER]: tm.rememberLevel,
      [BloomsTaxonomyLevel.UNDERSTAND]: tm.understandLevel,
      [BloomsTaxonomyLevel.APPLY]: tm.applyLevel,
      [BloomsTaxonomyLevel.ANALYZE]: tm.analyzeLevel,
      [BloomsTaxonomyLevel.EVALUATE]: tm.evaluateLevel,
      [BloomsTaxonomyLevel.CREATE]: tm.createLevel,
      overallMastery: tm.overallMastery,
      lastAssessmentDate: tm.lastAssessmentDate,
      createdAt: tm.createdAt,
      updatedAt: tm.updatedAt
    }));

    // Get historical assessment results for growth calculation
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const historicalResults = await this.prisma.assessmentResult.findMany({
      where: {
        studentId,
        completedAt: {
          gte: oneMonthAgo
        }
      },
      orderBy: {
        completedAt: 'asc'
      }
    });

    // Calculate growth based on historical results
    const growth = this.calculateGrowth(historicalResults);

    // Calculate analytics
    const baseAnalytics = calculateStudentMasteryAnalytics(
      student.id,
      student.name,
      masteryData
    );

    // Enhance with topic and subject names
    const enhancedAnalytics: StudentMasteryAnalytics = {
      ...baseAnalytics,
      growth,
      masteryBySubject: baseAnalytics.masteryBySubject.map(subject => ({
        ...subject,
        subjectName: topicMasteries.find(tm => tm.subjectId === subject.subjectId)?.subject.name || subject.subjectName
      })),
      masteryGaps: baseAnalytics.masteryGaps.map(gap => ({
        ...gap,
        topicName: topicMasteries.find(tm => tm.topicId === gap.topicId)?.topic.name || gap.topicName
      }))
    };

    return enhancedAnalytics;
  }

  /**
   * Get class mastery analytics
   */
  public async getClassAnalytics(
    classId: string,
    subjectId?: string
  ): Promise<ClassMasteryAnalytics> {
    // Get class information
    const classInfo = await this.prisma.class.findUnique({
      where: {
        id: classId
      },
      select: {
        id: true,
        name: true
      }
    });

    if (!classInfo) {
      throw new Error(`Class with ID ${classId} not found`);
    }

    // Get all students in the class
    const students = await this.prisma.user.findMany({
      where: {
        studentClasses: {
          some: {
            classId
          }
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    // Get topic masteries for each student
    const studentMasteries = await Promise.all(
      students.map(async (student) => {
        const topicMasteries = await this.prisma.topicMastery.findMany({
          where: {
            studentId: student.id,
            ...(subjectId ? { subjectId } : {})
          },
          include: {
            topic: {
              select: {
                id: true,
                name: true
              }
            },
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        // Convert to TopicMasteryData
        return {
          studentId: student.id,
          studentName: student.name,
          topicMasteries: topicMasteries.map(tm => ({
            id: tm.id,
            studentId: tm.studentId,
            topicId: tm.topicId,
            subjectId: tm.subjectId,
            [BloomsTaxonomyLevel.REMEMBER]: tm.rememberLevel,
            [BloomsTaxonomyLevel.UNDERSTAND]: tm.understandLevel,
            [BloomsTaxonomyLevel.APPLY]: tm.applyLevel,
            [BloomsTaxonomyLevel.ANALYZE]: tm.analyzeLevel,
            [BloomsTaxonomyLevel.EVALUATE]: tm.evaluateLevel,
            [BloomsTaxonomyLevel.CREATE]: tm.createLevel,
            overallMastery: tm.overallMastery,
            lastAssessmentDate: tm.lastAssessmentDate,
            createdAt: tm.createdAt,
            updatedAt: tm.updatedAt,
            topicName: tm.topic.name,
            subjectName: tm.subject.name
          }))
        };
      })
    );

    // Calculate analytics
    const baseAnalytics = calculateClassMasteryAnalytics(
      classInfo.id,
      classInfo.name,
      studentMasteries.map(sm => ({
        studentId: sm.studentId,
        topicMasteries: sm.topicMasteries
      }))
    );

    // Enhance with topic names
    const enhancedAnalytics: ClassMasteryAnalytics = {
      ...baseAnalytics,
      topicMastery: baseAnalytics.topicMastery.map(topic => {
        const topicInfo = studentMasteries
          .flatMap(sm => sm.topicMasteries)
          .find(tm => tm.topicId === topic.topicId);

        return {
          ...topic,
          topicName: topicInfo?.topicName || topic.topicName
        };
      }),
      masteryGaps: baseAnalytics.masteryGaps.map(gap => {
        const topicInfo = studentMasteries
          .flatMap(sm => sm.topicMasteries)
          .find(tm => tm.topicId === gap.topicId);

        return {
          ...gap,
          topicName: topicInfo?.topicName || gap.topicName
        };
      })
    };

    return enhancedAnalytics;
  }

  /**
   * Get partitioned leaderboard data
   */
  public async getPartitionedLeaderboard(
    options: {
      subjectId?: string;
      topicId?: string;
      classId?: string;
      limit?: number;
      bloomsLevel?: BloomsTaxonomyLevel;
    }
  ): Promise<{
    entries: {
      id: string;
      name: string;
      avatar?: string;
      overallMastery: number;
      bloomsLevels?: Partial<Record<BloomsTaxonomyLevel, number>>;
    }[];
    userPosition?: {
      userId: string;
      position: number;
      entry: {
        id: string;
        name: string;
        avatar?: string;
        overallMastery: number;
        bloomsLevels?: Partial<Record<BloomsTaxonomyLevel, number>>;
      };
    };
  }> {
    const { subjectId, topicId, classId, limit = 10, bloomsLevel } = options;

    // Build the query
    const query: any = {};

    if (topicId) {
      query.topicId = topicId;
    }

    if (subjectId) {
      query.subjectId = subjectId;
    }

    if (classId) {
      query.student = {
        studentClasses: {
          some: {
            classId
          }
        }
      };
    }

    // Get all topic masteries matching the criteria
    const topicMasteries = await this.prisma.topicMastery.findMany({
      where: query,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Group by student and calculate average mastery
    type StudentMasteryMap = {
      id: string;
      name: string;
      avatar?: string;
      masteries: TopicMasteryData[];
    };

    const studentMasteries = new Map<string, StudentMasteryMap>();

    for (const tm of topicMasteries) {
      const studentId = tm.studentId;
      const student = studentMasteries.get(studentId) || {
        id: studentId,
        name: tm.student.name,
        avatar: tm.student.avatar,
        masteries: [] as TopicMasteryData[]
      };

      const masteryData: TopicMasteryData = {
        id: tm.id,
        studentId: tm.studentId,
        topicId: tm.topicId,
        subjectId: tm.subjectId,
        [BloomsTaxonomyLevel.REMEMBER]: tm.rememberLevel,
        [BloomsTaxonomyLevel.UNDERSTAND]: tm.understandLevel,
        [BloomsTaxonomyLevel.APPLY]: tm.applyLevel,
        [BloomsTaxonomyLevel.ANALYZE]: tm.analyzeLevel,
        [BloomsTaxonomyLevel.EVALUATE]: tm.evaluateLevel,
        [BloomsTaxonomyLevel.CREATE]: tm.createLevel,
        overallMastery: tm.overallMastery,
        lastAssessmentDate: tm.lastAssessmentDate,
        createdAt: tm.createdAt,
        updatedAt: tm.updatedAt
      };

      student.masteries.push(masteryData);
      studentMasteries.set(studentId, student);
    }

    // Calculate average mastery for each student
    const leaderboardEntries = Array.from(studentMasteries.values()).map(student => {
      const masteries = student.masteries;
      const count = masteries.length;

      if (count === 0) {
        return {
          id: student.id,
          name: student.name,
          avatar: student.avatar,
          overallMastery: 0,
          bloomsLevels: {}
        };
      }

      // Calculate average for each Bloom's level
      const bloomsLevels: Partial<Record<BloomsTaxonomyLevel, number>> = {};

      for (const level of Object.values(BloomsTaxonomyLevel)) {
        const sum = masteries.reduce((total, tm) => total + tm[level], 0);
        bloomsLevels[level] = Math.round((sum / count) * 10) / 10;
      }

      // Calculate overall mastery based on specific Bloom's level or overall average
      let overallMastery: number;

      if (bloomsLevel) {
        overallMastery = bloomsLevels[bloomsLevel] || 0;
      } else {
        overallMastery = masteries.reduce((total, tm) => total + tm.overallMastery, 0) / count;
      }

      return {
        id: student.id,
        name: student.name,
        avatar: student.avatar,
        overallMastery: Math.round(overallMastery * 10) / 10,
        bloomsLevels
      };
    });

    // Sort by overall mastery
    const sortedEntries = leaderboardEntries.sort((a, b) => b.overallMastery - a.overallMastery);

    // Get top entries
    const topEntries = sortedEntries.slice(0, limit);

    // Return the leaderboard data
    return {
      entries: topEntries
    };
  }

  /**
   * Calculate growth based on historical assessment results
   */
  private calculateGrowth(
    historicalResults: any[]
  ): {
    overall: number;
    byBloomsLevel: Record<BloomsTaxonomyLevel, number>;
    period: 'week' | 'month' | 'term';
  } {
    // Default growth object
    const growth = {
      overall: 0,
      byBloomsLevel: {
        [BloomsTaxonomyLevel.REMEMBER]: 0,
        [BloomsTaxonomyLevel.UNDERSTAND]: 0,
        [BloomsTaxonomyLevel.APPLY]: 0,
        [BloomsTaxonomyLevel.ANALYZE]: 0,
        [BloomsTaxonomyLevel.EVALUATE]: 0,
        [BloomsTaxonomyLevel.CREATE]: 0
      },
      period: 'month' as const
    };

    // If no historical results, return default growth
    if (historicalResults.length < 2) {
      return growth;
    }

    // Get earliest and latest results
    const earliest = historicalResults[0];
    const latest = historicalResults[historicalResults.length - 1];

    // Calculate overall growth
    const earliestScore = earliest.percentage || 0;
    const latestScore = latest.percentage || 0;
    growth.overall = Math.round((latestScore - earliestScore) * 10) / 10;

    // Calculate growth by Bloom's level
    for (const level of Object.values(BloomsTaxonomyLevel)) {
      const earliestLevelScore = earliest.bloomsLevelScores?.[level]?.score || 0;
      const earliestLevelMaxScore = earliest.bloomsLevelScores?.[level]?.maxScore || 1;
      const latestLevelScore = latest.bloomsLevelScores?.[level]?.score || 0;
      const latestLevelMaxScore = latest.bloomsLevelScores?.[level]?.maxScore || 1;

      const earliestPercentage = (earliestLevelScore / earliestLevelMaxScore) * 100;
      const latestPercentage = (latestLevelScore / latestLevelMaxScore) * 100;

      growth.byBloomsLevel[level] = Math.round((latestPercentage - earliestPercentage) * 10) / 10;
    }

    return growth;
  }
}
