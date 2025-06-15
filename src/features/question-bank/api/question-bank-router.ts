/**
 * Question Bank Router
 *
 * This file defines the tRPC router for the question bank feature.
 * It provides endpoints for managing questions and question banks.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  QuestionType,
  DifficultyLevel,
  QuestionContent,
  SystemStatus
} from "../models/types";
import { QuestionBankService } from "../services/question-bank.service";
import { toPrismaSystemStatus } from "../utils/enum-converters";

// Input validation schemas
const createQuestionBankSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  institutionId: z.string(),
});

const createQuestionSchema = z.object({
  questionBankId: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  questionType: z.nativeEnum(QuestionType),
  difficulty: z.nativeEnum(DifficultyLevel).optional().default(DifficultyLevel.MEDIUM),
  content: z.record(z.any()), // This will be cast to QuestionContent in the service
  subjectId: z.string(),
  courseId: z.string().optional(),
  topicId: z.string().optional(),
  gradeLevel: z.number().int().min(1).max(12).optional(),
  sourceId: z.string().optional(),
  sourceReference: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 5).optional(), // Year of the question (especially for past papers)
  categoryIds: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateQuestionSchema = createQuestionSchema.partial();

const bulkUploadSchema = z.object({
  questionBankId: z.string(),
  questions: z.array(createQuestionSchema),
  validateOnly: z.boolean().optional().default(false),
});

const getQuestionsSchema = z.object({
  questionBankId: z.string(),
  filters: z.object({
    questionType: z.nativeEnum(QuestionType).optional(),
    difficulty: z.nativeEnum(DifficultyLevel).optional(),
    subjectId: z.string().optional(),
    courseId: z.string().optional(),
    topicId: z.string().optional(),
    gradeLevel: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 5).optional(),
    categoryId: z.string().optional(),
    search: z.string().optional(),
    status: z.union([
      z.nativeEnum(SystemStatus),
      z.string()
    ]).optional().default(SystemStatus.ACTIVE),
  }).optional(),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  }).optional(),
  sorting: z.object({
    field: z.enum(["title", "createdAt", "updatedAt", "difficulty", "year"]).default("createdAt"),
    direction: z.enum(["asc", "desc"]).default("desc"),
  }).optional(),
});

const getQuestionBanksSchema = z.object({
  filters: z.object({
    search: z.string().optional(),
    status: z.union([
      z.nativeEnum(SystemStatus),
      z.string()
    ]).optional().default(SystemStatus.ACTIVE),
    institutionId: z.string().optional(),
    courseId: z.string().optional(),
    subjectId: z.string().optional(),
  }).optional(),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  }).optional(),
  sorting: z.object({
    field: z.enum(["name", "createdAt", "updatedAt"]).default("createdAt"),
    direction: z.enum(["asc", "desc"]).default("desc"),
  }).optional(),
});

export const questionBankRouter = createTRPCRouter({
  // Question bank procedures
  createQuestionBank: protectedProcedure
    .input(createQuestionBankSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      return service.createQuestionBank(input, ctx.session.user.id);
    }),

  // Question procedures
  createQuestion: protectedProcedure
    .input(createQuestionSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      // Cast the content to QuestionContent
      const typedInput = {
        ...input,
        content: input.content as unknown as QuestionContent
      };
      return service.createQuestion(typedInput, ctx.session.user.id);
    }),

  updateQuestion: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateQuestionSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      // Cast the content to QuestionContent if it exists
      const typedData = {
        ...input.data,
        content: input.data.content ? (input.data.content as unknown as QuestionContent) : undefined
      };
      return service.updateQuestion(input.id, typedData, ctx.session.user.id);
    }),

  deleteQuestion: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      return service.deleteQuestion(input.id);
    }),

  getQuestion: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      return service.getQuestion(input.id);
    }),

  getQuestionBank: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      return service.getQuestionBank(input.id);
    }),

  // Bulk operations
  bulkUploadQuestions: protectedProcedure
    .input(bulkUploadSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      // Cast the content of each question to QuestionContent
      const typedInput = {
        ...input,
        questions: input.questions.map(q => ({
          ...q,
          content: q.content as unknown as QuestionContent
        }))
      };
      return service.bulkUploadQuestions(typedInput, ctx.session.user.id);
    }),

  // Query operations
  getQuestions: protectedProcedure
    .input(getQuestionsSchema)
    .query(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      // No need for type assertion anymore, our utility function handles the conversion
      return service.getQuestions(input);
    }),

  // Duplicate a question
  duplicateQuestion: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      return service.duplicateQuestion(input.id, ctx.session.user.id);
    }),

  // Get question banks with filtering and pagination
  getQuestionBanks: protectedProcedure
    .input(getQuestionBanksSchema)
    .query(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      // No need for type assertion anymore, our utility function handles the conversion
      return service.getQuestionBanks(input);
    }),

  // Delete a question bank (soft delete)
  deleteQuestionBank: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new QuestionBankService(ctx.prisma);
      return service.deleteQuestionBank(input.id);
    }),

  // Additional procedures would be implemented here...
});
