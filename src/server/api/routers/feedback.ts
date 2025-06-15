import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import {
  baseFeedbackSchema,
  studentFeedbackSchema,
  teacherFeedbackSchema,
  feedbackResponseSchema
} from '@/lib/validations/feedback';
// import { validateInput } from '@/lib/middleware/validation';
import { TRPCError } from '@trpc/server';
import { Prisma, SystemStatus } from '@prisma/client';

export const feedbackRouter = createTRPCRouter({
  // Get student feedback
  getStudentFeedback: protectedProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to perform this action',
        });
      }

      return ctx.prisma.studentFeedback.findMany({
        where: {
          studentId: input.studentId,
          feedbackBase: {
            status: SystemStatus.ACTIVE,
          },
        },
        include: {
          feedbackBase: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          responses: {
            where: {
              status: SystemStatus.ACTIVE,
            },
            include: {
              responder: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          feedbackBase: {
            createdAt: 'desc',
          },
        },
      });
    }),
  // Get teacher feedback
  getTeacherFeedback: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to perform this action',
        });
      }

      return ctx.prisma.teacherFeedback.findMany({
        where: {
          teacherId: input.teacherId,
          feedbackBase: {
            status: SystemStatus.ACTIVE,
          },
        },
        include: {
          feedbackBase: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          responses: {
            where: {
              status: SystemStatus.ACTIVE,
            },
            include: {
              responder: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          feedbackBase: {
            createdAt: 'desc',
          },
        },
      });
    }),
  // Create base feedback
  createFeedback: protectedProcedure
    .input(baseFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to perform this action',
        });
      }

      return ctx.prisma.feedbackBase.create({
        data: {
          type: input.type,
          severity: input.severity,
          title: input.title,
          description: input.description,
          academicCycle: input.academicCycle,
          term: input.term,
          tags: input.tags || [],
          attachments: input.attachments ? (input.attachments as Prisma.InputJsonValue) : undefined,
          classId: input.classId,
          createdById: ctx.session.user.id,
          status: SystemStatus.ACTIVE,
        },
      });
    }),

  // Create student feedback
  createStudentFeedback: protectedProcedure
    .input(z.object({
      feedbackBase: baseFeedbackSchema,
      student: studentFeedbackSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to perform this action',
        });
      }

      // Create base feedback first
      const feedbackBase = await ctx.prisma.feedbackBase.create({
        data: {
          type: input.feedbackBase.type,
          severity: input.feedbackBase.severity,
          title: input.feedbackBase.title,
          description: input.feedbackBase.description,
          academicCycle: input.feedbackBase.academicCycle,
          term: input.feedbackBase.term,
          tags: input.feedbackBase.tags || [],
          attachments: input.feedbackBase.attachments ? (input.feedbackBase.attachments as Prisma.InputJsonValue) : undefined,
          classId: input.feedbackBase.classId,
          createdById: ctx.session.user.id,
          status: SystemStatus.ACTIVE,
        },
      });

      // Create student feedback
      return ctx.prisma.studentFeedback.create({
        data: {
          studentId: input.student.studentId,
          feedbackBaseId: feedbackBase.id,
        },
        include: {
          feedbackBase: true,
        },
      });
    }),

  // Create teacher feedback
  createTeacherFeedback: protectedProcedure
    .input(z.object({
      feedbackBase: baseFeedbackSchema,
      teacher: teacherFeedbackSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to perform this action',
        });
      }

      // Create base feedback first
      const feedbackBase = await ctx.prisma.feedbackBase.create({
        data: {
          type: input.feedbackBase.type,
          severity: input.feedbackBase.severity,
          title: input.feedbackBase.title,
          description: input.feedbackBase.description,
          academicCycle: input.feedbackBase.academicCycle,
          term: input.feedbackBase.term,
          tags: input.feedbackBase.tags || [],
          attachments: input.feedbackBase.attachments ? (input.feedbackBase.attachments as Prisma.InputJsonValue) : undefined,
          classId: input.feedbackBase.classId,
          createdById: ctx.session.user.id,
          status: SystemStatus.ACTIVE,
        },
      });

      // Create teacher feedback
      return ctx.prisma.teacherFeedback.create({
        data: {
          teacherId: input.teacher.teacherId,
          feedbackBaseId: feedbackBase.id,
        },
        include: {
          feedbackBase: true,
        },
      });
    }),

  // Add response to feedback
  addResponse: protectedProcedure
    .input(feedbackResponseSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to perform this action',
        });
      }

      // Validate that either studentFeedbackId or teacherFeedbackId exists
      if (!input.studentFeedbackId && !input.teacherFeedbackId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either student feedback ID or teacher feedback ID must be provided',
        });
      }

      // If studentFeedbackId is provided, verify it exists
      if (input.studentFeedbackId) {
        const studentFeedback = await ctx.prisma.studentFeedback.findUnique({
          where: { id: input.studentFeedbackId },
        });
        if (!studentFeedback) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Student feedback not found',
          });
        }
      }

      // If teacherFeedbackId is provided, verify it exists
      if (input.teacherFeedbackId) {
        const teacherFeedback = await ctx.prisma.teacherFeedback.findUnique({
          where: { id: input.teacherFeedbackId },
        });
        if (!teacherFeedback) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Teacher feedback not found',
          });
        }
      }

      // Create the response with the appropriate connections
      const responseData: Prisma.FeedbackResponseCreateInput = {
        content: input.content,
        responder: { connect: { id: ctx.session.user.id } },
        status: SystemStatus.ACTIVE,
      };

      // Add attachments if present
      if (input.attachments) {
        responseData.attachments = input.attachments as Prisma.InputJsonValue;
      }

      // Add the appropriate feedback connection
      if (input.studentFeedbackId) {
        responseData.studentFeedback = { connect: { id: input.studentFeedbackId } };
      } else if (input.teacherFeedbackId) {
        responseData.teacherFeedback = { connect: { id: input.teacherFeedbackId } };
      }

      return ctx.prisma.feedbackResponse.create({
        data: responseData,
      });
    }),

  // Get feedback by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string(),
      type: z.enum(['BASE', 'STUDENT', 'TEACHER']),
    }))
    .query(async ({ ctx, input }) => {
      switch (input.type) {
        case 'BASE':
          return ctx.prisma.feedbackBase.findUnique({
            where: { id: input.id },
            include: {
              createdBy: true,
              studentFeedback: true,
              teacherFeedback: true,
            },
          });
        case 'STUDENT':
          return ctx.prisma.studentFeedback.findUnique({
            where: { id: input.id },
            include: {
              student: true,
              feedbackBase: {
                include: {
                  createdBy: true,
                },
              },
              responses: {
                include: {
                  responder: true,
                },
              },
            },
          });
        case 'TEACHER':
          return ctx.prisma.teacherFeedback.findUnique({
            where: { id: input.id },
            include: {
              teacher: true,
              feedbackBase: {
                include: {
                  createdBy: true,
                },
              },
              responses: {
                include: {
                  responder: true,
                },
              },
            },
          });
      }
    }),
});