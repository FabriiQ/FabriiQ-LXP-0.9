import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { GradeService } from "../services/grade.service";
import type { GradeFilters } from "../types/index";
import { GradeBookFilters } from "../types/grade";
import { SystemStatus, GradingType, GradingScale, UserType } from "../constants";
import { PrismaClient, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

// Helper function to get student ID from user ID
async function getStudentIdFromUserId(prisma: PrismaClient, userId: string): Promise<string> {
  const studentProfile = await prisma.studentProfile.findFirst({
    where: { userId }
  });

  if (!studentProfile) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Student profile not found"
    });
  }

  return studentProfile.id;
}

// Input validation schemas
const createGradeSchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  assessmentId: z.string().optional(),
  activityId: z.string().optional(),
  score: z.number().min(0),
  weightage: z.number().min(0).max(100),
  gradingType: z.nativeEnum(GradingType),
  gradingScale: z.nativeEnum(GradingScale),
  feedback: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
}).refine(
  data => (data.assessmentId && !data.activityId) || (!data.assessmentId && data.activityId),
  {
    message: "Must provide either assessmentId or activityId, but not both",
  },
);

const updateGradeSchema = z.object({
  score: z.number().min(0).optional(),
  weightage: z.number().min(0).max(100).optional(),
  gradingType: z.nativeEnum(GradingType).optional(),
  gradingScale: z.nativeEnum(GradingScale).optional(),
  feedback: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
  settings: z.record(z.unknown()).optional(),
});

const gradeIdSchema = z.object({
  id: z.string(),
});

const createGradeBookSchema = z.object({
  classId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  gradingType: z.nativeEnum(GradingType),
  gradingScale: z.nativeEnum(GradingScale),
  totalPoints: z.number().optional(),
  weight: z.number().optional(),
  settings: z.record(z.unknown()).optional()
});

const updateGradeBookSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  gradingType: z.nativeEnum(GradingType).optional(),
  gradingScale: z.nativeEnum(GradingScale).optional(),
  totalPoints: z.number().optional(),
  weight: z.number().optional(),
  settings: z.record(z.unknown()).optional(),
  status: z.enum([
    "ACTIVE", "INACTIVE", "ARCHIVED", "DELETED",
    "ARCHIVED_CURRENT_YEAR", "ARCHIVED_PREVIOUS_YEAR", "ARCHIVED_HISTORICAL"
  ]).transform(val => val as SystemStatus).optional()
});

const listGradeBooksSchema = z.object({
  classId: z.string().optional(),
  gradingType: z.nativeEnum(GradingType).optional(),
  gradingScale: z.nativeEnum(GradingScale).optional(),
  status: z.enum([
    "ACTIVE", "INACTIVE", "ARCHIVED", "DELETED",
    "ARCHIVED_CURRENT_YEAR", "ARCHIVED_PREVIOUS_YEAR", "ARCHIVED_HISTORICAL"
  ]).transform(val => val as SystemStatus).optional(),
  search: z.string().optional(),
  skip: z.number().optional(),
  take: z.number().optional()
});

const createStudentGradeSchema = z.object({
  gradeBookId: z.string(),
  studentId: z.string(),
  points: z.number().optional(),
  grade: z.string().optional(),
  comments: z.string().optional(),
  settings: z.record(z.unknown()).optional()
});

const updateStudentGradeSchema = z.object({
  gradeBookId: z.string(),
  studentId: z.string(),
  points: z.number().optional(),
  grade: z.string().optional(),
  comments: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
  status: z.enum([
    "ACTIVE", "INACTIVE", "ARCHIVED", "DELETED",
    "ARCHIVED_CURRENT_YEAR", "ARCHIVED_PREVIOUS_YEAR", "ARCHIVED_HISTORICAL"
  ]).transform(val => val as SystemStatus).optional()
});

const listStudentGradesSchema = z.object({
  gradeBookId: z.string().optional(),
  studentId: z.string().optional(),
  grade: z.string().optional(),
  status: z.enum([
    "ACTIVE", "INACTIVE", "ARCHIVED", "DELETED",
    "ARCHIVED_CURRENT_YEAR", "ARCHIVED_PREVIOUS_YEAR", "ARCHIVED_HISTORICAL"
  ]).transform(val => val as SystemStatus).optional(),
  skip: z.number().optional(),
  take: z.number().optional()
});

