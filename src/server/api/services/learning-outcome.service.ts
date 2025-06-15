/**
 * Learning Outcome Service
 *
 * This file contains the service for managing learning outcomes.
 */

import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';
import { parseLearningOutcomeCriteria, generateDefaultCriteria, generateDefaultPerformanceLevels } from '@/features/bloom/utils/learning-outcome-helpers';

interface CreateLearningOutcomeInput {
  statement: string;
  description?: string;
  bloomsLevel: BloomsTaxonomyLevel;
  actionVerbs: string[];
  subjectId: string;
  topicId?: string;
  createdById: string;
  hasCriteria?: boolean;
  criteria?: any[];
  performanceLevels?: any[];
}

interface UpdateLearningOutcomeInput {
  statement?: string;
  description?: string;
  bloomsLevel?: BloomsTaxonomyLevel;
  actionVerbs?: string[];
  hasCriteria?: boolean;
  criteria?: any[];
  performanceLevels?: any[];
}

interface GetLearningOutcomesOptions {
  page: number;
  pageSize: number;
  subjectId?: string;
  topicId?: string;
  bloomsLevel?: BloomsTaxonomyLevel;
  search?: string;
}

export class LearningOutcomeService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new learning outcome
   */
  async createLearningOutcome(input: CreateLearningOutcomeInput) {
    try {
      // Validate subject exists
      const subject = await this.prisma.subject.findUnique({
        where: { id: input.subjectId },
      });

      if (!subject) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subject not found',
        });
      }

      // Validate topic exists if provided
      if (input.topicId) {
        const topic = await this.prisma.subjectTopic.findUnique({
          where: { id: input.topicId },
        });

        if (!topic) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Topic not found',
          });
        }

        // Ensure topic belongs to the subject
        if (topic.subjectId !== input.subjectId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Topic does not belong to the specified subject',
          });
        }
      }

      // Generate default criteria if requested but not provided
      let criteriaToUse = input.criteria;
      let performanceLevelsToUse = input.performanceLevels;
      let hasCriteriaToUse = input.hasCriteria || false;

      if (hasCriteriaToUse && (!criteriaToUse || criteriaToUse.length === 0)) {
        criteriaToUse = generateDefaultCriteria(input.bloomsLevel, input.statement);
      }

      if (hasCriteriaToUse && (!performanceLevelsToUse || performanceLevelsToUse.length === 0)) {
        performanceLevelsToUse = generateDefaultPerformanceLevels();
      }

      // Create learning outcome
      const createData: any = {
        statement: input.statement,
        description: input.description,
        bloomsLevel: input.bloomsLevel as any, // Cast to any to handle enum
        actionVerbs: input.actionVerbs,
        subjectId: input.subjectId,
        topicId: input.topicId,
        createdById: input.createdById,
        hasCriteria: hasCriteriaToUse,
        criteria: criteriaToUse as any, // Cast to any to handle JSON
        performanceLevels: performanceLevelsToUse as any, // Cast to any to handle JSON
      };

      const learningOutcome = await this.prisma.learningOutcome.create({
        data: createData,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
              code: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Create reusable RubricCriteria if criteria were provided
      if (hasCriteriaToUse && criteriaToUse && Array.isArray(criteriaToUse)) {
        await this.createReusableCriteria(
          learningOutcome.id,
          input.topicId,
          input.subjectId,
          criteriaToUse,
          input.createdById
        );
      }

      // Parse JSON fields
      return parseLearningOutcomeCriteria(learningOutcome);
    } catch (error) {
      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Error creating learning outcome:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create learning outcome',
        cause: error,
      });
    }
  }

  /**
   * Update an existing learning outcome
   */
  async updateLearningOutcome(id: string, input: UpdateLearningOutcomeInput) {
    try {
      // Check if learning outcome exists
      const existingOutcome = await this.prisma.learningOutcome.findUnique({
        where: { id },
      });

      if (!existingOutcome) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Learning outcome not found',
        });
      }

      // Prepare update data
      const updateData: any = {};
      if (input.statement !== undefined) updateData.statement = input.statement;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.bloomsLevel !== undefined) updateData.bloomsLevel = input.bloomsLevel;
      if (input.actionVerbs !== undefined) updateData.actionVerbs = input.actionVerbs;
      if (input.hasCriteria !== undefined) updateData.hasCriteria = input.hasCriteria;
      if (input.criteria !== undefined) updateData.criteria = input.criteria ? (input.criteria as any) : null;
      if (input.performanceLevels !== undefined) updateData.performanceLevels = input.performanceLevels ? (input.performanceLevels as any) : null;

      // Update learning outcome
      const updatedOutcome = await this.prisma.learningOutcome.update({
        where: { id },
        data: updateData,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
              code: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return updatedOutcome;
    } catch (error) {
      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Error updating learning outcome:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update learning outcome',
        cause: error,
      });
    }
  }

  /**
   * Delete a learning outcome
   */
  async deleteLearningOutcome(id: string) {
    try {
      // Check if learning outcome exists
      const existingOutcome = await this.prisma.learningOutcome.findUnique({
        where: { id },
      });

      if (!existingOutcome) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Learning outcome not found',
        });
      }

      // Delete learning outcome
      await this.prisma.learningOutcome.delete({
        where: { id },
      });

      return { success: true };
    } catch (error) {
      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Error deleting learning outcome:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete learning outcome',
        cause: error,
      });
    }
  }

  /**
   * Get a learning outcome by ID
   */
  async getLearningOutcomeById(id: string) {
    try {
      const learningOutcome = await this.prisma.learningOutcome.findUnique({
        where: { id },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
              code: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!learningOutcome) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Learning outcome not found',
        });
      }

      // Parse JSON fields
      return parseLearningOutcomeCriteria(learningOutcome);
    } catch (error) {
      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Error fetching learning outcome:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch learning outcome',
        cause: error,
      });
    }
  }

  /**
   * Get learning outcomes by subject ID
   */
  async getLearningOutcomesBySubject(subjectId: string) {
    try {
      const learningOutcomes = await this.prisma.learningOutcome.findMany({
        where: { subjectId },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
              code: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Parse JSON fields
      return learningOutcomes.map(outcome => parseLearningOutcomeCriteria(outcome));
    } catch (error) {
      console.error('Error fetching learning outcomes by subject:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch learning outcomes',
        cause: error,
      });
    }
  }

  /**
   * Get learning outcomes by topic ID
   */
  async getLearningOutcomesByTopic(topicId: string) {
    try {
      const learningOutcomes = await this.prisma.learningOutcome.findMany({
        where: { topicId },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
              code: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Parse JSON fields
      return learningOutcomes.map(outcome => parseLearningOutcomeCriteria(outcome));
    } catch (error) {
      console.error('Error fetching learning outcomes by topic:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch learning outcomes',
        cause: error,
      });
    }
  }

  /**
   * Get learning outcomes by multiple topic IDs
   */
  async getLearningOutcomesByTopics(topicIds: string[]) {
    try {
      if (!topicIds || topicIds.length === 0) {
        return [];
      }

      const learningOutcomes = await this.prisma.learningOutcome.findMany({
        where: {
          topicId: {
            in: topicIds
          }
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
              code: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Parse JSON fields
      return learningOutcomes.map(outcome => parseLearningOutcomeCriteria(outcome));
    } catch (error) {
      console.error('Error fetching learning outcomes by topics:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch learning outcomes',
        cause: error,
      });
    }
  }

  /**
   * Get learning outcomes by IDs
   */
  async getLearningOutcomesByIds(ids: string[]) {
    try {
      if (!ids || ids.length === 0) {
        return [];
      }

      const learningOutcomes = await this.prisma.learningOutcome.findMany({
        where: {
          id: {
            in: ids
          }
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
              code: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Parse JSON fields
      return learningOutcomes.map(outcome => parseLearningOutcomeCriteria(outcome));
    } catch (error) {
      console.error('Error fetching learning outcomes by IDs:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch learning outcomes',
        cause: error,
      });
    }
  }

  /**
   * Get learning outcomes with pagination and filtering
   */
  async getLearningOutcomes(options: GetLearningOutcomesOptions) {
    try {
      const { page, pageSize, subjectId, topicId, bloomsLevel, search } = options;
      const skip = (page - 1) * pageSize;

      // Build the where clause
      const where: any = {};

      if (subjectId) {
        where.subjectId = subjectId;
      }

      if (topicId) {
        where.topicId = topicId;
      }

      if (bloomsLevel) {
        where.bloomsLevel = bloomsLevel;
      }

      if (search) {
        where.OR = [
          { statement: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Count total records
      const total = await this.prisma.learningOutcome.count({ where });

      // Fetch data with pagination
      const learningOutcomes = await this.prisma.learningOutcome.findMany({
        where,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
              code: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      });

      // Parse JSON fields
      const parsedOutcomes = learningOutcomes.map(outcome => parseLearningOutcomeCriteria(outcome));

      return {
        data: parsedOutcomes,
        pagination: {
          page,
          pageSize,
          total,
          pageCount: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      console.error('Error fetching learning outcomes:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch learning outcomes',
        cause: error,
      });
    }
  }

  /**
   * Create reusable RubricCriteria from learning outcome criteria
   */
  private async createReusableCriteria(
    learningOutcomeId: string,
    topicId: string | undefined,
    subjectId: string,
    criteria: any[],
    createdById: string
  ) {
    try {
      // Create a temporary rubric to hold the criteria
      const tempRubric = await this.prisma.rubric.create({
        data: {
          title: `Criteria for Learning Outcome ${learningOutcomeId}`,
          description: 'Temporary rubric to hold reusable criteria',
          type: 'ANALYTIC',
          maxScore: 100,
          subjectId,
          createdById,
        },
      });

      // Create RubricCriteria records associated with learning outcome and topic
      for (const criterion of criteria) {
        const criteriaData: any = {
          name: criterion.name,
          description: criterion.description,
          bloomsLevel: criterion.bloomsLevel,
          weight: criterion.weight || 1,
          rubricId: tempRubric.id,
          status: 'ACTIVE',
        };

        // Add optional fields if they exist in the schema
        if (subjectId) criteriaData.subjectId = subjectId;
        if (topicId) criteriaData.topicId = topicId;
        if (learningOutcomeId) criteriaData.learningOutcomeId = learningOutcomeId;

        await this.prisma.rubricCriteria.create({
          data: criteriaData,
        });
      }

      console.log(`Created ${criteria.length} reusable criteria for learning outcome ${learningOutcomeId}`);
    } catch (error) {
      console.error('Error creating reusable criteria:', error);
      // Don't throw error here to avoid breaking learning outcome creation
    }
  }
}
