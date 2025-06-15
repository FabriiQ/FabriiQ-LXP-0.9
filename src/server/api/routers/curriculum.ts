import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { CurriculumService, createCourseSchema, updateCourseSchema, createSubjectSchema, updateSubjectSchema, createLearningMaterialSchema, updateLearningMaterialSchema } from "../services/curriculum.service";
import { TRPCError } from "@trpc/server";

export const curriculumRouter = createTRPCRouter({
  // Course endpoints
  createCourse: protectedProcedure
    .input(createCourseSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.createCourse(input);
    }),

  getCourse: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.getCourse(input.id);
    }),

  updateCourse: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        // Add other course fields as needed
      })
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.updateCourse(input.id, input.data);
    }),

  deleteCourse: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.deleteCourse(input.id);
    }),

  getAllCourses: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.getAllCourses();
    }),

  // Subject endpoints
  createSubject: protectedProcedure
    .input(createSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.createSubject(input);
    }),

  getSubject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.getSubject(input.id);
    }),

  updateSubject: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        courseId: z.string().optional(),
        // Add other subject fields as needed
      })
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.updateSubject(input.id, input.data);
    }),

  deleteSubject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.deleteSubject(input.id);
    }),

  getSubjectsByCourse: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.getSubjectsByCourse(input.courseId);
    }),

  // Learning material endpoints
  createLearningMaterial: protectedProcedure
    .input(createLearningMaterialSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.createLearningMaterial(input);
    }),

  getLearningMaterial: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.getLearningMaterial(input.id);
    }),

  updateLearningMaterial: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        title: z.string().optional(),
        content: z.string().optional(),
        subjectId: z.string().optional(),
        type: z.enum(["VIDEO", "DOCUMENT", "QUIZ"]).optional(),
        // Add other learning material fields as needed
      })
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.updateLearningMaterial(input.id, input.data);
    }),

  deleteLearningMaterial: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.deleteLearningMaterial(input.id);
    }),

  getLearningMaterialsBySubject: protectedProcedure
    .input(z.object({ subjectId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        });
      }
      const curriculumService = new CurriculumService(ctx.prisma, ctx.session.userId);
      return curriculumService.getLearningMaterialsBySubject(input.subjectId);
    }),
});