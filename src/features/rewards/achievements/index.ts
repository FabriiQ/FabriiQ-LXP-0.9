/**
 * Achievement System Implementation
 *
 * This module provides the functionality for tracking and unlocking achievements
 * in the reward system. It implements achievement types, progress tracking, and
 * achievement unlocking logic.
 */

import { PrismaClient, SystemStatus } from '@prisma/client';
import { RewardSystem } from '..';
import { logger } from '../../../server/api/utils/logger';
import { RewardSystemPrismaClient } from '../types';
import { getRewardSystemPrisma } from '../utils';

export interface AchievementInfo {
  id: string;
  title: string;
  description: string;
  type: string;
  progress: number;
  total: number;
  unlocked: boolean;
  unlockedAt?: Date;
  icon?: string;
  classId?: string;
  className?: string;
  subjectId?: string;
  subjectName?: string;
  newlyUnlocked?: boolean;
}

export interface AchievementFilter {
  type?: string;
  classId?: string;
  subjectId?: string;
  unlocked?: boolean;
}

export class AchievementSystem {
  private prisma: RewardSystemPrismaClient;
  private rewardSystem: RewardSystem;

  constructor(prisma: PrismaClient) {
    this.prisma = getRewardSystemPrisma(prisma);
    this.rewardSystem = new RewardSystem({ prisma });
  }

