/**
 * Topic Mastery tRPC Router
 *
 * This file contains tRPC routes for topic mastery functionality.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { BloomsTaxonomyLevel, MasteryLevel } from '../types';
import {
  MasteryCalculatorService,
  MasteryAnalyticsService,
  MasteryPartitionService,
  MasteryPartitionType
} from '../services';

// Enum schemas for zod validation
const BloomsTaxonomyLevelEnum = z.enum([
  BloomsTaxonomyLevel.REMEMBER,
  BloomsTaxonomyLevel.UNDERSTAND,
  BloomsTaxonomyLevel.APPLY,
  BloomsTaxonomyLevel.ANALYZE,
  BloomsTaxonomyLevel.EVALUATE,
  BloomsTaxonomyLevel.CREATE
]);

const MasteryPartitionTypeEnum = z.enum([
  'global',
  'subject',
  'topic',
  'class',
  'bloomsLevel'
] as const);

// Schema for partition options
const masteryPartitionOptionsSchema = z.object({
  partitionType: MasteryPartitionTypeEnum,
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  classId: z.string().optional(),
  bloomsLevel: BloomsTaxonomyLevelEnum.optional(),
  limit: z.number().min(1).max(100).default(10),
});

/**
 * Topic Mastery Router
 */
export const masteryRouter = createTRPCRouter({
  /**
   * Get topic mastery for a student
   */
  getTopicMastery: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      topicId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { studentId, topicId } = input;
      const userId = ctx.session.user.id;
      const userRole = ctx.session.user.userType;

      // Check permissions
      const isTeacher = userRole === 'TEACHER';
      const isOwnData = userId === studentId;

      if (!isTeacher && !isOwnData) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this data',
        });
      }

      // Get topic mastery data
      try {
        const masteryCalculator = new MasteryCalculatorService(ctx.prisma);
        const masteryData = await masteryCalculator.getTopicMastery(studentId, topicId);

        return masteryData;
      } catch (error) {
        console.error('Error getting topic mastery:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get topic mastery data',
        });
      }
    }),

  /**
   * Get student mastery analytics
   */
  getStudentAnalytics: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      subjectId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { studentId, subjectId } = input;
      const userId = ctx.session.user.id;
      const userRole = ctx.session.user.userType;

      // Check permissions
      const isTeacher = userRole === 'TEACHER';
      const isOwnData = userId === studentId;

      if (!isTeacher && !isOwnData) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this data',
        });
      }

      // Get student mastery analytics
      try {
        const masteryAnalytics = new MasteryAnalyticsService(ctx.prisma);
        const analytics = await masteryAnalytics.getStudentAnalytics(studentId, subjectId);

        return analytics;
      } catch (error) {
        console.error('Error getting student mastery analytics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get student mastery analytics',
        });
      }
    }),

  /**
   * Get class mastery analytics
   */
  getClassAnalytics: protectedProcedure
    .input(z.object({
      classId: z.string(),
      subjectId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { classId, subjectId } = input;
      const userRole = ctx.session.user.userType;

      // Check permissions
      const isTeacher = userRole === 'TEACHER';

      if (!isTeacher) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only teachers can access class analytics',
        });
      }

      // Get class mastery analytics
      try {
        const masteryAnalytics = new MasteryAnalyticsService(ctx.prisma);
        const analytics = await masteryAnalytics.getClassAnalytics(classId, subjectId);

        return analytics;
      } catch (error) {
        console.error('Error getting class mastery analytics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get class mastery analytics',
        });
      }
    }),

  /**
   * Get partitioned mastery data
   */
  getPartitionedMastery: protectedProcedure
    .input(masteryPartitionOptionsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = ctx.session.user.userType;

      // Check permissions for class partition
      if (input.partitionType === 'class' && userRole !== 'TEACHER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only teachers can access class partitions',
        });
      }

      // Get partitioned mastery data
      try {
        const masteryPartition = new MasteryPartitionService(ctx.prisma);
        const partitionedData = await masteryPartition.getPartitionedMasteryData({
          ...input,
          userId,
        });

        return partitionedData;
      } catch (error) {
        console.error('Error getting partitioned mastery data:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get partitioned mastery data',
        });
      }
    }),

  /**
   * Get multi-partition mastery data
   */
  getMultiPartitionMastery: protectedProcedure
    .input(z.array(masteryPartitionOptionsSchema))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = ctx.session.user.userType;

      // Check permissions for class partitions
      const hasClassPartition = input.some(partition => partition.partitionType === 'class');

      if (hasClassPartition && userRole !== 'TEACHER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only teachers can access class partitions',
        });
      }

      // Add user ID to each partition
      const partitionsWithUserId = input.map(partition => ({
        ...partition,
        userId,
      }));

      // Get multi-partition mastery data
      try {
        const masteryPartition = new MasteryPartitionService(ctx.prisma);
        const multiPartitionData = await masteryPartition.getMultiPartitionMasteryData(
          partitionsWithUserId
        );

        return multiPartitionData;
      } catch (error) {
        console.error('Error getting multi-partition mastery data:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get multi-partition mastery data',
        });
      }
    }),

  /**
   * Update topic mastery from assessment result
   */
  updateMasteryFromAssessment: protectedProcedure
    .input(z.object({
      assessmentResultId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { assessmentResultId } = input;
      const userRole = ctx.session.user.userType;

      // Check permissions
      const isTeacher = userRole === 'TEACHER';

      if (!isTeacher) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only teachers can update mastery data',
        });
      }

      // Get assessment result
      const assessmentResult = await ctx.prisma.assessmentResult.findUnique({
        where: { id: assessmentResultId },
        include: {
          assessment: {
            select: {
              subjectId: true,
              topicId: true,
            },
          },
        },
      });

      if (!assessmentResult) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Assessment result not found',
        });
      }

      // Convert to the format expected by the service
      const resultData = {
        id: assessmentResult.id,
        assessmentId: assessmentResult.assessmentId,
        studentId: assessmentResult.studentId,
        topicId: assessmentResult.assessment.topicId,
        subjectId: assessmentResult.assessment.subjectId,
        bloomsLevelScores: assessmentResult.bloomsLevelScores as any,
        totalScore: assessmentResult.score,
        maxScore: assessmentResult.maxScore,
        percentage: assessmentResult.percentage,
        completedAt: assessmentResult.completedAt,
      };

      // Update mastery data
      try {
        const masteryCalculator = new MasteryCalculatorService(ctx.prisma);
        const updatedMastery = await masteryCalculator.updateTopicMastery(
          assessmentResult.studentId,
          resultData
        );

        return updatedMastery;
      } catch (error) {
        console.error('Error updating mastery from assessment:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update mastery data',
        });
      }
    }),
});
