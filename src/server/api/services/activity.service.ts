import { TRPCError } from "@trpc/server";
import { PrismaClient, SystemStatus } from "@prisma/client";
import { ActivityType } from "../constants";
import { SystemStatus as AppSystemStatus } from "../constants";
import type { PaginationInput, BaseFilters } from "../types/index";
import { CreateActivityInput, UpdateActivityInput } from "../types/activity";
import { SYSTEM_CONFIG, SubmissionStatus } from "../constants";
import { v4 as uuidv4 } from 'uuid';

interface ActivityServiceConfig {
  prisma: PrismaClient;
  defaultStatus?: SystemStatus;
}

export class ActivityService {
  private prisma: PrismaClient;
  private config: ActivityServiceConfig;

  constructor(config: ActivityServiceConfig) {
    this.prisma = config.prisma;
    this.config = config;
  }

  /**
   * Create a new activity
   */
  async createActivity(input: CreateActivityInput) {
    try {
      // Check if subject and class exist
      const subject = await this.prisma.subject.findUnique({
        where: { id: input.subjectId },
        select: { id: true, name: true }
      });

      const classEntity = await this.prisma.class.findUnique({
        where: { id: input.classId },
        select: { id: true, name: true }
      });

      if (!subject || !classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject or class not found",
        });
      }

