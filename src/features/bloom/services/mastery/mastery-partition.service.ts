/**
 * Mastery Partition Service
 *
 * This service provides partitioned topic mastery data following the same pattern as the leaderboard.
 */

import { PrismaClient } from '@prisma/client';
import {
  BloomsTaxonomyLevel,
  MasteryLevel,
  TopicMasteryData
} from '../../types';
import { getMasteryLevel } from '../../utils/mastery-helpers';

/**
 * Partition type for topic mastery
 */
export type MasteryPartitionType =
  | 'global'
  | 'subject'
  | 'topic'
  | 'class'
  | 'bloomsLevel';

/**
 * Partition options for topic mastery
 */
export interface MasteryPartitionOptions {
  partitionType: MasteryPartitionType;
  subjectId?: string;
  topicId?: string;
  classId?: string;
  bloomsLevel?: BloomsTaxonomyLevel;
  limit?: number;
  userId?: string;
}

/**
 * Mastery entry for leaderboard
 */
export interface MasteryEntry {
  id: string;
  name: string;
  avatar?: string;
  overallMastery: number;
  masteryLevel: MasteryLevel;
  bloomsLevels?: Partial<Record<BloomsTaxonomyLevel, number>>;
}

/**
 * Partitioned mastery data
 */
export interface PartitionedMasteryData {
  entries: MasteryEntry[];
  userPosition?: {
    userId: string;
    position: number;
    entry: MasteryEntry;
  };
  partitionType: MasteryPartitionType;
  partitionId?: string;
  partitionName?: string;
  totalCount: number;
}

/**
 * Service for partitioning topic mastery data
 */
export class MasteryPartitionService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get partitioned mastery data
   */
  public async getPartitionedMasteryData(
    options: MasteryPartitionOptions
  ): Promise<PartitionedMasteryData> {
    const {
      partitionType,
      subjectId,
      topicId,
      classId,
      bloomsLevel,
      limit = 10,
      userId
    } = options;

    // Build the query based on partition type
    const query: any = {};
    let partitionId: string | undefined;
    let partitionName: string | undefined;

    switch (partitionType) {
      case 'subject':
        if (!subjectId) {
          throw new Error('Subject ID is required for subject partition');
        }
        query.subjectId = subjectId;
        partitionId = subjectId;

        // Get subject name
        const subject = await this.prisma.subject.findUnique({
          where: { id: subjectId },
          select: { name: true }
        });
        partitionName = subject?.name;
        break;

      case 'topic':
        if (!topicId) {
          throw new Error('Topic ID is required for topic partition');
        }
        query.topicId = topicId;
        partitionId = topicId;

        // Get topic name
        const topic = await this.prisma.subjectTopic.findUnique({
          where: { id: topicId },
          select: { name: true }
        });
        partitionName = topic?.name;
        break;

      case 'class':
        if (!classId) {
          throw new Error('Class ID is required for class partition');
        }
        query.student = {
          studentClasses: {
            some: {
              classId
            }
          }
        };
        partitionId = classId;

        // Get class name
        const classInfo = await this.prisma.class.findUnique({
          where: { id: classId },
          select: { name: true }
        });
        partitionName = classInfo?.name;
        break;

      case 'bloomsLevel':
        if (!bloomsLevel) {
          throw new Error('Bloom\'s level is required for bloomsLevel partition');
        }
        // No specific query filter, we'll sort by the specified Bloom's level
        partitionId = bloomsLevel;
        partitionName = `${bloomsLevel} Level`;
        break;

      case 'global':
      default:
        // No specific filters for global partition
        break;
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
        },
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
    const masteryEntries: MasteryEntry[] = Array.from(studentMasteries.values()).map(student => {
      const masteries = student.masteries;
      const count = masteries.length;

      if (count === 0) {
        return {
          id: student.id,
          name: student.name,
          avatar: student.avatar,
          overallMastery: 0,
          masteryLevel: MasteryLevel.NOVICE,
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

      if (bloomsLevel && partitionType === 'bloomsLevel') {
        overallMastery = bloomsLevels[bloomsLevel] || 0;
      } else {
        overallMastery = masteries.reduce((total, tm) => total + tm.overallMastery, 0) / count;
      }

      // Round to 1 decimal place
      overallMastery = Math.round(overallMastery * 10) / 10;

      // Get mastery level
      const masteryLevel = getMasteryLevel(overallMastery);

      return {
        id: student.id,
        name: student.name,
        avatar: student.avatar,
        overallMastery,
        masteryLevel,
        bloomsLevels
      };
    });

    // Sort entries by overall mastery (descending)
    const sortedEntries = [...masteryEntries].sort((a, b) => b.overallMastery - a.overallMastery);

    // Get total count
    const totalCount = sortedEntries.length;

    // Get top entries
    const topEntries = sortedEntries.slice(0, limit);

    // Find user position if userId is provided
    let userPosition: PartitionedMasteryData['userPosition'] = undefined;

    if (userId) {
      const userIndex = sortedEntries.findIndex(entry => entry.id === userId);

      if (userIndex !== -1) {
        userPosition = {
          userId,
          position: userIndex + 1,
          entry: sortedEntries[userIndex]
        };
      }
    }

    return {
      entries: topEntries,
      userPosition,
      partitionType,
      partitionId,
      partitionName,
      totalCount
    };
  }

  /**
   * Get mastery data for multiple partitions
   */
  public async getMultiPartitionMasteryData(
    partitions: MasteryPartitionOptions[]
  ): Promise<Record<string, PartitionedMasteryData>> {
    const result: Record<string, PartitionedMasteryData> = {};

    // Process each partition in parallel
    await Promise.all(
      partitions.map(async (partition) => {
        const key = this.getPartitionKey(partition);
        result[key] = await this.getPartitionedMasteryData(partition);
      })
    );

    return result;
  }

  /**
   * Get a unique key for a partition
   */
  private getPartitionKey(options: MasteryPartitionOptions): string {
    const { partitionType, subjectId, topicId, classId, bloomsLevel } = options;

    switch (partitionType) {
      case 'subject':
        return `subject_${subjectId}`;
      case 'topic':
        return `topic_${topicId}`;
      case 'class':
        return `class_${classId}`;
      case 'bloomsLevel':
        return `bloomsLevel_${bloomsLevel}`;
      case 'global':
      default:
        return 'global';
    }
  }
}
