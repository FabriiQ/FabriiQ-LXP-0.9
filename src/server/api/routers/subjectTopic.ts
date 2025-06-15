import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { SubjectTopicService } from "../services/subject-topic.service";
import { SystemStatus } from "@prisma/client";
import { SubjectNodeType, CompetencyLevel } from "../constants";
import { TRPCError } from "@trpc/server";

import { cacheTopicsQuery } from "../cache/topic-cache.service";

export const subjectTopicRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        title: z.string(),
        description: z.string().optional(),
        context: z.string().optional(),
        learningOutcomes: z.string().optional(),
        nodeType: z.enum([
          SubjectNodeType.CHAPTER,
          SubjectNodeType.TOPIC,
          SubjectNodeType.SUBTOPIC,
        ]),
        orderIndex: z.number().int().min(0),
        estimatedMinutes: z.number().int().optional(),
        competencyLevel: z.enum([
          CompetencyLevel.BASIC,
          CompetencyLevel.INTERMEDIATE,
          CompetencyLevel.ADVANCED,
          CompetencyLevel.EXPERT,
        ]).optional(),
        keywords: z.array(z.string()).optional(),
        bloomsDistribution: z.record(z.number()).optional(),
        subjectId: z.string(),
        parentTopicId: z.string().optional(),
        status: z.enum([
          SystemStatus.ACTIVE,
          SystemStatus.INACTIVE,
          SystemStatus.ARCHIVED,
        ]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = new SubjectTopicService({
        prisma: ctx.prisma,
      });
      return service.createSubjectTopic({
        code: input.code,
        title: input.title,
        description: input.description,
        context: input.context,
        learningOutcomes: input.learningOutcomes,
        nodeType: input.nodeType,
        orderIndex: input.orderIndex,
        estimatedMinutes: input.estimatedMinutes,
        competencyLevel: input.competencyLevel,
        keywords: input.keywords,
        bloomsDistribution: input.bloomsDistribution,
        subjectId: input.subjectId,
        parentTopicId: input.parentTopicId,
        status: input.status
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = new SubjectTopicService({
        prisma: ctx.prisma,
      });
      return service.getSubjectTopic(input.id);
    }),

  // Add getById procedure that maps to the existing get functionality
  // This ensures backward compatibility with components using getById
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = new SubjectTopicService({
        prisma: ctx.prisma,
      });
      return service.getSubjectTopic(input.id);
    }),

  list: protectedProcedure
    .input(
      z.object({
        subjectId: z.string().optional(),
        nodeType: z.enum([
          SubjectNodeType.CHAPTER,
          SubjectNodeType.TOPIC,
          SubjectNodeType.SUBTOPIC,
        ]).optional(),
        parentTopicId: z.string().optional(),
        status: z.enum([
          SystemStatus.ACTIVE,
          SystemStatus.INACTIVE,
          SystemStatus.ARCHIVED,
        ]).optional(),
        search: z.string().optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = new SubjectTopicService({
        prisma: ctx.prisma,
      });
      const { page, pageSize, ...filters } = input;
      return service.listSubjectTopics(
        {
          skip: page ? (page - 1) * (pageSize || 10) : undefined,
          take: pageSize,
        },
        filters
      );
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        context: z.string().optional(),
        learningOutcomes: z.string().optional(),
        nodeType: z.enum([
          SubjectNodeType.CHAPTER,
          SubjectNodeType.TOPIC,
          SubjectNodeType.SUBTOPIC,
        ]).optional(),
        orderIndex: z.number().int().min(0).optional(),
        estimatedMinutes: z.number().int().optional(),
        competencyLevel: z.enum([
          CompetencyLevel.BASIC,
          CompetencyLevel.INTERMEDIATE,
          CompetencyLevel.ADVANCED,
          CompetencyLevel.EXPERT,
        ]).optional(),
        keywords: z.array(z.string()).optional(),
        parentTopicId: z.string().nullable().optional(),
        status: z.enum([
          SystemStatus.ACTIVE,
          SystemStatus.INACTIVE,
          SystemStatus.ARCHIVED,
        ]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = new SubjectTopicService({
        prisma: ctx.prisma,
      });
      const { id, ...updateData } = input;

      // Convert null to undefined for string fields to match the type
      const sanitizedData: any = { ...updateData };
      if (sanitizedData.description === null) sanitizedData.description = undefined;
      if (sanitizedData.context === null) sanitizedData.context = undefined;
      if (sanitizedData.learningOutcomes === null) sanitizedData.learningOutcomes = undefined;

      return service.updateSubjectTopic(id, sanitizedData);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const service = new SubjectTopicService({
        prisma: ctx.prisma,
      });
      return service.deleteSubjectTopic(input.id);
    }),

  getHierarchy: protectedProcedure
    .input(z.object({ subjectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = new SubjectTopicService({
        prisma: ctx.prisma,
      });
      return service.getTopicHierarchy(input.subjectId);
    }),

  getBySubject: protectedProcedure
    .input(z.object({ subjectId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        // Get all topics for a subject
        const topics = await ctx.prisma.subjectTopic.findMany({
          where: {
            subjectId: input.subjectId,
            status: SystemStatus.ACTIVE,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        });

        return topics;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get topics for subject: ${(error as Error).message}`,
        });
      }
    }),

  // Optimized list endpoint for AI Content Studio
  listTopics: protectedProcedure
    .input(
      z.object({
        subjectId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(50),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const service = new SubjectTopicService({
          prisma: ctx.prisma,
        });

        // Use the caching utility to cache the topics query
        const getTopicsCached = cacheTopicsQuery(
          async (subjectId: string, page: number, pageSize: number, search?: string) =>
            await service.listTopics({
              subjectId,
              page,
              pageSize,
              search,
            })
        );

        return await getTopicsCached(
          input.subjectId,
          input.page,
          input.pageSize,
          input.search
        );
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get topics: ${(error as Error).message}`,
        });
      }
    }),

  // Infinite query version of listTopics for better client-side pagination
  listTopicsInfinite: protectedProcedure
    .input(
      z.object({
        subjectId: z.string(),
        pageSize: z.number().int().min(1).max(100).default(50),
        search: z.string().optional(),
        cursor: z.number().int().min(1).optional(), // cursor is the page number
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const service = new SubjectTopicService({
          prisma: ctx.prisma,
        });

        const page = input.cursor || 1;

        // Use the caching utility to cache the topics query
        const getTopicsCached = cacheTopicsQuery(
          async (subjectId: string, page: number, pageSize: number, search?: string) =>
            await service.listTopics({
              subjectId,
              page,
              pageSize,
              search,
            })
        );

        const result = await getTopicsCached(
          input.subjectId,
          page,
          input.pageSize,
          input.search
        );

        return {
          data: result.data,
          page: result.page,
          pageSize: result.pageSize,
          hasMore: result.hasMore,
          nextCursor: result.hasMore ? result.page + 1 : undefined,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get topics: ${(error as Error).message}`,
        });
      }
    }),
});