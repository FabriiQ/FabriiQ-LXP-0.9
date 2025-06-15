import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { 
  AssignmentService, 
  createAssignmentSchema, 
  updateAssignmentSchema,
  assignmentSubmissionSchema,
  assignmentGradingSchema
} from "../services/assignment.service";
import { ActivityType, Prisma, SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { UserType } from "../constants";

// Create assignment input schema
const createAssignmentInput = createAssignmentSchema.extend({});

// Update assignment input schema
const updateAssignmentInput = updateAssignmentSchema.extend({});

// List assignments input schema
const listAssignmentsInput = z.object({
  subjectId: z.string().optional(),
  classId: z.string().optional(),
  type: z.nativeEnum(ActivityType).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

// Submit assignment input schema
const submitAssignmentInput = assignmentSubmissionSchema;

// Grade assignment input schema
const gradeAssignmentInput = assignmentGradingSchema;

export const assignmentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createAssignmentInput)
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const assignmentService = new AssignmentService({ prisma: ctx.prisma });
      return assignmentService.createAssignment(input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          UserType.CAMPUS_STUDENT,
        ].includes(ctx.session.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const assignmentService = new AssignmentService({ prisma: ctx.prisma });
      return assignmentService.getAssignment(input.id);
    }),

  list: protectedProcedure
    .input(listAssignmentsInput)
    .query(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          UserType.CAMPUS_STUDENT,
        ].includes(ctx.session.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const assignmentService = new AssignmentService({ prisma: ctx.prisma });
      // Use the appropriate method from the service
      return assignmentService.getAssignmentsBySubject(input.subjectId || "");
    }),

  update: protectedProcedure
    .input(updateAssignmentInput)
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const assignmentService = new AssignmentService({ prisma: ctx.prisma });
      return assignmentService.updateAssignment(input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const assignmentService = new AssignmentService({ prisma: ctx.prisma });
      return assignmentService.deleteAssignment(input.id);
    }),

  submit: protectedProcedure
    .input(submitAssignmentInput)
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          UserType.CAMPUS_STUDENT,
        ].includes(ctx.session.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (
        ctx.session.userType === "CAMPUS_STUDENT" &&
        input.studentId
      ) {
        // Verify student is submitting their own assignment
        const studentProfile = await ctx.prisma.studentProfile.findFirst({
          where: { userId: ctx.session.userId },
        });
        
        if (!studentProfile || studentProfile.id !== input.studentId) {
          throw new TRPCError({ 
            code: "UNAUTHORIZED",
            message: "Students can only submit their own assignments"
          });
        }
      }

      const assignmentService = new AssignmentService({ prisma: ctx.prisma });
      return assignmentService.submitAssignment(input);
    }),

  grade: protectedProcedure
    .input(gradeAssignmentInput)
    .mutation(async ({ ctx, input }) => {
      // Check user permissions
      if (
        ![
          "SYSTEM_ADMIN",
          "CAMPUS_ADMIN",
          "CAMPUS_TEACHER",
        ].includes(ctx.session.userType)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to grade assignments",
        });
      }

      const assignmentService = new AssignmentService({ prisma: ctx.prisma });
      return assignmentService.gradeAssignment(input);
    }),
}); 