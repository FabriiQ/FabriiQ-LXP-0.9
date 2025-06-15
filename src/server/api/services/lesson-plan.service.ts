/**
 * Lesson Plan Service
 * Handles operations related to lesson plans
 */

// Define a namespace to replace the missing Prisma types
namespace Prisma {
  export type JsonValue = any;
  export type InputJsonValue = any;
  export type LessonPlanUpdateInput = any;
  export type LessonPlanWhereInput = any;
}
import { LessonPlanStatus, SystemStatus } from "../schemas/lesson-plan.schema";
import { TRPCError } from "@trpc/server";
import { ServiceBase } from "./service-base";
import {
  CreateLessonPlanInput,
  UpdateLessonPlanInput,
  SubmitLessonPlanInput,
  CoordinatorApproveInput,
  CoordinatorRejectInput,
  AdminApproveInput,
  AdminRejectInput,
  AddReflectionInput,
  LessonPlanQueryInput
} from "../schemas/lesson-plan.schema";
import {
  UserType,
  ActivityPurpose,
  LearningActivityType,
  AssessmentType,
  AssessmentCategory,
  GradingType
} from "../constants";
import { BloomsTaxonomyLevel, BloomsDistribution } from "@/features/bloom/types";
import { DEFAULT_BLOOMS_DISTRIBUTION } from "@/features/bloom/constants/bloom-levels";
import { NotificationService, NotificationDeliveryType, NotificationStatus } from "./notification.service";

import { SubjectTopicService } from './subject-topic.service';
import { ComponentActivityService } from './component-activity.service';
import { AssessmentService } from './assessment.service';

