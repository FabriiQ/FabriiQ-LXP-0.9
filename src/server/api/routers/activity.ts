import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ActivityService } from "../services/activity.service";
import { ComponentActivityService } from "../services/component-activity.service";
import { ClassService } from "../services/class.service";
import { ActivityGradeService } from "../services/activity-grade.service";
import { gradeActivity, getGradingFunction } from "../services/activity-grading-registry";
import {
  SystemStatus,
  UserType,
  ActivityPurpose,
  LearningActivityType,
  AssessmentType,
  SubmissionStatus
} from "../constants";
import { logger } from "../utils/logger";
import { processActivitySubmission } from "../services/activity-submission.service";
import { ActivityCacheService } from "../services/activity-cache.service";
import { ActivityBatchService } from "../services/activity-batch.service";
import { ActivityAnalyticsService } from "../services/activity-analytics.service";
import { ActivityArchivingService } from "../services/activity-archiving.service";
import { ActivityRewardIntegration } from "@/features/rewards/activity-integration";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { BloomsTaxonomyLevel } from "@/features/bloom/types";

// Activity content schema
const activityContentSchema = z.object({
  version: z.number(),
  activityType: z.string(),
  settings: z.record(z.any()).optional(),
  blocks: z.array(z.any()).optional(),
  metadata: z.object({
    objectives: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(),
    estimatedDuration: z.number().optional(),
    difficultyLevel: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  analytics: z.object({
    trackViews: z.boolean().optional(),
    trackInteractions: z.boolean().optional(),
    trackCompletion: z.boolean().optional(),
    customTracking: z.record(z.any()).optional(),
  }).optional(),
}).passthrough(); // Allow additional fields for activity-specific content

// Create activity schema for router
const routerCreateActivitySchema = z.object({
  title: z.string().min(1),
  purpose: z.nativeEnum(ActivityPurpose),
  learningType: z.nativeEnum(LearningActivityType).optional(),
  assessmentType: z.nativeEnum(AssessmentType).optional(),
  subjectId: z.string(),
  topicId: z.string().optional(),
  classId: z.string(),
  content: activityContentSchema,
  isGradable: z.boolean().default(false),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
  weightage: z.number().optional(),
  gradingConfig: z.any().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  duration: z.number().optional(),
  useComponentSystem: z.boolean().optional().default(false),
  // Add Bloom's taxonomy fields
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional(),
  learningOutcomeIds: z.array(z.string()).optional(),
  rubricId: z.string().optional(),
  lessonPlanId: z.string().optional(),
});

// Update activity schema for router
const routerUpdateActivitySchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  content: activityContentSchema.optional(),
  isGradable: z.boolean().optional(),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
  weightage: z.number().optional(),
  gradingConfig: z.any().optional(),
  status: z.enum([
    SystemStatus.ACTIVE,
    SystemStatus.INACTIVE,
    SystemStatus.ARCHIVED,
    SystemStatus.DELETED,
  ]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  duration: z.number().optional(),
  useComponentSystem: z.boolean().optional(),
});

const activityIdSchema = z.object({
  id: z.string(),
});

const classIdSchema = z.object({
  classId: z.string(),
});

// Analytics tracking schema
const trackActivityViewSchema = z.object({
  activityId: z.string(),
  userId: z.string(),
  institutionId: z.string(),
});

const trackActivityInteractionSchema = z.object({
  activityId: z.string(),
  userId: z.string(),
  institutionId: z.string(),
  data: z.any(),
});

const trackActivityCompletionSchema = z.object({
  activityId: z.string(),
  userId: z.string(),
  institutionId: z.string(),
  data: z.any(),
});

// Pagination type
type PaginationInput = {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

// Filter type
type FilterInput = {
  status?: SystemStatus;
  search?: string;
  subjectId?: string;
  topicId?: string;
  purpose?: ActivityPurpose;
  learningType?: LearningActivityType;
  assessmentType?: AssessmentType;
  isGradable?: boolean;
  lessonPlanId?: string; // Add lessonPlanId filter
};

// Grading functions are now imported from activity-grading-registry.ts

export const activityRouter = createTRPCRouter({
  /**
   * Auto-grade an activity
   *
   * This procedure automatically grades an activity submission using the appropriate
   * grading function based on the activity type.
   */
  autoGrade: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        studentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { prisma } = ctx;
        const { activityId, studentId } = input;

        // Get the activity
        const activity = await prisma.activity.findUnique({
          where: { id: activityId },
          include: {
            subject: true,
            class: true,
          },
        });

        if (!activity) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Activity not found",
          });
        }

        // Get the submission
        const submission = await prisma.activityGrade.findFirst({
          where: {
            activityId,
            studentId,
          },
        });

        if (!submission) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Submission not found",
          });
        }

        // Check if auto-grading is enabled for this activity
        let gradingMethod = 'manual';
        if (typeof activity.content === 'object' && activity.content !== null) {
          gradingMethod = (activity.content as any).gradingMethod || 'manual';
        } else if (typeof activity.gradingConfig === 'object' && activity.gradingConfig !== null) {
          gradingMethod = (activity.gradingConfig as any).gradingMethod || 'manual';
        }

        if (gradingMethod !== 'auto') {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This activity does not support auto-grading",
          });
        }

        // Get the activity type
        let activityType = 'manual-grading';
        if (typeof activity.content === 'object' && activity.content !== null) {
          activityType = (activity.content as any).activityType || 'manual-grading';
        }

        // Get the grading function
        const gradingFunction = getGradingFunction(activityType);
        if (!gradingFunction) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `No grading function found for activity type: ${activityType}`,
          });
        }

        // Grade the activity
        const gradingResult = gradingFunction(activity, submission.attachments || {});

        // Update the submission with the grading result
        const updatedSubmission = await prisma.activityGrade.update({
          where: { id: submission.id },
          data: {
            score: gradingResult.score,
            feedback: gradingResult.feedback,
            status: SubmissionStatus.GRADED,
            attachments: {
              ...(typeof submission.attachments === 'object' && submission.attachments !== null
                ? submission.attachments as object
                : {}),
              gradingDetails: {
                bloomsLevelScores: gradingResult.bloomsLevelScores,
                criteriaResults: gradingResult.criteriaResults,
                isAutoGraded: true,
              },
            },
          },
        });

        return updatedSubmission;
      } catch (error) {
        logger.error("Error auto-grading activity", { error });
        throw error;
      }
    }),
  /**
   * Submit an activity for grading
   *
   * This procedure handles the submission of an activity by a student,
   * including grading, feedback, and updating the gradebook.
   */
  submitActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        answers: z.any(),
        clientResult: z.any().optional(),
        storeDetailedResults: z.boolean().optional().default(true),
        priority: z.number().optional().default(1), // Add priority parameter for faster processing
        timeSpentMinutes: z.number().optional(), // Add timeSpentMinutes parameter for learning time tracking
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { activityId, answers, clientResult, storeDetailedResults, priority, timeSpentMinutes } = input;

        // Get the student profile
        const studentProfile = await ctx.prisma.studentProfile.findUnique({
          where: { userId: ctx.session.user.id },
          select: { id: true },
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        // Check if we should use batch processing or direct processing
        if (priority && priority > 3) {
          // High priority (4-5) - Process immediately for better user experience
          logger.debug('Processing high-priority activity submission immediately', {
            activityId,
            studentId: studentProfile.id,
            priority
          });

          // Process the submission directly
          const result = await processActivitySubmission(
            ctx.prisma,
            activityId,
            studentProfile.id,
            answers,
            clientResult,
            { storeDetailedResults },
            timeSpentMinutes
          );

          return result;
        } else {
          // Normal priority (1-3) - Use batch processing for better system performance
          // Get the batch service instance
          const batchService = ActivityBatchService.getInstance(ctx.prisma);

          // Queue the submission with the specified priority
          const queueId = await batchService.queueSubmission(
            activityId,
            studentProfile.id,
            answers,
            clientResult,
            { storeDetailedResults },
            priority || 1,
            timeSpentMinutes
          );

          logger.debug('Queued activity submission with batch service', {
            queueId,
            activityId,
            studentId: studentProfile.id,
            priority: priority || 1
          });

          // For immediate feedback, return a placeholder result
          // The actual processing will happen in the background
          return {
            success: true,
            gradeId: queueId, // Use the queue ID as a temporary grade ID
            score: clientResult?.score || null,
            maxScore: clientResult?.maxScore || null,
            feedback: "Your submission is being processed...",
            isGraded: false,
            rewardPoints: 10, // Default points for animation
            // Add placeholder reward data for animations
            levelUp: false,
            newLevel: null,
            achievements: []
          };
        }
      } catch (error) {
        logger.error('Error submitting activity', { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to submit activity: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),
  getUpcomingForClass: protectedProcedure
    .input(z.object({
      classId: z.string(),
      limit: z.number().optional().default(5),
    }))
    .query(async ({ ctx, input }) => {
      const { classId, limit } = input;

      // Get upcoming activities for the class
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

      const activities = await ctx.prisma.activity.findMany({
        where: {
          classId,
          status: SystemStatus.ACTIVE,
          startDate: {
            gte: new Date(),
            lte: twoWeeksFromNow,
          },
        },
        orderBy: {
          startDate: 'asc',
        },
        take: limit,
      });

      return activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        scheduledDate: activity.startDate || new Date(),
        type: activity.purpose,
        status: activity.status,
      }));
    }),
  create: protectedProcedure
    .input(routerCreateActivitySchema)
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER',
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        let activity: any;

        // Use the appropriate service based on whether it's a component-based activity
        if (input.useComponentSystem) {
          const service = new ComponentActivityService({ prisma: ctx.prisma });
          // Component service has a different structure than the ActivityService
          // We can't guarantee that the input matches the expected CreateActivityInput
          // So we create a specific object with the required properties
          activity = await service.createActivity({
            title: input.title,
            purpose: input.purpose,
            learningType: input.learningType,
            assessmentType: input.assessmentType,
            subjectId: input.subjectId,
            topicId: input.topicId,
            classId: input.classId,
            content: input.content,
            isGradable: input.isGradable,
            maxScore: input.maxScore,
            passingScore: input.passingScore,
            weightage: input.weightage,
            gradingConfig: input.gradingConfig,
            startDate: input.startDate,
            endDate: input.endDate,
            duration: input.duration,
            bloomsLevel: input.bloomsLevel,
            rubricId: input.rubricId,
            lessonPlanId: input.lessonPlanId,
            learningOutcomeIds: input.learningOutcomeIds,
          });
        } else {
          const service = new ActivityService({ prisma: ctx.prisma });
          // Create the activity input object without the optional assessmentType
          const activityInput: any = {
            title: input.title,
            purpose: input.purpose,
            learningType: input.learningType,
            subjectId: input.subjectId,
            topicId: input.topicId,
            classId: input.classId,
            content: input.content,
            isGradable: input.isGradable,
            maxScore: input.maxScore,
            passingScore: input.passingScore,
            weightage: input.weightage,
            gradingConfig: input.gradingConfig,
            startDate: input.startDate,
            endDate: input.endDate,
            duration: input.duration,
            bloomsLevel: input.bloomsLevel,
            rubricId: input.rubricId,
            lessonPlanId: input.lessonPlanId,
            learningOutcomeIds: input.learningOutcomeIds,
          };

          // Only add assessmentType if it's defined
          if (input.assessmentType) {
            activityInput.assessmentType = input.assessmentType;
          }

          activity = await service.createActivity(activityInput);
        }

        // Create ActivityGrade records for all students, regardless of whether the activity is gradable
        try {
          // First, ensure a gradebook exists for this class if the activity is gradable
          if (activity && input.isGradable) {
            const classService = new ClassService({ prisma: ctx.prisma });
            await classService.initializeGradebook(input.classId, ctx.session.user.id);
          }

          // Get all students enrolled in the class
          const enrollments = await ctx.prisma.studentEnrollment.findMany({
            where: {
              classId: input.classId,
              status: 'ACTIVE',
            },
            select: {
              studentId: true,
            },
          });

          // Create ActivityGrade entries for all students with UNATTEMPTED status
          if (enrollments.length > 0) {
            // Cast the status to any to avoid type errors with Prisma
            const gradeData = enrollments.map(enrollment => ({
              studentId: enrollment.studentId,
              activityId: activity.id,
              score: null,
              status: SubmissionStatus.DRAFT as any, // Will be updated to UNATTEMPTED after schema migration
              submittedAt: new Date(),
            }));

            // Batch insert the grade records
            if (gradeData.length > 0) {
              await ctx.prisma.activityGrade.createMany({
                data: gradeData,
                skipDuplicates: true,
              });

              logger.debug('Created ActivityGrade records for all students', {
                activityId: activity.id,
                studentCount: gradeData.length,
                status: SubmissionStatus.UNATTEMPTED
              });
            }
          }
        } catch (error) {
          // Log the error but don't fail the activity creation
          logger.error('Error creating ActivityGrade records:', error);
        }

        return activity;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create activity: ${(error as Error).message}`,
        });
      }
    }),

  getById: protectedProcedure
    .input(activityIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Validate input
        if (!input.id || typeof input.id !== 'string' || input.id.trim() === '') {
          logger.error('Invalid activity ID provided', { id: input.id });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid activity ID provided",
          });
        }

        // Special case: handle "grade" as a URL segment rather than an activity ID
        // This happens when the URL is like /activities/grade instead of /activities/[id]/grade
        if (input.id === 'grade') {
          logger.error('Invalid activity ID: "grade" is a URL segment, not an activity ID', { id: input.id });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid activity ID: 'grade' is a URL segment, not an activity ID. Please use the correct URL format.",
          });
        }

        logger.debug('Fetching activity by ID', { id: input.id });

        // First try with the standard service
        const service = new ActivityService({ prisma: ctx.prisma });

        try {
          const activity = await service.getActivity(input.id);

          // If this is a component-based activity (check by content structure)
          if (activity.content && typeof activity.content === 'object' && 'activityType' in activity.content) {
            // Here we could add additional component-specific data if needed
            logger.debug('Component-based activity detected', {
              activityId: activity.id,
              activityType: (activity.content as any).activityType
            });
          }

          return activity;
        } catch (serviceError) {
          logger.error('Error in ActivityService.getActivity', {
            id: input.id,
            error: serviceError
          });
          throw serviceError;
        }
      } catch (error) {
        logger.error('Error in getById procedure', {
          id: input.id,
          error: error
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get activity: ${(error as Error).message}`,
        });
      }
    }),

  getByClass: protectedProcedure
    .input(classIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Use the ComponentActivityService for this method since it has getActivitiesByClass
        const componentService = new ComponentActivityService({ prisma: ctx.prisma });
        return await componentService.getActivitiesByClass(input.classId);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get class activities: ${(error as Error).message}`,
        });
      }
    }),

  listByClass: protectedProcedure
    .input(classIdSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Get the student profile for the current user
        const studentProfile = await ctx.prisma.studentProfile.findUnique({
          where: { userId: ctx.session.user.id },
          select: { id: true },
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        // Get activities for this class
        const activities = await ctx.prisma.activity.findMany({
          where: {
            classId: input.classId,
            status: SystemStatus.ACTIVE,
          },
          include: {
            subject: true,
            topic: true,
            _count: {
              select: {
                activityGrades: true
              }
            },
            // Include the student's grades for each activity
            activityGrades: {
              where: {
                studentId: studentProfile.id
              },
              orderBy: {
                updatedAt: 'desc'
              },
              take: 1 // Only get the most recent grade
            }
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        logger.debug('Fetched activities with grades', {
          activityCount: activities.length,
          studentId: studentProfile.id,
          classId: input.classId
        });

        return activities;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to list class activities: ${(error as Error).message}`,
        });
      }
    }),

  update: protectedProcedure
    .input(routerUpdateActivitySchema)
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER',
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Check if this is a component-based activity
        const activity = await ctx.prisma.activity.findUnique({
          where: { id: input.id },
          select: { content: true }
        });

        if (!activity) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Activity not found" });
        }

        const isComponentBased = input.useComponentSystem ||
          (activity.content && typeof activity.content === 'object' && 'activityType' in activity.content);

        if (isComponentBased) {
          const service = new ComponentActivityService({ prisma: ctx.prisma });
          return await service.updateActivity(input.id, {
            title: input.title,
            content: input.content,
            isGradable: input.isGradable,
            maxScore: input.maxScore,
            passingScore: input.passingScore,
            weightage: input.weightage,
            gradingConfig: input.gradingConfig,
            status: input.status,
            startDate: input.startDate,
            endDate: input.endDate,
            duration: input.duration,
          });
        } else {
          const service = new ActivityService({ prisma: ctx.prisma });
          return await service.updateActivity(input.id, {
            title: input.title,
            content: input.content,
            isGradable: input.isGradable,
            maxScore: input.maxScore,
            passingScore: input.passingScore,
            weightage: input.weightage,
            gradingConfig: input.gradingConfig,
            status: input.status,
            startDate: input.startDate,
            endDate: input.endDate,
            duration: input.duration,
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update activity: ${(error as Error).message}`,
        });
      }
    }),

  delete: protectedProcedure
    .input(activityIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const service = new ActivityService({ prisma: ctx.prisma });
        return await service.deleteActivity(input.id);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete activity: ${(error as Error).message}`,
        });
      }
    }),

  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(10),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      status: z.nativeEnum(SystemStatus).optional(),
      search: z.string().optional(),
      subjectId: z.string().optional(),
      topicId: z.string().optional(),
      purpose: z.nativeEnum(ActivityPurpose).optional(),
      learningType: z.nativeEnum(LearningActivityType).optional(),
      assessmentType: z.nativeEnum(AssessmentType).optional(),
      isGradable: z.boolean().optional(),
      lessonPlanId: z.string().optional(), // Add lessonPlanId filter
    }))
    .query(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER',
          UserType.CAMPUS_STUDENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const service = new ActivityService({ prisma: ctx.prisma });

        // Extract pagination params
        const pagination: PaginationInput = {
          page: input.page,
          pageSize: input.pageSize,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
        };

        // Extract filter params
        const filters: FilterInput = {
          status: input.status,
          search: input.search,
          subjectId: input.subjectId,
          topicId: input.topicId,
          purpose: input.purpose,
          learningType: input.learningType,
          assessmentType: input.assessmentType,
          isGradable: input.isGradable,
          lessonPlanId: input.lessonPlanId, // Add lessonPlanId filter
        };

        return await service.listActivities(pagination, filters);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to list activities: ${(error as Error).message}`,
        });
      }
    }),

  // Removed duplicate getActivityAttempts endpoint - the one at line ~906 is kept

  // Analytics tracking endpoints
  trackView: protectedProcedure
    .input(trackActivityViewSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ComponentActivityService({ prisma: ctx.prisma });
      try {
        await service.recordActivityView(
          input.userId,
          input.activityId,
          input.institutionId
        );
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to track activity view: ${(error as Error).message}`,
        });
      }
    }),

  trackInteraction: protectedProcedure
    .input(trackActivityInteractionSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ComponentActivityService({ prisma: ctx.prisma });
      try {
        await service.recordActivityInteraction(
          input.userId,
          input.activityId,
          input.institutionId,
          input.data
        );
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to track activity interaction: ${(error as Error).message}`,
        });
      }
    }),

  trackCompletion: protectedProcedure
    .input(trackActivityCompletionSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ComponentActivityService({ prisma: ctx.prisma });
      try {
        await service.recordActivityCompletion(
          input.userId,
          input.activityId,
          input.institutionId,
          input.data
        );
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to track activity completion: ${(error as Error).message}`,
        });
      }
    }),

  /**
   * Get detailed submission results for an activity
   *
   * This endpoint retrieves the detailed results of a student's submission,
   * including question-by-question feedback and analytics.
   */
  getSubmissionDetails: protectedProcedure
    .input(z.object({
      activityId: z.string(),
      studentId: z.string().optional(), // Optional for teachers to view any student's submission
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { activityId, studentId } = input;

        // Determine which student's submission to retrieve
        let targetStudentId: string;

        // If studentId is provided and user is authorized to view it (teacher, admin)
        if (studentId && [
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER',
        ].includes(ctx.session.user.userType as UserType)) {
          targetStudentId = studentId;
        }
        // Otherwise, user can only view their own submissions
        else {
          // Get the student profile
          const studentProfile = await ctx.prisma.studentProfile.findUnique({
            where: { userId: ctx.session.user.id },
            select: { id: true },
          });

          if (!studentProfile) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Student profile not found",
            });
          }

          targetStudentId = studentProfile.id;
        }

        // Get the submission details
        const submission = await ctx.prisma.activityGrade.findFirst({
          where: {
            activityId,
            studentId: targetStudentId,
          },
          select: {
            id: true,
            score: true,
            status: true,
            submittedAt: true,
            gradedAt: true,
            feedback: true,
            attachments: true,
            content: true,
            activity: {
              select: {
                id: true,
                title: true,
                content: true,
                maxScore: true,
                passingScore: true,
              }
            }
          }
        });

        if (!submission) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Submission not found",
          });
        }

        // Extract detailed results from attachments if available
        const detailedResults = (submission.attachments as any)?.detailedResults || null;
        const attemptHistory = (submission.attachments as any)?.attemptHistory || [];

        return {
          submission: {
            id: submission.id,
            score: submission.score,
            status: submission.status,
            submittedAt: submission.submittedAt,
            gradedAt: submission.gradedAt,
            feedback: submission.feedback,
            answers: submission.content,
          },
          activity: submission.activity,
          detailedResults,
          attemptHistory,
        };
      } catch (error) {
        logger.error('Error retrieving submission details', { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to retrieve submission details: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),

  /**
   * Get activity attempts count for a student
   *
   * This endpoint returns the number of attempts a student has made for a specific activity
   */
  getActivityAttempts: protectedProcedure
    .input(z.object({
      activityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get the student profile
        const studentProfile = await ctx.prisma.studentProfile.findUnique({
          where: { userId: ctx.session.user.id },
          select: { id: true },
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        // Count the number of activity grades (submissions) for this activity and student
        const attemptCount = await ctx.prisma.activityGrade.count({
          where: {
            activityId: input.activityId,
            studentId: studentProfile.id,
          },
        });

        return {
          activityId: input.activityId,
          studentId: studentProfile.id,
          attemptCount,
        };
      } catch (error) {
        logger.error('Error getting activity attempts', { error, activityId: input.activityId });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get activity attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),

  /**
   * Get student activity statistics
   *
   * This endpoint provides statistics about a student's activity performance,
   * including completion rates, average scores, and trends over time.
   */
  getStudentActivityStats: protectedProcedure
    .input(z.object({
      studentId: z.string().optional(), // Optional for teachers to view any student's stats
      classId: z.string().optional(),
      subjectId: z.string().optional(),
      topicId: z.string().optional(),
      timeRange: z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { studentId, classId, subjectId, topicId, timeRange } = input;

        // Determine which student's stats to retrieve
        let targetStudentId: string;

        // If studentId is provided and user is authorized to view it (teacher, admin)
        if (studentId && [
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER',
        ].includes(ctx.session.user.userType as UserType)) {
          targetStudentId = studentId;
        }
        // Otherwise, user can only view their own stats
        else {
          // Get the student profile
          const studentProfile = await ctx.prisma.studentProfile.findUnique({
            where: { userId: ctx.session.user.id },
            select: { id: true },
          });

          if (!studentProfile) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Student profile not found",
            });
          }

          targetStudentId = studentProfile.id;
        }

        // Use the analytics service to get comprehensive student analytics
        const analyticsService = new ActivityAnalyticsService(ctx.prisma);
        const analytics = await analyticsService.getStudentAnalytics(targetStudentId, {
          classId,
          subjectId,
          topicId,
          timeRange
        });

        return analytics;
      } catch (error) {
        logger.error('Error retrieving student activity statistics', { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to retrieve activity statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),

  /**
   * Get comprehensive analytics for an activity
   *
   * This endpoint provides detailed analytics for an activity, including
   * student performance, question analysis, and score distribution.
   */
  getActivityAnalytics: protectedProcedure
    .input(z.object({
      activityId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { activityId } = input;

        // Check if the user has permission to view this activity
        if (![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER',
        ].includes(ctx.session.user.userType as UserType)) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Use the analytics service to get comprehensive activity analytics
        const analyticsService = new ActivityAnalyticsService(ctx.prisma);
        const analytics = await analyticsService.getActivityAnalytics(activityId);

        return analytics;
      } catch (error) {
        logger.error('Error retrieving activity analytics', { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to retrieve activity analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),

  /**
   * Get comparative analytics for activities
   *
   * This endpoint provides comparative analytics for activities across classes,
   * subjects, and topics.
   */
  getComparativeAnalytics: protectedProcedure
    .input(z.object({
      subjectId: z.string().optional(),
      topicId: z.string().optional(),
      activityType: z.string().optional(),
      timeRange: z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Check if the user has permission to view comparative analytics
        if (![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER',
        ].includes(ctx.session.user.userType as UserType)) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Use the analytics service to get comparative analytics
        const analyticsService = new ActivityAnalyticsService(ctx.prisma);
        const analytics = await analyticsService.getComparativeAnalytics(input);

        return analytics;
      } catch (error) {
        logger.error('Error retrieving comparative analytics', { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to retrieve comparative analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),

  /**
   * Submit activity in batch mode
   *
   * This endpoint queues an activity submission for batch processing,
   * which is useful during high-volume periods.
   */
  submitActivityBatch: protectedProcedure
    .input(z.object({
      activityId: z.string(),
      answers: z.any(),
      clientResult: z.any().optional(),
      priority: z.number().min(1).max(10).optional().default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { activityId, answers, clientResult, priority } = input;

        // Get the student profile
        const studentProfile = await ctx.prisma.studentProfile.findUnique({
          where: { userId: ctx.session.user.id },
          select: { id: true },
        });

        if (!studentProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found",
          });
        }

        // Get the batch service instance
        const batchService = ActivityBatchService.getInstance(ctx.prisma);

        // Queue the submission
        const queueId = await batchService.queueSubmission(
          activityId,
          studentProfile.id,
          answers,
          clientResult,
          { storeDetailedResults: true },
          priority
        );

        // Get the queue status
        const queueStatus = batchService.getQueueStatus();

        return {
          success: true,
          queueId,
          queueStatus,
          message: "Activity submission queued for processing"
        };
      } catch (error) {
        logger.error('Error queueing activity submission', { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to queue activity submission: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),

  /**
   * Get batch processing queue status
   *
   * This endpoint provides information about the current state of the
   * activity submission processing queue.
   */
  getBatchQueueStatus: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Check if the user has permission to view queue status
        if (![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER',
        ].includes(ctx.session.user.userType as UserType)) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Get the batch service instance
        const batchService = ActivityBatchService.getInstance(ctx.prisma);

        // Get the queue status
        const queueStatus = batchService.getQueueStatus();

        return queueStatus;
      } catch (error) {
        logger.error('Error retrieving batch queue status', { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to retrieve batch queue status: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),

  /**
   * Archive old activity grades
   *
   * This endpoint archives old activity grades to maintain database performance.
   */
  archiveActivityGrades: protectedProcedure
    .input(z.object({
      classId: z.string().optional(),
      beforeDate: z.date().optional(),
      dryRun: z.boolean().optional().default(false),
      ageThresholdDays: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if the user has permission to archive grades
        if (![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
        ].includes(ctx.session.user.userType as UserType)) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // Create the archiving service
        const archivingService = new ActivityArchivingService(ctx.prisma, {
          ageThresholdDays: input.ageThresholdDays,
        });

        // Archive old grades
        const result = await archivingService.archiveOldGrades({
          classId: input.classId,
          beforeDate: input.beforeDate,
          userId: ctx.session.user.id,
          dryRun: input.dryRun,
        });

        return result;
      } catch (error) {
        logger.error('Error archiving activity grades', { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to archive activity grades: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),

  /**
   * Get archived activity grades for a student
   *
   * This endpoint retrieves archived activity grades for a student.
   */
  getArchivedGradesForStudent: protectedProcedure
    .input(z.object({
      studentId: z.string().optional(),
      academicYear: z.string().optional(),
      termId: z.string().optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { studentId, academicYear, termId, limit, offset } = input;

        // Determine which student's archived grades to retrieve
        let targetStudentId: string;

        // If studentId is provided and user is authorized to view it (teacher, admin)
        if (studentId && [
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.CAMPUS_TEACHER,
          'TEACHER',
        ].includes(ctx.session.user.userType as UserType)) {
          targetStudentId = studentId;
        }
        // Otherwise, user can only view their own archived grades
        else {
          // Get the student profile
          const studentProfile = await ctx.prisma.studentProfile.findUnique({
            where: { userId: ctx.session.user.id },
            select: { id: true },
          });

          if (!studentProfile) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Student profile not found",
            });
          }

          targetStudentId = studentProfile.id;
        }

        // Create the archiving service
        const archivingService = new ActivityArchivingService(ctx.prisma);

        // Get archived grades for the student
        const archivedGrades = await archivingService.getArchivedGradesForStudent(
          targetStudentId,
          { academicYear, termId, limit, offset }
        );

        return archivedGrades;
      } catch (error) {
        logger.error('Error retrieving archived grades', { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to retrieve archived grades: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),
});