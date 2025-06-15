/**
 * Reward System Core Implementation
 *
 * This module provides the core functionality for the reward system, including:
 * - Point calculation and awarding
 * - Level progression
 * - Achievement tracking and unlocking
 */

import { PrismaClient, SystemStatus } from '@prisma/client';
import { logger } from '../../server/api/utils/logger';
import { RewardSystemPrismaClient } from './types';

// Types
export interface PointsAwardInput {
  studentId: string;
  amount: number;
  source: string;
  sourceId?: string;
  classId?: string;
  subjectId?: string;
  description?: string;
}

export interface AchievementProgressInput {
  achievementId: string;
  progress: number;
  unlocked?: boolean;
}

export interface LevelProgressionInput {
  studentId: string;
  expPoints: number;
  classId?: string;
}

export interface RewardSystemContext {
  prisma: PrismaClient;
}

/**
 * Reward System class that handles all reward-related operations
 */
export class RewardSystem {
  private prisma: RewardSystemPrismaClient;

  constructor({ prisma }: RewardSystemContext) {
    this.prisma = prisma as unknown as RewardSystemPrismaClient;
  }

  /**
   * Award points to a student and update their level
   */
  async awardPoints(data: PointsAwardInput): Promise<{
    pointsRecord: any;
    levelProgression?: {
      leveledUp: boolean;
      newLevel?: number;
      previousLevel?: number;
    }
  }> {
    try {
      const { studentId, amount, source, sourceId, classId, subjectId, description } = data;

      // Create points record
      const pointsRecord = await this.prisma.studentPoints.create({
        data: {
          studentId,
          amount,
          source,
          sourceId,
          classId,
          subjectId,
          description,
        },
      });

      // Update student's total points
      // Using raw query to update totalPoints since it's not in the TypeScript type
      await this.prisma.$executeRaw`
        UPDATE "student_profiles"
        SET "totalPoints" = "totalPoints" + ${amount}
        WHERE "id" = ${studentId}
      `;

      // Update points aggregates for leaderboards
      await this.updatePointsAggregates(studentId, amount, classId, subjectId);

      // Update student level based on points
      const levelProgression = await this.progressLevel({
        studentId,
        expPoints: amount,
        classId,
      });

      // Check for point-based achievements
      await this.checkPointBasedAchievements(studentId, amount, classId, subjectId);

      return {
        pointsRecord,
        levelProgression: levelProgression ? {
          leveledUp: levelProgression.leveledUp,
          newLevel: levelProgression.studentLevel.level,
          previousLevel: levelProgression.previousLevel
        } : undefined
      };
    } catch (error) {
      logger.error('Error awarding points', { error, data });
      throw error;
    }
  }

  /**
   * Update points aggregates for leaderboards
   */
  private async updatePointsAggregates(
    studentId: string,
    amount: number,
    classId?: string,
    subjectId?: string
  ): Promise<void> {
    try {
      const date = new Date();
      date.setHours(0, 0, 0, 0); // Start of day

      // Check if aggregate exists for today
      const existingAggregate = await this.prisma.studentPointsAggregate.findFirst({
        where: {
          studentId,
          classId: classId || null,
          subjectId: subjectId || null,
          date,
        },
      });

      if (existingAggregate) {
        // Update existing aggregate
        await this.prisma.studentPointsAggregate.update({
          where: { id: existingAggregate.id },
          data: {
            dailyPoints: { increment: amount },
            weeklyPoints: { increment: amount },
            monthlyPoints: { increment: amount },
            termPoints: { increment: amount },
            totalPoints: { increment: amount },
          },
        });
      } else {
        // Get current aggregates
        const weeklyPoints = await this.calculateWeeklyPoints(studentId, classId, subjectId);
        const monthlyPoints = await this.calculateMonthlyPoints(studentId, classId, subjectId);
        const totalPoints = await this.calculateTotalPoints(studentId, classId, subjectId);

        // Create new aggregate record
        await this.prisma.studentPointsAggregate.create({
          data: {
            studentId,
            classId,
            subjectId,
            date,
            dailyPoints: amount,
            weeklyPoints: weeklyPoints + amount,
            monthlyPoints: monthlyPoints + amount,
            termPoints: totalPoints + amount, // Simplified - in a real app, would calculate term points
            totalPoints: totalPoints + amount,
          },
        });
      }
    } catch (error) {
      logger.error('Error updating points aggregates', { error, studentId, amount, classId, subjectId });
      // Don't throw here to prevent breaking the main flow
    }
  }

