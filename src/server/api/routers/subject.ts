import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { SubjectService } from "../services/subject.service";
import { SystemStatus, UserType } from "../constants";
import { TRPCError } from "@trpc/server";

// Input validation schemas
const createSubjectSchema = z.object({
  code: z.string().min(2).max(10),
  name: z.string().min(1).max(100),
  credits: z.number().min(0),
  courseId: z.string(),
  syllabus: z.record(z.unknown()).optional(),
  bloomsDistribution: z.record(z.number()).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

const updateSubjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  credits: z.number().min(0).optional(),
  syllabus: z.record(z.unknown()).optional(),
  bloomsDistribution: z.record(z.number()).optional(),
  status: z.nativeEnum(SystemStatus).optional(),
});

const subjectIdSchema = z.object({
  id: z.string(),
});

export const subjectRouter = createTRPCRouter({
  // Get all subjects
  getAllSubjects: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        return ctx.prisma.subject.findMany({
          where: {
            status: 'ACTIVE' as SystemStatus,
          },
          orderBy: {
            name: 'asc',
          },
        });
      } catch (error) {
        console.error('Error fetching subjects:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch subjects',
        });
      }
    }),
  create: protectedProcedure
    .input(createSubjectSchema)
    .mutation(async ({ input, ctx }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Insufficient permissions to create subjects"
        });
      }

      // Ensure all required fields are present
      const subjectData: {
        code: string;
        name: string;
        credits: number;
        courseId: string;
        syllabus?: Record<string, unknown>;
        bloomsDistribution?: Record<string, number>;
        status?: SystemStatus;
      } = {
        code: input.code,
        name: input.name,
        credits: input.credits,
        courseId: input.courseId,
        syllabus: input.syllabus,
        bloomsDistribution: input.bloomsDistribution,
        status: input.status
      };

      const service = new SubjectService({ prisma: ctx.prisma });
      return service.createSubject(subjectData);
    }),

  getById: protectedProcedure
    .input(subjectIdSchema)
    .query(async ({ input, ctx }) => {
      const service = new SubjectService({ prisma: ctx.prisma });
      return service.getSubject(input.id);
    }),

  list: protectedProcedure
    .input(z.object({
      skip: z.number().min(0).default(0),
      take: z.number().min(1).max(100).default(10),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      status: z.nativeEnum(SystemStatus).optional(),
      search: z.string().optional(),
      courseId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          UserType.CAMPUS_STUDENT,
          'TEACHER',
          'STUDENT',
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const { skip, take, sortBy, sortOrder, ...filters } = input;
      const service = new SubjectService({ prisma: ctx.prisma });
      return service.listSubjects(
        { skip, take },
        filters,
      );
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: updateSubjectSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Insufficient permissions to update subjects"
        });
      }

      const service = new SubjectService({ prisma: ctx.prisma });
      return service.updateSubject(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(subjectIdSchema)
    .mutation(async ({ input, ctx }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only system admins can delete subjects"
        });
      }

      const service = new SubjectService({ prisma: ctx.prisma });
      return service.deleteSubject(input.id);
    }),

  getStats: protectedProcedure
    .input(subjectIdSchema)
    .query(async ({ input, ctx }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Insufficient permissions to view subject stats"
        });
      }

      const service = new SubjectService({ prisma: ctx.prisma });
      return service.getSubjectStats(input.id);
    }),

  // Get topics for a subject
  getTopics: protectedProcedure
    .input(z.object({
      subjectId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const topics = await ctx.prisma.subjectTopic.findMany({
        where: {
          subjectId: input.subjectId,
          status: SystemStatus.ACTIVE,
        },
        orderBy: {
          createdAt: 'asc' as const,
        },
      });

      return topics;
    }),

  // Get subjects for a course campus
  getByCourseCampus: protectedProcedure
    .input(z.object({
      courseCampusId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const courseCampus = await ctx.prisma.courseCampus.findUnique({
        where: { id: input.courseCampusId },
        include: { course: true }
      });

      if (!courseCampus) {
        return [];
      }

      const subjects = await ctx.prisma.subject.findMany({
        where: {
          courseId: courseCampus.courseId,
          status: SystemStatus.ACTIVE,
        },
        orderBy: {
          name: 'asc' as const,
        },
      });

      return subjects;
    }),

  getByCampus: protectedProcedure
    .input(z.object({
      campusId: z.string().min(1, "Campus ID is required"),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // If no campus ID is provided, try to use the user's primary campus
        const campusId = input.campusId || ctx.session?.user?.primaryCampusId;

        if (!campusId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Campus ID is required and no primary campus is available",
          });
        }

        const subjects = await ctx.prisma.subject.findMany({
          where: {
            course: {
              campusOfferings: {
                some: {
                  campusId
                }
              }
            },
            status: 'ACTIVE',
          },
          orderBy: { name: 'asc' },
        });

        return subjects;
      } catch (error) {
        console.error(`Error fetching subjects for campus ${input.campusId}:`, error);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while retrieving subjects",
            });
      }
    }),

  // Get all subjects, optionally filtered by campus
  getAll: protectedProcedure
    .input(z.object({
      campusId: z.string().optional(),
      status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED", "DELETED"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // If no campus ID is provided, try to use the user's primary campus
        const campusId = input.campusId || ctx.session?.user?.primaryCampusId;
        const status = input.status || 'ACTIVE';

        let subjects: any[];

        if (campusId) {
          // If we have a campus ID, filter subjects by campus
          subjects = await ctx.prisma.subject.findMany({
            where: {
              course: {
                campusOfferings: {
                  some: {
                    campusId
                  }
                }
              },
              status: status as SystemStatus,
            },
            orderBy: { name: 'asc' },
          });
        } else {
          // Otherwise, get all subjects
          subjects = await ctx.prisma.subject.findMany({
            where: {
              status: status as SystemStatus,
            },
            orderBy: { name: 'asc' },
          });
        }

        return subjects;
      } catch (error) {
        console.error(`Error fetching all subjects:`, error);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while retrieving subjects",
            });
      }
    }),
  // Get subjects for a teacher
  getTeacherSubjects: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      status: z.nativeEnum(SystemStatus).optional().default(SystemStatus.ACTIVE),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { teacherId, status } = input;

        // Get the teacher's subject qualifications
        const qualifications = await ctx.prisma.teacherSubjectQualification.findMany({
          where: {
            teacherId,
            isVerified: true,
          },
          select: {
            subjectId: true,
          },
        });

        // Get the teacher's class assignments
        const assignments = await ctx.prisma.teacherAssignment.findMany({
          where: {
            teacherId,
            status: status as SystemStatus,
          },
          include: {
            class: {
              include: {
                courseCampus: {
                  include: {
                    course: {
                      include: {
                        subjects: {
                          where: {
                            status: status as SystemStatus,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        // Extract subject IDs from qualifications
        const qualificationSubjectIds = qualifications.map((q: { subjectId: string }) => q.subjectId);

        // Extract subject IDs from class assignments
        const assignmentSubjectIds = assignments
          .flatMap((a: any) => a.class.courseCampus?.course?.subjects || [])
          .map((s: { id: string }) => s.id);

        // Combine and deduplicate subject IDs
        const subjectIds = [...new Set([...qualificationSubjectIds, ...assignmentSubjectIds])];

        if (subjectIds.length === 0) {
          return [];
        }

        // Fetch the actual subjects
        const subjects = await ctx.prisma.subject.findMany({
          where: {
            id: { in: subjectIds },
            status: status as SystemStatus,
          },
          orderBy: {
            name: 'asc',
          },
        });

        return subjects;
      } catch (error) {
        console.error(`Error fetching subjects for teacher ${input.teacherId}:`, error);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while retrieving teacher subjects",
            });
      }
    }),
});






