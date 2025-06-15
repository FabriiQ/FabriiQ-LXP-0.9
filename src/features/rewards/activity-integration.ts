/**
 * Reward System Integration with Activity System
 *
 * This module provides the integration between the reward system and the activity system.
 * It handles awarding points, updating achievements, and progressing levels based on
 * activity completion and grading.
 */

import { PrismaClient, SystemStatus, ActivityGrade, SubmissionStatus } from '@prisma/client';
import { PointSystem } from './points';
import { AchievementSystem } from './achievements';
import { LevelSystem } from './levels';
import { logger } from '../../server/api/utils/logger';
import { RewardSystemPrismaClient } from './types';
import { getRewardSystemPrisma } from './utils';

export interface ActivityCompletionResult {
  points: number;
  levelUp: boolean;
  newLevel?: number;
  achievements: Array<{
    id: string;
    title: string;
    newlyUnlocked: boolean;
  }>;
}

export class ActivityRewardIntegration {
  private prisma: RewardSystemPrismaClient;
  private pointSystem: PointSystem;
  private achievementSystem: AchievementSystem;
  private levelSystem: LevelSystem;

  constructor(prisma: PrismaClient) {
    this.prisma = getRewardSystemPrisma(prisma);
    this.pointSystem = new PointSystem(prisma);
    this.achievementSystem = new AchievementSystem(prisma);
    this.levelSystem = new LevelSystem(prisma);
  }

  /**
   * Process activity completion
   */
  async processActivityCompletion(
    studentId: string,
    activityId: string,
    options?: {
      gradePercentage?: number;
      isGraded?: boolean;
      complexity?: 'low' | 'medium' | 'high';
    }
  ): Promise<ActivityCompletionResult> {
    try {
      // Award points for activity
      const pointsResult = await this.pointSystem.awardPointsForActivity(
        studentId,
        activityId,
        options
      );

      // Update first activity achievement if needed
      const firstActivityResult = await this.updateFirstActivityAchievement(studentId);

      // Get activity details
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: {
          classId: true,
          subjectId: true,
          content: true,
          learningType: true,
        },
      });

      // Use learningType as the primary source of activity type
      // Fall back to content.activityType if learningType is not available
      let activityType: string;
      if (activity?.learningType) {
        // Convert enum value to string and make it lowercase for consistency
        activityType = activity.learningType.toString().toLowerCase().replace(/_/g, '-');
      } else {
        // Fall back to content.activityType if available
        const activityContent = activity?.content as any;
        activityType = activityContent?.activityType || 'unknown';
      }

      // Update activity count achievements
      const activityCountResult = await this.updateActivityCountAchievements(
        studentId,
        activity?.classId,
        activity?.subjectId
      );

      // Update activity type achievements
      const activityTypeResult = await this.updateActivityTypeAchievements(
        studentId,
        activityType
      );

      // Combine all achievement results
      const achievementResults = [
        ...(firstActivityResult ? [firstActivityResult] : []),
        ...activityCountResult,
        ...activityTypeResult,
      ];