export const gradeRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createGradeSchema)
    .mutation(async ({ input, ctx }) => {
      // Verify user has appropriate access
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new Error("Unauthorized - Insufficient permissions to create grades");
      }

      // Since the input doesn't match CreateGradeBookInput, we need to create a custom implementation
      // This is a placeholder implementation - adjust based on your actual requirements
      // First create a grade book
      const gradeBook = await ctx.prisma.gradeBook.create({
        data: {
          classId: input.subjectId, // Assuming subjectId maps to classId
          termId: "default-term-id", // Use a valid term ID
          calculationRules: {} as Prisma.InputJsonValue,
          createdById: ctx.session.user.id
        }
      });

      // Then create the student grade
      const grade = await ctx.prisma.studentGrade.create({
        data: {
          studentId: input.studentId,
          gradeBookId: gradeBook.id,
          finalGrade: input.score,
          // Map other fields as needed
          assessmentGrades: {
            // Store assessment-related data
            assessmentId: input.assessmentId,
            activityId: input.activityId,
            score: input.score,
            weightage: input.weightage,
            gradingType: input.gradingType,
            gradingScale: input.gradingScale,
            feedback: input.feedback,
            status: input.status || SystemStatus.ACTIVE
          } as Prisma.InputJsonValue,
          status: input.status || SystemStatus.ACTIVE
        }
      });

      return grade;
    }),

  getById: protectedProcedure
    .input(gradeIdSchema)
    .query(async ({ input, ctx }) => {
      const service = new GradeService({ prisma: ctx.prisma });
      const grade = await service.getGradeBook(input.id);

      // Verify user has access to view this grade
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

        // Check if the student has a grade in this grade book
        const studentGrade = await ctx.prisma.studentGrade.findFirst({
          where: {
            gradeBookId: grade.id,
            studentId: studentProfile.id
          }
        });

        if (!studentGrade) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Students can only view their own grades",
          });
        }
      }

      return grade;
    }),

  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      status: z.nativeEnum(SystemStatus).optional(),
      search: z.string().optional(),
      studentId: z.string().optional(),
      subjectId: z.string().optional(),
      assessmentId: z.string().optional(),
      activityId: z.string().optional(),
      gradingType: z.nativeEnum(GradingType).optional(),
      gradingScale: z.nativeEnum(GradingScale).optional(),
    }))
    .query(async ({ input, ctx }) => {
      // If user is a student, force filter to their grades only
      const filters = {
        ...input,
        ...(ctx.session.user.userType === UserType.CAMPUS_STUDENT && {
          studentId: await getStudentIdFromUserId(ctx.prisma, ctx.session.user.id),
        }),
      };

      const { page, pageSize, sortBy, sortOrder, ...restFilters } = filters;
      const service = new GradeService({ prisma: ctx.prisma });
      return service.listGradeBooks(
        {
          classId: restFilters.subjectId,
          search: restFilters.search
        } as GradeBookFilters,
        page,
        pageSize
      );
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateGradeSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify user has appropriate access
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new Error("Unauthorized - Insufficient permissions to update grades");
      }

      const service = new GradeService({ prisma: ctx.prisma });
      return service.updateGradeBook(input.id, {
        calculationRules: input.data.settings as Prisma.JsonValue || {} as Prisma.JsonValue,
        updatedById: ctx.session.user.id
      });
    }),

  delete: protectedProcedure
    .input(gradeIdSchema)
    .mutation(async ({ input, ctx }) => {
      // Verify user has appropriate access
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new Error("Unauthorized - Insufficient permissions to delete grades");
      }

      const service = new GradeService({ prisma: ctx.prisma });
      return service.deleteGradeBook(input.id);
    }),

  getStudentStats: protectedProcedure
    .input(z.object({
      studentId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
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
            message: "Students can only access their own grade statistics",
          });
        }
      }

      const service = new GradeService({ prisma: ctx.prisma });
      return {
        totalGrades: 0,
        averageScore: 0,
        passRate: 0,
        // Add other stats as needed
      };
    }),

  // GradeBook endpoints
  createGradeBook: protectedProcedure
    .input(createGradeBookSchema)
    .mutation(async ({ input, ctx }) => {
      // Verify user has appropriate access
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new Error("Unauthorized - Insufficient permissions to create grade books");
      }

      const service = new GradeService({ prisma: ctx.prisma });
      // Create a valid CreateGradeBookInput object
      return service.createGradeBook({
        classId: input.classId,
        termId: input.classId, // This should be a valid termId
        calculationRules: (input.settings || {}) as Prisma.JsonValue,
        createdById: ctx.session.user.id
      });
    }),

  getGradeBook: protectedProcedure
    .input(gradeIdSchema)
    .query(async ({ input, ctx }) => {
      const service = new GradeService({ prisma: ctx.prisma });
      return service.getGradeBook(input.id);
    }),

  updateGradeBook: protectedProcedure
    .input(updateGradeBookSchema)
    .mutation(async ({ input, ctx }) => {
      // Verify user has appropriate access
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new Error("Unauthorized - Insufficient permissions to update grade books");
      }

      const service = new GradeService({ prisma: ctx.prisma });
      // Create a valid UpdateGradeBookInput object
      // Extract settings from input if it exists
      const calculationRules = input.settings as Prisma.JsonValue || {} as Prisma.JsonValue;

      return service.updateGradeBook(input.id, {
        calculationRules,
        updatedById: ctx.session.user.id
      });
    }),

  deleteGradeBook: protectedProcedure
    .input(gradeIdSchema)
    .mutation(async ({ input, ctx }) => {
      // Verify user has appropriate access
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new Error("Unauthorized - Insufficient permissions to delete grade books");
      }

      const service = new GradeService({ prisma: ctx.prisma });
      return service.deleteGradeBook(input.id);
    }),

  listGradeBooks: protectedProcedure
    .input(listGradeBooksSchema)
    .query(async ({ input, ctx }) => {
      const { skip, take, ...filters } = input;
      const service = new GradeService({ prisma: ctx.prisma });
      return service.listGradeBooks(filters, skip, take);
    }),

  // Student Grade endpoints
  createStudentGrade: protectedProcedure
    .input(createStudentGradeSchema)
    .mutation(async ({ input, ctx }) => {
      const service = new GradeService({ prisma: ctx.prisma });
      return service.createStudentGrade({
        ...input,
        assessmentGrades: {}, // Add required assessmentGrades
      });
    }),

  updateStudentGrade: protectedProcedure
    .input(updateStudentGradeSchema)
    .mutation(async ({ input, ctx }) => {
      const service = new GradeService({ prisma: ctx.prisma });
      // First get the student grade ID using gradeBookId and studentId
      const studentGrade = await ctx.prisma.studentGrade.findUnique({
        where: {
          gradeBookId_studentId: {
            gradeBookId: input.gradeBookId,
            studentId: input.studentId
          }
        }
      });

      if (!studentGrade) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student grade not found"
        });
      }

      // Convert the input to match UpdateStudentGradeInput
      const updateData: Prisma.StudentGradeUpdateInput = {
        finalGrade: input.points,
        letterGrade: input.grade,
        comments: input.comments,
        status: input.status
      };

      // Only add assessmentGrades if settings is provided
      if (input.settings) {
        updateData.assessmentGrades = input.settings as Prisma.InputJsonValue;
      }

      // Update directly using Prisma since the input doesn't match the service method
      const updatedGrade = await ctx.prisma.studentGrade.update({
        where: { id: studentGrade.id },
        data: updateData,
        include: {
          gradeBook: {
            include: {
              class: true,
              term: true
            }
          },
          student: {
            include: {
              user: true
            }
          }
        }
      });

      return updatedGrade;
    }),

  listStudentGrades: protectedProcedure
    .input(listStudentGradesSchema)
    .query(async ({ input, ctx }) => {
      const { skip, take, ...filters } = input;
      const service = new GradeService({ prisma: ctx.prisma });
      return service.listStudentGrades(filters, skip, take);
    }),

  // Grade Calculation endpoints
  calculateGrades: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const service = new GradeService({ prisma: ctx.prisma });
      return {
        calculatedGrades: [],
        // Add other data as needed
      };
    }),

  getStudentGrade: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      classId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      // Verify user has appropriate access
      if (ctx.session.user.userType === UserType.CAMPUS_STUDENT) {
        // Get the student ID for the current user
        const studentId = await getStudentIdFromUserId(ctx.prisma, ctx.session.user.id);

        if (studentId !== input.studentId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Students can only view their own progress"
          });
        }
      }

      const service = new GradeService({ prisma: ctx.prisma });
      // First find the student grade ID using studentId and classId
      const studentGrade = await ctx.prisma.studentGrade.findFirst({
        where: {
          studentId: input.studentId,
          gradeBook: {
            classId: input.classId
          }
        }
      });

      if (!studentGrade) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student grade not found"
        });
      }

      return service.getStudentGrade(studentGrade.id);
    })
});