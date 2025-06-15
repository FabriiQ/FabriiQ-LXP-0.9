import { PrismaClient, SystemStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { logger } from '@/server/api/utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface PersonalBestServiceConfig {
  prisma: PrismaClient;
}

interface CreatePersonalBestInput {
  studentId: string;
  title: string;
  value: string | number;
  date: Date;
  type: string;
  classId?: string;
  subjectId?: string;
  activityId?: string;
  icon?: string;
  metadata?: Record<string, any>;
}

interface PersonalBestFilters {
  classId?: string;
  subjectId?: string;
  type?: string;
}

interface CheckAndUpdatePersonalBestInput extends Omit<CreatePersonalBestInput, 'date'> {
  compareFunction: 'greater' | 'lesser' | 'equal';
}

export class PersonalBestService {
  private prisma: PrismaClient;

  constructor(config: PersonalBestServiceConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Create a new personal best
   */
  async createPersonalBest(input: CreatePersonalBestInput) {
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

      // Create personal best
      const personalBest = await this.prisma.personalBest.create({
        data: {
          id: uuidv4(),
          studentId: input.studentId,
          title: input.title,
          value: String(input.value), // Store as string for consistency
          date: input.date,
          type: input.type,
          classId: input.classId,
          subjectId: input.subjectId,
          activityId: input.activityId,
          icon: input.icon,
          metadata: input.metadata as any,
          status: SystemStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return personalBest;
    } catch (error) {
      logger.error('Error creating personal best', { error, input });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create personal best',
        cause: error,
      });
    }
  }

  /**
   * Get personal bests for a student
   */
  async getStudentPersonalBests(studentId: string, filters: PersonalBestFilters = {}) {
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

      // Get personal bests
      const personalBests = await this.prisma.personalBest.findMany({
        where,
        orderBy: {
          date: 'desc'
        }
      });

      return personalBests;
    } catch (error) {
      logger.error('Error getting student personal bests', { error, studentId, filters });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get student personal bests',
        cause: error,
      });
    }
  }

  /**
   * Delete a personal best
   */
  async deletePersonalBest(id: string) {
    try {
      // Validate personal best exists
      const personalBest = await this.prisma.personalBest.findUnique({
        where: { id }
      });

      if (!personalBest) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Personal best not found',
        });
      }

      // Delete personal best (soft delete)
      const deletedPersonalBest = await this.prisma.personalBest.update({
        where: { id },
        data: {
          status: SystemStatus.DELETED,
          updatedAt: new Date()
        }
      });

      return deletedPersonalBest;
    } catch (error) {
      logger.error('Error deleting personal best', { error, id });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete personal best',
        cause: error,
      });
    }
  }

  /**
   * Check and update personal best
   * This will check if the new value is better than the existing personal best
   * and update it if it is
   */
  async checkAndUpdatePersonalBest(input: CheckAndUpdatePersonalBestInput) {
    try {
      // Validate student exists - first try by ID
      let student = await this.prisma.studentProfile.findUnique({
        where: { id: input.studentId }
      });

      // If not found by ID, try by userId (in case studentId is actually a userId)
      if (!student) {
        student = await this.prisma.studentProfile.findUnique({
          where: { userId: input.studentId }
        });

        // If found by userId, update studentId to use the actual profile ID
        if (student) {
          logger.info('Student found by userId instead of id', { originalId: input.studentId, profileId: student.id });
          input.studentId = student.id;
        }
      }

      if (!student) {
        logger.error('Student not found by id or userId', { studentId: input.studentId });
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Student not found',
        });
      }

      // Build where clause to find existing personal best
      const where: any = {
        studentId: input.studentId,
        title: input.title,
        type: input.type,
        status: SystemStatus.ACTIVE
      };

      if (input.classId) {
        where.classId = input.classId;
      }

      if (input.subjectId) {
        where.subjectId = input.subjectId;
      }

      // Find existing personal best
      const existingPersonalBest = await this.prisma.personalBest.findFirst({
        where
      });

      // If no existing personal best, create a new one
      if (!existingPersonalBest) {
        return this.createPersonalBest({
          ...input,
          date: new Date()
        });
      }

      // Check if the new value is better than the existing one
      let isNewBest = false;
      const existingValue = existingPersonalBest.value;
      const newValue = String(input.value);

      // For numeric values, compare as numbers
      if (!isNaN(Number(existingValue)) && !isNaN(Number(newValue))) {
        const existingNumeric = Number(existingValue);
        const newNumeric = Number(newValue);

        if (input.compareFunction === 'greater') {
          isNewBest = newNumeric > existingNumeric;
        } else if (input.compareFunction === 'lesser') {
          isNewBest = newNumeric < existingNumeric;
        } else {
          isNewBest = newNumeric === existingNumeric;
        }
      } else {
        // For string values, compare as strings
        if (input.compareFunction === 'greater') {
          isNewBest = newValue > existingValue;
        } else if (input.compareFunction === 'lesser') {
          isNewBest = newValue < existingValue;
        } else {
          isNewBest = newValue === existingValue;
        }
      }

      // If the new value is better, update the personal best
      if (isNewBest) {
        const updatedPersonalBest = await this.prisma.personalBest.update({
          where: { id: existingPersonalBest.id },
          data: {
            value: newValue,
            date: new Date(),
            icon: input.icon,
            metadata: input.metadata as any,
            updatedAt: new Date()
          }
        });

        return {
          ...updatedPersonalBest,
          isNewBest: true
        };
      }

      // Return the existing personal best
      return {
        ...existingPersonalBest,
        isNewBest: false
      };
    } catch (error) {
      logger.error('Error checking and updating personal best', { error, input });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check and update personal best',
        cause: error,
      });
    }
  }
}
