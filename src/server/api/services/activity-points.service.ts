import { PrismaClient, SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { logger } from '@/server/api/utils/logger';

interface ActivityPointsServiceConfig {
  prisma: PrismaClient;
}

/**
 * ActivityPointsService
 * 
 * This service handles the points system for activities, separate from grades.
 * Points are awarded for completing activities, regardless of whether they are gradable.
 */
export class ActivityPointsService {
  private prisma: PrismaClient;

  constructor(config: ActivityPointsServiceConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Calculate points for an activity based on its type and configuration
   * 
   * @param activityId The ID of the activity
   * @returns The number of points to award
   */
  async calculateActivityPoints(activityId: string): Promise<number> {
    try {
      // Get the activity
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: {
          learningType: true,
          purpose: true,
          isGradable: true,
          maxScore: true,
          weightage: true,
          content: true,
        },
      });

      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      // Base points calculation
      let points = 0;

      // If the activity has a weightage, use that as a base multiplier
      const weightMultiplier = activity.weightage || 1;

      // Calculate points based on activity type
      switch (activity.learningType) {
        case "MULTIPLE_CHOICE":
        case "TRUE_FALSE":
          points = 5 * weightMultiplier;
          break;
        case "MULTIPLE_RESPONSE":
        case "FILL_IN_THE_BLANKS":
        case "MATCHING":
        case "SEQUENCE":
          points = 10 * weightMultiplier;
          break;
        case "SHORT_ANSWER":
        case "ESSAY":
          points = 15 * weightMultiplier;
          break;
        case "PROJECT":
        case "PORTFOLIO":
          points = 25 * weightMultiplier;
          break;
        case "DISCUSSION":
        case "REFLECTION":
          points = 8 * weightMultiplier;
          break;
        case "INTERACTIVE":
        case "SIMULATION":
          points = 12 * weightMultiplier;
          break;
        default:
          // Default points for other activity types
          points = 5 * weightMultiplier;
      }

      // Adjust points based on activity purpose
      switch (activity.purpose) {
        case "ASSESSMENT":
          // Assessment activities get a bonus
          points *= 1.5;
          break;
        case "PRACTICE":
          // Practice activities get a small bonus
          points *= 1.2;
          break;
        case "ENRICHMENT":
          // Enrichment activities get a small bonus
          points *= 1.1;
          break;
        default:
          // No adjustment for other purposes
          break;
      }

      // Round to the nearest integer
      return Math.round(points);
    } catch (error) {
      logger.error('Error calculating activity points', { error, activityId });
      throw error;
    }
  }

  /**
   * Award points to a student for completing an activity
   * 
   * @param activityGradeId The ID of the activity grade
   * @param points Optional points to award (if not provided, will be calculated)
   * @returns The updated activity grade with points
   */
  async awardActivityPoints(activityGradeId: string, points?: number): Promise<any> {
    try {
      // Get the activity grade
      const activityGrade = await this.prisma.activityGrade.findUnique({
        where: { id: activityGradeId },
        include: {
          activity: {
            select: {
              id: true,
              isGradable: true,
              learningType: true,
              purpose: true,
            },
          },
        },
      });

      if (!activityGrade) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity grade not found",
        });
      }

      // Calculate points if not provided
      const pointsToAward = points || await this.calculateActivityPoints(activityGrade.activityId);

      // Update the activity grade with points
      const updatedActivityGrade = await this.prisma.activityGrade.update({
        where: { id: activityGradeId },
        data: {
          points: pointsToAward,
        },
      });

      // Record the points in the student points table if it exists
      try {
        await (this.prisma as any).studentPoints.create({
          data: {
            studentId: activityGrade.studentId,
            amount: pointsToAward,
            source: 'ACTIVITY',
            sourceId: activityGrade.activityId,
            description: `Points for completing activity`,
            classId: activityGrade.activity.classId,
            subjectId: activityGrade.activity.subjectId,
            status: SystemStatus.ACTIVE,
          },
        });
      } catch (pointsError) {
        // Log the error but don't fail the operation
        logger.error('Error recording student points', { 
          error: pointsError, 
          activityGradeId,
          studentId: activityGrade.studentId
        });
      }

      return updatedActivityGrade;
    } catch (error) {
      logger.error('Error awarding activity points', { error, activityGradeId });
      throw error;
    }
  }
}
