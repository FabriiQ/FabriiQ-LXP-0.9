import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { SubmissionService } from "../services/submission.service";
import { UserType } from "../constants";
import type { SubmissionFilters } from "../types/index";
import { TRPCError } from "@trpc/server";
import { SubmissionStatus } from "@prisma/client";

// Input validation schemas
const createSubmissionSchema = z.object({
  studentId: z.string(),
  activityId: z.string().optional(),
  assessmentId: z.string(),
  content: z.record(z.unknown()),
  attachments: z.array(z.record(z.unknown())).optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
});

const updateSubmissionSchema = z.object({
  content: z.record(z.unknown()).optional(),
  attachments: z.array(z.record(z.unknown())).optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
  score: z.number().min(0).optional(),
  feedback: z.string().optional(),
  gradedById: z.string().optional(),
});

const submissionIdSchema = z.object({
  id: z.string(),
});

export const submissionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createSubmissionSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create submissions",
        });
      }

      // Verify user has appropriate access
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER', // Add regular TEACHER type
          UserType.CAMPUS_STUDENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions to create submissions",
        });
      }

      // If user is a student, they can only submit for themselves
      if (ctx.session.user.userType === UserType.CAMPUS_STUDENT) {
        // Get the student profile for the current user
        const studentProfile = await ctx.prisma.studentProfile.findFirst({
          where: { userId: ctx.session.user.id }
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        if (studentProfile.id !== input.studentId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Students can only submit for themselves",
          });
        }
      }

      const service = new SubmissionService({ prisma: ctx.prisma });

      // Create the submission with the required fields
      return service.createSubmission({
        studentId: input.studentId,
        assessmentId: input.assessmentId,
        content: input.content,
        attachments: input.attachments,
        status: input.status,
      });
    }),

  getById: protectedProcedure
    .input(submissionIdSchema)
    .query(async ({ input, ctx }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view submissions",
        });
      }

      const service = new SubmissionService({ prisma: ctx.prisma });
      const submission = await service.getSubmission(input.id);

      // Verify user has access to view this submission
      if (ctx.session.user.userType === UserType.CAMPUS_STUDENT) {
        // Get the student profile for the current user
        const studentProfile = await ctx.prisma.studentProfile.findFirst({
          where: { userId: ctx.session.user.id }
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        if (studentProfile.id !== submission.student.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Students can only view their own submissions",
          });
        }
      }

      return submission;
    }),

  list: protectedProcedure
    .input(z.object({
      skip: z.number().min(0).default(0),
      take: z.number().min(1).max(100).default(10),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      status: z.nativeEnum(SubmissionStatus).optional(),
      search: z.string().optional(),
      studentId: z.string().optional(),
      activityId: z.string().optional(),
      assessmentId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to list submissions",
        });
      }

      const { skip, take, sortBy, sortOrder, ...filters } = input;
      const service = new SubmissionService({ prisma: ctx.prisma });

      // Convert skip/take to page/pageSize for the service
      const page = Math.floor(skip / take) + 1;
      const pageSize = take;

      return service.listSubmissions(
        { page, pageSize, sortBy, sortOrder },
        filters as SubmissionFilters,
      );
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateSubmissionSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update submissions",
        });
      }

      const service = new SubmissionService({ prisma: ctx.prisma });
      const submission = await service.getSubmission(input.id);

      // Verify user has appropriate access
      if (ctx.session.user.userType === UserType.CAMPUS_STUDENT) {
        // Get the student profile for the current user
        const studentProfile = await ctx.prisma.studentProfile.findFirst({
          where: { userId: ctx.session.user.id }
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        // Students can only update their own ungraded submissions
        if (studentProfile.id !== submission.student.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Students can only update their own submissions",
          });
        }
        if (submission.gradedById) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot update graded submission",
          });
        }
        // Students can only update content and attachments
        const { content, attachments } = input.data;
        return service.updateSubmission(input.id, {
          content,
          attachments
        });
      }

      // Teachers and admins can update all fields
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER', // Add regular TEACHER type
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions to update submissions",
        });
      }

      return service.updateSubmission(input.id, {
        content: input.data.content,
        attachments: input.data.attachments,
        status: input.data.status,
        score: input.data.score,
        feedback: input.data.feedback,
        gradedById: input.data.gradedById
      });
    }),

  delete: protectedProcedure
    .input(submissionIdSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to delete submissions",
        });
      }

      const service = new SubmissionService({ prisma: ctx.prisma });
      const submission = await service.getSubmission(input.id);

      // Verify user has appropriate access
      if (ctx.session.user.userType === UserType.CAMPUS_STUDENT) {
        // Get the student profile for the current user
        const studentProfile = await ctx.prisma.studentProfile.findFirst({
          where: { userId: ctx.session.user.id }
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        // Students can only delete their own ungraded submissions
        if (studentProfile.id !== submission.student.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Students can only delete their own submissions",
          });
        }
        if (submission.gradedById) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot delete graded submission",
          });
        }
      } else if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER', // Add regular TEACHER type
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions to delete submissions",
        });
      }

      return service.deleteSubmission(input.id);
    }),

  getStudentStats: protectedProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view student stats",
        });
      }

      // Verify user has appropriate access
      if (ctx.session.user.userType === UserType.CAMPUS_STUDENT) {
        // Get the student profile for the current user
        const studentProfile = await ctx.prisma.studentProfile.findFirst({
          where: { userId: ctx.session.user.id }
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        if (studentProfile.id !== input.studentId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Students can only view their own stats",
          });
        }
      }

      const service = new SubmissionService({ prisma: ctx.prisma });
      return service.getStudentStats(input.studentId);
    }),
});