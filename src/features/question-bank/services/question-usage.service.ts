import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';

/**
 * Question Usage Service
 *
 * This service handles tracking the usage of questions from the question bank
 * in activities and quizzes. It updates usage statistics and provides analytics.
 */
export class QuestionUsageService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Record question usage when a student answers a question
   *
   * @param questionId The ID of the question from the question bank
   * @param wasCorrect Whether the student answered correctly
   * @param timeToAnswer Time taken to answer in seconds
   * @param activityId The ID of the activity where the question was used
   * @param studentId The ID of the student who answered
   * @param classId The ID of the class where the activity was used (optional)
   */
  async recordQuestionUsage(
    questionId: string,
    wasCorrect: boolean,
    timeToAnswer: number,
    activityId: string,
    studentId: string,
    classId?: string
  ) {
    try {
      // First, check if the question exists
      const question = await this.prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Question not found',
        });
      }

      // Update the question usage stats
      await this.prisma.questionUsageStats.upsert({
        where: { questionId },
        create: {
          questionId,
          usageCount: 1,
          correctCount: wasCorrect ? 1 : 0,
          incorrectCount: wasCorrect ? 0 : 1,
          partialCount: 0,
          averageTime: timeToAnswer,
          difficultyRating: wasCorrect ? 2 : 4, // Initial difficulty rating based on correctness
          lastUsedAt: new Date(),
        },
        update: {
          usageCount: { increment: 1 },
          correctCount: wasCorrect ? { increment: 1 } : undefined,
          incorrectCount: wasCorrect ? undefined : { increment: 1 },
          // Update average time calculation
          averageTime: timeToAnswer, // Simplified for now
          // Update difficulty rating based on correctness
          difficultyRating: wasCorrect ?
            { decrement: 0.1 } : // Make slightly easier if answered correctly
            { increment: 0.1 },  // Make slightly harder if answered incorrectly
          lastUsedAt: new Date(),
        },
      });

      // For now, we'll just update the usage stats
      // In the future, when the schema is updated, we'll track individual usage instances

      // For now, we'll just track usage in the main stats table
      // Class-specific tracking will be added when the schema is updated
      if (classId) {
        console.log(`Recording question usage for class ${classId}`);
        // In the future, we'll track class-specific usage here
      }

      return { success: true };
    } catch (error) {
      console.error('Error recording question usage:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to record question usage',
        cause: error,
      });
    }
  }

  /**
   * Get usage statistics for a question
   *
   * @param questionId The ID of the question
   */
  async getQuestionUsageStats(questionId: string) {
    try {
      const stats = await this.prisma.questionUsageStats.findUnique({
        where: { questionId },
      });

      if (!stats) {
        return {
          questionId,
          usageCount: 0,
          correctCount: 0,
          incorrectCount: 0,
          partialCount: 0,
          averageTime: 0,
          difficultyRating: 3, // Default medium difficulty
          lastUsedAt: null,
        };
      }

      return stats;
    } catch (error) {
      console.error('Error getting question usage stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get question usage statistics',
        cause: error,
      });
    }
  }

  /**
   * Get usage history for a question
   *
   * @param questionId The ID of the question
   * @param limit Maximum number of records to return
   * @param offset Offset for pagination
   */
  async getQuestionUsageHistory(questionId: string, limit = 10, offset = 0) {
    try {
      // For now, return mock data until the schema is updated
      return {
        history: [
          {
            id: '1',
            questionId,
            activityId: 'act1',
            studentId: 'student1',
            wasCorrect: true,
            timeToAnswer: 15.5,
            answeredAt: new Date(),
            student: {
              id: 'student1',
              name: 'John Doe',
            },
            activity: {
              id: 'act1',
              title: 'Weekly Quiz 1',
            },
          },
          {
            id: '2',
            questionId,
            activityId: 'act2',
            studentId: 'student2',
            wasCorrect: false,
            timeToAnswer: 25.2,
            answeredAt: new Date(Date.now() - 86400000), // 1 day ago
            student: {
              id: 'student2',
              name: 'Jane Smith',
            },
            activity: {
              id: 'act2',
              title: 'Chapter Test',
            },
          },
        ],
        total: 2,
      };
    } catch (error) {
      console.error('Error getting question usage history:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get question usage history',
        cause: error,
      });
    }
  }

  /**
   * Get class usage for a question
   *
   * @param questionId The ID of the question
   */
  async getQuestionClassUsage(questionId: string) {
    try {
      // For now, return mock data until the schema is updated
      return {
        classes: [
          {
            classId: 'class1',
            className: 'Class 10-A',
            courseName: 'Mathematics',
            subjectName: 'Algebra',
            usageCount: 3,
            correctPercentage: 75,
            activities: [
              {
                activityId: 'act1',
                activityTitle: 'Weekly Quiz 1',
                lastUsedAt: new Date(),
                correctPercentage: 80,
              },
              {
                activityId: 'act2',
                activityTitle: 'Chapter Test',
                lastUsedAt: new Date(Date.now() - 86400000), // 1 day ago
                correctPercentage: 70,
              },
            ],
          },
          {
            classId: 'class2',
            className: 'Class 11-B',
            courseName: 'Mathematics',
            subjectName: 'Algebra',
            usageCount: 1,
            correctPercentage: 60,
            activities: [
              {
                activityId: 'act3',
                activityTitle: 'Final Exam',
                lastUsedAt: new Date(Date.now() - 172800000), // 2 days ago
                correctPercentage: 60,
              },
            ],
          },
        ],
        reusedInClasses: ['Class 10-A'],
        totalUsageCount: 4,
      };
    } catch (error) {
      console.error('Error getting question class usage:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get question class usage',
        cause: error,
      });
    }
  }

  /**
   * Get question usage in a specific class
   *
   * @param classId The ID of the class
   */
  async getClassQuestionUsage(classId: string) {
    try {
      // For now, return mock data until the schema is updated
      return {
        usedQuestions: [
          {
            questionId: 'q1',
            usageCount: 2,
            lastUsedAt: new Date(),
            activities: ['Weekly Quiz 1', 'Chapter Test'],
          },
          {
            questionId: 'q2',
            usageCount: 1,
            lastUsedAt: new Date(Date.now() - 86400000), // 1 day ago
            activities: ['Final Exam'],
          },
        ],
      };
    } catch (error) {
      console.error('Error getting class question usage:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get class question usage',
        cause: error,
      });
    }
  }

  /**
   * Get most used questions in a question bank
   *
   * @param questionBankId The ID of the question bank
   * @param limit Maximum number of questions to return
   */
  async getMostUsedQuestions(questionBankId: string, limit = 10) {
    try {
      const questions = await this.prisma.question.findMany({
        where: { questionBankId },
        include: {
          usageStats: true,
        },
        orderBy: {
          usageStats: {
            usageCount: 'desc',
          },
        },
        take: limit,
      });

      return questions;
    } catch (error) {
      console.error('Error getting most used questions:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get most used questions',
        cause: error,
      });
    }
  }
}
