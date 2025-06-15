/**
 * Worksheet Service
 * Handles operations related to AI-generated worksheets
 */

import { SystemStatus, ActivityPurpose, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ServiceBase, ServiceOptions } from "./service-base";

// Define input types
export interface CreateWorksheetInput {
  title: string;
  content: any;
  teacherId: string;
  subjectId?: string;
  topicId?: string;
}

export interface UpdateWorksheetInput {
  id: string;
  title?: string;
  content?: any;
  subjectId?: string;
  topicId?: string;
  status?: SystemStatus;
}

export interface ConvertToActivityInput {
  worksheetId: string;
  classId: string;
  activityType: ActivityPurpose;
  isGradable?: boolean;
  maxScore?: number;
  passingScore?: number;
}

export class WorksheetService extends ServiceBase {
  constructor(options: ServiceOptions) {
    super(options);
  }

  /**
   * Create a new worksheet
   */
  async createWorksheet(input: CreateWorksheetInput) {
    try {
      return await this.prisma.worksheet.create({
        data: {
          title: input.title,
          content: input.content,
          teacherId: input.teacherId,
          subjectId: input.subjectId,
          topicId: input.topicId,
          status: SystemStatus.ACTIVE,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A worksheet with this title already exists',
          });
        }
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
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
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          },
          subject: true,
          topic: true,
        },
      });

      if (!worksheet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Worksheet not found',
        });
      }

      return worksheet;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get worksheet: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get worksheets by teacher ID
   */
  async getWorksheetsByTeacher(teacherId: string, status?: SystemStatus) {
    try {
      return await this.prisma.worksheet.findMany({
        where: {
          teacherId,
          status: status || undefined,
        },
        include: {
          subject: true,
          topic: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get worksheets: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Update a worksheet
   */
  async updateWorksheet(input: UpdateWorksheetInput) {
    try {
      const worksheet = await this.prisma.worksheet.findUnique({
        where: { id: input.id },
      });

      if (!worksheet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Worksheet not found',
        });
      }

      return await this.prisma.worksheet.update({
        where: { id: input.id },
        data: {
          title: input.title,
          content: input.content,
          subjectId: input.subjectId,
          topicId: input.topicId,
          status: input.status,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to update worksheet: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Delete a worksheet
   */
  async deleteWorksheet(id: string) {
    try {
      const worksheet = await this.prisma.worksheet.findUnique({
        where: { id },
      });

      if (!worksheet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Worksheet not found',
        });
      }

      // Soft delete by updating status
      return await this.prisma.worksheet.update({
        where: { id },
        data: {
          status: SystemStatus.DELETED,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to delete worksheet: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Convert a worksheet to an activity
   */
  async convertToActivity(input: ConvertToActivityInput) {
    try {
      // Get the worksheet
      const worksheet = await this.prisma.worksheet.findUnique({
        where: { id: input.worksheetId },
        include: { subject: true, topic: true },
      });

      if (!worksheet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Worksheet not found',
        });
      }

      if (!worksheet.subjectId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Worksheet must have a subject assigned to convert to activity',
        });
      }

      // Transform worksheet content to activity content
      const activityContent = this.transformContent(worksheet.content);

      // Create the activity
      return await this.prisma.activity.create({
        data: {
          title: worksheet.title,
          purpose: input.activityType,
          subjectId: worksheet.subjectId,
          topicId: worksheet.topicId,
          classId: input.classId,
          content: activityContent,
          isGradable: input.isGradable ?? (input.activityType === ActivityPurpose.ASSESSMENT),
          maxScore: input.maxScore,
          passingScore: input.passingScore,
          status: SystemStatus.ACTIVE,
        },
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to convert worksheet to activity: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Transform worksheet content to activity content format
   * This will depend on your specific content structures
   */
  private transformContent(worksheetContent: any) {
    // Add version and activityType fields
    return {
      ...worksheetContent,
      version: 1,
      activityType: 'worksheet',
      // Add any additional fields needed for activities
    };
  }
}