      // Check if topic exists and belongs to subject
      let topic: { id: string; title: string; code: string; subjectId: string } | null = null;
      if (input.topicId) {
        const foundTopic = await this.prisma.subjectTopic.findUnique({
          where: { id: input.topicId },
          select: { id: true, title: true, code: true, subjectId: true }
        });

        if (!foundTopic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Topic not found",
          });
        }

        if (foundTopic.subjectId !== input.subjectId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Topic does not belong to the specified subject",
          });
        }

        topic = foundTopic;
      }

      // Set default status if not provided
      const status = input.status || this.config.defaultStatus || SystemStatus.ACTIVE;

      // Import the activity type mapper
      const { ensureActivityTypeConsistency } = await import('@/features/activties/utils/activity-type-mapper');

      // Create a copy of the input with the status
      const inputWithStatus = {
        ...input,
        status
      };

      // Ensure activity type consistency
      const consistentData = ensureActivityTypeConsistency(inputWithStatus);

      // Prepare data for activity creation with consistent types
      const activityData: any = {
        subjectId: consistentData.subjectId,
        classId: consistentData.classId,
        title: consistentData.title,
        purpose: consistentData.purpose,
        content: consistentData.content,
        status: consistentData.status || status,
        isGradable: consistentData.isGradable || false,
        learningType: consistentData.learningType,
        assessmentType: consistentData.assessmentType,
        topicId: consistentData.topicId,
        maxScore: consistentData.maxScore,
        passingScore: consistentData.passingScore,
        weightage: consistentData.weightage,
        gradingConfig: consistentData.gradingConfig,
        startDate: consistentData.startDate,
        endDate: consistentData.endDate,
        duration: consistentData.duration
      };

      // Create activity using Prisma
      const activity = await this.prisma.activity.create({
        data: activityData
      });

      // Return activity with related data
      return {
        ...activity,
        subject: {
          title: subject?.name
        },
        class: {
          name: classEntity.name
        },
        topic: topic ? {
          id: topic.id,
          title: topic.title,
          code: topic.code
        } : null,
        _count: {
          activityGrades: 0
        }
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create activity",
        cause: error,
      });
    }
  }

  /**
   * Get an activity by ID
   */
  async getActivity(id: string) {
    try {
      console.log(`Fetching activity with ID: ${id}`);

      // Validate the ID format first
      if (!id || typeof id !== 'string' || id.trim() === '') {
        console.error(`Invalid activity ID: ${id}`);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid activity ID",
        });
      }

      const activity = await this.prisma.activity.findUnique({
        where: { id },
        include: {
          subject: {
            select: {
              id: true,
              name: true
            }
          },
          class: {
            select: {
              id: true,
              name: true
            }
          },
          topic: {
            select: {
              id: true,
              title: true,
              code: true
            }
          },
          _count: {
            select: { activityGrades: true }
          }
        }
      });

      if (!activity) {
        console.error(`Activity not found with ID: ${id}`);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Activity not found with ID: ${id}`,
        });
      }

      console.log(`Successfully retrieved activity: ${activity.title}`);

      return {
        ...activity,
        subject: { title: activity.subject?.name },
        class: { name: activity.class?.name },
        topic: activity.topic ? {
          id: activity.topic.id,
          title: activity.topic.title,
          code: activity.topic.code
        } : null
      };
    } catch (error) {
      console.error(`Error fetching activity with ID ${id}:`, error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get activity: ${(error as Error).message}`,
        cause: error,
      });
    }
  }

  /**
   * List activities with pagination and filters
   */
  async listActivities(
    pagination: PaginationInput,
    filters?: BaseFilters & {
      subjectId?: string;
      topicId?: string;
      purpose?: string;
      learningType?: string;
      assessmentType?: string;
      isGradable?: boolean;
      lessonPlanId?: string; // Add lessonPlanId filter
    },
  ) {
    try {
      const { page = 1, pageSize = SYSTEM_CONFIG.DEFAULT_PAGE_SIZE } = pagination;
      const skip = (page - 1) * pageSize;

      // Build where conditions for Prisma query
      const whereConditions: any = {};

      if (filters) {
        if (filters.subjectId) {
          whereConditions.subjectId = filters.subjectId;
        }

        if (filters.topicId) {
          whereConditions.topicId = filters.topicId;
        }

        if (filters.purpose) {
          whereConditions.purpose = filters.purpose;
        }

        if (filters.learningType) {
          whereConditions.learningType = filters.learningType;
        }

        if (filters.assessmentType) {
          whereConditions.assessmentType = filters.assessmentType;
        }

        if (filters.isGradable !== undefined) {
          whereConditions.isGradable = filters.isGradable;
        }

        if (filters.status) {
          whereConditions.status = filters.status;
        }

        if (filters.search) {
          whereConditions.title = {
            contains: filters.search,
            mode: 'insensitive'
          };
        }

        // Add filter by lesson plan
        if (filters.lessonPlanId) {
          whereConditions.lessonPlanId = filters.lessonPlanId;
        }
      }

      // Get total count
      const total = await this.prisma.activity.count({
        where: whereConditions
      });

      // Get activities with pagination
      const activities = await this.prisma.activity.findMany({
        where: whereConditions,
        include: {
          subject: {
            select: {
              id: true,
              name: true
            }
          },
          class: {
            select: {
              id: true,
              name: true
            }
          },
          topic: {
            select: {
              id: true,
              title: true,
              code: true
            }
          },
          _count: {
            select: { activityGrades: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      });

      // Format activities to maintain the same response structure
      const formattedActivities = activities.map(activity => ({
        ...activity,
        subject: { title: activity.subject?.name },
        class: { name: activity.class?.name },
        topic: activity.topic ? {
          id: activity.topic.id,
          title: activity.topic.title,
          code: activity.topic.code
        } : null
      }));

      return {
        items: formattedActivities,
        meta: {
          total,
          page,
          pageSize,
          pageCount: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error("Error listing activities:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to list activities",
        cause: error,
      });
    }
  }

  /**
   * Update an activity by ID
   */
  async updateActivity(id: string, input: UpdateActivityInput) {
    try {
      // Check if activity exists
      const existingActivity = await this.prisma.activity.findUnique({
        where: { id }
      });

      if (!existingActivity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      // Import the activity type mapper
      const { ensureActivityTypeConsistency } = await import('@/features/activties/utils/activity-type-mapper');

      // Create a merged input with existing activity data
      const mergedInput = {
        ...existingActivity,
        ...input
      };

      // Ensure activity type consistency
      const consistentData = ensureActivityTypeConsistency(mergedInput);

      // Build update data with consistent types
      const updateData: any = {
        updatedAt: new Date(),
        title: consistentData.title,
        learningType: consistentData.learningType,
        assessmentType: consistentData.assessmentType,
        content: consistentData.content,
        isGradable: consistentData.isGradable,
        maxScore: consistentData.maxScore,
        passingScore: consistentData.passingScore,
        weightage: consistentData.weightage,
        gradingConfig: consistentData.gradingConfig,
        status: consistentData.status,
        startDate: consistentData.startDate,
        endDate: consistentData.endDate,
        duration: consistentData.duration
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Execute update
      if (Object.keys(updateData).length > 1) { // More than just updatedAt
        const updatedActivity = await this.prisma.activity.update({
          where: { id },
          data: updateData
        });

        // Get related data
        const [subject, classEntity, topic] = await Promise.all([
          this.prisma.subject.findUnique({
            where: { id: updatedActivity.subjectId },
            select: { name: true }
          }),
          this.prisma.class.findUnique({
            where: { id: updatedActivity.classId },
            select: { name: true }
          }),
          updatedActivity.topicId ? this.prisma.subjectTopic.findUnique({
            where: { id: updatedActivity.topicId },
            select: { title: true, code: true }
          }) : null
        ]);

        return {
          ...updatedActivity,
          subject: { title: subject?.name },
          class: { name: classEntity?.name },
          topic: updatedActivity.topicId && topic ? {
            id: updatedActivity.topicId,
            title: topic.title,
            code: topic.code
          } : null
        };
      }

      // If no fields to update, return existing activity with related data
      const [subject, classEntity, topic] = await Promise.all([
        this.prisma.subject.findUnique({
          where: { id: existingActivity.subjectId },
          select: { name: true }
        }),
        this.prisma.class.findUnique({
          where: { id: existingActivity.classId },
          select: { name: true }
        }),
        existingActivity.topicId ? this.prisma.subjectTopic.findUnique({
          where: { id: existingActivity.topicId },
          select: { title: true, code: true }
        }) : null
      ]);

      return {
        ...existingActivity,
        subject: { title: subject?.name },
        class: { name: classEntity?.name },
        topic: existingActivity.topicId && topic ? {
          id: existingActivity.topicId,
          title: topic.title,
          code: topic.code
        } : null
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update activity",
        cause: error,
      });
    }
  }

  /**
   * Delete an activity
   */
  async deleteActivity(id: string) {
    try {
      // Check if activity exists
      const existingActivity = await this.prisma.activity.findUnique({
        where: { id },
        include: {
          _count: {
            select: { activityGrades: true }
          }
        }
      });

      if (!existingActivity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      // Check if activity has any submissions/grades
      if (existingActivity._count.activityGrades > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete activity with existing submissions. Archive it instead.",
        });
      }

      // Delete activity
      await this.prisma.activity.delete({
        where: { id }
      });

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete activity",
        cause: error,
      });
    }
  }

  /**
   * Get activity statistics for a class
   */
  async getActivityStats(classId: string) {
    try {
      // Get all activities for the class with their grade counts
      const activities = await this.prisma.activity.findMany({
        where: {
          classId: classId,
          status: AppSystemStatus.ACTIVE
        },
        include: {
          _count: {
            select: { activityGrades: true }
          }
        }
      });

      // Get gradable activities and their completion stats
      const gradableActivities = activities.filter(a => a.isGradable);

      // Get total students in the class
      const studentCount = await this.prisma.studentEnrollment.count({
        where: {
          classId: classId,
          status: AppSystemStatus.ACTIVE
        }
      });

      // Calculate stats for each activity
      const activityStats = gradableActivities.map(activity => ({
        id: activity.id,
        title: activity.title,
        type: activity.purpose, // Use purpose instead of type which doesn't exist
        maxScore: activity.maxScore,
        submissionCount: activity._count.activityGrades,
        completionRate: studentCount > 0 ? (activity._count.activityGrades / studentCount) * 100 : 0,
      }));

      // Calculate overall stats
      const totalActivities = gradableActivities.length;
      const totalSubmissions = gradableActivities.reduce((sum, activity) => sum + activity._count.activityGrades, 0);
      const averageCompletionRate = totalActivities > 0
        ? gradableActivities.reduce((sum, activity) => sum + (activity._count.activityGrades / studentCount) * 100, 0) / totalActivities
        : 0;

      return {
        activities: activityStats,
        summary: {
          totalActivities,
          totalSubmissions,
          averageCompletionRate,
          studentCount,
        },
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get activity statistics",
        cause: error,
      });
    }
  }

  /**
   * Submit a response to an activity
   */
  async submitActivityResponse(activityId: string, studentId: string, submission: any) {
    try {
      // Check if activity exists
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId }
      });

      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      // Check if submission already exists
      const existingSubmission = await this.prisma.activityGrade.findUnique({
        where: {
          activityId_studentId: {
            activityId,
            studentId
          }
        }
      });

      const now = new Date();

      if (existingSubmission) {
        // Update existing submission
        const updatedSubmission = await this.prisma.activityGrade.update({
          where: {
            activityId_studentId: {
              activityId,
              studentId
            }
          },
          data: {
            content: submission,
            status: SubmissionStatus.SUBMITTED,
            submittedAt: now,
            updatedAt: now
          }
        });

        return updatedSubmission;
      } else {
        // Create new submission
        const id = uuidv4();
        const newSubmission = await this.prisma.activityGrade.create({
          data: {
            id,
            activityId,
            studentId,
            content: submission,
            status: SubmissionStatus.SUBMITTED,
            submittedAt: now,
            createdAt: now,
            updatedAt: now
          }
        });

        return newSubmission;
      }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to submit activity response",
        cause: error,
      });
    }
  }

  async getTeacherActivities(teacherId: string, limit?: number) {
    try {
      const activities = await this.prisma.activity.findMany({
        where: {
          class: {
            teachers: {
              some: {
                teacherId,
              },
            },
          },
          status: SystemStatus.ACTIVE,
        },
        include: {
          class: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return activities;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get teacher activities",
        cause: error,
      });
    }
  }
}