/**
 * Question Bank Service
 *
 * This service provides the business logic for the question bank feature.
 * It handles operations like creating, updating, and retrieving questions,
 * as well as bulk operations and integration with other system components.
 */

import { PrismaClient, SystemStatus as PrismaSystemStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import {
  CreateQuestionBankInput,
  CreateQuestionInput,
  BulkUploadInput,
  GetQuestionsInput,
  DifficultyLevel,
  SystemStatus
} from '../models/types';
import { toPrismaSystemStatus } from '../utils/enum-converters';

export class QuestionBankService {
  constructor(private prisma: PrismaClient) {
    // No custom model initialization needed - using standard Prisma models
  }

  /**
   * Create a new question bank
   */
  async createQuestionBank(input: CreateQuestionBankInput, userId: string) {
    try {
      // Generate partition key
      const partitionKey = `inst_${input.institutionId}`;

      // Create the question bank using standard Prisma model
      const questionBank = await this.prisma.questionBank.create({
        data: {
          name: input.name,
          description: input.description,
          institutionId: input.institutionId,
          status: toPrismaSystemStatus(SystemStatus.ACTIVE),
          partitionKey,
          createdById: userId,
        },
      });

      return questionBank;
    } catch (error) {
      console.error('Error creating question bank:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create question bank',
        cause: error,
      });
    }
  }

  /**
   * Create a new question
   */
  async createQuestion(input: CreateQuestionInput, userId: string) {
    try {
      // Validate question bank exists
      const questionBank = await this.prisma.questionBank.findUnique({
        where: {
          id: input.questionBankId,
          status: toPrismaSystemStatus(SystemStatus.ACTIVE)
        },
      });

      if (!questionBank) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Question bank not found',
        });
      }

      // Generate partition key
      const partitionKey = `inst_${questionBank.institutionId}_grade_${input.gradeLevel || 0}_subj_${input.subjectId}`;

      // Create the question
      const question = await this.prisma.question.create({
        data: {
          questionBankId: input.questionBankId,
          title: input.title,
          questionType: input.questionType,
          difficulty: input.difficulty || DifficultyLevel.MEDIUM,
          content: input.content as any,
          subjectId: input.subjectId,
          courseId: input.courseId,
          topicId: input.topicId,
          gradeLevel: input.gradeLevel,
          sourceId: input.sourceId,
          sourceReference: input.sourceReference,
          year: input.year,
          metadata: input.metadata || {},
          status: toPrismaSystemStatus(SystemStatus.ACTIVE),
          partitionKey,
          createdById: userId,
        },
      });

      // Create category mappings if provided
      if (input.categoryIds && input.categoryIds.length > 0) {
        await Promise.all(
          input.categoryIds.map((categoryId) =>
            this.prisma.questionCategoryMapping.create({
              data: {
                questionId: question.id,
                categoryId,
              },
            })
          )
        );
      }

      // Initialize usage stats
      await this.prisma.questionUsageStats.create({
        data: {
          questionId: question.id,
        },
      });

      return question;
    } catch (error) {
      console.error('Error creating question:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create question',
        cause: error,
      });
    }
  }

  /**
   * Bulk upload questions
   */
  async bulkUploadQuestions(input: BulkUploadInput, userId: string) {
    const { questionBankId, questions, validateOnly = false } = input;
    const results = {
      total: questions.length,
      successful: 0,
      failed: 0,
      errors: [] as { index: number; message: string }[],
    };

    try {
      // Validate question bank exists
      const questionBank = await this.prisma.questionBank.findUnique({
        where: { id: questionBankId, status: toPrismaSystemStatus(SystemStatus.ACTIVE) },
      });

      if (!questionBank) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Question bank not found',
        });
      }

      // Process questions in batches for better performance
      const batchSize = 100;
      // Create batches of questions
      const batches: CreateQuestionInput[][] = [];

      for (let i = 0; i < questions.length; i += batchSize) {
        batches.push(questions.slice(i, i + batchSize));
      }

      // Process each batch
      for (const [batchIndex, batch] of batches.entries()) {
        try {
          // If validateOnly is true, just validate without saving
          if (!validateOnly) {
            // Process each question individually instead of using transaction
            for (const [index, question] of batch.entries()) {
              const globalIndex = batchIndex * batchSize + index;

              try {
                // Generate partition key
                const partitionKey = `inst_${questionBank.institutionId}_grade_${question.gradeLevel || 0}_subj_${question.subjectId}`;

                // Create the question
                // @ts-ignore - Using the custom implementation
                const createdQuestion = await this.prisma.question.create({
                  data: {
                    questionBankId,
                    title: question.title,
                    questionType: question.questionType as any,
                    difficulty: (question.difficulty || DifficultyLevel.MEDIUM) as any,
                    content: question.content as any,
                    subjectId: question.subjectId,
                    courseId: question.courseId,
                    topicId: question.topicId,
                    gradeLevel: question.gradeLevel,
                    sourceId: question.sourceId,
                    sourceReference: question.sourceReference,
                    year: question.year,
                    metadata: question.metadata || {},
                    status: toPrismaSystemStatus(SystemStatus.ACTIVE),
                    partitionKey,
                    createdById: userId,
                  },
                });

                // Create category mappings if provided
                if (question.categoryIds && question.categoryIds.length > 0) {
                  await Promise.all(
                    question.categoryIds.map((categoryId) =>
                      // @ts-ignore - Using the custom implementation
                      this.prisma.questionCategoryMapping.create({
                        data: {
                          questionId: createdQuestion.id,
                          categoryId,
                        },
                      })
                    )
                  );
                }

                // Initialize usage stats
                // @ts-ignore - Using the custom implementation
                await this.prisma.questionUsageStats.create({
                  data: {
                    questionId: createdQuestion.id,
                  },
                });

                results.successful++;
              } catch (error) {
                results.failed++;
                results.errors.push({
                  index: globalIndex,
                  message: error instanceof Error ? error.message : String(error),
                });
              }
            }
          } else {
            // Just count as successful for validation
            results.successful += batch.length;
          }
        } catch (error) {
          // If a batch fails, mark all questions in the batch as failed
          results.failed += batch.length;
          results.successful -= batch.length;

          for (let i = 0; i < batch.length; i++) {
            const globalIndex = batchIndex * batchSize + i;
            results.errors.push({
              index: globalIndex,
              message: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error bulk uploading questions:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to bulk upload questions',
        cause: error,
      });
    }
  }

  /**
   * Get questions with filtering and pagination
   */
  async getQuestions(input: GetQuestionsInput) {
    try {
      const { questionBankId, filters = {}, pagination = { page: 1, pageSize: 20 }, sorting = { field: 'createdAt', direction: 'desc' } } = input;

      // Build where clause
      const where: any = {
        questionBankId,
      };

      // Handle status filter using our utility function
      where.status = toPrismaSystemStatus(filters.status);

      // Add filters
      if (filters.questionType) {
        where.questionType = filters.questionType;
      }

      if (filters.difficulty) {
        where.difficulty = filters.difficulty;
      }

      if (filters.subjectId) {
        where.subjectId = filters.subjectId;
      }

      if (filters.courseId) {
        where.courseId = filters.courseId;
      }

      if (filters.topicId) {
        where.topicId = filters.topicId;
      }

      if (filters.gradeLevel) {
        where.gradeLevel = filters.gradeLevel;
      }

      if (filters.year) {
        where.year = filters.year;
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { content: { path: '$.text', string_contains: filters.search } },
        ];
      }

      // Add category filter if provided
      const include: any = {};
      if (filters.categoryId) {
        include.categories = {
          where: {
            categoryId: filters.categoryId,
          },
        };

        // Only include questions that have this category
        where.categories = {
          some: {
            categoryId: filters.categoryId,
          },
        };
      }

      // Get total count
      // @ts-ignore - Using the custom implementation
      const total = await this.prisma.question.count({ where });

      // Get questions
      // @ts-ignore - Using the custom implementation
      const questions = await this.prisma.question.findMany({
        where,
        include,
        orderBy: {
          [sorting.field]: sorting.direction,
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      });

      return {
        items: questions,
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        hasMore: total > pagination.page * pagination.pageSize,
      };
    } catch (error) {
      console.error('Error getting questions:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get questions',
        cause: error,
      });
    }
  }

  /**
   * Get a question by ID
   */
  async getQuestion(id: string) {
    try {
      // @ts-ignore - Using the custom implementation
      const question = await this.prisma.question.findUnique({
        where: { id },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          usageStats: true,
        },
      });

      if (!question) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Question not found',
        });
      }

      return question;
    } catch (error) {
      console.error('Error getting question:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get question',
        cause: error,
      });
    }
  }

  /**
   * Get a question bank by ID
   */
  async getQuestionBank(id: string) {
    try {
      // Validate the ID first
      if (!id || typeof id !== 'string') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid question bank ID',
        });
      }

      const questionBank = await this.prisma.questionBank.findUnique({
        where: { id },
        include: {
          questions: {
            take: 1,
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              },
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              }
            }
          }
        }
      });

      if (!questionBank) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Question bank not found',
        });
      }

      return questionBank;
    } catch (error) {
      console.error('Error getting question bank:', error);
      // If it's already a TRPC error, just rethrow it
      if (error instanceof TRPCError) {
        throw error;
      }
      // Otherwise, wrap it in a TRPC error
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get question bank',
        cause: error,
      });
    }
  }

  /**
   * Update a question
   */
  async updateQuestion(id: string, input: Partial<CreateQuestionInput>, userId: string) {
    try {
      // Get the current question
      // @ts-ignore - Using the custom implementation
      const currentQuestion = await this.prisma.question.findUnique({
        where: { id },
      });

      if (!currentQuestion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Question not found',
        });
      }

      // Create a version record (in a real implementation, you would have a QuestionVersion model)
      // await this.prisma.questionVersion.create({
      //   data: {
      //     questionId: id,
      //     versionNumber: await this.getNextVersionNumber(id),
      //     content: currentQuestion.content,
      //     metadata: currentQuestion.metadata,
      //     createdById: currentQuestion.createdById,
      //   },
      // });

      // Update the question
      // @ts-ignore - Using the custom implementation
      const updatedQuestion = await this.prisma.question.update({
        where: { id },
        data: {
          title: input.title,
          questionType: input.questionType as any,
          difficulty: input.difficulty as any,
          content: input.content as any,
          subjectId: input.subjectId,
          courseId: input.courseId,
          topicId: input.topicId,
          gradeLevel: input.gradeLevel,
          sourceId: input.sourceId,
          sourceReference: input.sourceReference,
          year: input.year,
          metadata: input.metadata,
          updatedById: userId,
        },
      });

      // Update category mappings if provided
      if (input.categoryIds) {
        // Delete existing mappings
        // @ts-ignore - Using the custom implementation
        await this.prisma.questionCategoryMapping.deleteMany({
          where: { questionId: id },
        });

        // Create new mappings
        if (input.categoryIds.length > 0) {
          await Promise.all(
            input.categoryIds.map((categoryId) =>
              // @ts-ignore - Using the custom implementation
              this.prisma.questionCategoryMapping.create({
                data: {
                  questionId: id,
                  categoryId,
                },
              })
            )
          );
        }
      }

      return updatedQuestion;
    } catch (error) {
      console.error('Error updating question:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update question',
        cause: error,
      });
    }
  }

  /**
   * Delete a question (soft delete)
   */
  async deleteQuestion(id: string) {
    try {
      // @ts-ignore - Using the custom implementation
      const question = await this.prisma.question.update({
        where: { id },
        data: {
          status: PrismaSystemStatus.DELETED,
        },
      });

      return question;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete question',
        cause: error,
      });
    }
  }

  /**
   * Duplicate a question
   */
  async duplicateQuestion(id: string, userId: string) {
    try {
      // Get the original question
      // @ts-ignore - Using the custom implementation
      const originalQuestion = await this.prisma.question.findUnique({
        where: { id },
        include: {
          categories: true,
        },
      });

      if (!originalQuestion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Question not found',
        });
      }

      // Create a new question with the same data
      // @ts-ignore - Using the custom implementation
      const duplicatedQuestion = await this.prisma.question.create({
        data: {
          questionBankId: originalQuestion.questionBankId,
          title: `${originalQuestion.title} (Copy)`,
          questionType: originalQuestion.questionType,
          difficulty: originalQuestion.difficulty,
          content: originalQuestion.content as any,
          subjectId: originalQuestion.subjectId,
          courseId: originalQuestion.courseId,
          topicId: originalQuestion.topicId,
          gradeLevel: originalQuestion.gradeLevel,
          sourceId: originalQuestion.sourceId,
          sourceReference: originalQuestion.sourceReference,
          year: originalQuestion.year,
          metadata: originalQuestion.metadata as any,
          status: PrismaSystemStatus.ACTIVE,
          partitionKey: originalQuestion.partitionKey,
          createdById: userId,
        },
      });

      // Duplicate category mappings if any
      if (originalQuestion.categories && originalQuestion.categories.length > 0) {
        await Promise.all(
          originalQuestion.categories.map((mapping) =>
            // @ts-ignore - Using the custom implementation
            this.prisma.questionCategoryMapping.create({
              data: {
                questionId: duplicatedQuestion.id,
                categoryId: mapping.categoryId,
              },
            })
          )
        );
      }

      // Initialize usage stats
      // @ts-ignore - Using the custom implementation
      await this.prisma.questionUsageStats.create({
        data: {
          questionId: duplicatedQuestion.id,
        },
      });

      return duplicatedQuestion;
    } catch (error) {
      console.error('Error duplicating question:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to duplicate question',
        cause: error,
      });
    }
  }

  /**
   * Get question banks with filtering and pagination
   */
  async getQuestionBanks(input: {
    filters?: {
      search?: string;
      status?: SystemStatus | string;
      institutionId?: string;
      courseId?: string;
      subjectId?: string;
    };
    pagination?: {
      page: number;
      pageSize: number;
    };
    sorting?: {
      field: string;
      direction: 'asc' | 'desc';
    };
  }) {
    try {
      console.log('getQuestionBanks input:', JSON.stringify(input, null, 2));

      const {
        filters = {},
        pagination = { page: 1, pageSize: 20 },
        sorting = { field: 'createdAt', direction: 'desc' }
      } = input;

      // Build where clause
      const where: any = {};

      // Handle status filter using our utility function
      if (filters.status) {
        console.log('Converting status:', filters.status);
        where.status = toPrismaSystemStatus(filters.status);
        console.log('Converted status:', where.status);
      } else {
        where.status = PrismaSystemStatus.ACTIVE;
      }

      // Add institution filter if provided
      if (filters.institutionId) {
        where.institutionId = filters.institutionId;
      }

      // Add course and subject filters if provided
      if (filters.courseId || filters.subjectId) {
        where.questions = {
          some: {
            ...(filters.courseId ? { courseId: filters.courseId } : {}),
            ...(filters.subjectId ? { subjectId: filters.subjectId } : {})
          }
        };
      }

      // Add search filter if provided
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      console.log('Final where clause:', JSON.stringify(where, null, 2));

      // Get total count
      const total = await this.prisma.questionBank.count({ where });
      console.log('Total question banks:', total);

      // Get question banks with related questions to extract course and subject info
      const questionBanks = await this.prisma.questionBank.findMany({
        where,
        orderBy: {
          [sorting.field]: sorting.direction,
        },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        include: {
          questions: {
            take: 1,
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              },
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              }
            }
          }
        }
      });

      console.log(`Retrieved ${questionBanks.length} question banks`);

      return {
        items: questionBanks,
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        hasMore: total > pagination.page * pagination.pageSize,
      };
    } catch (error) {
      console.error('Error getting question banks:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get question banks',
        cause: error,
      });
    }
  }

  /**
   * Delete a question bank (soft delete)
   */
  async deleteQuestionBank(id: string) {
    try {
      // Check if the question bank exists
      const questionBank = await this.prisma.questionBank.findUnique({
        where: { id },
      });

      if (!questionBank) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Question bank not found',
        });
      }

      // Soft delete the question bank
      const deletedQuestionBank = await this.prisma.questionBank.update({
        where: { id },
        data: {
          status: toPrismaSystemStatus(SystemStatus.DELETED),
        },
      });

      return deletedQuestionBank;
    } catch (error) {
      console.error('Error deleting question bank:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete question bank',
        cause: error,
      });
    }
  }

  // Additional methods would be implemented here...
}
