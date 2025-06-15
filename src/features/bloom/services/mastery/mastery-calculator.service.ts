/**
 * Mastery Calculator Service
 *
 * This service calculates and updates topic mastery based on assessment results.
 */

import { PrismaClient } from '@prisma/client';
import {
  TopicMasteryData,
  AssessmentResultData,
  BloomsTaxonomyLevel,
  MasteryLevel
} from '../../types';
import {
  DEFAULT_MASTERY_DECAY_CONFIG,
  BLOOMS_LEVEL_MASTERY_WEIGHTS
} from '../../constants/mastery-thresholds';
import {
  initializeMasteryFromResult,
  applyMasteryDecay,
  updateMasteryLevels,
  calculateOverallMastery,
  getMasteryLevel
} from '../../utils/mastery-helpers';

export class MasteryCalculatorService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Update topic mastery based on a new assessment result
   */
  public async updateTopicMastery(
    studentId: string,
    assessmentResult: AssessmentResultData
  ): Promise<TopicMasteryData> {
    // Get topic ID from assessment result
    const topicId = assessmentResult.topicId;
    if (!topicId) {
      throw new Error('Assessment result must have a topic ID');
    }

    // Get current topic mastery
    let topicMastery = await this.prisma.topicMastery.findUnique({
      where: {
        studentId_topicId: {
          studentId,
          topicId
        }
      }
    });

    // Calculate new mastery
    let newMastery: TopicMasteryData;

    if (topicMastery) {
      // Convert from database model to TopicMasteryData
      const currentMastery: TopicMasteryData = {
        id: topicMastery.id,
        studentId: topicMastery.studentId,
        topicId: topicMastery.topicId,
        subjectId: topicMastery.subjectId,
        [BloomsTaxonomyLevel.REMEMBER]: topicMastery.rememberLevel,
        [BloomsTaxonomyLevel.UNDERSTAND]: topicMastery.understandLevel,
        [BloomsTaxonomyLevel.APPLY]: topicMastery.applyLevel,
        [BloomsTaxonomyLevel.ANALYZE]: topicMastery.analyzeLevel,
        [BloomsTaxonomyLevel.EVALUATE]: topicMastery.evaluateLevel,
        [BloomsTaxonomyLevel.CREATE]: topicMastery.createLevel,
        overallMastery: topicMastery.overallMastery,
        lastAssessmentDate: topicMastery.lastAssessmentDate,
        createdAt: topicMastery.createdAt,
        updatedAt: topicMastery.updatedAt
      };

      // Apply decay to current mastery
      const decayedMastery = applyMasteryDecay(currentMastery, DEFAULT_MASTERY_DECAY_CONFIG);

      // Update mastery with new result
      newMastery = updateMasteryLevels(decayedMastery, assessmentResult);
    } else {
      // Initialize new mastery from result
      newMastery = initializeMasteryFromResult(assessmentResult);
    }

    // Save to database
    const updatedTopicMastery = await this.prisma.topicMastery.upsert({
      where: {
        studentId_topicId: {
          studentId,
          topicId
        }
      },
      update: {
        rememberLevel: newMastery[BloomsTaxonomyLevel.REMEMBER],
        understandLevel: newMastery[BloomsTaxonomyLevel.UNDERSTAND],
        applyLevel: newMastery[BloomsTaxonomyLevel.APPLY],
        analyzeLevel: newMastery[BloomsTaxonomyLevel.ANALYZE],
        evaluateLevel: newMastery[BloomsTaxonomyLevel.EVALUATE],
        createLevel: newMastery[BloomsTaxonomyLevel.CREATE],
        overallMastery: newMastery.overallMastery,
        lastAssessmentDate: assessmentResult.completedAt,
        updatedAt: new Date(),
        assessmentResults: {
          connect: {
            id: assessmentResult.id
          }
        }
      },
      create: {
        studentId,
        topicId,
        subjectId: assessmentResult.subjectId,
        rememberLevel: newMastery[BloomsTaxonomyLevel.REMEMBER],
        understandLevel: newMastery[BloomsTaxonomyLevel.UNDERSTAND],
        applyLevel: newMastery[BloomsTaxonomyLevel.APPLY],
        analyzeLevel: newMastery[BloomsTaxonomyLevel.ANALYZE],
        evaluateLevel: newMastery[BloomsTaxonomyLevel.EVALUATE],
        createLevel: newMastery[BloomsTaxonomyLevel.CREATE],
        overallMastery: newMastery.overallMastery,
        lastAssessmentDate: assessmentResult.completedAt,
        assessmentResults: {
          connect: {
            id: assessmentResult.id
          }
        }
      }
    });

    // Convert back to TopicMasteryData
    return {
      id: updatedTopicMastery.id,
      studentId: updatedTopicMastery.studentId,
      topicId: updatedTopicMastery.topicId,
      subjectId: updatedTopicMastery.subjectId,
      [BloomsTaxonomyLevel.REMEMBER]: updatedTopicMastery.rememberLevel,
      [BloomsTaxonomyLevel.UNDERSTAND]: updatedTopicMastery.understandLevel,
      [BloomsTaxonomyLevel.APPLY]: updatedTopicMastery.applyLevel,
      [BloomsTaxonomyLevel.ANALYZE]: updatedTopicMastery.analyzeLevel,
      [BloomsTaxonomyLevel.EVALUATE]: updatedTopicMastery.evaluateLevel,
      [BloomsTaxonomyLevel.CREATE]: updatedTopicMastery.createLevel,
      overallMastery: updatedTopicMastery.overallMastery,
      lastAssessmentDate: updatedTopicMastery.lastAssessmentDate,
      createdAt: updatedTopicMastery.createdAt,
      updatedAt: updatedTopicMastery.updatedAt
    };
  }

  /**
   * Get topic mastery for a student
   */
  public async getTopicMastery(
    studentId: string,
    topicId: string
  ): Promise<TopicMasteryData | null> {
    const topicMastery = await this.prisma.topicMastery.findUnique({
      where: {
        studentId_topicId: {
          studentId,
          topicId
        }
      }
    });

    if (!topicMastery) {
      return null;
    }

    // Convert to TopicMasteryData
    return {
      id: topicMastery.id,
      studentId: topicMastery.studentId,
      topicId: topicMastery.topicId,
      subjectId: topicMastery.subjectId,
      [BloomsTaxonomyLevel.REMEMBER]: topicMastery.rememberLevel,
      [BloomsTaxonomyLevel.UNDERSTAND]: topicMastery.understandLevel,
      [BloomsTaxonomyLevel.APPLY]: topicMastery.applyLevel,
      [BloomsTaxonomyLevel.ANALYZE]: topicMastery.analyzeLevel,
      [BloomsTaxonomyLevel.EVALUATE]: topicMastery.evaluateLevel,
      [BloomsTaxonomyLevel.CREATE]: topicMastery.createLevel,
      overallMastery: topicMastery.overallMastery,
      lastAssessmentDate: topicMastery.lastAssessmentDate,
      createdAt: topicMastery.createdAt,
      updatedAt: topicMastery.updatedAt
    };
  }

  /**
   * Get all topic masteries for a student
   */
  public async getStudentTopicMasteries(
    studentId: string,
    subjectId?: string
  ): Promise<TopicMasteryData[]> {
    const topicMasteries = await this.prisma.topicMastery.findMany({
      where: {
        studentId,
        ...(subjectId ? { subjectId } : {})
      },
      orderBy: {
        overallMastery: 'desc'
      }
    });

    // Convert to TopicMasteryData
    return topicMasteries.map(tm => ({
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
  }

  /**
   * Get topic masteries for a class
   */
  public async getClassTopicMasteries(
    classId: string,
    topicId?: string
  ): Promise<{ studentId: string; topicMasteries: TopicMasteryData[] }[]> {
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
        id: true
      }
    });

    // Get topic masteries for each student
    const studentMasteries = await Promise.all(
      students.map(async (student) => {
        const topicMasteries = await this.prisma.topicMastery.findMany({
          where: {
            studentId: student.id,
            ...(topicId ? { topicId } : {})
          },
          orderBy: {
            overallMastery: 'desc'
          }
        });

        // Convert to TopicMasteryData
        return {
          studentId: student.id,
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
            updatedAt: tm.updatedAt
          }))
        };
      })
    );

    return studentMasteries;
  }

  /**
   * Get leaderboard data for a topic
   */
  public async getTopicLeaderboard(
    topicId: string,
    limit: number = 10
  ): Promise<{ id: string; name: string; overallMastery: number; bloomsLevels: Partial<Record<BloomsTaxonomyLevel, number>> }[]> {
    // Get top students for the topic
    const topicMasteries = await this.prisma.topicMastery.findMany({
      where: {
        topicId
      },
      orderBy: {
        overallMastery: 'desc'
      },
      take: limit,
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Format for leaderboard
    return topicMasteries.map(tm => ({
      id: tm.studentId,
      name: tm.student.name,
      overallMastery: tm.overallMastery,
      bloomsLevels: {
        [BloomsTaxonomyLevel.REMEMBER]: tm.rememberLevel,
        [BloomsTaxonomyLevel.UNDERSTAND]: tm.understandLevel,
        [BloomsTaxonomyLevel.APPLY]: tm.applyLevel,
        [BloomsTaxonomyLevel.ANALYZE]: tm.analyzeLevel,
        [BloomsTaxonomyLevel.EVALUATE]: tm.evaluateLevel,
        [BloomsTaxonomyLevel.CREATE]: tm.createLevel
      }
    }));
  }

  /**
   * Get leaderboard data for a subject
   */
  public async getSubjectLeaderboard(
    subjectId: string,
    limit: number = 10
  ): Promise<{ id: string; name: string; overallMastery: number; bloomsLevels: Partial<Record<BloomsTaxonomyLevel, number>> }[]> {
    // Get all topic masteries for the subject
    const topicMasteries = await this.prisma.topicMastery.findMany({
      where: {
        subjectId
      },
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Group by student and calculate average mastery
    type StudentMasteryMap = {
      id: string;
      name: string;
      masteries: TopicMasteryData[];
    };

    const studentMasteries = new Map<string, StudentMasteryMap>();

    for (const tm of topicMasteries) {
      const studentId = tm.studentId;
      const student = studentMasteries.get(studentId) || {
        id: studentId,
        name: tm.student.name,
        masteries: [] as TopicMasteryData[]
      };

      // Add the mastery data to the student's masteries array
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
    const leaderboard = Array.from(studentMasteries.values()).map(student => {
      const masteries = student.masteries;
      const count = masteries.length;

      if (count === 0) {
        return {
          id: student.id,
          name: student.name,
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

      // Calculate overall mastery
      const overallMastery = masteries.reduce((total, tm) => total + tm.overallMastery, 0) / count;

      return {
        id: student.id,
        name: student.name,
        overallMastery: Math.round(overallMastery * 10) / 10,
        bloomsLevels
      };
    });

    // Sort by overall mastery and limit
    return leaderboard
      .sort((a, b) => b.overallMastery - a.overallMastery)
      .slice(0, limit);
  }
}
