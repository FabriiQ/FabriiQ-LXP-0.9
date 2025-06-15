import { PrismaClient, SystemStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { logger } from '@/server/api/utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface JourneyEventServiceConfig {
  prisma: PrismaClient;
}

type JourneyEventType = 'achievement' | 'level' | 'activity' | 'enrollment' | 'milestone';

interface CreateJourneyEventInput {
  studentId: string;
  title: string;
  description: string;
  date: Date;
  type: JourneyEventType;
  classId?: string;
  subjectId?: string;
  icon?: string;
  metadata?: Record<string, any>;
}

interface JourneyEventFilters {
  classId?: string;
  subjectId?: string;
  type?: JourneyEventType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export class JourneyEventService {
  private prisma: PrismaClient;

  constructor(config: JourneyEventServiceConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Create a new journey event
   */
  async createJourneyEvent(input: CreateJourneyEventInput) {
    try {
      // Validate student exists
      const student = await this.prisma.studentProfile.findUnique({
        where: { id: input.studentId }
      });

      if (!student) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student not found',
        });
      }

      // If classId is provided, validate class exists
      if (input.classId) {
        const classExists = await this.prisma.class.findUnique({
          where: { id: input.classId }
        });

        if (!classExists) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Class not found',
          });
        }
      }

      // If subjectId is provided, validate subject exists
      if (input.subjectId) {
        const subjectExists = await this.prisma.subject.findUnique({
          where: { id: input.subjectId }
        });

        if (!subjectExists) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Subject not found',
          });
        }
      }

      // Create journey event
      const journeyEvent = await this.prisma.journeyEvent.create({
        data: {
          id: uuidv4(),
          studentId: input.studentId,
          title: input.title,
          description: input.description,
          date: input.date,
          type: input.type,
          classId: input.classId,
          subjectId: input.subjectId,
          icon: input.icon,
          metadata: input.metadata as any,
          status: SystemStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return journeyEvent;
    } catch (error) {
      logger.error('Error creating journey event', { error, input });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create journey event',
        cause: error,
      });
    }
  }

  /**
   * Get journey events for a student
   */
  async getStudentJourneyEvents(studentId: string, filters: JourneyEventFilters = {}) {
    try {
      // Validate student exists - first try by ID
      let student = await this.prisma.studentProfile.findUnique({
        where: { id: studentId }
      });

      // If not found by ID, try by userId (in case studentId is actually a userId)
      if (!student) {
        student = await this.prisma.studentProfile.findUnique({
          where: { userId: studentId }
        });

        // If found by userId, update studentId to use the actual profile ID
        if (student) {
          logger.info('Student found by userId instead of id', { originalId: studentId, profileId: student.id });
          studentId = student.id;
        }
      }

      if (!student) {
        logger.error('Student not found by id or userId', { studentId });
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student not found',
        });
      }

      // Build where clause
      const where: any = {
        studentId,
        status: SystemStatus.ACTIVE
      };

      if (filters.classId) {
        where.classId = filters.classId;
      }

      if (filters.subjectId) {
        where.subjectId = filters.subjectId;
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
          where.date.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.date.lte = filters.endDate;
        }
      }

      // Get journey events
      const journeyEvents = await this.prisma.journeyEvent.findMany({
        where,
        orderBy: {
          date: 'desc'
        },
        take: filters.limit || 50
      });

      return journeyEvents;
    } catch (error) {
      logger.error('Error getting student journey events', { error, studentId, filters });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get student journey events',
        cause: error,
      });
    }
  }

  /**
   * Delete a journey event
   */
  async deleteJourneyEvent(id: string) {
    try {
      // Validate journey event exists
      const journeyEvent = await this.prisma.journeyEvent.findUnique({
        where: { id }
      });

      if (!journeyEvent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Journey event not found',
        });
      }

      // Delete journey event (soft delete)
      const deletedJourneyEvent = await this.prisma.journeyEvent.update({
        where: { id },
        data: {
          status: SystemStatus.DELETED,
          updatedAt: new Date()
        }
      });

      return deletedJourneyEvent;
    } catch (error) {
      logger.error('Error deleting journey event', { error, id });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete journey event',
        cause: error,
      });
    }
  }
}
