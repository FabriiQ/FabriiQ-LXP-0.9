import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { SystemStatus, TermPeriod, TermType } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const createTermSchema = z.object({
  name: z.string(),
  code: z.string(),
  startDate: z.date(),
  endDate: z.date(), // Change from nullable to required
  termType: z.enum(['SEMESTER', 'TRIMESTER', 'QUARTER', 'THEME_BASED', 'CUSTOM']),
  termPeriod: z.enum(['FALL', 'SPRING', 'SUMMER', 'WINTER']),
  courseId: z.string(),
  academicCycleId: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

export const termRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
      status: z.nativeEnum(SystemStatus).optional(),
      courseId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, courseId } = input;
      const skip = (page - 1) * pageSize;

      const where = {
        status,
        courseId,
      };

      const [terms, count] = await Promise.all([
        ctx.prisma.term.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { startDate: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              }
            },
            academicCycle: {
              select: {
                id: true,
                code: true,
                name: true,
                startDate: true,
                endDate: true,
              }
            }
          }
        }),
        ctx.prisma.term.count({ where })
      ]);

      return {
        terms,
        count,
        pageCount: Math.ceil(count / pageSize)
      };
    }),

  create: publicProcedure
    .input(createTermSchema)
    .mutation(async ({ ctx, input }) => {
      // First get the course and its academic cycle
      const course = await ctx.prisma.course.findUnique({
        where: { id: input.courseId },
        include: {
          program: true
        }
      });

      if (!course) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Course not found'
        });
      }

      // Get the academic cycle
      const academicCycle = await ctx.prisma.academicCycle.findUnique({
        where: { id: input.academicCycleId }
      });

      if (!academicCycle) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Academic cycle not found'
        });
      }

      // Validate dates
      if (input.startDate >= input.endDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Term start date must be before end date'
        });
      }

      // Validate term dates are within academic cycle dates
      if (input.startDate < academicCycle.startDate || input.endDate > academicCycle.endDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Term dates must be within the academic cycle dates'
        });
      }

      // Check for overlapping terms for the same course
      const overlappingTerm = await ctx.prisma.term.findFirst({
        where: {
          courseId: input.courseId,
          OR: [
            {
              startDate: {
                lte: input.endDate,
              },
              endDate: {
                gte: input.startDate,
              },
            },
          ],
          NOT: {
            status: SystemStatus.DELETED,
          },
        },
      });

      if (overlappingTerm) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Term dates overlap with an existing term for this course'
        });
      }

      // Create the term
      return ctx.prisma.term.create({
        data: {
          code: input.code,
          name: input.name,
          description: input.description,
          termType: input.termType,
          termPeriod: input.termPeriod,
          startDate: input.startDate,
          endDate: input.endDate,
          status: input.status,
          course: {
            connect: { id: input.courseId }
          },
          academicCycle: {
            connect: { id: input.academicCycleId }
          }
        },
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
            }
          },
          academicCycle: {
            select: {
              id: true,
              code: true,
              name: true,
              startDate: true,
              endDate: true,
            }
          }
        }
      });
    }),

  // Get current active term
  getCurrent: protectedProcedure
    .query(async ({ ctx }) => {
      const currentDate = new Date();

      // Find the term that includes the current date
      const currentTerm = await ctx.prisma.term.findFirst({
        where: {
          startDate: { lte: currentDate },
          endDate: { gte: currentDate },
          status: SystemStatus.ACTIVE
        },
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          academicCycle: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        orderBy: {
          startDate: 'desc'
        }
      });

      if (!currentTerm) {
        // If no current term, return the most recent term
        return ctx.prisma.term.findFirst({
          where: {
            status: SystemStatus.ACTIVE
          },
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true
              }
            },
            academicCycle: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: {
            startDate: 'desc'
          }
        });
      }

      return currentTerm;
    })
});