export class LessonPlanService extends ServiceBase {
  /**
   * Create a new lesson plan
   * @param data Lesson plan data
   * @returns Created lesson plan
   */
  async createLessonPlan(data: CreateLessonPlanInput) {
    try {
      // Verify teacher exists
      const teacher = await this.prisma.teacherProfile.findUnique({
        where: { id: data.teacherId },
        include: { user: true }
      });

      if (!teacher) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher not found",
        });
      }

      // Verify class exists
      const classEntity = await this.prisma.class.findUnique({
        where: { id: data.classId }
      });

      if (!classEntity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      // Verify subject exists if provided
      if (data.subjectId) {
        const subject = await this.prisma.subject.findUnique({
          where: { id: data.subjectId }
        });

        if (!subject) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subject not found",
          });
        }
      }

      // Extract Bloom's distribution from content if it exists
      const bloomsDistribution = data.content?.bloomsDistribution || null;

      // Create the lesson plan
      return await this.prisma.lessonPlan.create({
        data: {
          title: data.title,
          description: data.description,
          teacherId: data.teacherId,
          classId: data.classId,
          subjectId: data.subjectId,
          startDate: data.startDate,
          endDate: data.endDate,
          planType: data.planType,
          content: data.content as unknown as Prisma.JsonValue,
          bloomsDistribution: bloomsDistribution as unknown as Prisma.JsonValue, // Save in dedicated field
          status: LessonPlanStatus.DRAFT
        },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true
        }
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create lesson plan",
        cause: error,
      });
    }
  }

  /**
   * Update an existing lesson plan
   * @param data Lesson plan update data
   * @returns Updated lesson plan
   */
  async updateLessonPlan(data: UpdateLessonPlanInput) {
    try {
      // Verify lesson plan exists
      const lessonPlan = await this.prisma.lessonPlan.findUnique({
        where: { id: data.id }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson plan not found",
        });
      }

      // Only allow updates if the lesson plan is in DRAFT or REJECTED status
      if (lessonPlan.status !== LessonPlanStatus.DRAFT && lessonPlan.status !== LessonPlanStatus.REJECTED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot update a lesson plan that is not in DRAFT or REJECTED status",
        });
      }

      // Verify subject exists if provided
      if (data.subjectId) {
        const subject = await this.prisma.subject.findUnique({
          where: { id: data.subjectId }
        });

        if (!subject) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subject not found",
          });
        }
      }

      // Prepare update data
      const updateData: Prisma.LessonPlanUpdateInput = {};

      if (data.title) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.subjectId) updateData.subject = { connect: { id: data.subjectId } };
      if (data.startDate) updateData.startDate = data.startDate;
      if (data.endDate) updateData.endDate = data.endDate;
      if (data.planType) updateData.planType = data.planType;
      if (data.content) {
        updateData.content = data.content as Prisma.InputJsonValue;
        // Also update bloomsDistribution if it exists in content
        if (data.content.bloomsDistribution) {
          updateData.bloomsDistribution = data.content.bloomsDistribution as Prisma.InputJsonValue;
        }
      }
      if (data.status) updateData.status = data.status;

      // Update the lesson plan
      return await this.prisma.lessonPlan.update({
        where: { id: data.id },
        data: updateData,
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true
        }
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update lesson plan",
        cause: error,
      });
    }
  }

  /**
   * Get a lesson plan by ID
   * @param id Lesson plan ID
   * @returns Lesson plan
   */
  async getLessonPlanById(id: string) {
    try {
      const lessonPlan = await this.prisma.lessonPlan.findUnique({
        where: { id },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true,
          coordinator: true,
          admin: true
        }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson plan not found",
        });
      }

      // Extract learning outcome IDs from content if they exist
      const content = lessonPlan.content as any;
      const learningOutcomeIds = content?.learningOutcomeIds || [];

      // If there are learning outcome IDs, fetch the learning outcomes
      if (learningOutcomeIds.length > 0) {
        try {
          const learningOutcomes = await this.prisma.learningOutcome.findMany({
            where: {
              id: {
                in: learningOutcomeIds
              }
            },
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              },
              topic: {
                select: {
                  id: true,
                  title: true,
                  code: true,
                }
              }
            }
          });

          // Add learning outcomes to the content
          content.learningOutcomes = learningOutcomes;
          lessonPlan.content = content;
        } catch (error) {
          console.error('Error fetching learning outcomes:', error);
          // Don't fail the whole request if learning outcomes can't be fetched
        }
      }

      return lessonPlan;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get lesson plan",
        cause: error,
      });
    }
  }

  /**
   * Get lesson plans by query parameters
   * @param query Query parameters
   * @returns Lesson plans and count
   */
  async getLessonPlans(query: LessonPlanQueryInput) {
    try {
      const { page = 1, pageSize = 10, ...filters } = query;
      const skip = (page - 1) * pageSize;

      // Build where conditions
      const where: Prisma.LessonPlanWhereInput = {};

      if (filters.teacherId) where.teacherId = filters.teacherId;
      if (filters.classId) where.classId = filters.classId;
      if (filters.subjectId) where.subjectId = filters.subjectId;
      if (filters.status) where.status = filters.status;
      if (filters.planType) where.planType = filters.planType;

      // Date range filter
      if (filters.startDate || filters.endDate) {
        where.startDate = {};
        where.endDate = {};

        if (filters.startDate) {
          where.startDate.gte = filters.startDate;
        }

        if (filters.endDate) {
          where.endDate.lte = filters.endDate;
        }
      }

      // Get total count
      const totalCount = await this.prisma.lessonPlan.count({ where });

      // Get lesson plans
      const lessonPlans = await this.prisma.lessonPlan.findMany({
        where,
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true
        },
        skip,
        take: pageSize,
        orderBy: {
          updatedAt: 'desc'
        }
      });

      return {
        lessonPlans,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get lesson plans",
        cause: error,
      });
    }
  }

  /**
   * Get lesson plans for a coordinator by query parameters
   * @param query Query parameters including classIds from coordinator's managed classes
   * @returns Lesson plans and count
   */
  async getLessonPlansForCoordinator(query: LessonPlanQueryInput & { classIds?: string[] }) {
    try {
      const { page = 1, pageSize = 100, classIds, ...filters } = query;
      const skip = (page - 1) * pageSize;

      // Build where conditions
      const where: Prisma.LessonPlanWhereInput = {};

      if (filters.teacherId) where.teacherId = filters.teacherId;
      if (filters.classId) where.classId = filters.classId;
      if (filters.subjectId) where.subjectId = filters.subjectId;
      if (filters.status) where.status = filters.status;
      if (filters.planType) where.planType = filters.planType;

      // Filter by coordinator's managed classes - this is the key part
      if (classIds && classIds.length > 0) {
        // If a specific class is already filtered, make sure it's in the managed classes
        if (filters.classId) {
          if (!classIds.includes(filters.classId)) {
            // The requested class is not in the coordinator's managed classes
            console.log(`Requested class ${filters.classId} is not in coordinator's managed classes`);
            return {
              lessonPlans: [],
              totalCount: 0,
              page,
              pageSize,
              totalPages: 0
            };
          }
          // Keep the specific class filter
        } else {
          // No specific class filter, use all managed classes
          where.classId = { in: classIds };
        }
      } else if (!filters.classId) {
        // No managed classes and no specific class filter
        console.log('No managed classes found for coordinator and no specific class filter');
        return {
          lessonPlans: [],
          totalCount: 0,
          page,
          pageSize,
          totalPages: 0
        };
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        where.startDate = {};
        where.endDate = {};

        if (filters.startDate) {
          where.startDate.gte = filters.startDate;
        }

        if (filters.endDate) {
          where.endDate.lte = filters.endDate;
        }
      }

      console.log('Fetching lesson plans with where conditions:', JSON.stringify(where));

      // Get total count - without pagination to get all lesson plans
      const totalCount = await this.prisma.lessonPlan.count({ where });
      console.log(`Total count of lesson plans: ${totalCount}`);

      // Get lesson plans - increase pageSize to get more lesson plans
      const lessonPlans = await this.prisma.lessonPlan.findMany({
        where,
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true
        },
        // Skip pagination for now to get all lesson plans
        // skip,
        // take: pageSize,
        orderBy: {
          updatedAt: 'desc'
        }
      });

      console.log(`Found ${lessonPlans.length} lesson plans for coordinator`);

      // Log the statuses of the lesson plans
      const statusCounts = lessonPlans.reduce((acc, plan) => {
        acc[plan.status] = (acc[plan.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('Lesson plan status counts in service:', statusCounts);

      // Log some details about the first few lesson plans
      if (lessonPlans.length > 0) {
        console.log('First lesson plan details:');
        const firstPlan = lessonPlans[0];
        console.log(`ID: ${firstPlan.id}, Title: ${firstPlan.title}, Status: ${firstPlan.status}`);
        console.log(`Class: ${firstPlan.class.name}, Teacher: ${firstPlan.teacher.user.name}`);
      }

      return {
        lessonPlans,
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      };
    } catch (error) {
      console.error('Error in getLessonPlansForCoordinator:', error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get lesson plans for coordinator",
        cause: error,
      });
    }
  }

  /**
   * Submit a lesson plan for review
   * @param data Submission data
   * @returns Updated lesson plan
   */
  async submitLessonPlan(data: SubmitLessonPlanInput, userId: string) {
    try {
      // Verify lesson plan exists
      const lessonPlan = await this.prisma.lessonPlan.findUnique({
        where: { id: data.id },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: {
            include: {
              campus: true
            }
          }
        }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson plan not found",
        });
      }

      // Verify the user is the teacher who created the plan
      if (lessonPlan.teacher.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the teacher who created the lesson plan can submit it for review",
        });
      }

      // Only allow submission if the lesson plan is in DRAFT or REJECTED status
      if (lessonPlan.status !== LessonPlanStatus.DRAFT && lessonPlan.status !== LessonPlanStatus.REJECTED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot submit a lesson plan that is not in DRAFT or REJECTED status",
        });
      }

      // Update the lesson plan status
      const updatedLessonPlan = await this.prisma.lessonPlan.update({
        where: { id: data.id },
        data: {
          status: LessonPlanStatus.SUBMITTED,
          submittedAt: new Date()
        },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true
        }
      });

      // Find coordinators for the campus to notify them
      const coordinators = await this.prisma.user.findMany({
        where: {
          OR: [
            { userType: UserType.CAMPUS_COORDINATOR },
            { userType: 'COORDINATOR' }
          ],
          activeCampuses: {
            some: {
              campusId: lessonPlan.class.campusId,
              status: 'ACTIVE'
            }
          }
        }
      });

      // Send notifications to coordinators
      if (coordinators.length > 0) {
        const notificationService = new NotificationService({ prisma: this.prisma });

        await notificationService.createNotification({
          title: "New Lesson Plan Submitted",
          content: `${lessonPlan.teacher.user.name} has submitted a lesson plan "${lessonPlan.title}" for review.`,
          type: "LESSON_PLAN_SUBMITTED",
          status: NotificationStatus.PUBLISHED,
          deliveryType: NotificationDeliveryType.IN_APP,
          senderId: userId,
          recipientIds: coordinators.map((c: { id: string }) => c.id),
          metadata: {
            lessonPlanId: lessonPlan.id,
            teacherId: lessonPlan.teacherId,
            teacherName: lessonPlan.teacher.user.name,
            classId: lessonPlan.classId,
            className: lessonPlan.class.name
          }
        });
      }

      return updatedLessonPlan;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to submit lesson plan",
        cause: error,
      });
    }
  }

  /**
   * Approve a lesson plan as coordinator
   * @param data Approval data
   * @param coordinatorId Coordinator user ID
   * @returns Updated lesson plan
   */
  async coordinatorApprove(data: CoordinatorApproveInput, coordinatorId: string) {
    try {
      // Verify lesson plan exists
      const lessonPlan = await this.prisma.lessonPlan.findUnique({
        where: { id: data.id },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: {
            include: {
              campus: true
            }
          }
        }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson plan not found",
        });
      }

      // Only allow approval if the lesson plan is in SUBMITTED status
      if (lessonPlan.status !== LessonPlanStatus.SUBMITTED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot approve a lesson plan that is not in SUBMITTED status",
        });
      }

      // Verify the user is a coordinator for the campus
      const coordinator = await this.prisma.user.findFirst({
        where: {
          id: coordinatorId,
          OR: [
            { userType: UserType.CAMPUS_COORDINATOR },
            { userType: 'COORDINATOR' }
          ],
          activeCampuses: {
            some: {
              campusId: lessonPlan.class.campusId,
              status: 'ACTIVE'
            }
          }
        }
      });

      if (!coordinator) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coordinators for this campus can approve lesson plans",
        });
      }

      // Update the lesson plan status
      const updatedLessonPlan = await this.prisma.lessonPlan.update({
        where: { id: data.id },
        data: {
          status: LessonPlanStatus.COORDINATOR_APPROVED,
          coordinatorId: coordinatorId,
          coordinatorNote: data.note,
          coordinatorApprovedAt: new Date()
        },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true,
          coordinator: true
        }
      });

      // Find campus admins to notify them
      const campusAdmins = await this.prisma.user.findMany({
        where: {
          userType: UserType.CAMPUS_ADMIN,
          activeCampuses: {
            some: {
              campusId: lessonPlan.class.campusId,
              status: 'ACTIVE'
            }
          }
        }
      });

      // Send notifications to campus admins
      if (campusAdmins.length > 0) {
        const notificationService = new NotificationService({ prisma: this.prisma });

        await notificationService.createNotification({
          title: "Lesson Plan Approved by Coordinator",
          content: `A lesson plan "${lessonPlan.title}" has been approved by coordinator ${coordinator.name} and is awaiting your final approval.`,
          type: "LESSON_PLAN_COORDINATOR_APPROVED",
          status: NotificationStatus.PUBLISHED,
          deliveryType: NotificationDeliveryType.IN_APP,
          senderId: coordinatorId,
          recipientIds: campusAdmins.map((a: { id: string }) => a.id),
          metadata: {
            lessonPlanId: lessonPlan.id,
            teacherId: lessonPlan.teacherId,
            teacherName: lessonPlan.teacher.user.name,
            classId: lessonPlan.classId,
            className: lessonPlan.class.name,
            coordinatorId: coordinatorId,
            coordinatorName: coordinator.name
          }
        });
      }

      return updatedLessonPlan;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to approve lesson plan",
        cause: error,
      });
    }
  }

  /**
   * Reject a lesson plan as coordinator
   * @param data Rejection data
   * @param coordinatorId Coordinator user ID
   * @returns Updated lesson plan
   */
  async coordinatorReject(data: CoordinatorRejectInput, coordinatorId: string) {
    try {
      // Verify lesson plan exists
      const lessonPlan = await this.prisma.lessonPlan.findUnique({
        where: { id: data.id },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: {
            include: {
              campus: true
            }
          }
        }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson plan not found",
        });
      }

      // Only allow rejection if the lesson plan is in SUBMITTED status
      if (lessonPlan.status !== LessonPlanStatus.SUBMITTED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot reject a lesson plan that is not in SUBMITTED status",
        });
      }

      // Verify the user is a coordinator for the campus
      const coordinator = await this.prisma.user.findFirst({
        where: {
          id: coordinatorId,
          OR: [
            { userType: UserType.CAMPUS_COORDINATOR },
            { userType: 'COORDINATOR' }
          ],
          activeCampuses: {
            some: {
              campusId: lessonPlan.class.campusId,
              status: 'ACTIVE'
            }
          }
        }
      });

      if (!coordinator) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only coordinators for this campus can reject lesson plans",
        });
      }

      // Update the lesson plan status
      const updatedLessonPlan = await this.prisma.lessonPlan.update({
        where: { id: data.id },
        data: {
          status: LessonPlanStatus.REJECTED,
          coordinatorId: coordinatorId,
          coordinatorNote: data.note
        },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true,
          coordinator: true
        }
      });

      // Send notification to the teacher
      const notificationService = new NotificationService({ prisma: this.prisma });

      await notificationService.createNotification({
        title: "Lesson Plan Rejected",
        content: `Your lesson plan "${lessonPlan.title}" has been rejected by coordinator ${coordinator.name}. Reason: ${data.note}`,
        type: "LESSON_PLAN_REJECTED",
        status: NotificationStatus.PUBLISHED,
        deliveryType: NotificationDeliveryType.IN_APP,
        senderId: coordinatorId,
        recipientIds: [lessonPlan.teacher.userId],
        metadata: {
          lessonPlanId: lessonPlan.id,
          coordinatorId: coordinatorId,
          coordinatorName: coordinator.name,
          rejectionReason: data.note
        }
      });

      return updatedLessonPlan;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to reject lesson plan",
        cause: error,
      });
    }
  }

  /**
   * Approve a lesson plan as admin
   * @param data Approval data
   * @param adminId Admin user ID
   * @returns Updated lesson plan
   */
  async adminApprove(data: AdminApproveInput, adminId: string) {
    try {
      // Verify lesson plan exists
      const lessonPlan = await this.prisma.lessonPlan.findUnique({
        where: { id: data.id },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: {
            include: {
              campus: true
            }
          }
        }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson plan not found",
        });
      }

      // Only allow approval if the lesson plan is in COORDINATOR_APPROVED status
      if (lessonPlan.status !== LessonPlanStatus.COORDINATOR_APPROVED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot approve a lesson plan that is not in COORDINATOR_APPROVED status",
        });
      }

      // Verify the user is an admin for the campus
      const admin = await this.prisma.user.findFirst({
        where: {
          id: adminId,
          userType: UserType.CAMPUS_ADMIN,
          activeCampuses: {
            some: {
              campusId: lessonPlan.class.campusId,
              status: 'ACTIVE'
            }
          }
        }
      });

      if (!admin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only campus admins for this campus can approve lesson plans",
        });
      }

      // Update the lesson plan status
      const updatedLessonPlan = await this.prisma.lessonPlan.update({
        where: { id: data.id },
        data: {
          status: LessonPlanStatus.APPROVED,
          adminId: adminId,
          adminNote: data.note,
          adminApprovedAt: new Date()
        },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true,
          coordinator: true,
          admin: true
        }
      });

      // Send notification to the teacher
      const notificationService = new NotificationService({ prisma: this.prisma });

      await notificationService.createNotification({
        title: "Lesson Plan Approved",
        content: `Your lesson plan "${lessonPlan.title}" has been approved by admin ${admin.name}.`,
        type: "LESSON_PLAN_APPROVED",
        status: NotificationStatus.PUBLISHED,
        deliveryType: NotificationDeliveryType.IN_APP,
        senderId: adminId,
        recipientIds: [lessonPlan.teacher.userId],
        metadata: {
          lessonPlanId: lessonPlan.id,
          adminId: adminId,
          adminName: admin.name
        }
      });

      return updatedLessonPlan;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to approve lesson plan",
        cause: error,
      });
    }
  }

  /**
   * Reject a lesson plan as admin
   * @param data Rejection data
   * @param adminId Admin user ID
   * @returns Updated lesson plan
   */
  async adminReject(data: AdminRejectInput, adminId: string) {
    try {
      // Verify lesson plan exists
      const lessonPlan = await this.prisma.lessonPlan.findUnique({
        where: { id: data.id },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: {
            include: {
              campus: true
            }
          }
        }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson plan not found",
        });
      }

      // Only allow rejection if the lesson plan is in COORDINATOR_APPROVED status
      if (lessonPlan.status !== LessonPlanStatus.COORDINATOR_APPROVED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot reject a lesson plan that is not in COORDINATOR_APPROVED status",
        });
      }

      // Verify the user is an admin for the campus
      const admin = await this.prisma.user.findFirst({
        where: {
          id: adminId,
          userType: UserType.CAMPUS_ADMIN,
          activeCampuses: {
            some: {
              campusId: lessonPlan.class.campusId,
              status: 'ACTIVE'
            }
          }
        }
      });

      if (!admin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only campus admins for this campus can reject lesson plans",
        });
      }

      // Update the lesson plan status
      const updatedLessonPlan = await this.prisma.lessonPlan.update({
        where: { id: data.id },
        data: {
          status: LessonPlanStatus.REJECTED,
          adminId: adminId,
          adminNote: data.note
        },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true,
          coordinator: true,
          admin: true
        }
      });

      // Send notification to the teacher
      const notificationService = new NotificationService({ prisma: this.prisma });

      await notificationService.createNotification({
        title: "Lesson Plan Rejected",
        content: `Your lesson plan "${lessonPlan.title}" has been rejected by admin ${admin.name}. Reason: ${data.note}`,
        type: "LESSON_PLAN_REJECTED",
        status: NotificationStatus.PUBLISHED,
        deliveryType: NotificationDeliveryType.IN_APP,
        senderId: adminId,
        recipientIds: [lessonPlan.teacher.userId],
        metadata: {
          lessonPlanId: lessonPlan.id,
          adminId: adminId,
          adminName: admin.name,
          rejectionReason: data.note
        }
      });

      return updatedLessonPlan;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to reject lesson plan",
        cause: error,
      });
    }
  }

  /**
   * Add reflection to a lesson plan
   * @param data Reflection data
   * @param teacherId Teacher user ID
   * @returns Updated lesson plan
   */
  /**
   * Get subject topics for a specific subject
   * @param subjectId Subject ID
   * @returns Array of subject topics
   */
  async getSubjectTopics(subjectId: string) {
    try {
      if (!subjectId) {
        return [];
      }

      const topicService = new SubjectTopicService({ prisma: this.prisma });
      const result = await topicService.listSubjectTopics(
        { take: 100 }, // Get up to 100 topics
        {
          subjectId,
          status: SystemStatus.ACTIVE
        }
      );

      return result.data;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get subject topics",
        cause: error,
      });
    }
  }

  /**
   * Get suggested learning objectives based on selected topics
   * @param topicIds Array of topic IDs
   * @returns Array of suggested learning objectives
   */
  async getSuggestedLearningObjectives(topicIds: string[]) {
    try {
      if (!topicIds || topicIds.length === 0) {
        return [];
      }

      // Get topics with learning outcomes
      const topics = await this.prisma.subjectTopic.findMany({
        where: {
          id: { in: topicIds },
          status: SystemStatus.ACTIVE as any,
        },
        select: {
          id: true,
          title: true,
          learningOutcomes: true,
        }
      });

      // Extract and process learning outcomes
      const learningObjectives: string[] = [];

      topics.forEach((topic: any) => {
        if (topic.learningOutcomes) {
          // Parse learning outcomes - they might be in different formats
          try {
            // Try to parse as JSON if it's stored that way
            const parsedOutcomes = JSON.parse(topic.learningOutcomes);
            if (Array.isArray(parsedOutcomes)) {
              learningObjectives.push(...parsedOutcomes);
            } else if (typeof parsedOutcomes === 'string') {
              // If it's a string, split by newlines
              learningObjectives.push(...parsedOutcomes.split('\n').filter(line => line.trim()));
            }
          } catch (e) {
            // If not JSON, treat as plain text and split by newlines
            if (typeof topic.learningOutcomes === 'string') {
              learningObjectives.push(...topic.learningOutcomes.split('\n').filter((line: string) => line.trim()));
            }
          }
        }
      });

      // Remove duplicates and empty strings
      return [...new Set(learningObjectives)].filter(objective => objective.trim());
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get suggested learning objectives",
        cause: error,
      });
    }
  }

  /**
   * Get learning outcomes by Bloom's Taxonomy level
   * @param subjectId Subject ID
   * @param topicId Optional topic ID to filter by
   * @param bloomsLevel Optional Bloom's level to filter by
   * @returns Array of learning outcomes
   */
  async getLearningOutcomesByBloomsLevel(
    subjectId: string,
    topicId?: string,
    bloomsLevel?: BloomsTaxonomyLevel
  ) {
    try {
      // Build where conditions
      const where: any = {
        subjectId,
      };

      if (topicId) {
        where.topicId = topicId;
      }

      if (bloomsLevel) {
        where.bloomsLevel = bloomsLevel;
      }

      // Get learning outcomes
      const learningOutcomes = await this.prisma.learningOutcome.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return learningOutcomes;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get learning outcomes by Bloom's level",
        cause: error,
      });
    }
  }

  /**
   * Analyze Bloom's distribution for a lesson plan
   * @param content Lesson plan content
   * @returns Analysis of Bloom's distribution
   */
  analyzeLessonPlanBloomsDistribution(content: any) {
    try {
      // Get the current distribution or use default
      const bloomsDistribution = content.bloomsDistribution || DEFAULT_BLOOMS_DISTRIBUTION;

      // Count activities by Bloom's level
      const activityCounts: Record<BloomsTaxonomyLevel, number> = {
        [BloomsTaxonomyLevel.REMEMBER]: 0,
        [BloomsTaxonomyLevel.UNDERSTAND]: 0,
        [BloomsTaxonomyLevel.APPLY]: 0,
        [BloomsTaxonomyLevel.ANALYZE]: 0,
        [BloomsTaxonomyLevel.EVALUATE]: 0,
        [BloomsTaxonomyLevel.CREATE]: 0,
      };

      // Count activities
      if (content.activities && Array.isArray(content.activities)) {
        content.activities.forEach((activity: any) => {
          if (activity.bloomsLevel) {
            activityCounts[activity.bloomsLevel as BloomsTaxonomyLevel]++;
          }
        });
      }

      // Count assessments
      if (content.assessments && Array.isArray(content.assessments)) {
        content.assessments.forEach((assessment: any) => {
          if (assessment.bloomsLevel) {
            activityCounts[assessment.bloomsLevel as BloomsTaxonomyLevel]++;
          }
        });
      }

      // Calculate total activities
      const totalActivities = Object.values(activityCounts).reduce((sum, count) => sum + count, 0);

      // Calculate actual distribution percentages
      const actualDistribution: BloomsDistribution = {} as BloomsDistribution;

      if (totalActivities > 0) {
        Object.entries(activityCounts).forEach(([level, count]) => {
          actualDistribution[level as BloomsTaxonomyLevel] = Math.round((count / totalActivities) * 100);
        });
      } else {
        // If no activities, use the target distribution
        Object.assign(actualDistribution, bloomsDistribution);
      }

      // Calculate gaps between target and actual
      const gaps: BloomsDistribution = {} as BloomsDistribution;

      Object.entries(bloomsDistribution).forEach(([level, targetPercentage]) => {
        const actualPercentage = actualDistribution[level as BloomsTaxonomyLevel] || 0;
        gaps[level as BloomsTaxonomyLevel] = (targetPercentage as number) - actualPercentage;
      });

      // Generate recommendations
      const recommendations: string[] = [];

      Object.entries(gaps).forEach(([level, gap]) => {
        if (gap > 10) {
          recommendations.push(`Add more ${level.toLowerCase()} activities (${Math.abs(gap)}% below target)`);
        } else if (gap < -10) {
          recommendations.push(`Reduce ${level.toLowerCase()} activities (${Math.abs(gap)}% above target)`);
        }
      });

      return {
        targetDistribution: bloomsDistribution,
        actualDistribution,
        gaps,
        activityCounts,
        totalActivities,
        recommendations,
        isBalanced: recommendations.length === 0
      };
    } catch (error) {
      console.error("Error analyzing Bloom's distribution:", error);
      return {
        targetDistribution: DEFAULT_BLOOMS_DISTRIBUTION,
        actualDistribution: {},
        gaps: {},
        activityCounts: {},
        totalActivities: 0,
        recommendations: ["Error analyzing distribution"],
        isBalanced: false
      };
    }
  }

  /**
   * Get lesson plan data for pre-filling activity form
   * @param lessonPlanId Lesson plan ID
   * @returns Lesson plan data for activity creation
   */
  async getLessonPlanDataForActivity(lessonPlanId: string) {
    try {
      // Get the lesson plan with related data
      const lessonPlan = await this.prisma.lessonPlan.findUnique({
        where: { id: lessonPlanId },
        include: {
          class: true,
          subject: true
        }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson plan not found",
        });
      }

      // Extract topics from lesson plan content
      const lessonPlanContent = lessonPlan.content as any;
      let topicId: string | undefined = undefined;
      let topics: string[] = [];

      // If the lesson plan has topics, extract them
      if (lessonPlanContent?.topics && Array.isArray(lessonPlanContent.topics)) {
        topics = lessonPlanContent.topics;

        // If any topic looks like an ID, use the first one as topicId
        const topicIds = topics.filter(
          (topic: string) => topic.length > 20 && /^[a-z0-9]+$/.test(topic)
        );
        if (topicIds.length > 0) {
          topicId = topicIds[0];
        }
      }

      // Extract learning objectives
      const learningObjectives = lessonPlanContent?.learningObjectives || [];

      // Prepare activity data
      return {
        lessonPlan,
        prefillData: {
          title: `Activity: ${lessonPlan.title}`,
          subjectId: lessonPlan.subjectId,
          classId: lessonPlan.classId,
          topicId,
          topics,
          learningObjectives,
          lessonPlanId
        }
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get lesson plan data for activity",
        cause: error,
      });
    }
  }

  /**
   * Get lesson plan data for pre-filling assessment form
   * @param lessonPlanId Lesson plan ID
   * @returns Lesson plan data for assessment creation
   */
  async getLessonPlanDataForAssessment(lessonPlanId: string) {
    try {
      // Get the lesson plan with related data
      const lessonPlan = await this.prisma.lessonPlan.findUnique({
        where: { id: lessonPlanId },
        include: {
          class: {
            include: {
              campus: true,
              term: true
            }
          },
          subject: true
        }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson plan not found",
        });
      }

      // Extract learning objectives for instructions
      const lessonPlanContent = lessonPlan.content as any;
      const learningObjectives = lessonPlanContent?.learningObjectives || [];

      // Create instructions from learning objectives
      let instructions = "This assessment covers the following learning objectives:\n";
      if (learningObjectives.length > 0) {
        learningObjectives.forEach((objective: string, index: number) => {
          instructions += `${index + 1}. ${objective}\n`;
        });
      } else {
        instructions = "Assessment based on lesson plan: " + lessonPlan.title;
      }

      // Prepare assessment data
      return {
        lessonPlan,
        prefillData: {
          title: `Assessment: ${lessonPlan.title}`,
          description: `Assessment for ${lessonPlan.title}`,
          subjectId: lessonPlan.subjectId,
          classId: lessonPlan.classId,
          institutionId: lessonPlan.class.campus.institutionId,
          termId: lessonPlan.class.termId,
          instructions,
          lessonPlanId
        }
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get lesson plan data for assessment",
        cause: error,
      });
    }
  }

  /**
   * Generate an activity from a lesson plan
   * @param lessonPlanId Lesson plan ID
   * @param data Activity generation data
   * @returns Created activity
   */
  async generateActivity(
    lessonPlanId: string,
    data: {
      title: string;
      purpose: ActivityPurpose;
      learningType?: LearningActivityType;
      assessmentType?: AssessmentType;
      isGradable?: boolean;
      maxScore?: number;
      passingScore?: number;
      content: any;
    }
  ) {
    try {
      // Get the lesson plan
      const lessonPlan = await this.prisma.lessonPlan.findUnique({
        where: { id: lessonPlanId },
        include: {
          class: true,
          subject: true
        }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson plan not found",
        });
      }

      // Ensure the lesson plan has a subject
      if (!lessonPlan.subjectId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Lesson plan must have a subject to generate an activity",
        });
      }

      // Extract topics from lesson plan content
      const lessonPlanContent = lessonPlan.content as any;
      let topicId: string | undefined = undefined;

      // If the lesson plan has topics that look like IDs, use the first one
      if (lessonPlanContent?.topics && Array.isArray(lessonPlanContent.topics)) {
        const topicIds = lessonPlanContent.topics.filter(
          (topic: string) => topic.length > 20 && /^[a-z0-9]+$/.test(topic)
        );
        if (topicIds.length > 0) {
          topicId = topicIds[0];
        }
      }

      // Create the activity
      const activityService = new ComponentActivityService({ prisma: this.prisma });
      const activity = await activityService.createActivity({
        title: data.title,
        purpose: data.purpose,
        learningType: data.purpose === ActivityPurpose.LEARNING ? data.learningType : undefined,
        assessmentType: (data.purpose === ActivityPurpose.ASSESSMENT || data.purpose === ActivityPurpose.PRACTICE)
          ? data.assessmentType
          : undefined,
        subjectId: lessonPlan.subjectId,
        topicId: topicId,
        classId: lessonPlan.classId,
        content: data.content,
        isGradable: data.isGradable || false,
        maxScore: data.isGradable ? data.maxScore : undefined,
        passingScore: data.isGradable ? data.passingScore : undefined,
        lessonPlanId: lessonPlanId, // Link to the lesson plan
      });

      return activity;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate activity from lesson plan",
        cause: error,
      });
    }
  }

  /**
   * Generate an assessment from a lesson plan
   * @param lessonPlanId Lesson plan ID
   * @param data Assessment generation data
   * @returns Created assessment
   */
  async generateAssessment(
    lessonPlanId: string,
    data: {
      title: string;
      description?: string;
      category: AssessmentCategory;
      maxScore: number;
      weightage: number;
      gradingType: GradingType;
      dueDate?: Date;
      instructions?: string;
      createdById: string;
    }
  ) {
    try {
      // Get the lesson plan
      const lessonPlan = await this.prisma.lessonPlan.findUnique({
        where: { id: lessonPlanId },
        include: {
          class: {
            include: {
              campus: true,
              term: true
            }
          },
          subject: true
        }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson plan not found",
        });
      }

      // Ensure the lesson plan has a subject
      if (!lessonPlan.subjectId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Lesson plan must have a subject to generate an assessment",
        });
      }

      // Create the assessment
      const assessmentService = new AssessmentService({ prisma: this.prisma });
      const assessment = await assessmentService.createAssessment({
        title: data.title,
        description: data.description,
        category: data.category,
        subjectId: lessonPlan.subjectId,
        classId: lessonPlan.classId,
        institutionId: lessonPlan.class.campus.institutionId,
        termId: lessonPlan.class.termId,
        maxScore: data.maxScore,
        weightage: data.weightage,
        gradingType: data.gradingType,
        dueDate: data.dueDate,
        instructions: data.instructions,
        createdById: data.createdById,
        lessonPlanId: lessonPlanId, // Link to the lesson plan
      });

      return assessment;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate assessment from lesson plan",
        cause: error,
      });
    }
  }

  async addReflection(data: AddReflectionInput, teacherId: string) {
    try {
      // Verify lesson plan exists
      const lessonPlan = await this.prisma.lessonPlan.findUnique({
        where: { id: data.id },
        include: {
          teacher: true
        }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lesson plan not found",
        });
      }

      // Verify the user is the teacher who created the plan
      if (lessonPlan.teacher.userId !== teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the teacher who created the lesson plan can add reflection",
        });
      }

      // Only allow reflection if the lesson plan is in APPROVED status
      if (lessonPlan.status !== LessonPlanStatus.APPROVED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot add reflection to a lesson plan that is not in APPROVED status",
        });
      }

      // Update the lesson plan with reflection
      return await this.prisma.lessonPlan.update({
        where: { id: data.id },
        data: {
          reflection: data.reflection
        },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true,
          coordinator: true,
          admin: true
        }
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add reflection",
        cause: error,
      });
    }
  }
}
