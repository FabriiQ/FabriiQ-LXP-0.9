import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { QuestionUsageService } from '../services/question-usage.service';

// Schema for recording question usage
const recordQuestionUsageSchema = z.object({
  questionId: z.string(),
  wasCorrect: z.boolean(),
  timeToAnswer: z.number(),
  activityId: z.string(),
  studentId: z.string(),
  classId: z.string().optional(),
});

// Schema for getting question usage stats
const getQuestionUsageStatsSchema = z.object({
  questionId: z.string(),
});

// Schema for getting question usage history
const getQuestionUsageHistorySchema = z.object({
  questionId: z.string(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

// Schema for getting most used questions
const getMostUsedQuestionsSchema = z.object({
  questionBankId: z.string(),
  limit: z.number().optional(),
});

// Schema for getting question class usage
const getQuestionClassUsageSchema = z.object({
  questionId: z.string(),
});

// Schema for getting class question usage
const getClassQuestionUsageSchema = z.object({
  classId: z.string(),
});

/**
 * Question Usage Router
 *
 * This router handles API endpoints for tracking and querying question usage.
 */
export const questionUsageRouter = createTRPCRouter({
  // Record question usage
  recordQuestionUsage: protectedProcedure
    .input(recordQuestionUsageSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new QuestionUsageService(ctx.prisma);
      return service.recordQuestionUsage(
        input.questionId,
        input.wasCorrect,
        input.timeToAnswer,
        input.activityId,
        input.studentId,
        input.classId
      );
    }),

  // Get question usage stats
  getQuestionUsageStats: protectedProcedure
    .input(getQuestionUsageStatsSchema)
    .query(async ({ ctx, input }) => {
      const service = new QuestionUsageService(ctx.prisma);
      return service.getQuestionUsageStats(input.questionId);
    }),

  // Get question usage history
  getQuestionUsageHistory: protectedProcedure
    .input(getQuestionUsageHistorySchema)
    .query(async ({ ctx, input }) => {
      const service = new QuestionUsageService(ctx.prisma);
      return service.getQuestionUsageHistory(
        input.questionId,
        input.limit,
        input.offset
      );
    }),

  // Get question class usage
  getQuestionClassUsage: protectedProcedure
    .input(getQuestionClassUsageSchema)
    .query(async ({ ctx, input }) => {
      const service = new QuestionUsageService(ctx.prisma);
      return service.getQuestionClassUsage(input.questionId);
    }),

  // Get class question usage
  getClassQuestionUsage: protectedProcedure
    .input(getClassQuestionUsageSchema)
    .query(async ({ ctx, input }) => {
      const service = new QuestionUsageService(ctx.prisma);
      return service.getClassQuestionUsage(input.classId);
    }),

  // Get most used questions
  getMostUsedQuestions: protectedProcedure
    .input(getMostUsedQuestionsSchema)
    .query(async ({ ctx, input }) => {
      const service = new QuestionUsageService(ctx.prisma);
      return service.getMostUsedQuestions(
        input.questionBankId,
        input.limit
      );
    }),
});
