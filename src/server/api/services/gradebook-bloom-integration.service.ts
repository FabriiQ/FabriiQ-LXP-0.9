/**
 * Gradebook Bloom's Taxonomy Integration Service
 *
 * This service provides methods for integrating Bloom's Taxonomy with the gradebook system.
 * It handles calculating Bloom's level scores, updating gradebook with Bloom's data,
 * and connecting with existing activity grades.
 */

import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { logger } from '@/server/api/utils/logger';

// Define the service configuration
interface GradebookBloomIntegrationServiceConfig {
  prisma: PrismaClient;
}

/**
 * Extended GradebookCalculationRules interface with Bloom's Taxonomy fields
 */
export interface GradebookCalculationRules {
  // Existing fields
  title?: string;
  description?: string;
  gradingSystem?: string;
  weights: {
    attendance: number;
    activities: number;
    assessments: number;
  };
  passingGrade?: number;
  customWeights?: Record<string, number>;

  // New Bloom's Taxonomy fields
  bloomsWeights?: Record<BloomsTaxonomyLevel, number>;
  enableBloomsAnalytics?: boolean;
  showBloomsDistribution?: boolean;
}

/**
 * Gradebook Bloom's Taxonomy Integration Service
 */
export class GradebookBloomIntegrationService {
  private config: GradebookBloomIntegrationServiceConfig;

  constructor(config: GradebookBloomIntegrationServiceConfig) {
    this.config = config;
  }

