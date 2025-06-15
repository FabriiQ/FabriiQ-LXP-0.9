/**
 * Point System Implementation
 *
 * This module provides the functionality for awarding, tracking, and calculating points
 * in the reward system. It implements the point awarding logic based on activity grades,
 * non-graded activities, and other sources.
 */

import { PrismaClient, SystemStatus, ActivityGrade, SubmissionStatus } from '@prisma/client';
import { RewardSystem } from '..';
import { logger } from '../../../server/api/utils/logger';
import { RewardSystemPrismaClient } from '../types';
import { getRewardSystemPrisma } from '../utils';

export interface PointCalculationOptions {
  activityType?: string;
  gradePercentage?: number;
  isGraded?: boolean;
  complexity?: 'low' | 'medium' | 'high';
  streakDays?: number;
}

export class PointSystem {
  private prisma: RewardSystemPrismaClient;
  private rewardSystem: RewardSystem;

  constructor(prisma: PrismaClient) {
    this.prisma = getRewardSystemPrisma(prisma);
    this.rewardSystem = new RewardSystem({ prisma });
  }

  /**
   * Award points based on activity completion
   */
  async awardPointsForActivity(
    studentId: string,
    activityId: string,
    options: PointCalculationOptions = {}
  ): Promise<{ points: number; levelUp: boolean; newLevel?: number }> {
    try {
      // Get activity details
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: {
          id: true,
          title: true,
          classId: true,
          subjectId: true,
          content: true,
          learningType: true,
          isGradable: true,
          maxScore: true,
        },
      });

      // Use learningType as the primary source of activity type
      // Fall back to content.activityType if learningType is not available
      let activityType: string | undefined;
      if (activity?.learningType) {
        // Convert enum value to string and make it lowercase for consistency
        activityType = activity.learningType.toString().toLowerCase().replace(/_/g, '-');
      } else {
        // Fall back to content.activityType if available
        const activityContent = activity?.content as any;
        activityType = activityContent?.activityType;
      }

