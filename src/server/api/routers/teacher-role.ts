import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TeacherRoleService } from "../services/teacher-role.service";
import { TRPCError } from "@trpc/server";
import { UserType } from "@prisma/client";
import { logger } from "../utils/logger";

export const teacherRoleRouter = createTRPCRouter({
  // Check if the current user is a class teacher for a specific class
  isClassTeacher: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        logger.warn("User not authenticated in isClassTeacher check", { classId: input.classId });
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      logger.debug("Checking class teacher permissions", {
        userId: ctx.session.user.id,
        userType: ctx.session.user.userType,
        classId: input.classId
      });

      // Allow system admins and campus admins
      if (ctx.session.user.userType === UserType.SYSTEM_ADMIN ||
          ctx.session.user.userType === UserType.CAMPUS_ADMIN ||
          ctx.session.user.userType === 'SYSTEM_ADMIN' ||
          ctx.session.user.userType === 'CAMPUS_ADMIN') {
        logger.debug("User is admin, granting class teacher access", {
          userId: ctx.session.user.id,
          userType: ctx.session.user.userType
        });
        return true;
      }

      // Allow coordinators
      if (ctx.session.user.userType === UserType.CAMPUS_COORDINATOR ||
          ctx.session.user.userType === 'COORDINATOR' ||
          ctx.session.user.userType === 'CAMPUS_COORDINATOR') {
        // Check if coordinator has access to this class
        const coordinator = await ctx.prisma.coordinatorProfile.findUnique({
          where: { userId: ctx.session.user.id }
        });

        if (coordinator) {
          logger.debug("User is coordinator, granting class teacher access", {
            userId: ctx.session.user.id,
            coordinatorId: coordinator.id
          });
          return true;
        }
      }

      // Check if user is a teacher
      if (ctx.session.user.userType !== UserType.CAMPUS_TEACHER &&
          ctx.session.user.userType !== 'TEACHER' &&
          ctx.session.user.userType !== 'CAMPUS_TEACHER') {
        logger.warn("User is not a teacher in isClassTeacher check", {
          userId: ctx.session.user.id,
          userType: ctx.session.user.userType
        });
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized",
        });
      }

      try {
        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          logger.warn(`Teacher profile not found for user ${ctx.session.user.id}`);

          // Instead of throwing an error, check if there's a direct assignment
          const directAssignment = await ctx.prisma.teacherAssignment.findFirst({
            where: {
              classId: input.classId,
              teacher: {
                userId: ctx.session.user.id
              }
            }
          });

          const hasDirectAssignment = !!directAssignment;
          logger.debug("Direct teacher assignment check result", {
            userId: ctx.session.user.id,
            classId: input.classId,
            hasDirectAssignment,
            assignmentId: directAssignment?.id
          });

          return hasDirectAssignment;
        }

        logger.debug("Found teacher profile, checking class assignment", {
          userId: ctx.session.user.id,
          teacherProfileId: user.teacherProfile.id,
          classId: input.classId
        });

        const teacherRoleService = new TeacherRoleService({ prisma: ctx.prisma });
        const isClassTeacher = await teacherRoleService.isClassTeacher(user.teacherProfile.id, input.classId);

        logger.debug("Teacher role check result", {
          userId: ctx.session.user.id,
          teacherProfileId: user.teacherProfile.id,
          classId: input.classId,
          isClassTeacher
        });

        return isClassTeacher;
      } catch (error) {
        logger.error('Error checking teacher role:', { error, userId: ctx.session.user.id, classId: input.classId });
        return false; // Default to false on error
      }
    }),

  // Check if the current user is a subject teacher for a specific class
  isSubjectTeacher: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a teacher
      if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized",
        });
      }

      // Get the teacher profile
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { teacherProfile: true }
      });

      if (!user?.teacherProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher profile not found",
        });
      }

      const teacherRoleService = new TeacherRoleService({ prisma: ctx.prisma });
      return teacherRoleService.isSubjectTeacher(user.teacherProfile.id, input.classId);
    }),

  // Get all classes where the current user is a class teacher
  getClassTeacherClasses: protectedProcedure
    .query(async ({ ctx }) => {
      // Ensure user is authenticated and is a teacher
      if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized",
        });
      }

      // Get the teacher profile
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { teacherProfile: true }
      });

      if (!user?.teacherProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher profile not found",
        });
      }

      const teacherRoleService = new TeacherRoleService({ prisma: ctx.prisma });
      return teacherRoleService.getClassTeacherClasses(user.teacherProfile.id);
    }),

  // Get all classes where the current user is a subject teacher
  getSubjectTeacherClasses: protectedProcedure
    .query(async ({ ctx }) => {
      // Ensure user is authenticated and is a teacher
      if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized",
        });
      }

      // Get the teacher profile
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { teacherProfile: true }
      });

      if (!user?.teacherProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher profile not found",
        });
      }

      const teacherRoleService = new TeacherRoleService({ prisma: ctx.prisma });
      return teacherRoleService.getSubjectTeacherClasses(user.teacherProfile.id);
    }),

  // Get all subjects the current user is qualified to teach
  getTeacherSubjects: protectedProcedure
    .query(async ({ ctx }) => {
      // Ensure user is authenticated and is a teacher
      if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized",
        });
      }

      // Get the teacher profile
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { teacherProfile: true }
      });

      if (!user?.teacherProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher profile not found",
        });
      }

      const teacherRoleService = new TeacherRoleService({ prisma: ctx.prisma });
      return teacherRoleService.getTeacherSubjects(user.teacherProfile.id);
    }),

  // Check if the current user has access to an activity
  hasActivityAccess: protectedProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a teacher
      if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized",
        });
      }

      // Get the teacher profile
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { teacherProfile: true }
      });

      if (!user?.teacherProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher profile not found",
        });
      }

      const teacherRoleService = new TeacherRoleService({ prisma: ctx.prisma });
      return teacherRoleService.hasActivityAccess(user.teacherProfile.id, input.activityId);
    }),
});
