import { TRPCError } from "@trpc/server";
import { PrismaClient, SystemStatus } from "@prisma/client";
import {
  CreateActivityGradeInput,
  UpdateActivityGradeInput,
  ActivityGradeFilters,
  BatchGradeActivitiesInput
} from "../types/activity";
import { Prisma } from "@prisma/client";
import { SYSTEM_CONFIG, SubmissionStatus } from "../constants";
import { v4 as uuidv4 } from 'uuid';
import { ActivityRewardIntegration } from '@/features/rewards/activity-integration';
import { ActivityPointsService } from './activity-points.service';
import { logger } from '@/server/api/utils/logger';

interface ActivityGradeServiceConfig {
  prisma: PrismaClient;
}

export class ActivityGradeService {
  private prisma: PrismaClient;

  constructor(config: ActivityGradeServiceConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Create a new activity grade
   */
  async createActivityGrade(input: CreateActivityGradeInput) {
    try {
      // Validate activity exists
      const activity = await this.prisma.activity.findUnique({
        where: { id: input.activityId }
      });

      if (!activity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Activity not found',
        });
      }

      // Validate student exists
      const student = await this.prisma.studentProfile.findUnique({
        where: { id: input.studentId }
      });

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student not found',
        });
      }

      // If score is provided and the activity is not gradable, throw error
      if (input.score !== undefined && !activity.isGradable) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot grade a non-gradable activity',
        });
      }

      // If score is provided, validate it
      if (input.score !== undefined && activity.maxScore !== null) {
        if (input.score < 0 || input.score > activity.maxScore) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Score must be between 0 and ${activity.maxScore}`,
          });
        }
      }

      // Calculate points if not provided and status is COMPLETED or GRADED
      let calculatedPoints: number | undefined = input.points;
      if (calculatedPoints === undefined &&
          (input.status === SubmissionStatus.COMPLETED || input.status === SubmissionStatus.GRADED)) {
        try {
          const pointsService = new ActivityPointsService({ prisma: this.prisma });
          calculatedPoints = await pointsService.calculateActivityPoints(input.activityId);
        } catch (pointsError) {
          logger.error('Error calculating points for activity grade', {
            error: pointsError,
            activityId: input.activityId,
            studentId: input.studentId
          });
          // Continue without points
        }
      }

      // Extract timeSpentMinutes from input or content
      let timeSpentMinutes = input.timeSpentMinutes;
      if (!timeSpentMinutes && input.content && typeof input.content === 'object' && 'timeSpent' in input.content) {
        timeSpentMinutes = (input.content as any).timeSpent;
      }

      // Prepare learning time fields
      const now = new Date();
      const learningStartedAt = input.learningStartedAt ||
        (timeSpentMinutes ? new Date(now.getTime() - timeSpentMinutes * 60 * 1000) : undefined);
      const learningCompletedAt = input.learningCompletedAt ||
        (timeSpentMinutes ? now : undefined);

      // Use upsert to handle both creation and update cases
      const activityGrade = await this.prisma.activityGrade.upsert({
        where: {
          activityId_studentId: {
            activityId: input.activityId,
            studentId: input.studentId
          }
        },
        update: {
          score: input.score,
          ...(calculatedPoints !== undefined ? { points: calculatedPoints } as any : {}),
          feedback: input.feedback,
          status: input.status || SubmissionStatus.SUBMITTED,
          gradedAt: input.score !== undefined ? new Date() : undefined,
          gradedById: input.gradedById,
          content: input.content as any,
          attachments: input.attachments as any,
          // Add learning time fields
          ...(timeSpentMinutes ? { timeSpentMinutes } as any : {}),
          ...(learningStartedAt ? { learningStartedAt } as any : {}),
          ...(learningCompletedAt ? { learningCompletedAt } as any : {}),
          updatedAt: new Date()
        },
        create: {
          id: uuidv4(),
          activityId: input.activityId,
          studentId: input.studentId,
          score: input.score,
          ...(calculatedPoints !== undefined ? { points: calculatedPoints } as any : {}),
          feedback: input.feedback,
          status: input.status || SubmissionStatus.SUBMITTED,
          submittedAt: new Date(),
          gradedAt: input.score !== undefined ? new Date() : null,
          gradedById: input.gradedById,
          content: input.content as any,
          attachments: input.attachments as any,
          // Add learning time fields
          ...(timeSpentMinutes ? { timeSpentMinutes } as any : {}),
          ...(learningStartedAt ? { learningStartedAt } as any : {}),
          ...(learningCompletedAt ? { learningCompletedAt } as any : {}),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Record points in student points table if activity is completed and points were calculated
      if (calculatedPoints !== undefined &&
          ((activityGrade.status as string) === 'COMPLETED' || (activityGrade.status as string) === 'GRADED')) {
        try {
          await (this.prisma as any).studentPoints.create({
            data: {
              studentId: input.studentId,
              amount: calculatedPoints,
              source: 'ACTIVITY',
              sourceId: input.activityId,
              description: `Points for completing activity`,
              classId: activity.classId,
              subjectId: activity.subjectId,
              status: SystemStatus.ACTIVE,
            },
          });
        } catch (pointsError) {
          logger.error('Error recording student points', {
            error: pointsError,
            activityId: input.activityId,
            studentId: input.studentId
          });
          // Continue even if points recording fails
        }
      }

      // If timeSpentMinutes is provided, create a learning time record
      if (timeSpentMinutes) {
        try {
          const now = new Date();
          const startedAt = new Date(now.getTime() - timeSpentMinutes * 60 * 1000);

          await this.prisma.learningTimeRecord.create({
            data: {
              studentId: input.studentId,
              activityId: input.activityId,
              classId: activity.classId,
              timeSpentMinutes,
              startedAt,
              completedAt: now,
              partitionKey: `class_${activity.classId}_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`,
            },
          });

          logger.debug('Created learning time record', {
            activityId: input.activityId,
            studentId: input.studentId,
            timeSpentMinutes
          });
        } catch (timeRecordError) {
          logger.error('Error creating learning time record', {
            error: timeRecordError,
            activityId: input.activityId,
            studentId: input.studentId
          });
          // Continue even if time record creation fails
        }
      }

      // Update student grade with activity grade
      await this.updateStudentGradeWithActivityGrade(activityGrade);

      return activityGrade;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error creating activity grade:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to create activity grade: ${(error as Error).message}`,
        cause: error,
      });
    }
  }

  /**
   * Get an activity grade by activity ID and student ID
   */
  async getActivityGrade(activityId: string, studentId: string) {
    try {
      logger.debug('Getting activity grade', { activityId, studentId });

      // First, verify the activity exists
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: {
          id: true,
          title: true,
          learningType: true,
          isGradable: true,
          content: true
        }
      });

      if (!activity) {
        logger.error('Activity not found when getting grade', { activityId });
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Activity not found',
        });
      }

      // Determine the activity type from various possible sources
      const activityType = activity.learningType ||
        (activity.content && typeof activity.content === 'object' && 'activityType' in activity.content
          ? (activity.content as any).activityType
          : 'unknown');

      logger.debug('Found activity', {
        activityId,
        title: activity.title,
        type: activityType,
        isGradable: activity.isGradable
      });

      // Then, find the grade
      const activityGrade = await this.prisma.activityGrade.findUnique({
        where: {
          activityId_studentId: {
            activityId,
            studentId
          }
        }
      });

      if (!activityGrade) {
        logger.error('Activity grade not found', {
          activityId,
          studentId,
          activityType: activityType
        });
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Activity grade not found for ${activityType} activity`,
        });
      }

      logger.debug('Found activity grade', {
        activityId,
        studentId,
        score: activityGrade.score,
        status: activityGrade.status
      });

      return activityGrade;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      logger.error('Error getting activity grade', {
        activityId,
        studentId,
        error: (error as Error).message
      });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get activity grade: ${(error as Error).message}`,
        cause: error,
      });
    }
  }

  /**
   * List activity grades with pagination and filtering
   */
  async listActivityGrades(
    pagination: { skip?: number; take?: number },
    filters?: ActivityGradeFilters,
  ) {
    try {
      const { skip = 0, take = 10 } = pagination;
      const { activityId, studentId, status, search } = filters || {};

      // Build where conditions
      const where: any = {};

      if (activityId) {
        where.activityId = activityId;
      }

      if (studentId) {
        where.studentId = studentId;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { feedback: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Count total records
      const total = await this.prisma.activityGrade.count({ where });

      // Fetch data with pagination
      const activityGrades = await this.prisma.activityGrade.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take
      });

      return {
        items: activityGrades,
        total,
        pageInfo: {
          hasNextPage: skip + take < total,
          hasPreviousPage: skip > 0,
        },
      };
    } catch (error) {
      console.error('Error listing activity grades:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to list activity grades: ${(error as Error).message}`,
        cause: error,
      });
    }
  }

  /**
   * Update an activity grade
   */
  async updateActivityGrade(activityId: string, studentId: string, input: UpdateActivityGradeInput) {
    try {
      // Check if activity grade exists
      const existingGrade = await this.prisma.activityGrade.findUnique({
        where: {
          activityId_studentId: {
            activityId,
            studentId
          }
        }
      });

      if (!existingGrade) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Activity grade not found',
        });
      }

      // If score is being updated, validate activity is gradable
      if (input.score !== undefined) {
        const activity = await this.prisma.activity.findUnique({
          where: { id: activityId }
        });

        if (!activity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Activity not found',
          });
        }

        if (!activity.isGradable) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot grade a non-gradable activity',
          });
        }

        if (activity.maxScore !== null && (input.score < 0 || input.score > activity.maxScore)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Score must be between 0 and ${activity.maxScore}`,
          });
        }
      }

      // Extract timeSpentMinutes from input or content
      let timeSpentMinutes = input.timeSpentMinutes;
      if (!timeSpentMinutes && input.content && typeof input.content === 'object' && 'timeSpent' in input.content) {
        timeSpentMinutes = (input.content as any).timeSpent;
      }

      // Prepare learning time fields
      const now = new Date();
      const learningStartedAt = input.learningStartedAt ||
        (timeSpentMinutes ? new Date(now.getTime() - timeSpentMinutes * 60 * 1000) : undefined);
      const learningCompletedAt = input.learningCompletedAt ||
        (timeSpentMinutes ? now : undefined);

      // Prepare update data
      const updateData: any = {
        updatedAt: new Date()
      };

      if (input.score !== undefined) {
        updateData.score = input.score;
        updateData.gradedAt = new Date();
      }

      if (input.points !== undefined) {
        updateData.points = input.points;
      }

      if (input.feedback !== undefined) {
        updateData.feedback = input.feedback;
      }

      if (input.content !== undefined) {
        updateData.content = input.content;
      }

      if (input.attachments !== undefined) {
        updateData.attachments = input.attachments;
      }

      if (input.status !== undefined) {
        updateData.status = input.status;
      }

      if (input.gradedById !== undefined) {
        updateData.gradedById = input.gradedById;
      }

      // Add learning time fields to update data
      if (timeSpentMinutes) {
        updateData.timeSpentMinutes = timeSpentMinutes;
      }

      if (learningStartedAt) {
        updateData.learningStartedAt = learningStartedAt;
      }

      if (learningCompletedAt) {
        updateData.learningCompletedAt = learningCompletedAt;
      }

      // Update activity grade
      const activityGrade = await this.prisma.activityGrade.update({
        where: {
          activityId_studentId: {
            activityId,
            studentId
          }
        },
        data: updateData
      });

      // If timeSpentMinutes is provided, create a learning time record
      if (timeSpentMinutes) {
        try {
          const now = new Date();
          const startedAt = new Date(now.getTime() - timeSpentMinutes * 60 * 1000);

          // Get the activity to access its classId
          const activityDetails = await this.prisma.activity.findUnique({
            where: { id: activityId },
            select: { classId: true }
          });

          if (!activityDetails) {
            throw new Error('Activity not found when creating learning time record');
          }

          await this.prisma.learningTimeRecord.create({
            data: {
              studentId: studentId,
              activityId: activityId,
              classId: activityDetails.classId,
              timeSpentMinutes,
              startedAt,
              completedAt: now,
              partitionKey: `class_${activityDetails.classId}_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`,
            },
          });

          logger.debug('Created learning time record during update', {
            activityId,
            studentId,
            timeSpentMinutes
          });
        } catch (timeRecordError) {
          logger.error('Error creating learning time record during update', {
            error: timeRecordError,
            activityId,
            studentId
          });
          // Continue even if time record creation fails
        }
      }

      // Update student grade with activity grade
      await this.updateStudentGradeWithActivityGrade(activityGrade);

      // Calculate and award points if status is changing to COMPLETED or GRADED
      if (input.status === SubmissionStatus.COMPLETED || input.status === SubmissionStatus.GRADED) {
        if (input.points === undefined) {
          try {
            const pointsService = new ActivityPointsService({ prisma: this.prisma });
            const calculatedPoints = await pointsService.calculateActivityPoints(activityId);

            // Update the activity grade with the calculated points
            await this.prisma.activityGrade.update({
              where: {
                activityId_studentId: {
                  activityId,
                  studentId
                }
              },
              data: {
                ...(calculatedPoints !== undefined ? { points: calculatedPoints } as any : {})
              }
            });

            // Record points in student points table
            await (this.prisma as any).studentPoints.create({
              data: {
                studentId: studentId,
                amount: calculatedPoints,
                source: 'ACTIVITY',
                sourceId: activityId,
                description: `Points for completing activity`,
                classId: (await this.prisma.activity.findUnique({ where: { id: activityId } }))?.classId,
                subjectId: (await this.prisma.activity.findUnique({ where: { id: activityId } }))?.subjectId,
                status: SystemStatus.ACTIVE,
              },
            });
          } catch (pointsError) {
            logger.error('Error calculating or awarding points', {
              error: pointsError,
              activityId,
              studentId
            });
            // Continue even if points processing fails
          }
        }
      }

      // Process rewards for activity grade
      if (input.score !== undefined && input.status === SubmissionStatus.GRADED) {
        try {
          const activityRewards = new ActivityRewardIntegration(this.prisma);
          const rewardResult = await activityRewards.processActivityGrade(activityGrade);

          logger.debug('Processed activity grade rewards', {
            activityId,
            studentId,
            pointsAwarded: rewardResult.points,
            levelUp: rewardResult.levelUp,
            achievementsUnlocked: rewardResult.achievements.length
          });
        } catch (rewardError) {
          logger.error('Error processing activity grade rewards', {
            error: rewardError,
            activityId,
            studentId
          });
          // Continue even if reward processing fails
        }
      }

      return activityGrade;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error updating activity grade:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to update activity grade: ${(error as Error).message}`,
        cause: error,
      });
    }
  }

  /**
   * Batch grade activities
   */
  async batchGradeActivities(input: BatchGradeActivitiesInput) {
    try {
      // Validate activity exists
      const activity = await this.prisma.activity.findUnique({
        where: { id: input.activityId }
      });

      if (!activity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Activity not found',
        });
      }

      if (!activity.isGradable) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot grade a non-gradable activity',
        });
      }

      // Validate scores
      if (activity.maxScore !== null) {
        for (const grade of input.grades) {
          if (grade.score < 0 || grade.score > activity.maxScore) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Score for student ${grade.studentId} must be between 0 and ${activity.maxScore}`,
            });
          }
        }
      }

      // Get existing grades for this activity
      const studentIds = input.grades.map(g => g.studentId);
      const existingGrades = await this.prisma.activityGrade.findMany({
        where: {
          activityId: input.activityId,
          studentId: { in: studentIds }
        }
      });

      const existingGradesMap = new Map(existingGrades.map(g => [g.studentId, g]));

      // Process each grade
      const results = [];
      for (const grade of input.grades) {
        let activityGrade;

        if (existingGradesMap.has(grade.studentId)) {
          // Calculate points for the activity
          let points: number | undefined;
          try {
            const pointsService = new ActivityPointsService({ prisma: this.prisma });
            points = await pointsService.calculateActivityPoints(input.activityId);
          } catch (pointsError) {
            logger.error('Error calculating points for batch grade update', {
              error: pointsError,
              activityId: input.activityId,
              studentId: grade.studentId
            });
            // Continue without updating points
          }

          // Update existing grade
          activityGrade = await this.prisma.activityGrade.update({
            where: {
              activityId_studentId: {
                activityId: input.activityId,
                studentId: grade.studentId
              }
            },
            data: {
              score: grade.score,
              ...(points !== undefined ? { points } : {}),
              feedback: grade.feedback,
              status: SubmissionStatus.GRADED,
              gradedAt: new Date(),
              gradedById: input.gradedById,
              updatedAt: new Date()
            }
          });
        } else {
          // Calculate points for the activity
          let points: number | undefined;
          try {
            const pointsService = new ActivityPointsService({ prisma: this.prisma });
            points = await pointsService.calculateActivityPoints(input.activityId);
          } catch (pointsError) {
            logger.error('Error calculating points for batch grade', {
              error: pointsError,
              activityId: input.activityId,
              studentId: grade.studentId
            });
            // Continue with default points
            points = 0;
          }

          // Create new grade with points as any to bypass type checking
          // This is necessary because the Prisma client may not be updated with the new schema yet
          activityGrade = await this.prisma.activityGrade.create({
            data: {
              id: uuidv4(),
              activityId: input.activityId,
              studentId: grade.studentId,
              score: grade.score,
              ...(points !== undefined ? { points } as any : {}),
              feedback: grade.feedback,
              status: SubmissionStatus.GRADED,
              submittedAt: new Date(),
              gradedAt: new Date(),
              gradedById: input.gradedById,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }

        results.push(activityGrade as never);

        // Update student grade
        await this.updateStudentGradeWithActivityGrade(activityGrade);

        // Process rewards for activity grade
        try {
          const activityRewards = new ActivityRewardIntegration(this.prisma);
          const rewardResult = await activityRewards.processActivityGrade(activityGrade);

          logger.debug('Processed batch activity grade rewards', {
            activityId: input.activityId,
            studentId: grade.studentId,
            pointsAwarded: rewardResult.points,
            levelUp: rewardResult.levelUp,
            achievementsUnlocked: rewardResult.achievements.length
          });
        } catch (rewardError) {
          logger.error('Error processing batch activity grade rewards', {
            error: rewardError,
            activityId: input.activityId,
            studentId: grade.studentId
          });
          // Continue even if reward processing fails
        }
      }

      return results;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error batch grading activities:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to batch grade activities: ${(error as Error).message}`,
        cause: error,
      });
    }
  }

  /**
   * Update student grade with activity grade
   */
  private async updateStudentGradeWithActivityGrade(activityGrade: any) {
    try {
      // Get activity to find class and subject
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityGrade.activityId }
      });

      if (!activity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Activity not found',
        });
      }

      // Find grade book for this class
      // Use a direct query with Prisma's $queryRaw to avoid type issues
      const gradeBook = await this.prisma.$queryRaw`
        SELECT * FROM "grade_books"
        WHERE "classId" = ${activity.classId}
        AND "status" = 'ACTIVE'
        LIMIT 1
      `
      .then((results: any[]) => results[0] || null)
      .catch(() => null);

      if (!gradeBook) {
        // No grade book, so we can't update student grade
        return;
      }

      // Find student grade
      const studentGrade = await this.prisma.studentGrade.findFirst({
        where: {
          gradeBookId: gradeBook.id,
          studentId: activityGrade.studentId
        }
      });

      if (!studentGrade) {
        // No student grade, so we can't update
        return;
      }

      // Get all activity grades for this student in this class
      const activityGrades = await this.prisma.activityGrade.findMany({
        where: {
          studentId: activityGrade.studentId,
          activity: {
            classId: activity.classId
          }
        },
        include: {
          activity: true
        }
      });

      // Group activity grades by topic
      const topicGrades: { [topicId: string]: { grades: any[], totalScore: number, totalWeight: number } } = {};

      for (const grade of activityGrades) {
        const act = grade.activity;
        if (!act || !act.topicId) continue;

        if (!topicGrades[act.topicId]) {
          topicGrades[act.topicId] = { grades: [], totalScore: 0, totalWeight: 0 };
        }

        const weight = act.weightage || 1;
        const score = grade.score !== null ? (grade.score / (act.maxScore || 100)) * 100 : 0;

        topicGrades[act.topicId].grades.push(grade);
        topicGrades[act.topicId].totalScore += score * weight;
        topicGrades[act.topicId].totalWeight += weight;
      }

      // Update topic grades
      for (const topicId in topicGrades) {
        const data = topicGrades[topicId];
        const activityScore = data.totalWeight > 0 ? data.totalScore / data.totalWeight : 0;

        // Check if student topic grade exists
        const existingTopicGrade = await this.prisma.studentTopicGrade.findFirst({
          where: {
            studentGradeId: studentGrade.id,
            topicId: topicId
          }
        });

        if (existingTopicGrade) {
          // Update existing topic grade
          await this.prisma.studentTopicGrade.update({
            where: { id: existingTopicGrade.id },
            data: {
              activityScore: activityScore,
              score: this.calculateOverallScore(existingTopicGrade.assessmentScore || 0, activityScore),
              updatedAt: new Date()
            }
          });
        } else {
          // Create new topic grade
          await this.prisma.studentTopicGrade.create({
            data: {
              id: uuidv4(),
              studentGradeId: studentGrade.id,
              topicId: topicId,
              activityScore: activityScore,
              assessmentScore: 0,
              score: activityScore,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      }

      // Prepare activity grades data for student grade
      const activityGradeData = activityGrades.map(grade => ({
        id: grade.id,
        activityId: grade.activityId,
        score: grade.score,
        status: grade.status,
        submittedAt: grade.submittedAt,
        gradedAt: grade.gradedAt,
      }));

      // Update student grade with activity grades
      await this.prisma.studentGrade.update({
        where: { id: studentGrade.id },
        data: {
          activityGrades: activityGradeData as any,
          updatedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to update student grade with activity grade:', error);
      return false;
    }
  }

  /**
   * Calculate overall score from assessment and activity scores
   */
  private calculateOverallScore(assessmentScore: number, activityScore: number): number {
    // Default weights: 70% assessments, 30% activities
    const assessmentWeight = 0.7;
    const activityWeight = 0.3;

    return (assessmentScore * assessmentWeight) + (activityScore * activityWeight);
  }
}