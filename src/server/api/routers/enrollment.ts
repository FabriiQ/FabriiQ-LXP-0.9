import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  EnrollmentService,
  updateEnrollmentSchema,
  transferStudentClassSchema,
  transferStudentCampusSchema
} from "../services/enrollment.service";
import { prisma } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "@prisma/client";

export const enrollmentRouter = createTRPCRouter({
  // Get all enrollments with optional filtering
  getAllEnrollments: protectedProcedure
    .input(
      z.object({
        campusId: z.string().optional(),
        programId: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const enrollmentService = new EnrollmentService({ prisma: ctx.prisma });
      return enrollmentService.getAllEnrollments(input);
    }),

  // Create a new enrollment
  createEnrollment: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        classId: z.string(),
        startDate: z.date(),
        endDate: z.date().optional(),
        status: z.enum(['ACTIVE', 'PENDING', 'COMPLETED', 'WITHDRAWN']).optional().default('ACTIVE'),
        createdById: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has appropriate permissions
      if (!['SYSTEM_ADMIN', 'SYSTEM_MANAGER', 'CAMPUS_ADMIN'].includes(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You don't have permission to create enrollments",
        });
      }

      try {
        // Create the enrollment
        const enrollment = await ctx.prisma.studentEnrollment.create({
          data: {
            studentId: input.studentId,
            classId: input.classId,
            startDate: input.startDate,
            endDate: input.endDate,
            status: input.status as SystemStatus,
            createdById: input.createdById,
          },
        });

        return enrollment;
      } catch (error) {
        console.error('Error creating enrollment:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create enrollment",
          cause: error,
        });
      }
    }),

  // Bulk enroll students
  bulkEnroll: protectedProcedure
    .input(
      z.object({
        studentIds: z.array(z.string()),
        classId: z.string(),
        startDate: z.date(),
        endDate: z.date().optional(),
        status: z.enum(['ACTIVE', 'PENDING']).optional().default('ACTIVE'),
        createdById: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has appropriate permissions
      if (!['SYSTEM_ADMIN', 'SYSTEM_MANAGER', 'CAMPUS_ADMIN'].includes(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You don't have permission to create enrollments",
        });
      }

      try {
        // Create enrollments for each student
        const enrollments = await Promise.all(
          input.studentIds.map(async (studentId) => {
            return ctx.prisma.studentEnrollment.create({
              data: {
                studentId,
                classId: input.classId,
                startDate: input.startDate,
                endDate: input.endDate,
                status: input.status as SystemStatus,
                createdById: input.createdById,
              },
            });
          })
        );

        return {
          success: true,
          count: enrollments.length,
          message: `Successfully enrolled ${enrollments.length} students`,
        };
      } catch (error) {
        console.error('Error bulk enrolling students:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to bulk enroll students",
          cause: error,
        });
      }
    }),

  // Get enrollment by ID
  getEnrollment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const enrollmentService = new EnrollmentService({ prisma: ctx.prisma });
      return enrollmentService.getEnrollment(input.id);
    }),

  // Update enrollment
  updateEnrollment: protectedProcedure
    .input(z.object({
      data: updateEnrollmentSchema,
      updatedById: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const enrollmentService = new EnrollmentService({ prisma: ctx.prisma });
      return enrollmentService.updateEnrollment(input.data, input.updatedById);
    }),

  // Delete enrollment
  deleteEnrollment: protectedProcedure
    .input(z.object({
      id: z.string(),
      updatedById: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const enrollmentService = new EnrollmentService({ prisma: ctx.prisma });
      return enrollmentService.deleteEnrollment(input.id, input.updatedById);
    }),

  // Get enrollments by class
  getEnrollmentsByClass: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      const enrollmentService = new EnrollmentService({ prisma: ctx.prisma });
      return enrollmentService.getEnrollmentsByClass(input.classId);
    }),

  // Get enrollments by student
  getEnrollmentsByStudent: protectedProcedure
    .input(z.object({ studentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const enrollmentService = new EnrollmentService({ prisma: ctx.prisma });
      return enrollmentService.getEnrollmentsByStudent(input.studentId);
    }),



  // Transfer student to another class within the same campus
  transferStudentToClass: protectedProcedure
    .input(transferStudentClassSchema)
    .mutation(async ({ ctx, input }) => {
      const enrollmentService = new EnrollmentService({ prisma: ctx.prisma });
      return enrollmentService.transferStudentToClass(input);
    }),

  // Transfer student to another campus
  transferStudentToCampus: protectedProcedure
    .input(transferStudentCampusSchema)
    .mutation(async ({ ctx, input }) => {
      const enrollmentService = new EnrollmentService({ prisma: ctx.prisma });
      return enrollmentService.transferStudentToCampus(input);
    }),

  // Get transfer history for a campus
  getTransferHistory: protectedProcedure
    .input(
      z.object({
        campusId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
        transferType: z.enum(['class', 'campus', 'all']).optional().default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Check if user has access to the campus
      const userHasCampusAccess = await prisma.userCampusAccess.findFirst({
        where: {
          userId: ctx.session.user.id,
          campusId: input.campusId,
          status: SystemStatus.ACTIVE,
        },
      });

      if (!userHasCampusAccess && ctx.session.user.userType !== 'SYSTEM_ADMIN') {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this campus",
        });
      }

      // Get all classes in this campus
      const classes = await prisma.class.findMany({
        where: {
          campusId: input.campusId,
        },
        select: {
          id: true,
        },
      });

      const classIds = classes.map(c => c.id);

      // Build the query for enrollment history
      const whereClause: any = {
        OR: [
          {
            action: {
              in: ['TRANSFERRED_IN', 'TRANSFERRED_OUT'],
            },
            enrollment: {
              classId: {
                in: classIds,
              },
            },
          },
          {
            action: {
              in: ['CAMPUS_TRANSFERRED_IN', 'CAMPUS_TRANSFERRED_OUT'],
            },
            details: {
              path: ['toCampusId'],
              equals: input.campusId,
            },
          },
          {
            action: {
              in: ['CAMPUS_TRANSFERRED_IN', 'CAMPUS_TRANSFERRED_OUT'],
            },
            details: {
              path: ['fromCampusId'],
              equals: input.campusId,
            },
          },
        ],
      };

      // Add date filters if provided
      if (input.startDate) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          gte: input.startDate,
        };
      }

      if (input.endDate) {
        whereClause.createdAt = {
          ...whereClause.createdAt,
          lte: input.endDate,
        };
      }

      // Filter by transfer type if specified
      if (input.transferType === 'class') {
        whereClause.OR = whereClause.OR.filter((condition: any) =>
          condition.action?.in?.includes('TRANSFERRED_IN') ||
          condition.action?.in?.includes('TRANSFERRED_OUT')
        );
      } else if (input.transferType === 'campus') {
        whereClause.OR = whereClause.OR.filter((condition: any) =>
          condition.action?.in?.includes('CAMPUS_TRANSFERRED_IN') ||
          condition.action?.in?.includes('CAMPUS_TRANSFERRED_OUT')
        );
      }

      // Get the transfer history
      const transferHistory = await prisma.enrollmentHistory.findMany({
        where: whereClause,
        include: {
          enrollment: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
              class: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              userType: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
        skip: input.offset,
      });

      // Get the total count
      const totalCount = await prisma.enrollmentHistory.count({
        where: whereClause,
      });

      return {
        transfers: transferHistory,
        totalCount,
      };
    }),
});