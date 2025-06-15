import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus, UserType } from "@prisma/client";
import { TeacherAssignmentService, assignTeacherSchema, teacherAssignmentQuerySchema } from "../services/teacher-assignment.service";

export const teacherAssignmentRouter = createTRPCRouter({
  // Assign a teacher to a class
  assignTeacher: protectedProcedure
    .input(assignTeacherSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Check if user has permission to assign teachers
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { 
          userType: true,
          coordinatorProfile: true
        }
      });

      const allowedRoles = [
        UserType.SYSTEM_ADMIN,
        UserType.SYSTEM_MANAGER,
        UserType.CAMPUS_ADMIN,
        UserType.CAMPUS_COORDINATOR
      ];

      if (!user || !allowedRoles.includes(user.userType as UserType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to assign teachers",
        });
      }

      // For coordinators, check if they are assigned to the program
      if (user.userType === UserType.CAMPUS_COORDINATOR) {
        // Get class details to check program
        const classEntity = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          include: {
            courseCampus: {
              include: {
                course: {
                  select: {
                    programId: true
                  }
                }
              }
            }
          }
        });

        if (!classEntity || !classEntity.courseCampus) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        // Check if coordinator is assigned to this program
        if (!user.coordinatorProfile) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Coordinator profile not found",
          });
        }

        const programId = classEntity.courseCampus.course.programId;
        const campusId = classEntity.campusId;
        const managedPrograms = user.coordinatorProfile.managedPrograms as any[];
        const isAssigned = managedPrograms.some(p => 
          p.programId === programId && p.campusId === campusId
        );

        if (!isAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to assign teachers to this class",
          });
        }
      }

      const assignmentService = new TeacherAssignmentService({ prisma: ctx.prisma });
      return assignmentService.assignTeacher(input);
    }),

  // Unassign a teacher from a class
  unassignTeacher: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Check if user has permission to unassign teachers
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { 
          userType: true,
          coordinatorProfile: true
        }
      });

      const allowedRoles = [
        UserType.SYSTEM_ADMIN,
        UserType.SYSTEM_MANAGER,
        UserType.CAMPUS_ADMIN,
        UserType.CAMPUS_COORDINATOR
      ];

      if (!user || !allowedRoles.includes(user.userType as UserType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to unassign teachers",
        });
      }

      // For coordinators, check if they are assigned to the program
      if (user.userType === UserType.CAMPUS_COORDINATOR) {
        // Get class details to check program
        const classEntity = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          include: {
            courseCampus: {
              include: {
                course: {
                  select: {
                    programId: true
                  }
                }
              }
            }
          }
        });

        if (!classEntity || !classEntity.courseCampus) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        // Check if coordinator is assigned to this program
        if (!user.coordinatorProfile) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Coordinator profile not found",
          });
        }

        const programId = classEntity.courseCampus.course.programId;
        const campusId = classEntity.campusId;
        const managedPrograms = user.coordinatorProfile.managedPrograms as any[];
        const isAssigned = managedPrograms.some(p => 
          p.programId === programId && p.campusId === campusId
        );

        if (!isAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to unassign teachers from this class",
          });
        }
      }

      const assignmentService = new TeacherAssignmentService({ prisma: ctx.prisma });
      return assignmentService.unassignTeacher(input.classId);
    }),

  // Get teacher assignments
  getTeacherAssignments: protectedProcedure
    .input(teacherAssignmentQuerySchema)
    .query(async ({ ctx, input }) => {
      const assignmentService = new TeacherAssignmentService({ prisma: ctx.prisma });
      return assignmentService.getTeacherAssignments(input);
    }),

  // Get available teachers for a class
  getAvailableTeachers: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const assignmentService = new TeacherAssignmentService({ prisma: ctx.prisma });
      return assignmentService.getAvailableTeachers(input.classId);
    }),

  // Get teacher workload
  getTeacherWorkload: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const assignmentService = new TeacherAssignmentService({ prisma: ctx.prisma });
      return assignmentService.getTeacherWorkload(input.teacherId);
    }),
});