  /**
   * Get all achievements for a student
   */
  async getStudentAchievements(
    studentId: string,
    filter?: AchievementFilter
  ): Promise<AchievementInfo[]> {
    try {
      const achievements = await this.prisma.studentAchievement.findMany({
        where: {
          studentId,
          ...(filter?.type && { type: filter.type }),
          ...(filter?.classId && { classId: filter.classId }),
          ...(filter?.subjectId && { subjectId: filter.subjectId }),
          ...(filter?.unlocked !== undefined && { unlocked: filter.unlocked }),
          status: SystemStatus.ACTIVE,
        },
        include: {
          class: {
            select: {
              name: true,
            },
          },
          subject: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { unlocked: 'desc' },
          { unlockedAt: 'desc' },
          { type: 'asc' },
          { title: 'asc' },
        ],
      });

      return achievements.map((achievement: any) => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        type: achievement.type,
        progress: achievement.progress,
        total: achievement.total,
        unlocked: achievement.unlocked,
        unlockedAt: achievement.unlockedAt || undefined,
        icon: achievement.icon || undefined,
        classId: achievement.classId || undefined,
        className: achievement.class?.name,
        subjectId: achievement.subjectId || undefined,
        subjectName: achievement.subject?.name,
        // Check if unlocked in the last 24 hours
        newlyUnlocked: achievement.unlocked && achievement.unlockedAt
          ? (new Date().getTime() - achievement.unlockedAt.getTime()) < 24 * 60 * 60 * 1000
          : false,
      }));
    } catch (error) {
      logger.error('Error getting student achievements', { error, studentId, filter });
      return [];
    }
  }

  /**
   * Get a specific achievement by ID
   */
  async getAchievementById(
    achievementId: string
  ): Promise<AchievementInfo | null> {
    try {
      const achievement = await this.prisma.studentAchievement.findUnique({
        where: { id: achievementId },
        include: {
          class: {
            select: {
              name: true,
            },
          },
          subject: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!achievement) {
        return null;
      }

      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        type: achievement.type,
        progress: achievement.progress,
        total: achievement.total,
        unlocked: achievement.unlocked,
        unlockedAt: achievement.unlockedAt || undefined,
        icon: achievement.icon || undefined,
        classId: achievement.classId || undefined,
        className: achievement.class?.name,
        subjectId: achievement.subjectId || undefined,
        subjectName: achievement.subject?.name,
        newlyUnlocked: achievement.unlocked && achievement.unlockedAt
          ? (new Date().getTime() - achievement.unlockedAt.getTime()) < 24 * 60 * 60 * 1000
          : false,
      };
    } catch (error) {
      logger.error('Error getting achievement by ID', { error, achievementId });
      return null;
    }
  }

  /**
   * Create a new achievement
   */
  async createAchievement(data: {
    studentId: string;
    title: string;
    description: string;
    type: string;
    classId?: string;
    subjectId?: string;
    progress: number;
    total: number;
    icon?: string;
  }): Promise<AchievementInfo | null> {
    try {
      const { studentId, title, description, type, classId, subjectId, progress, total, icon } = data;

      // Check if achievement already exists
      const existingAchievement = await this.prisma.studentAchievement.findFirst({
        where: {
          studentId,
          title,
          type,
          ...(classId && { classId }),
          ...(subjectId && { subjectId }),
          status: SystemStatus.ACTIVE,
        },
      });

      if (existingAchievement) {
        // Return existing achievement
        return this.getAchievementById(existingAchievement.id);
      }

      // Create new achievement
      const newAchievement = await this.prisma.studentAchievement.create({
        data: {
          studentId,
          title,
          description,
          type,
          ...(classId && { classId }),
          ...(subjectId && { subjectId }),
          progress,
          total,
          unlocked: progress >= total,
          unlockedAt: progress >= total ? new Date() : null,
          icon,
        },
      });

      // If achievement is unlocked on creation, award bonus points
      if (newAchievement.unlocked) {
        await this.awardAchievementBonusPoints(newAchievement);
      }

      return this.getAchievementById(newAchievement.id);
    } catch (error) {
      logger.error('Error creating achievement', { error, data });
      return null;
    }
  }

  /**
   * Update achievement progress
   */
  async updateAchievementProgress(data: {
    achievementId: string;
    progress: number;
    unlocked?: boolean;
  }): Promise<{ achievement: AchievementInfo | null; newlyUnlocked: boolean }> {
    try {
      const result = await this.rewardSystem.updateAchievementProgress(data);
      const achievement = await this.getAchievementById(data.achievementId);

      return {
        achievement,
        newlyUnlocked: result.newlyUnlocked,
      };
    } catch (error) {
      logger.error('Error updating achievement progress', { error, data });
      return { achievement: null, newlyUnlocked: false };
    }
  }

  /**
   * Check and update achievement progress
   */
  async checkAndUpdateProgress(
    achievementId: string,
    progressIncrement: number = 1
  ): Promise<{ achievement: AchievementInfo | null; newlyUnlocked: boolean }> {
    try {
      const achievement = await this.prisma.studentAchievement.findUnique({
        where: { id: achievementId },
      });

      if (!achievement) {
        throw new Error(`Achievement with ID ${achievementId} not found`);
      }

      const wasUnlocked = achievement.unlocked;
      const newProgress = Math.min(achievement.progress + progressIncrement, achievement.total);
      const isNowUnlocked = newProgress >= achievement.total;
      const newlyUnlocked = !wasUnlocked && isNowUnlocked;

      const updatedAchievement = await this.prisma.studentAchievement.update({
        where: { id: achievementId },
        data: {
          progress: newProgress,
          unlocked: isNowUnlocked,
          ...(newlyUnlocked && { unlockedAt: new Date() }),
        },
      });

      // If newly unlocked, award bonus points
      if (newlyUnlocked) {
        await this.awardAchievementBonusPoints(updatedAchievement);
      }

      const achievementInfo = await this.getAchievementById(achievementId);

      return {
        achievement: achievementInfo,
        newlyUnlocked,
      };
    } catch (error) {
      logger.error('Error checking and updating achievement progress', { error, achievementId, progressIncrement });
      return { achievement: null, newlyUnlocked: false };
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
        case 'class-completion':
          bonusPoints = 50;
          break;
        case 'subject':
        case 'subject-completion':
          bonusPoints = 40;
          break;
        case 'streak':
        case 'streak-milestone':
          bonusPoints = 30;
          break;
        case 'special':
          bonusPoints = 100;
          break;
        case 'perfect-score':
          bonusPoints = 50;
          break;
        case 'high-achiever':
          bonusPoints = 35;
          break;
        case 'level':
          bonusPoints = achievement.total * 2; // Level-based bonus
          break;
        case 'points':
          bonusPoints = Math.floor(achievement.total * 0.1); // 10% of point threshold
          break;
      }

      // Award the bonus points
      await this.rewardSystem.awardPoints({
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
   * Delete an achievement
   */
  async deleteAchievement(
    achievementId: string
  ): Promise<boolean> {
    try {
      await this.prisma.studentAchievement.update({
        where: { id: achievementId },
        data: { status: SystemStatus.DELETED },
      });
      return true;
    } catch (error) {
      logger.error('Error deleting achievement', { error, achievementId });
      return false;
    }
  }

  /**
   * Get achievement statistics for a student
   */
  async getAchievementStats(
    studentId: string
  ): Promise<{
    total: number;
    unlocked: number;
    byType: Record<string, { total: number; unlocked: number }>;
  }> {
    try {
      const achievements = await this.prisma.studentAchievement.findMany({
        where: {
          studentId,
          status: SystemStatus.ACTIVE,
        },
        select: {
          type: true,
          unlocked: true,
        },
      });

      const stats = {
        total: achievements.length,
        unlocked: achievements.filter((a: any) => a.unlocked).length,
        byType: {} as Record<string, { total: number; unlocked: number }>,
      };

      // Group by type
      achievements.forEach((achievement: any) => {
        if (!stats.byType[achievement.type]) {
          stats.byType[achievement.type] = { total: 0, unlocked: 0 };
        }
        stats.byType[achievement.type].total++;
        if (achievement.unlocked) {
          stats.byType[achievement.type].unlocked++;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Error getting achievement stats', { error, studentId });
      return { total: 0, unlocked: 0, byType: {} };
    }
  }

  /**
   * Get newly unlocked achievements for a student
   */
  async getNewlyUnlockedAchievements(
    studentId: string,
    hoursThreshold: number = 24
  ): Promise<AchievementInfo[]> {
    try {
      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

      const achievements = await this.prisma.studentAchievement.findMany({
        where: {
          studentId,
          unlocked: true,
          unlockedAt: {
            gte: thresholdDate,
          },
          status: SystemStatus.ACTIVE,
        },
        include: {
          class: {
            select: {
              name: true,
            },
          },
          subject: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          unlockedAt: 'desc',
        },
      });

      return achievements.map((achievement: any) => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        type: achievement.type,
        progress: achievement.progress,
        total: achievement.total,
        unlocked: achievement.unlocked,
        unlockedAt: achievement.unlockedAt || undefined,
        icon: achievement.icon || undefined,
        classId: achievement.classId || undefined,
        className: achievement.class?.name,
        subjectId: achievement.subjectId || undefined,
        subjectName: achievement.subject?.name,
        newlyUnlocked: true,
      }));
    } catch (error) {
      logger.error('Error getting newly unlocked achievements', { error, studentId, hoursThreshold });
      return [];
    }
  }

  /**
   * Create predefined achievements for a student
   */
  async createPredefinedAchievements(
    studentId: string,
    classId?: string,
    subjectId?: string
  ): Promise<void> {
    try {
      // Welcome achievement
      await this.createAchievement({
        studentId,
        title: 'Welcome',
        description: 'Started your learning journey',
        type: 'onboarding',
        progress: 1,
        total: 1,
        icon: 'hand-wave',
      });

      // First activity achievement
      await this.createAchievement({
        studentId,
        title: 'First Steps',
        description: 'Complete your first activity',
        type: 'activity',
        progress: 0,
        total: 1,
        icon: 'footprints',
      });

      // Activity streak achievement
      await this.createAchievement({
        studentId,
        title: 'Activity Streak',
        description: 'Complete activities for consecutive days',
        type: 'streak',
        progress: 0,
        total: 7,
        icon: 'calendar',
      });

      // Perfect score achievement
      await this.createAchievement({
        studentId,
        title: 'Perfect Score',
        description: 'Get a perfect score on any activity',
        type: 'perfect-score',
        progress: 0,
        total: 1,
        icon: 'star',
      });

      // Class-specific achievements
      if (classId) {
        const classEntity = await this.prisma.class.findUnique({
          where: { id: classId },
          select: {
            name: true,
            courseCampus: {
              select: {
                course: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (classEntity) {
          // Class completion achievement
          await this.createAchievement({
            studentId,
            title: 'Class Champion',
            description: `Complete all activities in ${classEntity.name}`,
            type: 'class-completion',
            classId,
            progress: 0,
            total: 100, // Will be updated dynamically
            icon: 'graduation-cap',
          });

          // Class participation achievement
          await this.createAchievement({
            studentId,
            title: 'Active Participant',
            description: `Participate in 10 activities in ${classEntity.name}`,
            type: 'class-participation',
            classId,
            progress: 0,
            total: 10,
            icon: 'users',
          });
        }
      }

      // Subject-specific achievements
      if (subjectId) {
        const subject = await this.prisma.subject.findUnique({
          where: { id: subjectId },
          select: { name: true },
        });

        if (subject) {
          // Subject mastery achievement
          await this.createAchievement({
            studentId,
            title: 'Subject Master',
            description: `Master all concepts in ${subject.name}`,
            type: 'subject-mastery',
            subjectId,
            progress: 0,
            total: 100, // Will be updated dynamically
            icon: 'book',
          });

          // Subject excellence achievement
          await this.createAchievement({
            studentId,
            title: 'Subject Excellence',
            description: `Achieve 90%+ in 5 activities in ${subject.name}`,
            type: 'subject-excellence',
            subjectId,
            progress: 0,
            total: 5,
            icon: 'award',
          });
        }
      }
    } catch (error) {
      logger.error('Error creating predefined achievements', { error, studentId, classId, subjectId });
      // Don't throw here to prevent breaking the main flow
    }
  }
}
