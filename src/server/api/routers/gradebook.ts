import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { UserType } from "@prisma/client";
import { GradeService } from "../services/grade.service";

// Input validation schemas
const createGradebookSchema = z.object({
  classId: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  gradingSystem: z.enum(["PERCENTAGE", "LETTER_GRADE", "GPA", "CUSTOM"]),
  config: z.object({
    weights: z.object({
      attendance: z.number().min(0).max(100),
      activities: z.number().min(0).max(100),
      assessments: z.number().min(0).max(100),
    }),
    passingGrade: z.number().min(0).max(100).optional(),
    customWeights: z.record(z.string(), z.number()).optional(),
  }),
});

export const gradebookRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createGradebookSchema)
    .mutation(async ({ input, ctx }) => {
      // Verify user has appropriate access
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          "TEACHER",
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Insufficient permissions to create gradebooks",
        });
      }

      try {
        // Get class details to get the term ID
        const classDetails = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          select: { termId: true },
        });

        if (!classDetails) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        const service = new GradeService({ prisma: ctx.prisma });
        
        // Create the gradebook
        const gradebook = await service.createGradeBook({
          classId: input.classId,
          termId: classDetails.termId,
          calculationRules: {
            title: input.title,
            description: input.description || "",
            gradingSystem: input.gradingSystem,
            weights: input.config.weights,
            passingGrade: input.config.passingGrade,
            customWeights: input.config.customWeights,
          },
          createdById: ctx.session.user.id,
        });

        return gradebook;
      } catch (error) {
        console.error("Error creating gradebook:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create gradebook",
          cause: error,
        });
      }
    }),

  getByClassId: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const gradebooks = await ctx.prisma.gradeBook.findMany({
          where: { classId: input.classId },
          include: {
            class: true,
            term: true,
            studentGrades: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        });

        if (gradebooks.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No gradebooks found for this class",
          });
        }

        return gradebooks;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch gradebooks",
          cause: error,
        });
      }
    }),
});
