/**
 * Rubric Router
 *
 * This file contains tRPC routes for rubric management.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { BloomsTaxonomyLevel, RubricType } from '../types';

// Enum schemas for zod validation
const BloomsTaxonomyLevelEnum = z.enum([
  BloomsTaxonomyLevel.REMEMBER,
  BloomsTaxonomyLevel.UNDERSTAND,
  BloomsTaxonomyLevel.APPLY,
  BloomsTaxonomyLevel.ANALYZE,
  BloomsTaxonomyLevel.EVALUATE,
  BloomsTaxonomyLevel.CREATE
]);

const RubricTypeEnum = z.enum([
  RubricType.ANALYTIC,
  RubricType.HOLISTIC
]);

/**
 * Rubric Router
 */
export const rubricRouter = createTRPCRouter({
  /**
   * Get rubric criteria by topic ID
   */
  getCriteriaByTopic: protectedProcedure
    .input(z.object({
      topicId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { topicId } = input;

      try {
        // Find all rubrics that have learning outcomes associated with this topic
        const rubricCriteria = await ctx.prisma.rubricCriteria.findMany({
          where: {
            rubric: {
              learningOutcomes: {
                some: {
                  learningOutcome: {
                    topicId
                  }
                }
              }
            }
          },
          include: {
            rubric: {
              select: {
                id: true,
                title: true
              }
            },
            criteriaLevels: {
              include: {
                performanceLevel: true
              }
            }
          }
        });

        return rubricCriteria;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get rubric criteria by topic: ${(error as Error).message}`
        });
      }
    }),
  /**
   * Get a rubric by ID
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { id } = input;

      try {
        const rubric = await ctx.prisma.rubric.findUnique({
          where: { id },
          include: {
            criteria: {
              include: {
                criteriaLevels: {
                  include: {
                    performanceLevel: true
                  }
                }
              }
            },
            performanceLevels: true,
            learningOutcomes: {
              include: {
                learningOutcome: true
              }
            },
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        if (!rubric) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Rubric not found'
          });
        }

        return rubric;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get rubric: ${(error as Error).message}`
        });
      }
    }),

  /**
   * List rubrics with filtering
   */
  list: protectedProcedure
    .input(z.object({
      type: RubricTypeEnum.optional(),
      search: z.string().optional(),
      bloomsLevel: BloomsTaxonomyLevelEnum.optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0)
    }))
    .query(async ({ ctx, input }) => {
      const { type, search, bloomsLevel, limit, offset } = input;

      try {
        // Build where clause
        const where: any = {};

        if (type) {
          where.type = type;
        }

        if (search) {
          where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ];
        }

        if (bloomsLevel) {
          where.criteria = {
            some: {
              bloomsLevel
            }
          };
        }

        // Get rubrics
        const rubrics = await ctx.prisma.rubric.findMany({
          where,
          include: {
            criteria: {
              select: {
                id: true,
                name: true,
                bloomsLevel: true
              }
            },
            _count: {
              select: {
                criteria: true,
                performanceLevels: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: limit,
          skip: offset
        });

        // Get total count
        const total = await ctx.prisma.rubric.count({ where });

        return {
          rubrics,
          total
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to list rubrics: ${(error as Error).message}`
        });
      }
    }),

  /**
   * Create a new rubric
   */
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
      type: RubricTypeEnum,
      maxScore: z.number().positive(),
      subjectId: z.string().optional(),
      learningOutcomeIds: z.array(z.string()).optional(),
      criteria: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        bloomsLevel: BloomsTaxonomyLevelEnum,
        weight: z.number(),
        topicId: z.string().optional(),
        learningOutcomeId: z.string().optional(),
        performanceLevels: z.array(z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          scorePercentage: z.number(),
          color: z.string()
        }))
      })).optional(),
      performanceLevels: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        scorePercentage: z.number(),
        color: z.string()
      })).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { criteria = [], performanceLevels = [], learningOutcomeIds = [], ...rubricData } = input;

        // Create the rubric with criteria and performance levels
        const rubric = await ctx.prisma.rubric.create({
          data: {
            ...rubricData,
            createdById: ctx.session.user.id,
            // Create performance levels first
            performanceLevels: {
              create: performanceLevels.map(level => ({
                name: level.name,
                description: level.description,
                minScore: Math.floor((level.scorePercentage / 100) * input.maxScore),
                maxScore: Math.ceil((level.scorePercentage / 100) * input.maxScore),
                color: level.color
              }))
            },
            // Create criteria with their levels
            criteria: {
              create: criteria.map(criterion => ({
                name: criterion.name,
                description: criterion.description,
                bloomsLevel: criterion.bloomsLevel,
                weight: criterion.weight,
                topicId: criterion.topicId,
                learningOutcomeId: criterion.learningOutcomeId
              }))
            },
            // Associate with learning outcomes
            learningOutcomes: {
              create: learningOutcomeIds.map(learningOutcomeId => ({
                learningOutcomeId
              }))
            }
          },
          include: {
            criteria: true,
            performanceLevels: true,
            learningOutcomes: {
              include: {
                learningOutcome: true
              }
            }
          }
        });

        return rubric;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create rubric: ${(error as Error).message}`
        });
      }
    }),

  /**
   * Get reusable criteria from topics and learning outcomes
   */
  getReusableCriteria: protectedProcedure
    .input(z.object({
      topicId: z.string().optional(),
      learningOutcomeIds: z.array(z.string()).optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { topicId, learningOutcomeIds = [] } = input;

        // Build where conditions
        const whereConditions: any[] = [];

        if (topicId) {
          whereConditions.push({ topicId });
        }

        if (learningOutcomeIds.length > 0) {
          whereConditions.push({ learningOutcomeId: { in: learningOutcomeIds } });
        }

        // Get existing criteria that can be reused
        const reusableCriteria = await ctx.prisma.rubricCriteria.findMany({
          where: {
            ...(whereConditions.length > 0 ? { OR: whereConditions } : {}),
            status: 'ACTIVE'
          },
          include: {
            rubric: {
              select: {
                id: true,
                title: true
              }
            },
            criteriaLevels: {
              include: {
                performanceLevel: true
              }
            }
          },
          orderBy: [
            { createdAt: 'desc' }
          ]
        });

        return {
          criteria: reusableCriteria,
          total: reusableCriteria.length
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get reusable criteria: ${(error as Error).message}`
        });
      }
    })
});
