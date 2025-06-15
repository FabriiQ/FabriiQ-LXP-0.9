/**
 * Learning Outcome Router
 *
 * This file contains tRPC routes for learning outcomes.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';
import { LearningOutcomeService } from '@/server/api/services/learning-outcome.service';

// Enum schema for zod validation
const BloomsTaxonomyLevelEnum = z.enum([
  BloomsTaxonomyLevel.REMEMBER,
  BloomsTaxonomyLevel.UNDERSTAND,
  BloomsTaxonomyLevel.APPLY,
  BloomsTaxonomyLevel.ANALYZE,
  BloomsTaxonomyLevel.EVALUATE,
  BloomsTaxonomyLevel.CREATE
]);

// Input validation schemas
const createLearningOutcomeSchema = z.object({
  statement: z.string().min(1, "Statement is required"),
  description: z.string().optional(),
  bloomsLevel: BloomsTaxonomyLevelEnum,
  actionVerbs: z.array(z.string()).min(1, "At least one action verb is required"),
  subjectId: z.string(),
  topicId: z.string().optional(),
  hasCriteria: z.boolean().optional(),
  criteria: z.array(z.any()).optional(),
  performanceLevels: z.array(z.any()).optional(),
});

const updateLearningOutcomeSchema = z.object({
  statement: z.string().min(1, "Statement is required").optional(),
  description: z.string().optional(),
  bloomsLevel: BloomsTaxonomyLevelEnum.optional(),
  actionVerbs: z.array(z.string()).min(1, "At least one action verb is required").optional(),
  hasCriteria: z.boolean().optional(),
  criteria: z.array(z.any()).optional(),
  performanceLevels: z.array(z.any()).optional(),
});

export const learningOutcomeRouter = createTRPCRouter({
  // Create a new learning outcome
  create: protectedProcedure
    .input(createLearningOutcomeSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new LearningOutcomeService(ctx.prisma);

      return service.createLearningOutcome({
        statement: input.statement,
        description: input.description,
        bloomsLevel: input.bloomsLevel,
        actionVerbs: input.actionVerbs,
        subjectId: input.subjectId,
        topicId: input.topicId,
        createdById: ctx.session.user.id,
        hasCriteria: input.hasCriteria,
        criteria: input.criteria,
        performanceLevels: input.performanceLevels,
      });
    }),

  // Update an existing learning outcome
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateLearningOutcomeSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new LearningOutcomeService(ctx.prisma);

      return service.updateLearningOutcome(input.id, {
        statement: input.data.statement,
        description: input.data.description,
        bloomsLevel: input.data.bloomsLevel,
        actionVerbs: input.data.actionVerbs,
        hasCriteria: input.data.hasCriteria,
        criteria: input.data.criteria,
        performanceLevels: input.data.performanceLevels,
      });
    }),

  // Delete a learning outcome
  delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new LearningOutcomeService(ctx.prisma);

      return service.deleteLearningOutcome(input.id);
    }),

  // Get a single learning outcome by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new LearningOutcomeService(ctx.prisma);

      return service.getLearningOutcomeById(input.id);
    }),

  // Get learning outcomes by subject ID
  getBySubject: protectedProcedure
    .input(z.object({
      subjectId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new LearningOutcomeService(ctx.prisma);

      return service.getLearningOutcomesBySubject(input.subjectId);
    }),

  // Get learning outcomes by topic ID
  getByTopic: protectedProcedure
    .input(z.object({
      topicId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new LearningOutcomeService(ctx.prisma);

      return service.getLearningOutcomesByTopic(input.topicId);
    }),

  // Get learning outcomes by multiple topic IDs
  getByTopics: protectedProcedure
    .input(z.object({
      topicIds: z.array(z.string()),
    }))
    .query(async ({ ctx, input }) => {
      const service = new LearningOutcomeService(ctx.prisma);

      return service.getLearningOutcomesByTopics(input.topicIds);
    }),

  // Get learning outcomes by IDs
  getByIds: protectedProcedure
    .input(z.object({
      ids: z.array(z.string()),
    }))
    .query(async ({ ctx, input }) => {
      const service = new LearningOutcomeService(ctx.prisma);

      return service.getLearningOutcomesByIds(input.ids);
    }),

  // Get learning outcomes with pagination and filtering
  getAll: protectedProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(10),
      subjectId: z.string().optional(),
      topicId: z.string().optional(),
      bloomsLevel: BloomsTaxonomyLevelEnum.optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new LearningOutcomeService(ctx.prisma);

      return service.getLearningOutcomes({
        page: input.page,
        pageSize: input.pageSize,
        subjectId: input.subjectId,
        topicId: input.topicId,
        bloomsLevel: input.bloomsLevel,
        search: input.search,
      });
    }),
});