  /**
   * Calculate weekly points for a student
   */
  private async calculateWeeklyPoints(
    studentId: string,
    classId?: string,
    subjectId?: string
  ): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const result = await this.prisma.studentPoints.aggregate({
      where: {
        studentId,
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        createdAt: { gte: oneWeekAgo },
        status: SystemStatus.ACTIVE,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  /**
   * Calculate monthly points for a student
   */
  private async calculateMonthlyPoints(
    studentId: string,
    classId?: string,
    subjectId?: string
  ): Promise<number> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const result = await this.prisma.studentPoints.aggregate({
      where: {
        studentId,
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        createdAt: { gte: oneMonthAgo },
        status: SystemStatus.ACTIVE,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  /**
   * Calculate total points for a student
   */
  private async calculateTotalPoints(
    studentId: string,
    classId?: string,
    subjectId?: string
  ): Promise<number> {
    const result = await this.prisma.studentPoints.aggregate({
      where: {
        studentId,
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        status: SystemStatus.ACTIVE,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  /**
   * Progress a student's level based on experience points
   */
  async progressLevel(data: LevelProgressionInput): Promise<{
    studentLevel: any;
    leveledUp: boolean;
    previousLevel?: number;
  } | null> {
    try {
      const { studentId, expPoints, classId } = data;

      // Get or create student level
      let studentLevel = await this.prisma.studentLevel.findFirst({
        where: {
          studentId,
          classId: classId || null,
          status: SystemStatus.ACTIVE,
        },
      });

      if (!studentLevel) {
        studentLevel = await this.prisma.studentLevel.create({
          data: {
            studentId,
            classId,
            level: 1,
            currentExp: 0,
            nextLevelExp: this.calculateExpForLevel(1),
          },
        });
      }

      const currentLevel = studentLevel.level;
      let currentExp = studentLevel.currentExp + expPoints;
      let nextLevelExp = studentLevel.nextLevelExp;
      let newLevel = currentLevel;
      let leveledUp = false;

      // Check if student has leveled up
      while (currentExp >= nextLevelExp) {
        newLevel++;
        currentExp -= nextLevelExp;
        nextLevelExp = this.calculateExpForLevel(newLevel);
        leveledUp = true;
      }

      // Update student level
      const updatedLevel = await this.prisma.studentLevel.update({
        where: { id: studentLevel.id },
        data: {
          level: newLevel,
          currentExp,
          nextLevelExp,
        },
      });

      // If leveled up, update student profile's current level
      if (leveledUp && !classId) {
        // Using raw query to update currentLevel since it's not in the TypeScript type
        await this.prisma.$executeRaw`
          UPDATE "student_profiles"
          SET "currentLevel" = ${newLevel}
          WHERE "id" = ${studentId}
        `;

        // Check for level-based achievements
        await this.checkLevelBasedAchievements(studentId, newLevel);
      }

      return {
        studentLevel: updatedLevel,
        leveledUp,
        previousLevel: leveledUp ? currentLevel : undefined,
      };
    } catch (error) {
      logger.error('Error progressing level', { error, data });
      return null;
    }
  }

  /**
   * Calculate the experience points needed for a given level
   */
  private calculateExpForLevel(level: number): number {
    // Exponential growth formula: 100 * (level ^ 1.5)
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  /**
   * Check and update achievement progress
   */
  async updateAchievementProgress(data: AchievementProgressInput): Promise<{
    achievement: any;
    newlyUnlocked: boolean;
  }> {
    try {
      const { achievementId, progress, unlocked } = data;

      const achievement = await this.prisma.studentAchievement.findUnique({
        where: { id: achievementId },
      });

      if (!achievement) {
        throw new Error(`Achievement with ID ${achievementId} not found`);
      }

      const wasUnlocked = achievement.unlocked;
      const isNowUnlocked = unlocked !== undefined ? unlocked : progress >= achievement.total;
      const unlockedNow = !wasUnlocked && isNowUnlocked;

      const updatedAchievement = await this.prisma.studentAchievement.update({
        where: { id: achievementId },
        data: {
          progress,
          unlocked: isNowUnlocked,
          ...(unlockedNow && { unlockedAt: new Date() }),
        },
      });

      // If newly unlocked, award bonus points
      if (unlockedNow) {
        await this.awardAchievementBonusPoints(updatedAchievement);
      }

      return {
        achievement: updatedAchievement,
        newlyUnlocked: unlockedNow
      };
    } catch (error) {
      logger.error('Error updating achievement progress', { error, data });
      throw error;
    }
  }

  /**
   * Award bonus points for unlocking an achievement
   */
  private async awardAchievementBonusPoints(achievement: any): Promise<void> {
    try {
      // Different achievement types can have different bonus point values
      let bonusPoints = 25; // Default bonus

      switch (achievement.type) {
        case 'class':
          bonusPoints = 50;
          break;
        case 'subject':
          bonusPoints = 40;
          break;
        case 'streak':
          bonusPoints = 30;
          break;
        case 'special':
          bonusPoints = 100;
          break;
      }

      // Award the bonus points
      await this.awardPoints({
        studentId: achievement.studentId,
        amount: bonusPoints,
        source: 'achievement',
        sourceId: achievement.id,
        classId: achievement.classId,
        subjectId: achievement.subjectId,
        description: `Bonus for unlocking achievement: ${achievement.title}`,
      });
    } catch (error) {
      logger.error('Error awarding achievement bonus points', { error, achievementId: achievement.id });
      // Don't throw here to prevent breaking the main flow
    }
  }

  /**
   * Check for point-based achievements
   */
  private async checkPointBasedAchievements(
    studentId: string,
    points: number,
    classId?: string,
    subjectId?: string
  ): Promise<void> {
    try {
      // Get total points for the student
      const totalPoints = await this.calculateTotalPoints(studentId, classId, subjectId);

      // Define point thresholds for achievements
      const pointThresholds = [100, 250, 500, 1000, 2500, 5000, 10000];

      // Check each threshold
      for (const threshold of pointThresholds) {
        // If total points just crossed a threshold
        if (totalPoints >= threshold && totalPoints - points < threshold) {
          // Check if achievement already exists
          const existingAchievement = await this.prisma.studentAchievement.findFirst({
            where: {
              studentId,
              type: 'points',
              title: `Earned ${threshold} Points`,
              ...(classId && { classId }),
              ...(subjectId && { subjectId }),
              status: SystemStatus.ACTIVE,
            },
          });

          if (!existingAchievement) {
            // Create the achievement
            const scope = classId
              ? 'in this class'
              : subjectId
                ? 'in this subject'
                : 'overall';

            await this.prisma.studentAchievement.create({
              data: {
                studentId,
                title: `Earned ${threshold} Points`,
                description: `Earned a total of ${threshold} points ${scope}`,
                type: 'points',
                classId,
                subjectId,
                progress: threshold,
                total: threshold,
                unlocked: true,
                unlockedAt: new Date(),
                icon: 'coins',
              },
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error checking point-based achievements', { error, studentId });
      // Don't throw here to prevent breaking the main flow
    }
  }

  /**
   * Check for level-based achievements
   */
  private async checkLevelBasedAchievements(
    studentId: string,
    level: number
  ): Promise<void> {
    try {
      // Define level thresholds for achievements
      const levelThresholds = [5, 10, 15, 20, 25, 30, 50, 100];

      // Check if the current level is a threshold
      if (levelThresholds.includes(level)) {
        // Check if achievement already exists
        const existingAchievement = await this.prisma.studentAchievement.findFirst({
          where: {
            studentId,
            type: 'level',
            title: `Reached Level ${level}`,
            status: SystemStatus.ACTIVE,
          },
        });

        if (!existingAchievement) {
          // Create the achievement
          await this.prisma.studentAchievement.create({
            data: {
              studentId,
              title: `Reached Level ${level}`,
              description: `Reached student level ${level}`,
              type: 'level',
              progress: level,
              total: level,
              unlocked: true,
              unlockedAt: new Date(),
              icon: 'trophy',
            },
          });
        }
      }
    } catch (error) {
      logger.error('Error checking level-based achievements', { error, studentId, level });
      // Don't throw here to prevent breaking the main flow
    }
  }

  /**
   * Get leaderboard data with reward system integration
   */
  async getLeaderboard(options: {
    type: 'class' | 'subject' | 'overall';
    referenceId?: string;
    timeframe: 'daily' | 'weekly' | 'monthly' | 'term' | 'all-time';
    limit?: number;
    offset?: number;
  }): Promise<{
    studentId: string;
    points: number;
    rank: number;
    studentName?: string;
    level?: number;
    achievements?: number;
  }[]> {
    try {
      const { type, referenceId, timeframe, limit = 10, offset = 0 } = options;

      // Determine which points field to use based on timeframe
      let pointsField = 'totalPoints';
      switch (timeframe) {
        case 'daily':
          pointsField = 'dailyPoints';
          break;
        case 'weekly':
          pointsField = 'weeklyPoints';
          break;
        case 'monthly':
          pointsField = 'monthlyPoints';
          break;
        case 'term':
          pointsField = 'termPoints';
          break;
        default:
          pointsField = 'totalPoints';
      }

      // Build where clause based on type
      let whereClause: any = {};
      if (type === 'class' && referenceId) {
        whereClause.classId = referenceId;
      } else if (type === 'subject' && referenceId) {
        whereClause.subjectId = referenceId;
      }

      // Get the latest date for each student's aggregate
      const latestAggregates = await this.prisma.studentPointsAggregate.groupBy({
        by: ['studentId'],
        where: whereClause,
        _max: {
          date: true,
        },
      });

      // Create a map of student IDs to their latest date
      const latestDateMap = new Map<string, Date>();
      latestAggregates.forEach((agg: any) => {
        latestDateMap.set(agg.studentId, agg._max.date);
      });

      // Extend where clause to include only the latest aggregates
      const studentIds = Array.from(latestDateMap.keys());
      const aggregatesWhere = studentIds.map(studentId => ({
        studentId,
        date: latestDateMap.get(studentId),
        ...whereClause,
      }));

      if (aggregatesWhere.length === 0) {
        return [];
      }

      // Get aggregates for the leaderboard
      const aggregates = await this.prisma.studentPointsAggregate.findMany({
        where: {
          OR: aggregatesWhere,
        },
        select: {
          studentId: true,
          [pointsField]: true,
          student: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
              currentLevel: true,
              studentAchievements: {
                where: {
                  unlocked: true,
                  status: SystemStatus.ACTIVE,
                },
                select: {
                  id: true,
                },
              },
            },
          },
        },
        orderBy: {
          [pointsField]: 'desc',
        },
        take: limit,
        skip: offset,
      });

      // Transform and add rank
      return aggregates.map((agg: any, index: number) => ({
        studentId: agg.studentId,
        points: agg[pointsField] as number,
        rank: offset + index + 1,
        studentName: agg.student?.user?.name || undefined,
        level: agg.student?.currentLevel,
        achievements: agg.student?.studentAchievements?.length || 0,
      }));
    } catch (error) {
      logger.error('Error getting leaderboard', { error, options });
      return [];
    }
  }

  /**
   * Create a snapshot of the current leaderboard
   */
  async createLeaderboardSnapshot(options: {
    type: string;
    referenceId: string;
    limit?: number;
  }): Promise<void> {
    try {
      const { type, referenceId, limit = 100 } = options;

      // Map type to the format expected by getLeaderboard
      let leaderboardType: 'class' | 'subject' | 'overall' = 'overall';
      if (type === 'CLASS') leaderboardType = 'class';
      if (type === 'SUBJECT') leaderboardType = 'subject';

      // Get current leaderboard
      const leaderboard = await this.getLeaderboard({
        type: leaderboardType,
        referenceId,
        timeframe: 'all-time',
        limit,
      });

      // Create snapshot
      await this.prisma.leaderboardSnapshot.create({
        data: {
          type,
          referenceId,
          entries: leaderboard,
          snapshotDate: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error creating leaderboard snapshot', { error, options });
      throw error;
    }
  }

  /**
   * Get historical leaderboard data
   */
  async getHistoricalLeaderboard(options: {
    type: string;
    referenceId: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    try {
      const { type, referenceId, startDate, endDate, limit = 10 } = options;

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
      const snapshots = await this.prisma.leaderboardSnapshot.findMany({
        where: whereClause,
        orderBy: {
          snapshotDate: 'desc',
        },
        take: limit,
      });

      return snapshots;
    } catch (error) {
      logger.error('Error getting historical leaderboard', { error, options });
      return [];
    }
  }
}