      if (!activity) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }

      // Calculate points based on activity type and grade
      const points = this.calculatePoints({
        activityType: activityType || options.activityType,
        gradePercentage: options.gradePercentage,
        isGraded: activity.isGradable || options.isGraded,
        complexity: options.complexity,
      });

      // Award the points
      const result = await this.rewardSystem.awardPoints({
        studentId,
        amount: points,
        source: 'activity',
        sourceId: activityId,
        classId: activity.classId,
        subjectId: activity.subjectId,
        description: `Completed activity: ${activity.title}`,
      });

      // Check for activity completion achievements
      await this.checkActivityCompletionAchievements(studentId, activity.classId, activity.subjectId);

      return {
        points,
        levelUp: result.levelProgression?.leveledUp || false,
        newLevel: result.levelProgression?.newLevel,
      };
    } catch (error) {
      logger.error('Error awarding points for activity', { error, studentId, activityId });
      throw error;
    }
  }

  /**
   * Award points based on grade submission
   */
  async awardPointsForGrade(
    activityGrade: {
      id: string;
      studentId: string;
      activityId: string;
      score: number | null;
      status: any;
      [key: string]: any;
    }
  ): Promise<{ points: number; levelUp: boolean; newLevel?: number }> {
    try {
      const { studentId, activityId, score } = activityGrade;

      // Get activity details to get maxScore
      const activityDetails = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: { maxScore: true }
      });

      const maxScore = activityDetails?.maxScore || 100;

      // Get activity details
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: {
          id: true,
          title: true,
          classId: true,
          subjectId: true,
          content: true,
          learningType: true,
        },
      });

      // Use learningType as the primary source of activity type
      let activityType: string | undefined;
      if (activity?.learningType) {
        // Convert enum value to string and make it lowercase for consistency
        activityType = activity.learningType.toString().toLowerCase().replace(/_/g, '-');
      } else {
        // Fall back to content.activityType if available
        const activityContent = activity?.content as any;
        activityType = activityContent?.activityType;
      }

      if (!activity) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }

      // Calculate grade percentage
      const gradePercentage = score !== null && maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

      // Calculate points (1:1 mapping with grade percentage)
      const points = gradePercentage;

      // Award the points
      const result = await this.rewardSystem.awardPoints({
        studentId,
        amount: points,
        source: 'grade',
        sourceId: activityId,
        classId: activity.classId,
        subjectId: activity.subjectId,
        description: `Grade for activity: ${activity.title}`,
      });

      // Check for grade-based achievements
      await this.checkGradeBasedAchievements(studentId, gradePercentage, activity.classId, activity.subjectId);

      return {
        points,
        levelUp: result.levelProgression?.leveledUp || false,
        newLevel: result.levelProgression?.newLevel,
      };
    } catch (error) {
      logger.error('Error awarding points for grade', { error, activityGrade });
      throw error;
    }
  }

  /**
   * Award points for daily login
   */
  async awardPointsForLogin(
    studentId: string
  ): Promise<{ points: number; streakDays: number; levelUp: boolean; newLevel?: number }> {
    try {
      // Get the last login record
      const lastLogin = await this.prisma.user.findUnique({
        where: { id: studentId },
        select: { lastLoginAt: true },
      });

      // Calculate streak days
      let streakDays = 1;
      if (lastLogin?.lastLoginAt) {
        const lastLoginDate = new Date(lastLogin.lastLoginAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Check if last login was yesterday
        if (
          lastLoginDate.getDate() === yesterday.getDate() &&
          lastLoginDate.getMonth() === yesterday.getMonth() &&
          lastLoginDate.getFullYear() === yesterday.getFullYear()
        ) {
          // Get current streak from achievements
          const streakAchievement = await this.prisma.studentAchievement.findFirst({
            where: {
              studentId,
              type: 'streak',
              status: SystemStatus.ACTIVE,
            },
            orderBy: { progress: 'desc' },
          });

          streakDays = streakAchievement ? streakAchievement.progress + 1 : 1;
        }
      }

      // Calculate login points (base 5 points + streak bonus)
      const basePoints = 5;
      const streakBonus = Math.min(streakDays * 5, 25); // Cap at 25 bonus points
      const totalPoints = basePoints + streakBonus;

      // Award the points
      const result = await this.rewardSystem.awardPoints({
        studentId,
        amount: totalPoints,
        source: 'login',
        description: `Daily login (${streakDays} day streak)`,
      });

      // Update or create streak achievement
      await this.updateStreakAchievement(studentId, streakDays);

      return {
        points: totalPoints,
        streakDays,
        levelUp: result.levelProgression?.leveledUp || false,
        newLevel: result.levelProgression?.newLevel,
      };
    } catch (error) {
      logger.error('Error awarding points for login', { error, studentId });
      throw error;
    }
  }

  /**
   * Award bonus points
   */
  async awardBonusPoints(
    studentId: string,
    amount: number,
    reason: string,
    classId?: string,
    subjectId?: string
  ): Promise<{ points: number; levelUp: boolean; newLevel?: number }> {
    try {
      // Award the points
      const result = await this.rewardSystem.awardPoints({
        studentId,
        amount,
        source: 'bonus',
        classId,
        subjectId,
        description: reason,
      });

      return {
        points: amount,
        levelUp: result.levelProgression?.leveledUp || false,
        newLevel: result.levelProgression?.newLevel,
      };
    } catch (error) {
      logger.error('Error awarding bonus points', { error, studentId, amount, reason });
      throw error;
    }
  }

  /**
   * Calculate points based on activity type and grade
   */
  private calculatePoints(options: PointCalculationOptions): number {
    const { activityType, gradePercentage, isGraded = true, complexity = 'medium' } = options;

    // For graded activities, points are 1:1 with grade percentage
    if (isGraded && gradePercentage !== undefined) {
      return gradePercentage;
    }

    // For non-graded activities, points depend on complexity
    if (!isGraded) {
      switch (complexity) {
        case 'low':
          return 10;
        case 'medium':
          return 25;
        case 'high':
          return 50;
        default:
          return 25;
      }
    }

    // If no activityType is provided, return default points
    if (!activityType) {
      return 20;
    }

    // Default points based on activity type (using kebab-case format)
    // These are mapped from LearningActivityType enum values
    switch (activityType) {
      // Assessment types
      case 'quiz':
      case 'multiple-choice':
        return 20;
      case 'multiple-response':
        return 25;
      case 'fill-in-the-blanks':
        return 30;
      case 'matching':
      case 'sequence':
        return 35;
      case 'drag-and-drop':
      case 'drag-the-words':
        return 40;
      case 'numeric':
        return 30;
      case 'true-false':
        return 15;

      // Content types
      case 'reading':
        return 10;
      case 'video':
        return 15;
      case 'h5p':
        return 25;
      case 'flash-cards':
        return 20;

      // Legacy types
      case 'assignment':
        return 30;
      case 'project':
        return 50;
      case 'discussion':
        return 15;

      // Default
      default:
        return 20;
    }
  }

  /**
   * Update streak achievement
   */
  private async updateStreakAchievement(studentId: string, streakDays: number): Promise<void> {
    try {
      // Check if streak achievement exists
      let streakAchievement = await this.prisma.studentAchievement.findFirst({
        where: {
          studentId,
          type: 'streak',
          status: SystemStatus.ACTIVE,
        },
      });

      if (streakAchievement) {
        // Update existing achievement
        await this.rewardSystem.updateAchievementProgress({
          achievementId: streakAchievement.id,
          progress: streakDays,
          unlocked: streakDays >= streakAchievement.total,
        });
      } else {
        // Create new streak achievement
        await this.prisma.studentAchievement.create({
          data: {
            studentId,
            title: 'Login Streak',
            description: 'Log in for consecutive days',
            type: 'streak',
            progress: streakDays,
            total: 7, // 7-day streak achievement
            unlocked: streakDays >= 7,
            unlockedAt: streakDays >= 7 ? new Date() : null,
            icon: 'calendar',
          },
        });
      }

      // Check for streak milestone achievements
      const streakMilestones = [7, 14, 30, 60, 90, 180, 365];
      for (const milestone of streakMilestones) {
        if (streakDays >= milestone) {
          // Check if milestone achievement exists
          const existingMilestone = await this.prisma.studentAchievement.findFirst({
            where: {
              studentId,
              type: 'streak-milestone',
              title: `${milestone}-Day Streak`,
              status: SystemStatus.ACTIVE,
            },
          });

          if (!existingMilestone) {
            // Create milestone achievement
            await this.prisma.studentAchievement.create({
              data: {
                studentId,
                title: `${milestone}-Day Streak`,
                description: `Logged in for ${milestone} consecutive days`,
                type: 'streak-milestone',
                progress: milestone,
                total: milestone,
                unlocked: true,
                unlockedAt: new Date(),
                icon: 'award',
              },
            });

            // Award bonus points for milestone
            await this.rewardSystem.awardPoints({
              studentId,
              amount: milestone,
              source: 'streak-milestone',
              description: `Bonus for ${milestone}-day login streak`,
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error updating streak achievement', { error, studentId, streakDays });
      // Don't throw here to prevent breaking the main flow
    }
  }

  /**
   * Check for activity completion achievements
   */
  private async checkActivityCompletionAchievements(
    studentId: string,
    classId?: string,
    subjectId?: string
  ): Promise<void> {
    try {
      if (classId) {
        // Get total activities in class
        const totalActivities = await this.prisma.activity.count({
          where: {
            classId,
            status: SystemStatus.ACTIVE,
          },
        });

        // Get completed activities
        const completedActivities = await this.prisma.activityGrade.count({
          where: {
            studentId,
            activity: {
              classId,
              status: SystemStatus.ACTIVE,
            },
            status: SubmissionStatus.SUBMITTED, // Using correct SubmissionStatus enum value
          },
        });

        // Check if all activities are completed
        if (completedActivities >= totalActivities && totalActivities > 0) {
          // Check if achievement exists
          const existingAchievement = await this.prisma.studentAchievement.findFirst({
            where: {
              studentId,
              type: 'class-completion',
              classId,
              status: SystemStatus.ACTIVE,
            },
          });

          if (!existingAchievement) {
            // Get class name
            const classEntity = await this.prisma.class.findUnique({
              where: { id: classId },
              select: { name: true },
            });

            // Create achievement
            await this.prisma.studentAchievement.create({
              data: {
                studentId,
                title: 'Class Champion',
                description: `Completed all activities in ${classEntity?.name || 'class'}`,
                type: 'class-completion',
                classId,
                progress: completedActivities,
                total: totalActivities,
                unlocked: true,
                unlockedAt: new Date(),
                icon: 'graduation-cap',
              },
            });

            // Award bonus points
            await this.rewardSystem.awardPoints({
              studentId,
              amount: 100,
              source: 'class-completion',
              classId,
              description: `Completed all activities in ${classEntity?.name || 'class'}`,
            });
          }
        }
      }

      if (subjectId) {
        // Similar logic for subject completion
        const totalActivities = await this.prisma.activity.count({
          where: {
            subjectId,
            status: SystemStatus.ACTIVE,
          },
        });

        const completedActivities = await this.prisma.activityGrade.count({
          where: {
            studentId,
            activity: {
              subjectId,
              status: SystemStatus.ACTIVE,
            },
            status: SubmissionStatus.SUBMITTED, // Using correct SubmissionStatus enum value
          },
        });

        if (completedActivities >= totalActivities && totalActivities > 0) {
          const existingAchievement = await this.prisma.studentAchievement.findFirst({
            where: {
              studentId,
              type: 'subject-completion',
              subjectId,
              status: SystemStatus.ACTIVE,
            },
          });

          if (!existingAchievement) {
            const subject = await this.prisma.subject.findUnique({
              where: { id: subjectId },
              select: { name: true },
            });

            await this.prisma.studentAchievement.create({
              data: {
                studentId,
                title: 'Subject Master',
                description: `Completed all activities in ${subject?.name || 'subject'}`,
                type: 'subject-completion',
                subjectId,
                progress: completedActivities,
                total: totalActivities,
                unlocked: true,
                unlockedAt: new Date(),
                icon: 'book',
              },
            });

            await this.rewardSystem.awardPoints({
              studentId,
              amount: 75,
              source: 'subject-completion',
              subjectId,
              description: `Completed all activities in ${subject?.name || 'subject'}`,
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error checking activity completion achievements', { error, studentId, classId, subjectId });
      // Don't throw here to prevent breaking the main flow
    }
  }

  /**
   * Check for grade-based achievements
   */
  private async checkGradeBasedAchievements(
    studentId: string,
    gradePercentage: number,
    classId?: string,
    subjectId?: string
  ): Promise<void> {
    try {
      // Perfect score achievement
      if (gradePercentage === 100) {
        // Check if achievement exists
        const existingAchievement = await this.prisma.studentAchievement.findFirst({
          where: {
            studentId,
            type: 'perfect-score',
            ...(classId && { classId }),
            ...(subjectId && { subjectId }),
            status: SystemStatus.ACTIVE,
          },
        });

        if (!existingAchievement) {
          // Create achievement
          await this.prisma.studentAchievement.create({
            data: {
              studentId,
              title: 'Perfect Score',
              description: 'Achieved a perfect score on an activity',
              type: 'perfect-score',
              classId,
              subjectId,
              progress: 1,
              total: 1,
              unlocked: true,
              unlockedAt: new Date(),
              icon: 'star',
            },
          });

          // Award bonus points
          await this.rewardSystem.awardPoints({
            studentId,
            amount: 50,
            source: 'perfect-score',
            classId,
            subjectId,
            description: 'Bonus for perfect score',
          });
        }
      }

      // High achiever achievement (90%+ on multiple activities)
      if (gradePercentage >= 90) {
        // Count high-scoring activities using a more compatible approach
        // Instead of using raw, we'll use a different query approach
        const highScoreActivities = await this.prisma.activityGrade.findMany({
          where: {
            studentId,
            ...(classId && {
              activity: {
                classId,
              },
            }),
            ...(subjectId && {
              activity: {
                subjectId,
              },
            }),
            status: SubmissionStatus.SUBMITTED, // Using correct SubmissionStatus enum value
          },
          select: {
            score: true,
            activity: {
              select: {
                maxScore: true
              }
            }
          }
        });

        // Filter and count high-scoring activities (90% or higher)
        const highScoreCount = highScoreActivities.filter(grade => {
          const maxScore = grade.activity?.maxScore || 100;
          return grade.score !== null && grade.score >= (0.9 * maxScore);
        }).length;

        // Check for milestone achievements (5, 10, 25, 50, 100)
        const milestones = [5, 10, 25, 50, 100];
        for (const milestone of milestones) {
          if (highScoreCount >= milestone) {
            // Check if milestone achievement exists
            const existingMilestone = await this.prisma.studentAchievement.findFirst({
              where: {
                studentId,
                type: 'high-achiever',
                title: `High Achiever ${milestone}`,
                ...(classId && { classId }),
                ...(subjectId && { subjectId }),
                status: SystemStatus.ACTIVE,
              },
            });

            if (!existingMilestone) {
              // Create milestone achievement
              await this.prisma.studentAchievement.create({
                data: {
                  studentId,
                  title: `High Achiever ${milestone}`,
                  description: `Scored 90% or higher on ${milestone} activities`,
                  type: 'high-achiever',
                  classId,
                  subjectId,
                  progress: milestone,
                  total: milestone,
                  unlocked: true,
                  unlockedAt: new Date(),
                  icon: 'award',
                },
              });

              // Award bonus points
              await this.rewardSystem.awardPoints({
                studentId,
                amount: milestone * 2,
                source: 'high-achiever',
                classId,
                subjectId,
                description: `Bonus for High Achiever ${milestone}`,
              });
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error checking grade-based achievements', { error, studentId, gradePercentage });
      // Don't throw here to prevent breaking the main flow
    }
  }

  /**
   * Get point history for a student
   */
  async getPointHistory(
    studentId: string,
    options?: {
      source?: string;
      classId?: string;
      subjectId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    try {
      return await this.prisma.studentPoints.findMany({
        where: {
          studentId,
          ...(options?.source && { source: options.source }),
          ...(options?.classId && { classId: options.classId }),
          ...(options?.subjectId && { subjectId: options.subjectId }),
          ...(options?.startDate && { createdAt: { gte: options.startDate } }),
          ...(options?.endDate && { createdAt: { lte: options.endDate } }),
          status: SystemStatus.ACTIVE,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: options?.limit || 50,
        skip: options?.offset || 0,
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
    } catch (error) {
      logger.error('Error getting point history', { error, studentId, options });
      return [];
    }
  }

  /**
   * Get point summary for a student
   */
  async getPointSummary(
    studentId: string,
    classId?: string,
    subjectId?: string
  ): Promise<{
    totalPoints: number;
    dailyPoints: number;
    weeklyPoints: number;
    monthlyPoints: number;
  }> {
    try {
      // Get the latest aggregate
      const latestAggregate = await this.prisma.studentPointsAggregate.findFirst({
        where: {
          studentId,
          classId: classId || null,
          subjectId: subjectId || null,
        },
        orderBy: {
          date: 'desc',
        },
      });

      if (latestAggregate) {
        return {
          totalPoints: latestAggregate.totalPoints,
          dailyPoints: latestAggregate.dailyPoints,
          weeklyPoints: latestAggregate.weeklyPoints,
          monthlyPoints: latestAggregate.monthlyPoints,
        };
      }

      // If no aggregate exists, calculate from raw points
      const totalPoints = await this.calculateTotalPoints(studentId, classId, subjectId);
      const dailyPoints = await this.calculateDailyPoints(studentId, classId, subjectId);
      const weeklyPoints = await this.calculateWeeklyPoints(studentId, classId, subjectId);
      const monthlyPoints = await this.calculateMonthlyPoints(studentId, classId, subjectId);

      return {
        totalPoints,
        dailyPoints,
        weeklyPoints,
        monthlyPoints,
      };
    } catch (error) {
      logger.error('Error getting point summary', { error, studentId, classId, subjectId });
      return {
        totalPoints: 0,
        dailyPoints: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
      };
    }
  }

  /**
   * Calculate total points
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
   * Calculate daily points
   */
  private async calculateDailyPoints(
    studentId: string,
    classId?: string,
    subjectId?: string
  ): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.studentPoints.aggregate({
      where: {
        studentId,
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        createdAt: { gte: today },
        status: SystemStatus.ACTIVE,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  /**
   * Calculate weekly points
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
   * Calculate monthly points
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
}
