import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  CourseService,
  createCourseSchema,
  updateCourseSchema,
  courseQuerySchema,
  createSubjectSchema,
  updateSubjectSchema,
  createCourseCampusSchema,
  updateCourseCampusSchema,
  coursePrerequisiteSchema
} from "../services/course.service";
import { SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { UserType } from "../types/user";

// Define allowed admin roles
const ADMIN_ROLES = [
  UserType.SYSTEM_ADMIN,
  UserType.SYSTEM_MANAGER,
  UserType.CAMPUS_ADMIN,
  UserType.CAMPUS_COORDINATOR,
] as const;

type AdminRole = typeof ADMIN_ROLES[number];

// Helper function to check if user has admin permissions
const hasAdminPermission = (userType: UserType): boolean => {
  return ADMIN_ROLES.includes(userType as AdminRole);
};

// List courses input schema
const listCoursesInput = courseQuerySchema.extend({
  search: z.string().optional(),
  skip: z.number().optional(),
  take: z.number().optional()
});

export const courseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createCourseSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasAdminPermission(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to create courses",
        });
      }

      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.createCourse(input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.getCourse(input.id);
    }),

  update: protectedProcedure
    .input(updateCourseSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasAdminPermission(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update courses",
        });
      }

      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.updateCourse(input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!hasAdminPermission(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete courses",
        });
      }

      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.deleteCourse(input.id);
    }),

  list: protectedProcedure
    .input(listCoursesInput)
    .query(async ({ ctx, input }) => {
      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.getCoursesByQuery(input);
    }),

  listByProgram: protectedProcedure
    .input(z.object({ programId: z.string() }))
    .query(async ({ ctx, input }) => {
      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.getCoursesByProgram(input.programId);
    }),

  // Subject endpoints
  createSubject: protectedProcedure
    .input(createSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasAdminPermission(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to create subjects",
        });
      }

      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.createSubject(input);
    }),

  getSubject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.getSubject(input.id);
    }),

  updateSubject: protectedProcedure
    .input(updateSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasAdminPermission(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update subjects",
        });
      }

      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.updateSubject(input);
    }),

  deleteSubject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!hasAdminPermission(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete subjects",
        });
      }

      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.deleteSubject(input.id);
    }),

  listSubjects: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.getSubjectsByCourse(input.courseId);
    }),

  associateSubjects: protectedProcedure
    .input(z.object({
      courseId: z.string(),
      subjectIds: z.array(z.string())
    }))
    .mutation(async ({ ctx, input }) => {
      if (!hasAdminPermission(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to associate subjects with courses",
        });
      }

      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.associateSubjectsWithCourse(input.courseId, input.subjectIds);
    }),

  // Course Campus endpoints
  createCourseCampus: protectedProcedure
    .input(createCourseCampusSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasAdminPermission(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to create course campus offerings",
        });
      }

      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.createCourseCampus(input);
    }),

  updateCourseCampus: protectedProcedure
    .input(updateCourseCampusSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasAdminPermission(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update course campus offerings",
        });
      }

      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.updateCourseCampus(input);
    }),

  // Course Prerequisites endpoints
  addPrerequisite: protectedProcedure
    .input(coursePrerequisiteSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasAdminPermission(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to add course prerequisites",
        });
      }

      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.addCoursePrerequisite(input);
    }),

  removePrerequisite: protectedProcedure
    .input(z.object({
      courseId: z.string(),
      prerequisiteId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!hasAdminPermission(ctx.session.user.userType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to remove course prerequisites",
        });
      }

      const courseService = new CourseService({ prisma: ctx.prisma });
      return courseService.removeCoursePrerequisite(input.courseId, input.prerequisiteId);
    }),

  getCampus: protectedProcedure
    .input(z.object({
      courseId: z.string(),
      campusId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const courseCampus = await ctx.prisma.courseCampus.findFirst({
        where: {
          courseId: input.courseId,
          campusId: input.campusId,
          status: "ACTIVE",
        },
      });
      return courseCampus;
    }),

  // Get courses by campus
  getByCampus: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      programId: z.string().optional(),
      status: z.nativeEnum(SystemStatus).optional().default(SystemStatus.ACTIVE),
      search: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { campusId, programId, status, search } = input;

        // Build where clause
        const where: any = {
          campusOfferings: {
            some: {
              campusId,
              status
            }
          },
          status
        };

        // Add program filter if provided
        if (programId) {
          where.programId = programId;
        }

        // Add search filter if provided
        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } }
          ];
        }

        // Get courses
        const courses = await ctx.prisma.course.findMany({
          where,
          include: {
            program: true,
            campusOfferings: {
              where: {
                campusId,
                status
              },
              include: {
                campus: true
              }
            },
            _count: {
              select: {
                subjects: true
              }
            }
          },
          orderBy: [
            { level: 'asc' },
            { code: 'asc' }
          ]
        });

        return courses;
      } catch (error) {
        console.error('Error fetching courses by campus:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch courses',
          cause: error
        });
      }
    })
});