/**
 * Bloom's Taxonomy tRPC Router
 *
 * This file contains tRPC routes for Bloom's Taxonomy classification and rubric generation.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
// Import the agent orchestration system from the agents feature
import { AgentRegistry, AgentType, AgentState } from '@/features/agents';

// Define a custom interface for our agent with execute method
interface BloomsAgent extends AgentState {
  execute: (params: any) => Promise<any>;
}
import { BloomsTaxonomyLevel, RubricType, LearningOutcomeFramework } from '../types';

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

const ContentTypeEnum = z.enum([
  'learning_outcome',
  'question',
  'activity',
  'assessment'
]);

const LearningOutcomeFrameworkEnum = z.enum([
  LearningOutcomeFramework.ABCD,
  LearningOutcomeFramework.SMART,
  LearningOutcomeFramework.SIMPLE
]);

/**
 * Bloom's Taxonomy Router
 */
export const bloomRouter = createTRPCRouter({
  /**
   * Test API configuration
   */
  testAPIConfiguration: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const { testGeminiAPIConfiguration } = await import('../utils/api-test');
        const result = await testGeminiAPIConfiguration();
        return result;
      } catch (error: any) {
        console.error('Error testing API configuration:', error);
        return {
          success: false,
          message: 'Failed to run API test',
          details: { error: error.message }
        };
      }
    }),

  /**
   * Generate learning outcomes for a specific topic and Bloom's level
   */
  generateLearningOutcomes: protectedProcedure
    .input(z.object({
      topic: z.string(),
      level: BloomsTaxonomyLevelEnum,
      count: z.number().min(1).max(10),
      customPrompt: z.string().optional(),
      taxonomyDistribution: z.record(BloomsTaxonomyLevelEnum, z.number()).optional(),
      selectedActionVerbs: z.array(z.string()).optional(),
      framework: LearningOutcomeFrameworkEnum.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { topic, level, count, customPrompt, taxonomyDistribution, selectedActionVerbs, framework } = input;

      try {
        console.log('Generating learning outcomes for:', { topic, level, count });

        // Import the RealBloomAgentService
        const { RealBloomAgentService } = await import('../services/agent/real-bloom-agent.service');

        // Create an instance of the service
        const bloomAgentService = new RealBloomAgentService();

        // Generate learning outcomes with optional custom prompt, taxonomy distribution, action verbs, and framework
        const outcomes = await bloomAgentService.generateLearningOutcomes(
          topic,
          level,
          count,
          customPrompt,
          taxonomyDistribution as Record<BloomsTaxonomyLevel, number> | undefined,
          selectedActionVerbs,
          framework
        );

        console.log('Successfully generated learning outcomes:', outcomes?.length || 0);
        return outcomes;
      } catch (error: any) {
        console.error('Error generating learning outcomes:', error);

        // Provide more specific error messages based on the error type
        let errorMessage = 'Failed to generate learning outcomes';

        if (error.message?.includes('API key')) {
          errorMessage = 'AI service configuration error. Please contact support.';
        } else if (error.message?.includes('quota') || error.message?.includes('QUOTA')) {
          errorMessage = 'AI service temporarily unavailable. Please try again later.';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message?.includes('Empty response')) {
          errorMessage = 'AI service returned empty response. Please try again.';
        } else if (error.message) {
          errorMessage = `Generation failed: ${error.message}`;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
        });
      }
    }),
  /**
   * Classify content according to Bloom's Taxonomy
   */
  classifyContent: protectedProcedure
    .input(z.object({
      content: z.string(),
      contentType: ContentTypeEnum.optional(),
      targetLevel: BloomsTaxonomyLevelEnum.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { content, contentType = 'learning_outcome', targetLevel } = input;

      try {
        // Get the agent registry instance
        const registry = AgentRegistry.getInstance();

        // Get the agent factory for the classification agent
        const factory = await registry.getAgentFactory('blooms-classification' as any);

        if (!factory) {
          throw new Error('Bloom\'s classification agent factory not found');
        }

        // Create the agent
        const agent = await factory({
          id: 'blooms-classification-agent',
          type: 'blooms-classification' as any,
          status: 'idle',
          messages: [],
          memory: [],
          tools: [],
          metadata: {}
        }) as BloomsAgent;

        // Execute the agent with the input parameters
        const result = await agent.execute({
          content,
          contentType,
          targetLevel
        });

        return result;
      } catch (error) {
        console.error('Error classifying content:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to classify content',
        });
      }
    }),

  /**
   * Generate a rubric aligned with Bloom's Taxonomy
   */
  generateRubric: protectedProcedure
    .input(z.object({
      request: z.object({
        title: z.string(),
        type: RubricTypeEnum,
        bloomsLevels: z.array(BloomsTaxonomyLevelEnum),
        learningOutcomeIds: z.array(z.string()),
        maxScore: z.number().positive(),
        criteriaCount: z.number().positive().optional(),
        performanceLevelCount: z.number().positive().optional(),
        subject: z.string().optional(),
        topic: z.string().optional(),
        gradeLevel: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { request } = input;

      // Get learning outcomes
      const learningOutcomes = await ctx.prisma.learningOutcome.findMany({
        where: {
          id: {
            in: request.learningOutcomeIds
          }
        },
        select: {
          id: true,
          statement: true,
          bloomsLevel: true,
        }
      });

      if (learningOutcomes.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No learning outcomes found with the provided IDs',
        });
      }

      // Get existing rubrics for reference
      const existingRubrics = await ctx.prisma.rubric.findMany({
        where: {
          type: request.type,
        },
        select: {
          id: true,
          title: true,
          type: true,
          criteria: {
            select: {
              id: true,
              name: true,
              description: true,
              bloomsLevel: true,
            }
          },
          performanceLevels: {
            select: {
              id: true,
              name: true,
              description: true,
              minScore: true,
              maxScore: true,
            }
          }
        },
        take: 2,
      });

      try {
        // Get the agent registry instance
        const registry = AgentRegistry.getInstance();

        // Get the agent factory for the rubric generation agent
        const factory = await registry.getAgentFactory('rubric-generation' as any);

        if (!factory) {
          throw new Error('Rubric generation agent factory not found');
        }

        // Create the agent
        const agent = await factory({
          id: 'rubric-generation-agent',
          type: 'rubric-generation' as any,
          status: 'idle',
          messages: [],
          memory: [],
          tools: [],
          metadata: {}
        }) as BloomsAgent;

        // Get existing rubrics for reference
        const existingRubrics = await ctx.prisma.rubric.findMany({
          where: {
            type: request.type,
          },
          take: 2,
          include: {
            criteria: {
              include: {
                criteriaLevels: true
              }
            }
          }
        });

        // Execute the agent with the input parameters
        const result = await agent.execute({
          request,
          learningOutcomes,
          existingRubrics: existingRubrics.length > 0 ? existingRubrics : undefined
        });

        // Save the generated rubric to the database
        const savedRubric = await ctx.prisma.rubric.create({
          data: {
            title: result.rubric.title,
            description: result.rubric.description,
            type: result.rubric.type,
            maxScore: result.rubric.maxScore,
            bloomsDistribution: result.rubric.bloomsDistribution,
            createdById: ctx.session.user.id,
            criteria: {
              create: result.rubric.criteria.map(criteria => ({
                name: criteria.name,
                description: criteria.description,
                bloomsLevel: criteria.bloomsLevel,
                weight: criteria.weight,
                criteriaLevels: {
                  create: criteria.performanceLevels.map(level => ({
                    description: level.description,
                    score: level.score,
                    performanceLevel: {
                      create: {
                        name: result.rubric.performanceLevels.find(pl => pl.id === level.levelId)?.name || 'Level',
                        description: result.rubric.performanceLevels.find(pl => pl.id === level.levelId)?.description || '',
                        minScore: result.rubric.performanceLevels.find(pl => pl.id === level.levelId)?.scoreRange.min || 0,
                        maxScore: result.rubric.performanceLevels.find(pl => pl.id === level.levelId)?.scoreRange.max || 100,
                        color: result.rubric.performanceLevels.find(pl => pl.id === level.levelId)?.color,
                      }
                    }
                  }))
                }
              }))
            },
            learningOutcomes: {
              create: request.learningOutcomeIds.map(id => ({
                learningOutcome: {
                  connect: { id }
                }
              }))
            }
          }
        });

        return {
          rubric: savedRubric,
          explanation: result.explanation
        };
      } catch (error) {
        console.error('Error generating rubric:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate rubric',
        });
      }
    }),

  /**
   * Generate an activity aligned with Bloom's Taxonomy
   */
  generateActivity: protectedProcedure
    .input(z.object({
      bloomsLevel: BloomsTaxonomyLevelEnum,
      learningOutcomeIds: z.array(z.string()),
      title: z.string().optional(),
      type: z.string().optional(),
      setting: z.string().optional(),
      duration: z.number().positive().optional(),
      groupSize: z.number().positive().optional(),
      subject: z.string().optional(),
      topic: z.string().optional(),
      gradeLevel: z.string().optional(),
      includeRubric: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const {
        bloomsLevel,
        learningOutcomeIds,
        title,
        type,
        setting,
        duration,
        groupSize,
        subject,
        topic,
        gradeLevel,
        includeRubric = false
      } = input;

      // Get learning outcomes
      const learningOutcomes = await ctx.prisma.learningOutcome.findMany({
        where: {
          id: {
            in: learningOutcomeIds
          }
        },
        select: {
          id: true,
          statement: true,
          bloomsLevel: true,
        }
      });

      if (learningOutcomes.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No learning outcomes found with the provided IDs',
        });
      }

      // Get existing activities for reference
      const existingActivities = await ctx.prisma.activity.findMany({
        where: {
          bloomsLevel,
        },
        select: {
          id: true,
          title: true,
          // Use content field instead of description
          content: true,
          // These fields might not exist in the schema
          purpose: true,
          bloomsLevel: true,
        },
        take: 2,
      });

      try {
        // Get the agent registry instance
        const registry = AgentRegistry.getInstance();

        // Get the agent factory for the activity generation agent
        const factory = await registry.getAgentFactory('activity-generation' as any);

        if (!factory) {
          throw new Error('Activity generation agent factory not found');
        }

        // Create the agent
        const agent = await factory({
          id: 'activity-generation-agent',
          type: 'activity-generation' as any,
          status: 'idle',
          messages: [],
          memory: [],
          tools: [],
          metadata: {}
        }) as BloomsAgent;

        // Get existing activities for reference
        const existingActivitiesForAgent = await ctx.prisma.activity.findMany({
          where: {
            bloomsLevel,
          },
          select: {
            id: true,
            title: true,
            // Use content field instead of description
            content: true,
            // These fields might not exist in the schema
            purpose: true,
            bloomsLevel: true,
          },
          take: 2,
        });

        // Execute the agent with the input parameters
        const result = await agent.execute({
          request: {
            title,
            bloomsLevel,
            learningOutcomeIds,
            type,
            setting,
            duration,
            groupSize,
            subject,
            topic,
            gradeLevel,
            includeRubric,
          },
          learningOutcomes,
          existingActivities: existingActivitiesForAgent.length > 0 ? existingActivitiesForAgent : undefined
        });

        // Save the generated activity to the database
        const savedActivity = await ctx.prisma.activity.create({
          data: {
            title: result.activity.title,
            // Store description in content JSON
            content: {
              description: result.activity.description,
              instructions: result.activity.instructions,
              materials: result.activity.materials,
              groupSize: result.activity.groupSize,
            },
            purpose: 'LEARNING', // Default purpose
            bloomsLevel: result.activity.bloomsLevel,
            duration: result.activity.duration,
            createdById: ctx.session.user.id,
            subjectId: subject || 'default-subject', // Replace with actual subject ID
            classId: 'default-class', // Replace with actual class ID
            topicId: topic, // Optional
            learningOutcomes: {
              create: learningOutcomeIds.map(id => ({
                learningOutcome: {
                  connect: { id }
                }
              }))
            },
            // Add rubric if included
            ...(result.rubric && includeRubric ? {
              rubric: {
                create: {
                  title: result.rubric.title,
                  description: `Rubric for ${result.activity.title}`,
                  type: RubricType.ANALYTIC,
                  maxScore: 100,
                  createdById: ctx.session.user.id,
                  criteria: {
                    create: result.rubric.criteria.map(criteria => ({
                      name: criteria.name,
                      description: criteria.description,
                      bloomsLevel: criteria.bloomsLevel,
                      weight: 1,
                    }))
                  }
                }
              }
            } : {})
          }
        });

        return {
          activity: savedActivity,
          hasRubric: !!result.rubric,
        };
      } catch (error) {
        console.error('Error generating activity:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate activity',
        });
      }
    }),

  /**
   * Analyze topic mastery and provide recommendations
   */
  analyzeMastery: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      topicId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { studentId, topicId } = input;
      const userRole = ctx.session.user.userType;

      // Check permissions
      const isTeacher = userRole === 'TEACHER';
      const isOwnData = ctx.session.user.id === studentId;

      if (!isTeacher && !isOwnData) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to analyze this data',
        });
      }

      // Get topic mastery data
      const topicMastery = await ctx.prisma.topicMastery.findUnique({
        where: {
          studentId_topicId: {
            studentId,
            topicId
          }
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
            }
          },
          topic: {
            select: {
              id: true,
              title: true, // Use title instead of name
              subjectId: true,
              subject: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          assessmentResults: {
            select: {
              id: true,
              submittedAt: true, // Use submittedAt instead of completedAt
              score: true, // Use score instead of percentage
              bloomsLevelScores: true,
            },
            orderBy: {
              submittedAt: 'asc' // Use submittedAt instead of completedAt
            },
            take: 5
          }
        }
      });

      if (!topicMastery) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Topic mastery data not found',
        });
      }

      // Get learning outcomes for the topic
      const learningOutcomes = await ctx.prisma.learningOutcome.findMany({
        where: {
          topicId,
        },
        select: {
          id: true,
          statement: true,
          bloomsLevel: true,
        }
      });

      // Format mastery data for the agent
      const masteryData = {
        overallMastery: topicMastery.overallMastery,
        bloomsLevels: {
          [BloomsTaxonomyLevel.REMEMBER]: topicMastery.rememberLevel,
          [BloomsTaxonomyLevel.UNDERSTAND]: topicMastery.understandLevel,
          [BloomsTaxonomyLevel.APPLY]: topicMastery.applyLevel,
          [BloomsTaxonomyLevel.ANALYZE]: topicMastery.analyzeLevel,
          [BloomsTaxonomyLevel.EVALUATE]: topicMastery.evaluateLevel,
          [BloomsTaxonomyLevel.CREATE]: topicMastery.createLevel,
        },
        // We'll fetch assessment history separately
        lastAssessmentDate: topicMastery.lastAssessmentDate,
      };

      try {
        // Get the agent registry instance
        const registry = AgentRegistry.getInstance();

        // Get the agent factory for the mastery analysis agent
        const factory = await registry.getAgentFactory('topic-mastery-analysis' as any);

        if (!factory) {
          throw new Error('Topic mastery analysis agent factory not found');
        }

        // Create the agent
        const agent = await factory({
          id: 'topic-mastery-analysis-agent',
          type: 'topic-mastery-analysis' as any,
          status: 'idle',
          messages: [],
          memory: [],
          tools: [],
          metadata: {}
        }) as BloomsAgent;

        // Get student name from the database
        const student = await ctx.prisma.user.findUnique({
          where: { id: topicMastery.studentId },
          select: { name: true }
        });

        // We already have topic details from the include in the topicMastery query
        // Just need to extract the data with the correct field names
        const topicDetails = {
          title: topicMastery.topic?.title || 'Topic',
          subjectName: topicMastery.topic?.subject?.name || 'Subject'
        };

        // Execute the agent with the input parameters
        const result = await agent.execute({
          studentId: topicMastery.studentId,
          studentName: student?.name || 'Student',
          topicId: topicMastery.topicId,
          topicName: topicDetails.title,
          subjectId: topicMastery.subjectId,
          subjectName: topicDetails.subjectName,
          masteryData,
          learningOutcomes,
          // Use empty array as fallback
          assessmentHistory: []
        });

        return result;
      } catch (error) {
        console.error('Error analyzing mastery:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to analyze mastery data',
        });
      }
    }),
});
