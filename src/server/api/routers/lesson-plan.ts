/**
 * Lesson Plan Router
 * Handles API routes for lesson plan operations
 */

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { UserType } from "../types/user";
import { LessonPlanService } from "../services/lesson-plan.service";
import { LessonPlanCalendarService } from "../services/lesson-plan-calendar.service";
import { LessonPlanAnalyticsService } from "../services/lesson-plan-analytics.service";
import {
  createLessonPlanSchema,
  updateLessonPlanSchema,
  submitLessonPlanSchema,
  coordinatorApproveSchema,
  coordinatorRejectSchema,
  adminApproveSchema,
  adminRejectSchema,
  addReflectionSchema,
  lessonPlanQuerySchema
} from "../schemas/lesson-plan.schema";
import { z } from "zod";
import { BloomsTaxonomyLevel } from "@/features/bloom/types";

export const lessonPlanRouter = createTRPCRouter({
  // Create a new lesson plan
  create: protectedProcedure
    .input(createLessonPlanSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a teacher
      if (!ctx.session?.user?.id || ctx.session.user.userType !== UserType.CAMPUS_TEACHER) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only teachers can create lesson plans",
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

      // Create the lesson plan
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.createLessonPlan({
        ...input,
        teacherId: user.teacherProfile.id
      });
    }),

  // Update an existing lesson plan
  update: protectedProcedure
    .input(updateLessonPlanSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a teacher
      if (!ctx.session?.user?.id || ctx.session.user.userType !== UserType.CAMPUS_TEACHER) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only teachers can update lesson plans",
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

      // Verify the teacher owns the lesson plan
      const lessonPlan = await ctx.prisma.lessonPlan.findUnique({
        where: { id: input.id },
        select: { teacherId: true }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson plan not found",
        });
      }

      if (lessonPlan.teacherId !== user.teacherProfile.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own lesson plans",
        });
      }

      // Update the lesson plan
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.updateLessonPlan(input);
    }),

  // Get a lesson plan by ID
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get the lesson plan
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.getLessonPlanById(input);
    }),

  // Get lesson plans for a teacher
  getByTeacher: protectedProcedure
    .input(lessonPlanQuerySchema)
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get the teacher profile if the user is a teacher
      let teacherId = input.teacherId;

      if (!teacherId && ctx.session.user.userType === UserType.CAMPUS_TEACHER) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (user?.teacherProfile) {
          teacherId = user.teacherProfile.id;
        }
      }

      // Get the lesson plans
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.getLessonPlans({
        ...input,
        teacherId
      });
    }),

  // Get lesson plans for a class
  getByClass: protectedProcedure
    .input(lessonPlanQuerySchema)
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get the lesson plans
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.getLessonPlans(input);
    }),

  // Get lesson plans by status
  getByStatus: protectedProcedure
    .input(lessonPlanQuerySchema)
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      console.log(`getByStatus called with input:`, JSON.stringify(input));

      // Check if user is a coordinator
      const isCoordinator = ctx.session.user.userType === UserType.CAMPUS_COORDINATOR ||
                           ctx.session.user.userType === 'COORDINATOR';

      console.log(`User is coordinator: ${isCoordinator}`);

      // If user is a coordinator, get their managed classes
      if (isCoordinator) {
        try {
          const user = await ctx.prisma.user.findUnique({
            where: { id: ctx.session.user.id },
            include: { coordinatorProfile: true }
          });

          if (!user) {
            console.log('User not found');
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "User not found",
            });
          }

          if (!user.coordinatorProfile) {
            console.log('Coordinator profile not found');
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Coordinator profile not found",
            });
          }

          // Get managed courses from coordinator profile
          const managedCourses = user.coordinatorProfile.managedCourses as any[] || [];
          console.log(`Found ${managedCourses.length} managed courses for coordinator`);

          // Extract class IDs from managed courses
          const managedClassIds = new Set<string>();

          // Process each course to extract class IDs
          for (const course of managedCourses) {
            // Handle different possible data structures
            if (course.classes && Array.isArray(course.classes)) {
              // Standard structure with classes array
              for (const cls of course.classes) {
                if (cls && typeof cls === 'object' && cls.classId) {
                  managedClassIds.add(cls.classId);
                }
              }
            }
          }

          console.log(`Found ${managedClassIds.size} class IDs from managedCourses.classes`);

          // If no classes found in the standard structure, try to fetch classes directly
          if (managedClassIds.size === 0) {
            console.log('No classes found in managedCourses.classes, trying direct fetch');

            // Get course IDs from managed courses
            const courseIds = managedCourses.map(course => course.courseId).filter(Boolean);
            console.log(`Found ${courseIds.length} course IDs from managedCourses`);

            if (courseIds.length > 0) {
              // Get campus IDs from managed courses
              const campusIds = [...new Set(managedCourses.map(course => course.campusId).filter(Boolean))];
              console.log(`Found ${campusIds.length} campus IDs from managedCourses`);

              if (campusIds.length > 0) {
                // Fetch course campuses
                const courseCampuses = await ctx.prisma.courseCampus.findMany({
                  where: {
                    courseId: { in: courseIds },
                    campusId: { in: campusIds },
                    status: 'ACTIVE'
                  },
                  select: { id: true }
                });

                console.log(`Found ${courseCampuses.length} course campuses`);

                if (courseCampuses.length > 0) {
                  // Fetch classes for these course campuses
                  const courseCampusIds = courseCampuses.map(cc => cc.id);
                  const classes = await ctx.prisma.class.findMany({
                    where: {
                      courseCampusId: { in: courseCampusIds },
                      status: 'ACTIVE'
                    },
                    select: { id: true }
                  });

                  console.log(`Found ${classes.length} classes from course campuses`);

                  // Add class IDs to the set
                  for (const cls of classes) {
                    managedClassIds.add(cls.id);
                  }
                }
              }
            }
          }

          // If coordinator has managed classes, filter lesson plans by those classes
          if (managedClassIds.size > 0) {
            console.log(`Found ${managedClassIds.size} managed classes for coordinator`);

            // Get the lesson plans service
            const service = new LessonPlanService({ prisma: ctx.prisma });

            // Add class filter to input if not already specified
            const modifiedInput = {
              ...input,
              classIds: Array.from(managedClassIds)
            };

            // Get lesson plans for coordinator
            const result = await service.getLessonPlansForCoordinator(modifiedInput);
            console.log(`Found ${result.lessonPlans.length} lesson plans for coordinator`);

            // Log the statuses of the lesson plans
            const statusCounts = result.lessonPlans.reduce((acc, plan) => {
              acc[plan.status] = (acc[plan.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            console.log('Lesson plan status counts:', statusCounts);

            return result;
          } else {
            console.log('No managed classes found for coordinator');
          }
        } catch (error) {
          console.error('Error fetching coordinator managed classes:', error);
        }
      }

      // For non-coordinators or coordinators without managed classes, use standard query
      console.log('Using standard query for lesson plans');
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.getLessonPlans(input);
    }),

  // Get lesson plans for a specific class and teacher
  getByClassAndTeacher: protectedProcedure
    .input(z.object({
      classId: z.string(),
      teacherId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get the lesson plans service and use it to find lesson plans
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.getLessonPlans({
        classId: input.classId,
        teacherId: input.teacherId,
        page: 1,
        pageSize: 100 // Get a reasonable number of lesson plans
      });
    }),

  // Submit a lesson plan for review
  submit: protectedProcedure
    .input(submitLessonPlanSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a teacher
      if (!ctx.session?.user?.id || ctx.session.user.userType !== UserType.CAMPUS_TEACHER) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only teachers can submit lesson plans",
        });
      }

      // Submit the lesson plan
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.submitLessonPlan(input, ctx.session.user.id);
    }),

  // Approve a lesson plan as coordinator
  coordinatorApprove: protectedProcedure
    .input(coordinatorApproveSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a coordinator
      if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_COORDINATOR && ctx.session.user.userType !== 'COORDINATOR')) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only coordinators can approve lesson plans",
        });
      }

      // Approve the lesson plan
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.coordinatorApprove(input, ctx.session.user.id);
    }),

  // Reject a lesson plan as coordinator
  coordinatorReject: protectedProcedure
    .input(coordinatorRejectSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a coordinator
      if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_COORDINATOR && ctx.session.user.userType !== 'COORDINATOR')) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only coordinators can reject lesson plans",
        });
      }

      // Reject the lesson plan
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.coordinatorReject(input, ctx.session.user.id);
    }),

  // Approve a lesson plan as admin
  adminApprove: protectedProcedure
    .input(adminApproveSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is an admin
      if (!ctx.session?.user?.id || ctx.session.user.userType !== UserType.CAMPUS_ADMIN) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only campus admins can approve lesson plans",
        });
      }

      // Approve the lesson plan
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.adminApprove(input, ctx.session.user.id);
    }),

  // Reject a lesson plan as admin
  adminReject: protectedProcedure
    .input(adminRejectSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is an admin
      if (!ctx.session?.user?.id || ctx.session.user.userType !== UserType.CAMPUS_ADMIN) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only campus admins can reject lesson plans",
        });
      }

      // Reject the lesson plan
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.adminReject(input, ctx.session.user.id);
    }),

  // Add reflection to a lesson plan
  addReflection: protectedProcedure
    .input(addReflectionSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is authenticated and is a teacher
      if (!ctx.session?.user?.id || ctx.session.user.userType !== UserType.CAMPUS_TEACHER) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only teachers can add reflections to lesson plans",
        });
      }

      // Add reflection to the lesson plan
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.addReflection(input, ctx.session.user.id);
    }),

  // Get subject topics for lesson plan
  getSubjectTopics: protectedProcedure
    .input(z.object({
      subjectId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get subject topics
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.getSubjectTopics(input.subjectId);
    }),

  // Get suggested learning objectives based on topics
  getSuggestedLearningObjectives: protectedProcedure
    .input(z.object({
      topicIds: z.array(z.string())
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get suggested learning objectives
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.getSuggestedLearningObjectives(input.topicIds);
    }),

  // Get learning outcomes by Bloom's Taxonomy level
  getLearningOutcomesByBloomsLevel: protectedProcedure
    .input(z.object({
      subjectId: z.string(),
      topicId: z.string().optional(),
      bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional()
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get learning outcomes
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.getLearningOutcomesByBloomsLevel(
        input.subjectId,
        input.topicId,
        input.bloomsLevel
      );
    }),

  // Analyze Bloom's distribution for a lesson plan
  analyzeBloomsDistribution: protectedProcedure
    .input(z.object({
      lessonPlanId: z.string().optional(),
      content: z.record(z.any()).optional()
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const service = new LessonPlanService({ prisma: ctx.prisma });

      // If lessonPlanId is provided, get the lesson plan content
      if (input.lessonPlanId) {
        const lessonPlan = await service.getLessonPlanById(input.lessonPlanId);
        return service.analyzeLessonPlanBloomsDistribution(lessonPlan.content);
      }

      // Otherwise, use the provided content
      if (input.content) {
        return service.analyzeLessonPlanBloomsDistribution(input.content);
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Either lessonPlanId or content must be provided",
      });
    }),

  // Get lesson plan data for pre-filling activity form
  getLessonPlanDataForActivity: protectedProcedure
    .input(z.object({
      lessonPlanId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get lesson plan data for activity
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.getLessonPlanDataForActivity(input.lessonPlanId);
    }),

  // Get lesson plan data for pre-filling assessment form
  getLessonPlanDataForAssessment: protectedProcedure
    .input(z.object({
      lessonPlanId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get lesson plan data for assessment
      const service = new LessonPlanService({ prisma: ctx.prisma });
      return service.getLessonPlanDataForAssessment(input.lessonPlanId);
    }),

  // Get lesson plan events for calendar
  getCalendarEvents: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      classId: z.string().optional(),
      teacherId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get the calendar events
      const service = new LessonPlanCalendarService({ prisma: ctx.prisma });
      return service.getLessonPlanEvents(
        input.startDate,
        input.endDate,
        input.classId,
        input.teacherId
      );
    }),

  // Get lesson plan events for a teacher
  getTeacherCalendarEvents: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      teacherId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get the teacher ID
      let teacherId = input.teacherId;

      if (!teacherId && ctx.session.user.userType === UserType.CAMPUS_TEACHER) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (user?.teacherProfile) {
          teacherId = user.teacherProfile.id;
        } else {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }
      }

      // Get the calendar events
      const service = new LessonPlanCalendarService({ prisma: ctx.prisma });
      // Make sure teacherId is defined before passing it
      if (!teacherId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Teacher ID is required",
        });
      }

      return service.getTeacherLessonPlanEvents(
        teacherId,
        input.startDate,
        input.endDate
      );
    }),

  // Get lesson plan events for a class
  getClassCalendarEvents: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      classId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Get the calendar events
      const service = new LessonPlanCalendarService({ prisma: ctx.prisma });
      return service.getClassLessonPlanEvents(
        input.classId,
        input.startDate,
        input.endDate
      );
    }),

  // Export lesson plan to iCalendar format
  exportToCalendar: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      // Export the lesson plan
      const service = new LessonPlanCalendarService({ prisma: ctx.prisma });
      return service.exportLessonPlanToCalendar(input);
    }),

  // Get approval rate metrics
  getApprovalRateMetrics: protectedProcedure
    .input(z.object({
      campusId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated and has appropriate role
      if (!ctx.session?.user?.id ||
          (ctx.session.user.userType !== UserType.CAMPUS_ADMIN &&
           ctx.session.user.userType !== UserType.CAMPUS_COORDINATOR)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only admins and coordinators can access analytics",
        });
      }

      // Get the metrics
      const service = new LessonPlanAnalyticsService({ prisma: ctx.prisma });
      return service.getApprovalRateMetrics(
        input.campusId,
        input.startDate,
        input.endDate
      );
    }),

  // Get metrics by teacher
  getMetricsByTeacher: protectedProcedure
    .input(z.object({
      campusId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated and has appropriate role
      if (!ctx.session?.user?.id ||
          (ctx.session.user.userType !== UserType.CAMPUS_ADMIN &&
           ctx.session.user.userType !== UserType.CAMPUS_COORDINATOR)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only admins and coordinators can access analytics",
        });
      }

      // Get the metrics
      const service = new LessonPlanAnalyticsService({ prisma: ctx.prisma });
      return service.getMetricsByTeacher(
        input.campusId,
        input.startDate,
        input.endDate
      );
    }),

  // Get metrics by subject
  getMetricsBySubject: protectedProcedure
    .input(z.object({
      campusId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated and has appropriate role
      if (!ctx.session?.user?.id ||
          (ctx.session.user.userType !== UserType.CAMPUS_ADMIN &&
           ctx.session.user.userType !== UserType.CAMPUS_COORDINATOR)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only admins and coordinators can access analytics",
        });
      }

      // Get the metrics
      const service = new LessonPlanAnalyticsService({ prisma: ctx.prisma });
      return service.getMetricsBySubject(
        input.campusId,
        input.startDate,
        input.endDate
      );
    }),

  // Get metrics by month
  getMetricsByMonth: protectedProcedure
    .input(z.object({
      campusId: z.string().optional(),
      year: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated and has appropriate role
      if (!ctx.session?.user?.id ||
          (ctx.session.user.userType !== UserType.CAMPUS_ADMIN &&
           ctx.session.user.userType !== UserType.CAMPUS_COORDINATOR)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only admins and coordinators can access analytics",
        });
      }

      // Get the metrics
      const service = new LessonPlanAnalyticsService({ prisma: ctx.prisma });
      return service.getMetricsByMonth(
        input.campusId,
        input.year
      );
    }),

  // Get metrics by plan type
  getMetricsByPlanType: protectedProcedure
    .input(z.object({
      campusId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated and has appropriate role
      if (!ctx.session?.user?.id ||
          (ctx.session.user.userType !== UserType.CAMPUS_ADMIN &&
           ctx.session.user.userType !== UserType.CAMPUS_COORDINATOR)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only admins and coordinators can access analytics",
        });
      }

      // Get the metrics
      const service = new LessonPlanAnalyticsService({ prisma: ctx.prisma });
      return service.getMetricsByPlanType(
        input.campusId,
        input.startDate,
        input.endDate
      );
    }),
});