  /**
   * Calculate Bloom's level scores for a student in a gradebook
   *
   * @param studentId The student ID
   * @param gradeBookId The gradebook ID
   * @returns Record of Bloom's level scores
   */
  async calculateBloomsLevelScores(
    studentId: string,
    gradeBookId: string
  ): Promise<Record<BloomsTaxonomyLevel, number>> {
    const { prisma } = this.config;

    try {
      // Get the gradebook
      const gradeBook = await prisma.gradeBook.findUnique({
        where: { id: gradeBookId },
        include: {
          class: true
        }
      });

      if (!gradeBook) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gradebook not found"
        });
      }

      // Get all activity grades for this student in this class
      const activityGrades = await prisma.activityGrade.findMany({
        where: {
          studentId,
          activity: {
            classId: gradeBook.classId
          },
          status: "GRADED"
        },
        include: {
          activity: true
        }
      });

      // Get all assessment results for this student in this class
      const assessmentResults = await prisma.assessmentResult.findMany({
        where: {
          studentId,
          assessment: {
            classId: gradeBook.classId
          }
        },
        include: {
          assessment: true
        }
      });

      // Initialize Bloom's level scores
      const bloomsLevelScores: Record<BloomsTaxonomyLevel, number> = {
        [BloomsTaxonomyLevel.REMEMBER]: 0,
        [BloomsTaxonomyLevel.UNDERSTAND]: 0,
        [BloomsTaxonomyLevel.APPLY]: 0,
        [BloomsTaxonomyLevel.ANALYZE]: 0,
        [BloomsTaxonomyLevel.EVALUATE]: 0,
        [BloomsTaxonomyLevel.CREATE]: 0
      };

      // Calculate total points possible for each level
      const totalPossiblePoints: Record<BloomsTaxonomyLevel, number> = {
        [BloomsTaxonomyLevel.REMEMBER]: 0,
        [BloomsTaxonomyLevel.UNDERSTAND]: 0,
        [BloomsTaxonomyLevel.APPLY]: 0,
        [BloomsTaxonomyLevel.ANALYZE]: 0,
        [BloomsTaxonomyLevel.EVALUATE]: 0,
        [BloomsTaxonomyLevel.CREATE]: 0
      };

      // Process activity grades
      for (const activityGrade of activityGrades) {
        const { activity } = activityGrade;

        // Skip if no Bloom's level is assigned
        if (!activity.bloomsLevel) continue;

        // Get Bloom's level scores from attachments if available
        const attachments = activityGrade.attachments as any;
        const gradingDetails = attachments?.gradingDetails;

        if (gradingDetails?.bloomsLevelScores) {
          // Use detailed Bloom's level scores if available
          Object.entries(gradingDetails.bloomsLevelScores).forEach(([level, score]) => {
            bloomsLevelScores[level as BloomsTaxonomyLevel] += Number(score);
            totalPossiblePoints[level as BloomsTaxonomyLevel] += activity.maxScore || 100;
          });
        } else if (activity.bloomsLevel) {
          // Otherwise, assign all points to the activity's Bloom's level
          bloomsLevelScores[activity.bloomsLevel] += activityGrade.score || 0;
          totalPossiblePoints[activity.bloomsLevel] += activity.maxScore || 100;
        }
      }

      // Process assessment results
      for (const assessmentResult of assessmentResults) {
        const { assessment } = assessmentResult;

        // Get Bloom's level scores from assessment result
        const bloomsLevelScores = assessmentResult.bloomsLevelScores as any;

        if (bloomsLevelScores) {
          // Use detailed Bloom's level scores if available
          Object.entries(bloomsLevelScores).forEach(([level, score]) => {
            bloomsLevelScores[level as BloomsTaxonomyLevel] += Number(score);
            totalPossiblePoints[level as BloomsTaxonomyLevel] += assessment.maxScore || 100;
          });
        } else {
          // If no Bloom's level scores, assign to UNDERSTAND level as default
          bloomsLevelScores[BloomsTaxonomyLevel.UNDERSTAND] += assessmentResult.score || 0;
          totalPossiblePoints[BloomsTaxonomyLevel.UNDERSTAND] += assessment.maxScore || 100;
        }
      }

      // Convert raw scores to percentages
      Object.keys(bloomsLevelScores).forEach(level => {
        const typedLevel = level as BloomsTaxonomyLevel;
        if (totalPossiblePoints[typedLevel] > 0) {
          bloomsLevelScores[typedLevel] = (bloomsLevelScores[typedLevel] / totalPossiblePoints[typedLevel]) * 100;
        }
      });

      return bloomsLevelScores;
    } catch (error) {
      logger.error('Error calculating Bloom\'s level scores', { error, studentId, gradeBookId });
      throw error;
    }
  }

  /**
   * Update gradebook with activity grade Bloom's data
   *
   * @param gradeBookId The gradebook ID
   * @param studentId The student ID
   * @param activityGradeId The activity grade ID
   * @returns Updated student grade
   */
  async updateGradebookWithActivityGrade(
    gradeBookId: string,
    studentId: string,
    activityGradeId: string
  ) {
    const { prisma } = this.config;

    try {
      // Get the activity grade with its attachments field
      const activityGrade = await prisma.activityGrade.findUnique({
        where: { id: activityGradeId },
        include: {
          activity: true
        }
      });

      if (!activityGrade) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity grade not found"
        });
      }

      // Get the student grade
      let studentGrade = await prisma.studentGrade.findFirst({
        where: {
          gradeBookId,
          studentId
        }
      });

      // Create student grade if it doesn't exist
      if (!studentGrade) {
        studentGrade = await prisma.studentGrade.create({
          data: {
            gradeBookId,
            studentId,
            assessmentGrades: {},
            activityGrades: {}
          }
        });
      }

      // Extract bloomsLevelScores from attachments.gradingDetails
      const attachments = activityGrade.attachments as any;
      const bloomsLevelScores = attachments?.gradingDetails?.bloomsLevelScores;

      // Update the activity grades in the student grade
      const activityGrades = studentGrade.activityGrades as any || {};
      activityGrades[activityGradeId] = {
        score: activityGrade.score,
        maxScore: activityGrade.activity.maxScore,
        bloomsLevelScores: bloomsLevelScores || (
          activityGrade.activity.bloomsLevel ? {
            [activityGrade.activity.bloomsLevel]: activityGrade.score
          } : undefined
        )
      };

      // Update the student grade
      const updatedStudentGrade = await prisma.studentGrade.update({
        where: { id: studentGrade.id },
        data: {
          activityGrades: activityGrades
        }
      });

      return updatedStudentGrade;
    } catch (error) {
      logger.error('Error updating gradebook with activity grade', { error, gradeBookId, studentId, activityGradeId });
      throw error;
    }
  }
}
