import { PrismaClient, Activity, ActivityGrade } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { WithPrisma } from "../types/prisma";
import { SystemStatus, SubmissionStatus, ActivityPurpose, LearningActivityType, AssessmentType } from "../constants";

type CreateActivityInput = {
  title: string;
  purpose: ActivityPurpose;
  learningType?: LearningActivityType | undefined | null;
  assessmentType?: AssessmentType | undefined | null;
  subjectId: string;
  topicId?: string;
  classId: string;
  content: any;
  isGradable?: boolean;
  maxScore?: number;
  passingScore?: number;
  weightage?: number;
  gradingConfig?: any;
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  lessonPlanId?: string; // Add lessonPlanId for linking to lesson plan
};

type UpdateActivityInput = {
  title?: string;
  content?: any;
  isGradable?: boolean;
  maxScore?: number;
  passingScore?: number;
  weightage?: number;
  gradingConfig?: any;
  status?: SystemStatus;
  startDate?: Date;
  endDate?: Date;
  duration?: number;
};

export class ComponentActivityService {
  private prisma: PrismaClient;
  private defaultStatus: SystemStatus;

  constructor(config: WithPrisma) {
    this.prisma = config.prisma;
    this.defaultStatus = SystemStatus.ACTIVE;
  }

  /**
   * Create a new component-based activity
   */
  async createActivity(input: CreateActivityInput): Promise<Activity> {
    // Validate class exists
    const classExists = await this.prisma.class.findUnique({
      where: { id: input.classId },
    });

    if (!classExists) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Class not found",
      });
    }

    // Validate subject exists
    const subjectExists = await this.prisma.subject.findUnique({
      where: { id: input.subjectId },
    });

    if (!subjectExists) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subject not found",
      });
    }

    // Validate topic if provided
    if (input.topicId) {
      const topicExists = await this.prisma.subjectTopic.findUnique({
        where: { id: input.topicId },
      });

      if (!topicExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Topic not found",
        });
      }
    }

    try {
      // Import the activity type mapper
      const { ensureActivityTypeConsistency } = await import('@/features/activties/utils/activity-type-mapper');

      // Ensure activity type consistency
      const consistentData = ensureActivityTypeConsistency(input);

      // Create activity with structured content and consistent types
      return await this.prisma.activity.create({
        data: {
          title: consistentData.title,
          purpose: consistentData.purpose,
          learningType: consistentData.learningType,
          assessmentType: consistentData.assessmentType,
          subjectId: consistentData.subjectId,
          topicId: consistentData.topicId,
          classId: consistentData.classId,
          content: consistentData.content,
          isGradable: consistentData.isGradable || false,
          maxScore: consistentData.maxScore,
          passingScore: consistentData.passingScore,
          weightage: consistentData.weightage,
          gradingConfig: consistentData.gradingConfig,
          startDate: consistentData.startDate,
          endDate: consistentData.endDate,
          duration: consistentData.duration,
          status: this.defaultStatus,
        },
      });
    } catch (error) {
      console.error("Error creating activity:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to create activity: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get an activity by ID
   */
  async getActivity(id: string): Promise<Activity> {
    try {
      const activity = await this.prisma.activity.findUnique({
        where: { id },
      });

      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      return activity;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get activity: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get activities by class ID
   */
  async getActivitiesByClass(classId: string, lessonPlanId?: string): Promise<Activity[]> {
    try {
      const whereCondition: any = {
        classId,
        status: {
          in: [SystemStatus.ACTIVE, SystemStatus.INACTIVE],
        },
      };

      // Add lessonPlanId filter if provided
      if (lessonPlanId) {
        whereCondition.lessonPlanId = lessonPlanId;
      }

      return await this.prisma.activity.findMany({
        where: whereCondition,
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get class activities: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Update an activity
   */
  async updateActivity(id: string, input: UpdateActivityInput): Promise<Activity> {
    try {
      // Verify activity exists
      const existingActivity = await this.prisma.activity.findUnique({
        where: { id },
      });

      if (!existingActivity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      // Update activity
      return await this.prisma.activity.update({
        where: { id },
        data: {
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
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to update activity: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Record an activity view
   */
  async recordActivityView(userId: string, activityId: string, institutionId: string): Promise<void> {
    try {
      // First, check if the institution exists
      const institution = await this.prisma.institution.findUnique({
        where: { id: institutionId },
        select: { id: true }
      });

      if (!institution) {
        // If institution doesn't exist, try to find the user's institution
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { institutionId: true }
        });

        if (user?.institutionId) {
          institutionId = user.institutionId;
        } else {
          // If we can't find a valid institution, log the view without institution
          console.warn(`Could not find valid institution for analytics event. User: ${userId}, Activity: ${activityId}`);
          return; // Skip recording the event
        }
      }

      // Now create the analytics event with the valid institution ID
      await this.prisma.analyticsEvent.create({
        data: {
          event: 'ACTIVITY_VIEW',
          userId,
          institutionId,
          data: {
            activityId,
            timestamp: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to record activity view:', error);
      // Don't throw an error, just log it - we don't want analytics to break the app
      // This prevents the error from bubbling up to the client
    }
  }

  /**
   * Record an activity interaction
   */
  async recordActivityInteraction(userId: string, activityId: string, institutionId: string, data: any): Promise<void> {
    try {
      // First, check if the institution exists
      const institution = await this.prisma.institution.findUnique({
        where: { id: institutionId },
        select: { id: true }
      });

      if (!institution) {
        // If institution doesn't exist, try to find the user's institution
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { institutionId: true }
        });

        if (user?.institutionId) {
          institutionId = user.institutionId;
        } else {
          // If we can't find a valid institution, log the interaction without institution
          console.warn(`Could not find valid institution for analytics event. User: ${userId}, Activity: ${activityId}`);
          return; // Skip recording the event
        }
      }

      await this.prisma.analyticsEvent.create({
        data: {
          event: 'ACTIVITY_INTERACTION',
          userId,
          institutionId,
          data: {
            activityId,
            interactionData: data,
            timestamp: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to record activity interaction:', error);
      // Don't throw an error, just log it - we don't want analytics to break the app
    }
  }

  /**
   * Record an activity completion
   */
  async recordActivityCompletion(userId: string, activityId: string, institutionId: string, data: any): Promise<void> {
    try {
      // First, check if the institution exists
      const institution = await this.prisma.institution.findUnique({
        where: { id: institutionId },
        select: { id: true }
      });

      if (!institution) {
        // If institution doesn't exist, try to find the user's institution
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { institutionId: true }
        });

        if (user?.institutionId) {
          institutionId = user.institutionId;
        } else {
          // If we can't find a valid institution, log the completion without institution
          console.warn(`Could not find valid institution for analytics event. User: ${userId}, Activity: ${activityId}`);
          return; // Skip recording the event
        }
      }

      // Record the analytics event
      await this.prisma.analyticsEvent.create({
        data: {
          event: 'ACTIVITY_COMPLETION',
          userId,
          institutionId,
          data: {
            activityId,
            completionData: data,
            timestamp: new Date(),
          },
        },
      });

      // Get the activity to check if it's gradable
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: { id: true, isGradable: true }
      });

      if (!activity) {
        console.warn(`Activity not found for completion: ${activityId}`);
        return;
      }

      // Determine the appropriate status based on whether the activity is gradable
      const status = activity.isGradable ? 'SUBMITTED' : 'COMPLETED';

      // Update or create the ActivityGrade record
      await this.prisma.activityGrade.upsert({
        where: {
          activityId_studentId: {
            activityId,
            studentId: userId
          }
        },
        update: {
          status: status as any, // Type assertion to handle potential schema issues
          submittedAt: new Date(),
          content: data as any,
          updatedAt: new Date()
        },
        create: {
          activityId,
          studentId: userId,
          status: status as any, // Type assertion to handle potential schema issues
          submittedAt: new Date(),
          content: data as any,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`Activity completion recorded and status updated to ${status} for activity ${activityId} by user ${userId}`);
    } catch (error) {
      console.error('Failed to record activity completion:', error);
      // Don't throw an error, just log it - we don't want analytics to break the app
    }
  }

  /**
   * Grade an activity submission
   */
  async gradeActivity(
    activityId: string,
    studentId: string,
    score: number,
    feedback?: string
  ): Promise<ActivityGrade> {
    try {
      // Verify activity exists and is gradable
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
      });

      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      if (!activity.isGradable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Activity is not gradable",
        });
      }

      // Create or update the grade
      return await this.prisma.activityGrade.upsert({
        where: {
          activityId_studentId: {
            activityId,
            studentId,
          },
        },
        update: {
          score,
          feedback,
          gradedAt: new Date(),
          status: 'GRADED' as SubmissionStatus,
        },
        create: {
          activityId,
          studentId,
          score,
          feedback,
          gradedAt: new Date(),
          status: 'GRADED' as SubmissionStatus,
        },
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to grade activity: ${(error as Error).message}`,
      });
    }
  }
}