      return {
        points: pointsResult.points,
        levelUp: pointsResult.levelUp,
        newLevel: pointsResult.newLevel,
        achievements: achievementResults,
      };
    } catch (error) {
      logger.error('Error processing activity completion', { error, studentId, activityId });
      return {
        points: 0,
        levelUp: false,
        achievements: [],
      };
    }
  }

  /**
   * Process activity grade
   */
  async processActivityGrade(
    activityGrade: {
      id: string;
      studentId: string;
      activityId: string;
      score: number | null;
      status: any;
      [key: string]: any;
    }
  ): Promise<ActivityCompletionResult> {
    try {
      // Award points for grade
      const pointsResult = await this.pointSystem.awardPointsForGrade(activityGrade);

      // Get activity details
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityGrade.activityId },
        select: {
          classId: true,
          subjectId: true,
        },
      });

      // Get activity to get maxScore
      const activityDetails = await this.prisma.activity.findUnique({
        where: { id: activityGrade.activityId },
        select: { maxScore: true }
      });

      // Calculate grade percentage
      const maxScore = activityDetails?.maxScore || 100;
      const gradePercentage = activityGrade.score !== null && maxScore > 0
        ? Math.round((activityGrade.score / maxScore) * 100)
        : 0;

      // Check for perfect score achievement
      const perfectScoreResult = gradePercentage === 100
        ? await this.updatePerfectScoreAchievement(
            activityGrade.studentId,
            activity?.classId,
            activity?.subjectId
          )
        : null;

      // Check for high score achievements
      const highScoreResult = gradePercentage >= 90
        ? await this.updateHighScoreAchievements(
            activityGrade.studentId,
            activity?.classId,
            activity?.subjectId
          )
        : [];

      // Combine all achievement results
      const achievementResults = [
        ...(perfectScoreResult ? [perfectScoreResult] : []),
        ...highScoreResult,
      ];

      return {
        points: pointsResult.points,
        levelUp: pointsResult.levelUp,
        newLevel: pointsResult.newLevel,
        achievements: achievementResults,
      };
    } catch (error) {
      logger.error('Error processing activity grade', { error, activityGrade });
      return {
        points: 0,
        levelUp: false,
        achievements: [],
      };
    }
  }

  /**
   * Update first activity achievement
   */
  private async updateFirstActivityAchievement(
    studentId: string
  ): Promise<{
    id: string;
    title: string;
    newlyUnlocked: boolean;
  } | null> {
    try {
      // Find the first activity achievement
      const achievement = await this.prisma.studentAchievement.findFirst({
        where: {
          studentId,
          title: 'First Steps',
          type: 'activity',
          status: SystemStatus.ACTIVE,
        },
      });

      if (!achievement) {
        return null;
      }

      // If already unlocked, return it
      if (achievement.unlocked) {
        return {
          id: achievement.id,
          title: achievement.title,
          newlyUnlocked: false,
        };
      }

      // Update the achievement
      const result = await this.achievementSystem.updateAchievementProgress({
        achievementId: achievement.id,
        progress: 1,
      });

      return {
        id: achievement.id,
        title: achievement.title,
        newlyUnlocked: result.newlyUnlocked,
      };
    } catch (error) {
      logger.error('Error updating first activity achievement', { error, studentId });
      return null;
    }
  }

  /**
   * Update activity count achievements
   */
  private async updateActivityCountAchievements(
    studentId: string,
    classId?: string,
    subjectId?: string
  ): Promise<Array<{
    id: string;
    title: string;
    newlyUnlocked: boolean;
  }>> {
    try {
      const results: Array<{
        id: string;
        title: string;
        newlyUnlocked: boolean;
      }> = [];

      // Count completed activities
      const completedActivities = await this.prisma.activityGrade.count({
        where: {
          studentId,
          status: SubmissionStatus.SUBMITTED, // Using correct SubmissionStatus enum value
        },
      });

      // Activity count milestones
      const milestones = [5, 10, 25, 50, 100, 250, 500, 1000];

      // Check each milestone
      for (const milestone of milestones) {
        if (completedActivities >= milestone) {
          // Check if milestone achievement exists
          let achievement = await this.prisma.studentAchievement.findFirst({
            where: {
              studentId,
              type: 'activity-count',
              title: `${milestone} Activities`,
              status: SystemStatus.ACTIVE,
            },
          });

          if (!achievement) {
            // Create milestone achievement
            achievement = await this.prisma.studentAchievement.create({
              data: {
                studentId,
                title: `${milestone} Activities`,
                description: `Completed ${milestone} activities`,
                type: 'activity-count',
                progress: milestone,
                total: milestone,
                unlocked: true,
                unlockedAt: new Date(),
                icon: 'check-circle',
              },
            });

            results.push({
              id: achievement.id,
              title: achievement.title,
              newlyUnlocked: true,
            });
          }
        }
      }

      // Class-specific activity count
      if (classId) {
        const classCompletedActivities = await this.prisma.activityGrade.count({
          where: {
            studentId,
            activity: {
              classId,
            },
            status: SubmissionStatus.SUBMITTED, // Using correct SubmissionStatus enum value
          },
        });

        // Class activity count milestones
        const classActivityMilestones = [5, 10, 25, 50, 100];

        // Check each milestone
        for (const milestone of classActivityMilestones) {
          if (classCompletedActivities >= milestone) {
            // Get class name
            const classEntity = await this.prisma.class.findUnique({
              where: { id: classId },
              select: { name: true },
            });

            // Check if milestone achievement exists
            let achievement = await this.prisma.studentAchievement.findFirst({
              where: {
                studentId,
                type: 'class-activity-count',
                title: `${milestone} Class Activities`,
                classId,
                status: SystemStatus.ACTIVE,
              },
            });

            if (!achievement) {
              // Create milestone achievement
              achievement = await this.prisma.studentAchievement.create({
                data: {
                  studentId,
                  title: `${milestone} Class Activities`,
                  description: `Completed ${milestone} activities in ${classEntity?.name || 'class'}`,
                  type: 'class-activity-count',
                  classId,
                  progress: milestone,
                  total: milestone,
                  unlocked: true,
                  unlockedAt: new Date(),
                  icon: 'layout',
                },
              });

              results.push({
                id: achievement.id,
                title: achievement.title,
                newlyUnlocked: true,
              });
            }
          }
        }
      }

      // Subject-specific activity count
      if (subjectId) {
        const subjectCompletedActivities = await this.prisma.activityGrade.count({
          where: {
            studentId,
            activity: {
              subjectId,
            },
            status: SubmissionStatus.SUBMITTED, // Using correct SubmissionStatus enum value
          },
        });

        // Subject activity count milestones
        const subjectActivityMilestones = [5, 10, 25, 50, 100];

        // Check each milestone
        for (const milestone of subjectActivityMilestones) {
          if (subjectCompletedActivities >= milestone) {
            // Get subject name
            const subject = await this.prisma.subject.findUnique({
              where: { id: subjectId },
              select: { name: true },
            });

            // Check if milestone achievement exists
            let achievement = await this.prisma.studentAchievement.findFirst({
              where: {
                studentId,
                type: 'subject-activity-count',
                title: `${milestone} Subject Activities`,
                subjectId,
                status: SystemStatus.ACTIVE,
              },
            });

            if (!achievement) {
              // Create milestone achievement
              achievement = await this.prisma.studentAchievement.create({
                data: {
                  studentId,
                  title: `${milestone} Subject Activities`,
                  description: `Completed ${milestone} activities in ${subject?.name || 'subject'}`,
                  type: 'subject-activity-count',
                  subjectId,
                  progress: milestone,
                  total: milestone,
                  unlocked: true,
                  unlockedAt: new Date(),
                  icon: 'book',
                },
              });

              results.push({
                id: achievement.id,
                title: achievement.title,
                newlyUnlocked: true,
              });
            }
          }
        }
      }

      return results;
    } catch (error) {
      logger.error('Error updating activity count achievements', { error, studentId, classId, subjectId });
      return [];
    }
  }

  /**
   * Update activity type achievements
   */
  private async updateActivityTypeAchievements(
    studentId: string,
    activityType: string
  ): Promise<Array<{
    id: string;
    title: string;
    newlyUnlocked: boolean;
  }>> {
    try {
      const results: Array<{
        id: string;
        title: string;
        newlyUnlocked: boolean;
      }> = [];

      // Count completed activities of this type
      // First try to count by learningType (which is a direct field)
      let completedActivities = 0;

      try {
        // Convert kebab-case back to UPPER_SNAKE_CASE for enum comparison
        const learningTypeEnum = activityType.toUpperCase().replace(/-/g, '_');

        // Count activities with matching learningType
        completedActivities = await this.prisma.activityGrade.count({
          where: {
            studentId,
            status: SubmissionStatus.SUBMITTED,
            activity: {
              learningType: learningTypeEnum as any, // Cast to any to avoid type issues
            },
          },
        });
      } catch (error) {
        // If there's an error with the enum conversion, fall back to content filtering
        logger.warn(`Error counting by learningType, falling back to content filtering: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // Get all activity grades and filter by content.activityType
        const activityGrades = await this.prisma.activityGrade.findMany({
          where: {
            studentId,
            status: SubmissionStatus.SUBMITTED,
          },
          include: {
            activity: {
              select: {
                content: true,
                learningType: true,
              },
            },
          },
        });

        // Filter activities by either learningType or content.activityType
        completedActivities = activityGrades.filter(grade => {
          // Check learningType first (convert to kebab-case for comparison)
          if (grade.activity?.learningType) {
            const learningTypeStr = grade.activity.learningType.toString().toLowerCase().replace(/_/g, '-');
            if (learningTypeStr === activityType) return true;
          }

          // Fall back to content.activityType
          const content = grade.activity?.content as any;
          return content?.activityType === activityType;
        }).length;
      }

      // Activity type milestones
      const milestones = [5, 10, 25, 50];

      // Check each milestone
      for (const milestone of milestones) {
        if (completedActivities >= milestone) {
          // Format activity type for display
          const formattedType = activityType
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          // Check if milestone achievement exists
          let achievement = await this.prisma.studentAchievement.findFirst({
            where: {
              studentId,
              type: `activity-type-${activityType}`,
              title: `${milestone} ${formattedType} Activities`,
              status: SystemStatus.ACTIVE,
            },
          });

          if (!achievement) {
            // Create milestone achievement
            achievement = await this.prisma.studentAchievement.create({
              data: {
                studentId,
                title: `${milestone} ${formattedType} Activities`,
                description: `Completed ${milestone} ${formattedType.toLowerCase()} activities`,
                type: `activity-type-${activityType}`,
                progress: milestone,
                total: milestone,
                unlocked: true,
                unlockedAt: new Date(),
                icon: this.getActivityTypeIcon(activityType),
              },
            });

            results.push({
              id: achievement.id,
              title: achievement.title,
              newlyUnlocked: true,
            });
          }
        }
      }

      return results;
    } catch (error) {
      logger.error('Error updating activity type achievements', { error, studentId, activityType });
      return [];
    }
  }

  /**
   * Update perfect score achievement
   */
  private async updatePerfectScoreAchievement(
    studentId: string,
    classId?: string,
    subjectId?: string
  ): Promise<{
    id: string;
    title: string;
    newlyUnlocked: boolean;
  } | null> {
    try {
      // Find the perfect score achievement
      let achievement = await this.prisma.studentAchievement.findFirst({
        where: {
          studentId,
          title: 'Perfect Score',
          type: 'perfect-score',
          ...(classId && { classId }),
          ...(subjectId && { subjectId }),
          status: SystemStatus.ACTIVE,
        },
      });

      if (!achievement) {
        // Create the achievement
        achievement = await this.prisma.studentAchievement.create({
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

        return {
          id: achievement.id,
          title: achievement.title,
          newlyUnlocked: true,
        };
      }

      // If already unlocked, return it
      if (achievement.unlocked) {
        return {
          id: achievement.id,
          title: achievement.title,
          newlyUnlocked: false,
        };
      }

      // Update the achievement
      const result = await this.achievementSystem.updateAchievementProgress({
        achievementId: achievement.id,
        progress: 1,
      });

      return {
        id: achievement.id,
        title: achievement.title,
        newlyUnlocked: result.newlyUnlocked,
      };
    } catch (error) {
      logger.error('Error updating perfect score achievement', { error, studentId, classId, subjectId });
      return null;
    }
  }

  /**
   * Update high score achievements
   */
  private async updateHighScoreAchievements(
    studentId: string,
    classId?: string,
    subjectId?: string
  ): Promise<Array<{
    id: string;
    title: string;
    newlyUnlocked: boolean;
  }>> {
    try {
      const results: Array<{
        id: string;
        title: string;
        newlyUnlocked: boolean;
      }> = [];

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

      // High score milestones
      const milestones = [5, 10, 25, 50, 100];

      // Check each milestone
      for (const milestone of milestones) {
        if (highScoreCount >= milestone) {
          // Check if milestone achievement exists
          let achievement = await this.prisma.studentAchievement.findFirst({
            where: {
              studentId,
              type: 'high-achiever',
              title: `High Achiever ${milestone}`,
              ...(classId && { classId }),
              ...(subjectId && { subjectId }),
              status: SystemStatus.ACTIVE,
            },
          });

          if (!achievement) {
            // Create milestone achievement
            achievement = await this.prisma.studentAchievement.create({
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

            results.push({
              id: achievement.id,
              title: achievement.title,
              newlyUnlocked: true,
            });
          }
        }
      }

      return results;
    } catch (error) {
      logger.error('Error updating high score achievements', { error, studentId, classId, subjectId });
      return [];
    }
  }

  /**
   * Get icon for activity type
   */
  private getActivityTypeIcon(activityType: string): string {
    switch (activityType.toLowerCase()) {
      case 'quiz':
        return 'help-circle';
      case 'assignment':
        return 'clipboard';
      case 'project':
        return 'briefcase';
      case 'discussion':
        return 'message-circle';
      case 'reading':
        return 'book-open';
      case 'video':
        return 'video';
      case 'presentation':
        return 'monitor';
      case 'essay':
        return 'edit';
      case 'exam':
        return 'file-text';
      case 'lab':
        return 'flask';
      case 'multiple-choice':
        return 'check-square';
      case 'fill-in-the-blank':
        return 'type';
      case 'matching':
        return 'git-merge';
      case 'sequence':
        return 'list';
      case 'drag-and-drop':
        return 'move';
      default:
        return 'activity';
    }
  }
}
