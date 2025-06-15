import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ActivityGradeService } from "../services/activity-grade.service";
import { SubmissionStatus, SystemStatus } from "../constants";
import { UserType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ExtendedPrismaClient } from "../types/prisma-extensions";

export const activityGradeRouter = createTRPCRouter({
  /**
   * Grade an activity
   *
   * This procedure handles manual grading of an activity by a teacher.
   * It supports both score-based and rubric-based grading.
   */
  grade: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        studentId: z.string(),
        score: z.number().min(0).optional(),
        feedback: z.string().optional(),
        attachments: z.any().optional(),
        status: z.enum([
          SubmissionStatus.DRAFT,
          SubmissionStatus.SUBMITTED,
          SubmissionStatus.UNDER_REVIEW,
          SubmissionStatus.GRADED,
          SubmissionStatus.RETURNED,
          SubmissionStatus.RESUBMITTED,
          SubmissionStatus.LATE,
          SubmissionStatus.REJECTED,
        ]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Check if user has permission to grade activities
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true, teacherProfile: true }
      });

      if (!user || (user.userType !== UserType.CAMPUS_TEACHER && user.userType !== 'TEACHER')) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only teachers can grade activities",
        });
      }

      const service = new ActivityGradeService({
        prisma: ctx.prisma,
      });

      // Get the existing grade if it exists
      const existingGrade = await ctx.prisma.activityGrade.findFirst({
        where: {
          activityId: input.activityId,
          studentId: input.studentId,
        },
      });

      if (!existingGrade) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity grade not found",
        });
      }

      // Update the grade
      return service.updateActivityGrade(
        input.activityId,
        input.studentId,
        {
          score: input.score,
          feedback: input.feedback,
          attachments: input.attachments,
          status: input.status || SubmissionStatus.GRADED,
          gradedById: ctx.session.user.id,
        }
      );
    }),
  create: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        studentId: z.string(),
        score: z.number().min(0).optional(),
        points: z.number().min(0).optional(),
        feedback: z.string().optional(),
        content: z.any().optional(),
        attachments: z.any().optional(),
        status: z.enum([
          SubmissionStatus.DRAFT,
          SubmissionStatus.SUBMITTED,
          SubmissionStatus.UNDER_REVIEW,
          SubmissionStatus.GRADED,
          SubmissionStatus.RETURNED,
          SubmissionStatus.RESUBMITTED,
          SubmissionStatus.LATE,
          SubmissionStatus.REJECTED,
        ]).optional(),
        gradedById: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = new ActivityGradeService({
        prisma: ctx.prisma,
      });
      return service.createActivityGrade({
        activityId: input.activityId,
        studentId: input.studentId,
        score: input.score,
        points: input.points,
        feedback: input.feedback,
        content: input.content,
        attachments: input.attachments,
        status: input.status,
        gradedById: input.gradedById,
      });
    }),

  get: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        studentId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const service = new ActivityGradeService({
        prisma: ctx.prisma,
      });

      // Handle 'current' student ID
      let studentId = input.studentId;

      if (studentId === 'current') {
        // Find the student profile for the current user
        const studentProfile = await ctx.prisma.studentProfile.findFirst({
          where: { userId: ctx.session.user.id },
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Student profile not found for current user',
          });
        }

        studentId = studentProfile.id;
      }

      return service.getActivityGrade(input.activityId, studentId);
    }),

  list: protectedProcedure
    .input(
      z.object({
        skip: z.number().int().min(0).optional(),
        take: z.number().int().min(1).max(100).optional(),
        activityId: z.string().optional(),
        studentId: z.string().optional(),
        status: z.enum([
          SubmissionStatus.DRAFT,
          SubmissionStatus.SUBMITTED,
          SubmissionStatus.UNDER_REVIEW,
          SubmissionStatus.GRADED,
          SubmissionStatus.RETURNED,
          SubmissionStatus.RESUBMITTED,
          SubmissionStatus.LATE,
          SubmissionStatus.REJECTED,
        ]).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { skip, take, ...filters } = input;
      const service = new ActivityGradeService({
        prisma: ctx.prisma,
      });
      return service.listActivityGrades({ skip: skip || 0, take: take || 10 }, {
        activityId: filters.activityId,
        studentId: filters.studentId,
        status: filters.status,
        search: filters.search,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        studentId: z.string(),
        score: z.number().min(0).optional(),
        points: z.number().min(0).optional(),
        feedback: z.string().optional(),
        content: z.any().optional(),
        attachments: z.any().optional(),
        status: z.enum([
          SubmissionStatus.DRAFT,
          SubmissionStatus.SUBMITTED,
          SubmissionStatus.UNDER_REVIEW,
          SubmissionStatus.GRADED,
          SubmissionStatus.RETURNED,
          SubmissionStatus.RESUBMITTED,
          SubmissionStatus.LATE,
          SubmissionStatus.REJECTED,
        ]).optional(),
        gradedById: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { activityId, studentId, ...data } = input;
      const service = new ActivityGradeService({
        prisma: ctx.prisma,
      });
      return service.updateActivityGrade(activityId, studentId, {
        score: data.score,
        points: data.points,
        feedback: data.feedback,
        content: data.content,
        attachments: data.attachments,
        status: data.status,
        gradedById: data.gradedById,
      });
    }),

  batchGrade: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        grades: z.array(
          z.object({
            studentId: z.string(),
            score: z.number().min(0),
            feedback: z.string().optional(),
          })
        ),
        gradedById: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = new ActivityGradeService({
        prisma: ctx.prisma,
      });

      // Ensure activityId is required
      if (!input.activityId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Activity ID is required'
        });
      }

      // Ensure grades array is not empty
      if (!input.grades || input.grades.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'At least one grade is required'
        });
      }

      // Ensure all grades have required properties
      const validatedGrades = input.grades.map(grade => {
        if (!grade.studentId || grade.score === undefined) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Student ID and score are required for all grades'
          });
        }
        return {
          studentId: grade.studentId,
          score: grade.score,
          feedback: grade.feedback
        };
      });

      return service.batchGradeActivities({
        activityId: input.activityId,
        grades: validatedGrades,
        gradedById: input.gradedById
      });
    }),

  // New endpoint for batch grading multiple students with the same score
  batchGradeStudents: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        studentIds: z.array(z.string()),
        score: z.number().min(0),
        feedback: z.string().optional(),
        status: z.enum([
          SubmissionStatus.DRAFT,
          SubmissionStatus.SUBMITTED,
          SubmissionStatus.UNDER_REVIEW,
          SubmissionStatus.GRADED,
          SubmissionStatus.RETURNED,
          SubmissionStatus.RESUBMITTED,
          SubmissionStatus.LATE,
          SubmissionStatus.REJECTED,
        ]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Check if user has permission to grade activities
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true }
      });

      if (!user || (user.userType !== UserType.CAMPUS_TEACHER && user.userType !== 'TEACHER')) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only teachers can grade activities",
        });
      }

      // Convert to the format expected by batchGradeActivities
      const batchInput = {
        activityId: input.activityId,
        grades: input.studentIds.map(studentId => ({
          studentId,
          score: input.score,
          feedback: input.feedback,
        })),
        gradedById: ctx.session.user.id,
      };

      const service = new ActivityGradeService({
        prisma: ctx.prisma,
      });

      // Ensure activityId is required
      if (!batchInput.activityId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Activity ID is required'
        });
      }

      // Ensure grades array is not empty
      if (!batchInput.grades || batchInput.grades.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'At least one grade is required'
        });
      }

      // Ensure all grades have required properties
      const validatedGrades = batchInput.grades.map(grade => {
        if (!grade.studentId || grade.score === undefined) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Student ID and score are required for all grades'
          });
        }
        return {
          studentId: grade.studentId,
          score: grade.score,
          feedback: grade.feedback
        };
      });

      return service.batchGradeActivities({
        activityId: batchInput.activityId,
        grades: validatedGrades,
        gradedById: batchInput.gradedById
      });
    }),

  // Get all grades for an activity
  getByActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
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

      // Check if user has permission to view grades
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { userType: true, teacherProfile: true }
      });

      if (!user || (user.userType !== UserType.CAMPUS_TEACHER && user.userType !== 'TEACHER')) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only teachers can view activity grades",
        });
      }

      // Get the activity to check if the teacher has access
      const activity = await ctx.prisma.activity.findUnique({
        where: { id: input.activityId },
        select: { classId: true, subjectId: true }
      });

      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      // Get all grades for this activity with learning time records
      return ctx.prisma.activityGrade.findMany({
        where: { activityId: input.activityId },
        include: {
          student: {
            include: {
              user: true
            }
          },
          // Include learning time records
          learningTimeRecords: true
        },
        orderBy: { updatedAt: "desc" }
      });
    }),

  // Get count of activities for a student
  getStudentActivityCount: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        status: z.enum([
          SubmissionStatus.DRAFT,
          SubmissionStatus.SUBMITTED,
          SubmissionStatus.UNDER_REVIEW,
          SubmissionStatus.GRADED,
          SubmissionStatus.RETURNED,
          SubmissionStatus.RESUBMITTED,
          SubmissionStatus.LATE,
          SubmissionStatus.REJECTED,
          // Add these after the schema migration is applied
          // SubmissionStatus.UNATTEMPTED,
          // SubmissionStatus.COMPLETED,
        ]).optional(),
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

      // Handle 'current' student ID
      let studentId = input.studentId;

      if (studentId === 'current') {
        // Find the student profile for the current user
        const studentProfile = await ctx.prisma.studentProfile.findFirst({
          where: { userId: ctx.session.user.id },
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Student profile not found for current user',
          });
        }

        studentId = studentProfile.id;
      }

      // Build where clause
      const where: any = {
        studentId,
      };

      if (input.classId) {
        where.activity = {
          classId: input.classId
        };
      }

      if (input.subjectId) {
        where.activity = {
          ...where.activity,
          subjectId: input.subjectId
        };
      }

      if (input.status) {
        where.status = input.status;
      }

      // Count activities
      return ctx.prisma.activityGrade.count({
        where
      });
    }),

  // New endpoint to fetch activities with grades for a student by class and subject
  listByStudentAndClass: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        subjectId: z.string().optional()
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

      // Find the student profile for the current user
      const studentProfile = await ctx.prisma.studentProfile.findFirst({
        where: { userId: ctx.session.user.id },
      });

      if (!studentProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student profile not found for current user',
        });
      }

      // Build the where condition
      const whereCondition: any = {
        studentId: studentProfile.id,
        activity: {
          classId: input.classId,
          status: SystemStatus.ACTIVE
        }
      };

      // Add subject filter if provided
      if (input.subjectId) {
        whereCondition.activity.subjectId = input.subjectId;
      }

      // Fetch activity grades with activity details and learning time records
      const activityGrades = await ctx.prisma.activityGrade.findMany({
        where: whereCondition,
        include: {
          activity: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              },
              topic: {
                select: {
                  id: true,
                  title: true,
                  code: true,
                }
              }
            }
          },
          // Include learning time records
          learningTimeRecords: true
        },
        orderBy: [
          { activity: { createdAt: 'desc' } }
        ]
      });

      return activityGrades;
    }),
});