/**
 * Gradebook Bloom's Taxonomy Integration Router
 *
 * This router provides API endpoints for integrating Bloom's Taxonomy with the gradebook system.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { GradebookBloomIntegrationService } from '@/server/api/services/gradebook-bloom-integration.service';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

// Create enum schema for Bloom's Taxonomy levels
const BloomsTaxonomyLevelEnum = z.enum([
  BloomsTaxonomyLevel.REMEMBER,
  BloomsTaxonomyLevel.UNDERSTAND,
  BloomsTaxonomyLevel.APPLY,
  BloomsTaxonomyLevel.ANALYZE,
  BloomsTaxonomyLevel.EVALUATE,
  BloomsTaxonomyLevel.CREATE
]);

/**
 * Gradebook Bloom's Taxonomy Integration Router
 */
export const gradebookBloomIntegrationRouter = createTRPCRouter({
  /**
   * Update gradebook calculation rules with Bloom's Taxonomy settings
   */
  updateGradebookBloomsSettings: protectedProcedure
    .input(z.object({
      gradebookId: z.string(),
      bloomsWeights: z.record(BloomsTaxonomyLevelEnum, z.number()).optional(),
      enableBloomsAnalytics: z.boolean().optional(),
      showBloomsDistribution: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { gradebookId, bloomsWeights, enableBloomsAnalytics, showBloomsDistribution } = input;

      try {
        // Get the gradebook
        const gradebook = await ctx.prisma.gradeBook.findUnique({
          where: { id: gradebookId }
        });

        if (!gradebook) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Gradebook not found"
          });
        }

        // Get the current calculation rules
        const calculationRules = gradebook.calculationRules as any;

        // Update the calculation rules with Bloom's Taxonomy settings
        const updatedCalculationRules = {
          ...calculationRules,
          bloomsWeights: bloomsWeights || calculationRules.bloomsWeights,
          enableBloomsAnalytics: enableBloomsAnalytics !== undefined ? enableBloomsAnalytics : calculationRules.enableBloomsAnalytics,
          showBloomsDistribution: showBloomsDistribution !== undefined ? showBloomsDistribution : calculationRules.showBloomsDistribution
        };

        // Update the gradebook
        const updatedGradebook = await ctx.prisma.gradeBook.update({
          where: { id: gradebookId },
          data: {
            calculationRules: updatedCalculationRules,
            updatedById: ctx.session.user.id
          }
        });

        return updatedGradebook;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update gradebook Bloom's settings: ${(error as Error).message}`
        });
      }
    }),

  /**
   * Get Bloom's level scores for a student in a gradebook
   */
  getStudentBloomsLevelScores: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      gradebookId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { studentId, gradebookId } = input;

      try {
        const service = new GradebookBloomIntegrationService({ prisma: ctx.prisma });
        return await service.calculateBloomsLevelScores(studentId, gradebookId);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get student Bloom's level scores: ${(error as Error).message}`
        });
      }
    }),

  /**
   * Update gradebook with activity grade
   */
  updateGradebookWithActivityGrade: protectedProcedure
    .input(z.object({
      gradebookId: z.string(),
      studentId: z.string(),
      activityGradeId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const { gradebookId, studentId, activityGradeId } = input;

      try {
        const service = new GradebookBloomIntegrationService({ prisma: ctx.prisma });
        return await service.updateGradebookWithActivityGrade(gradebookId, studentId, activityGradeId);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update gradebook with activity grade: ${(error as Error).message}`
        });
      }
    }),

  /**
   * Update topic mastery from gradebook
   */
  updateTopicMasteryFromGradebook: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      classId: z.string(),
      topicId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const { studentId, classId, topicId } = input;

      try {
        // Get all activity grades for this student, class, and topic
        const activityGrades = await ctx.prisma.activityGrade.findMany({
          where: {
            studentId,
            activity: {
              classId,
              topicId
            },
            status: "GRADED"
          },
          include: {
            activity: true
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

        // Convert raw scores to percentages
        Object.keys(bloomsLevelScores).forEach(level => {
          const typedLevel = level as BloomsTaxonomyLevel;
          if (totalPossiblePoints[typedLevel] > 0) {
            bloomsLevelScores[typedLevel] = (bloomsLevelScores[typedLevel] / totalPossiblePoints[typedLevel]) * 100;
          }
        });

        // Calculate overall mastery as average of all levels
        const overallMastery = Object.values(bloomsLevelScores).reduce((sum, score) => sum + score, 0) / 
          Object.values(bloomsLevelScores).filter(score => score > 0).length || 0;

        // Update topic mastery
        const topicMastery = await ctx.prisma.topicMastery.upsert({
          where: {
            studentId_topicId: {
              studentId,
              topicId
            }
          },
          update: {
            rememberLevel: bloomsLevelScores[BloomsTaxonomyLevel.REMEMBER],
            understandLevel: bloomsLevelScores[BloomsTaxonomyLevel.UNDERSTAND],
            applyLevel: bloomsLevelScores[BloomsTaxonomyLevel.APPLY],
            analyzeLevel: bloomsLevelScores[BloomsTaxonomyLevel.ANALYZE],
            evaluateLevel: bloomsLevelScores[BloomsTaxonomyLevel.EVALUATE],
            createLevel: bloomsLevelScores[BloomsTaxonomyLevel.CREATE],
            overallMastery,
            updatedAt: new Date()
          },
          create: {
            studentId,
            topicId,
            subjectId: activityGrades[0]?.activity.subjectId || '',
            rememberLevel: bloomsLevelScores[BloomsTaxonomyLevel.REMEMBER],
            understandLevel: bloomsLevelScores[BloomsTaxonomyLevel.UNDERSTAND],
            applyLevel: bloomsLevelScores[BloomsTaxonomyLevel.APPLY],
            analyzeLevel: bloomsLevelScores[BloomsTaxonomyLevel.ANALYZE],
            evaluateLevel: bloomsLevelScores[BloomsTaxonomyLevel.EVALUATE],
            createLevel: bloomsLevelScores[BloomsTaxonomyLevel.CREATE],
            overallMastery,
            lastAssessmentDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        return topicMastery;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update topic mastery from gradebook: ${(error as Error).message}`
        });
      }
    })
});
