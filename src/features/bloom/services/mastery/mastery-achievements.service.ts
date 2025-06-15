import { PrismaClient } from '@prisma/client';
import { BloomsTaxonomyLevel, MasteryLevel, TopicMasteryData } from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { getMasteryLevel } from '../../utils/mastery-helpers';
import { logger } from '@/server/api/utils/logger';

/**
 * Service for handling mastery-related achievements
 */
export class MasteryAchievementsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check and award achievements based on mastery levels
   */
  public async checkMasteryAchievements(
    studentId: string,
    masteryData: TopicMasteryData
  ): Promise<void> {
    try {
      // Check overall mastery achievements
      await this.checkOverallMasteryAchievements(studentId, masteryData);

      // Check cognitive level achievements
      await this.checkCognitiveLevelAchievements(studentId, masteryData);

      // Check topic mastery count achievements
      await this.checkTopicMasteryCountAchievements(studentId);
    } catch (error) {
      logger.error('Error checking mastery achievements', { error, studentId });
    }
  }

  /**
   * Check and award achievements based on overall mastery level
   */
  private async checkOverallMasteryAchievements(
    studentId: string,
    masteryData: TopicMasteryData
  ): Promise<void> {
    const masteryLevel = getMasteryLevel(masteryData.overallMastery);
    const topicName = await this.getTopicName(masteryData.topicId);

    // Define achievement data based on mastery level
    const achievementData = {
      [MasteryLevel.NOVICE]: {
        title: 'Topic Novice',
        description: `Started learning ${topicName}`,
        type: 'topic-mastery',
        icon: 'book-open',
        points: 5
      },
      [MasteryLevel.DEVELOPING]: {
        title: 'Topic Apprentice',
        description: `Developing understanding of ${topicName}`,
        type: 'topic-mastery',
        icon: 'book-open',
        points: 10
      },
      [MasteryLevel.PROFICIENT]: {
        title: 'Topic Proficient',
        description: `Achieved proficiency in ${topicName}`,
        type: 'topic-mastery',
        icon: 'award',
        points: 20
      },
      [MasteryLevel.ADVANCED]: {
        title: 'Topic Master',
        description: `Mastered ${topicName}`,
        type: 'topic-mastery',
        icon: 'award',
        points: 30
      },
      [MasteryLevel.EXPERT]: {
        title: 'Topic Expert',
        description: `Became an expert in ${topicName}`,
        type: 'topic-mastery',
        icon: 'star',
        points: 50
      }
    };

    // Check if achievement already exists
    const existingAchievement = await this.prisma.studentAchievement.findFirst({
      where: {
        studentId,
        type: 'topic-mastery',
        title: achievementData[masteryLevel].title,
        topicId: masteryData.topicId
      }
    });

    // If achievement doesn't exist, create it
    if (!existingAchievement) {
      await this.prisma.studentAchievement.create({
        data: {
          studentId,
          title: achievementData[masteryLevel].title,
          description: achievementData[masteryLevel].description,
          type: achievementData[masteryLevel].type,
          topicId: masteryData.topicId,
          subjectId: masteryData.subjectId,
          progress: 1,
          total: 1,
          unlocked: true,
          unlockedAt: new Date(),
          icon: achievementData[masteryLevel].icon,
          points: achievementData[masteryLevel].points
        }
      });

      // Award points
      await this.awardPoints(studentId, achievementData[masteryLevel].points);
    }
  }

  /**
   * Check and award achievements based on cognitive level mastery
   */
  private async checkCognitiveLevelAchievements(
    studentId: string,
    masteryData: TopicMasteryData
  ): Promise<void> {
    // Check each cognitive level
    for (const level of Object.values(BloomsTaxonomyLevel)) {
      const levelValue = masteryData[level];
      const masteryLevel = getMasteryLevel(levelValue);
      const metadata = BLOOMS_LEVEL_METADATA[level];

      // Only award achievements for advanced or expert mastery
      if (masteryLevel >= MasteryLevel.ADVANCED) {
        // Check if achievement already exists
        const existingAchievement = await this.prisma.studentAchievement.findFirst({
          where: {
            studentId,
            type: 'cognitive-level-mastery',
            title: `${metadata.name} Master`,
            topicId: masteryData.topicId
          }
        });

        // If achievement doesn't exist, create it
        if (!existingAchievement) {
          const topicName = await this.getTopicName(masteryData.topicId);
          
          await this.prisma.studentAchievement.create({
            data: {
              studentId,
              title: `${metadata.name} Master`,
              description: `Mastered ${metadata.name} skills in ${topicName}`,
              type: 'cognitive-level-mastery',
              topicId: masteryData.topicId,
              subjectId: masteryData.subjectId,
              progress: 1,
              total: 1,
              unlocked: true,
              unlockedAt: new Date(),
              icon: 'brain',
              points: 25
            }
          });

          // Award points
          await this.awardPoints(studentId, 25);
        }
      }
    }
  }

  /**
   * Check and award achievements based on the number of topics mastered
   */
  private async checkTopicMasteryCountAchievements(
    studentId: string
  ): Promise<void> {
    // Get count of topics where student has achieved at least proficient mastery
    const masteredTopicsCount = await this.prisma.topicMastery.count({
      where: {
        studentId,
        overallMastery: {
          gte: 70 // Proficient level threshold
        }
      }
    });

    // Define milestones for topic mastery count
    const milestones = [1, 5, 10, 25, 50, 100];

    // Find the highest milestone achieved
    const achievedMilestone = milestones.filter(m => masteredTopicsCount >= m).pop();

    if (achievedMilestone) {
      // Check if achievement already exists
      const existingAchievement = await this.prisma.studentAchievement.findFirst({
        where: {
          studentId,
          type: 'topic-mastery-count',
          total: achievedMilestone
        }
      });

      // If achievement doesn't exist, create it
      if (!existingAchievement) {
        await this.prisma.studentAchievement.create({
          data: {
            studentId,
            title: `Topic Master ${achievedMilestone}`,
            description: `Mastered ${achievedMilestone} topics`,
            type: 'topic-mastery-count',
            progress: achievedMilestone,
            total: achievedMilestone,
            unlocked: true,
            unlockedAt: new Date(),
            icon: 'trophy',
            points: achievedMilestone * 5
          }
        });

        // Award points
        await this.awardPoints(studentId, achievedMilestone * 5);
      }
    }
  }

  /**
   * Get topic name by ID
   */
  private async getTopicName(topicId: string): Promise<string> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { name: true }
    });

    return topic?.name || 'Unknown Topic';
  }

  /**
   * Award points to student
   */
  private async awardPoints(studentId: string, points: number): Promise<void> {
    try {
      // Check if rewards system is available
      const rewardsSystem = await this.prisma.systemSetting.findFirst({
        where: { key: 'enableRewards' }
      });

      if (rewardsSystem?.value === 'true') {
        // Add points to student
        await this.prisma.studentReward.create({
          data: {
            studentId,
            points,
            source: 'mastery-achievement',
            description: 'Mastery achievement reward',
            createdAt: new Date()
          }
        });
      }
    } catch (error) {
      logger.error('Error awarding points for mastery achievement', { error, studentId, points });
    }
  }
}
