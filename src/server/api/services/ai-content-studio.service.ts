/**
 * AI Content Studio Service
 * Handles business logic for AI-generated content (worksheets, activities, assessments)
 */

import { PrismaClient, SystemStatus, ActivityPurpose } from "@prisma/client";
import { TRPCError } from "@trpc/server";

interface AIContentStudioServiceOptions {
  prisma: PrismaClient;
}

interface CreateWorksheetInput {
  title: string;
  content: any;
  teacherId: string;
  subjectId?: string;
  topicId?: string;
}

interface UpdateWorksheetInput {
  id: string;
  title?: string;
  content?: any;
  subjectId?: string;
  topicId?: string;
  status?: SystemStatus;
}

interface ConvertToActivityInput {
  worksheetId: string;
  classId: string;
  activityType: ActivityPurpose;
  isGradable?: boolean;
  maxScore?: number;
  passingScore?: number;
  lessonPlanId?: string; // Add lessonPlanId for linking to lesson plan
}

export class AIContentStudioService {
  private prisma: PrismaClient;

  constructor(options: AIContentStudioServiceOptions) {
    this.prisma = options.prisma;
  }

  /**
   * Create a new worksheet
   */
  async createWorksheet(data: CreateWorksheetInput) {
    try {
      return await this.prisma.worksheet.create({
        data: {
          title: data.title,
          content: data.content,
          teacherId: data.teacherId,
          subjectId: data.subjectId,
          topicId: data.topicId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
            }
          },
          topic: {
            select: {
              id: true,
              title: true,
            }
          },
        },
      });
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to create worksheet: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get a worksheet by ID
   */
  async getWorksheet(id: string) {
    try {
      const worksheet = await this.prisma.worksheet.findUnique({
        where: { id },
        include: {
          teacher: {
            select: {
              id: true,
              userId: true
            }
          },
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
              description: true,
            }
          },
        },
      });

      if (!worksheet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Worksheet not found",
        });
      }

      return worksheet;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get worksheet: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get worksheets by teacher ID
   */
  async getWorksheetsByTeacher(teacherId: string, status: SystemStatus = SystemStatus.ACTIVE) {
    try {
      return await this.prisma.worksheet.findMany({
        where: {
          teacherId,
          status,
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
            }
          },
          topic: {
            select: {
              id: true,
              title: true,
            }
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get worksheets: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Update a worksheet
   */
  async updateWorksheet(data: UpdateWorksheetInput) {
    try {
      const { id, ...updateData } = data;

      // Use a transaction to check existence and update in one operation
      return await this.prisma.$transaction(async (tx) => {
        // Check if worksheet exists
        const worksheet = await tx.worksheet.findUnique({
          where: { id },
          select: { id: true }, // Only select the ID to minimize data transfer
        });

        if (!worksheet) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Worksheet not found",
          });
        }

        // Update the worksheet
        return await tx.worksheet.update({
          where: { id },
          data: updateData,
          include: {
            subject: {
              select: {
                id: true,
                name: true,
              }
            },
            topic: {
              select: {
                id: true,
                title: true,
              }
            },
          },
        });
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to update worksheet: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Delete a worksheet
   */
  async deleteWorksheet(id: string) {
    try {
      // Use a transaction to check existence and update in one operation
      return await this.prisma.$transaction(async (tx) => {
        // Check if worksheet exists
        const worksheet = await tx.worksheet.findUnique({
          where: { id },
          select: { id: true }, // Only select the ID to minimize data transfer
        });

        if (!worksheet) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Worksheet not found",
          });
        }

        // Soft delete by updating status
        return await tx.worksheet.update({
          where: { id },
          data: {
            status: SystemStatus.DELETED,
          },
          select: { id: true, status: true }, // Only return necessary fields
        });
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to delete worksheet: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Convert a worksheet to an activity
   */
  async convertToActivity(data: ConvertToActivityInput) {
    try {
      // Use a transaction to ensure data consistency
      return await this.prisma.$transaction(async (tx) => {
        // Get the worksheet with only the necessary fields
        const worksheet = await tx.worksheet.findUnique({
          where: { id: data.worksheetId },
          select: {
            id: true,
            title: true,
            content: true,
            teacherId: true,
            subjectId: true,
            topicId: true,
          },
        });

        if (!worksheet) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Worksheet not found",
          });
        }

        // Create an activity based on the worksheet
        return await tx.activity.create({
          data: {
            title: worksheet.title,
            purpose: data.activityType,
            learningType: data.activityType === ActivityPurpose.LEARNING ? "SELF_STUDY" : undefined,
            assessmentType: data.activityType === ActivityPurpose.ASSESSMENT ? "QUIZ" : undefined,
            content: {
              ...(typeof worksheet.content === 'object' ? worksheet.content : {}),
              version: 1,
              activityType: "WORKSHEET_CONVERSION",
              lessonPlanId: data.lessonPlanId, // Add lessonPlanId to content
            },
            isGradable: data.isGradable || false,
            maxScore: data.isGradable ? data.maxScore : undefined,
            passingScore: data.isGradable ? data.passingScore : undefined,
            subjectId: worksheet.subjectId || undefined,
            topicId: worksheet.topicId || undefined,
            classId: data.classId,
            activityType: "WORKSHEET_CONVERSION",
            status: SystemStatus.ACTIVE,
          },
          // Include only necessary related data
          include: {
            subject: {
              select: {
                id: true,
                name: true,
              }
            },
            class: {
              select: {
                id: true,
                name: true,
              }
            },
          },
        });
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to convert worksheet to activity: ${(error as Error).message}`,
      });
    }
  }
}
