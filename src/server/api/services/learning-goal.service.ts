import { PrismaClient, SystemStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { logger } from '@/server/api/utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface LearningGoalServiceConfig {
  prisma: PrismaClient;
}

interface CreateLearningGoalInput {
  studentId: string;
  title: string;
  description?: string;
  progress: number;
  total: number;
  classId?: string;
  subjectId?: string;
  isCustom: boolean;
}

interface UpdateLearningGoalInput {
  id: string;
  title?: string;
  description?: string;
  progress?: number;
  total?: number;
}

interface LearningGoalFilters {
  classId?: string;
  subjectId?: string;
  isCustom?: boolean;
}

export class LearningGoalService {
  private prisma: PrismaClient;

  constructor(config: LearningGoalServiceConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Create a new learning goal
   */
  async createLearningGoal(input: CreateLearningGoalInput) {
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

      // Create learning goal
      const learningGoal = await this.prisma.learningGoal.create({
        data: {
          id: uuidv4(),
          studentId: input.studentId,
          title: input.title,
          description: input.description,
          progress: input.progress,
          total: input.total,
          classId: input.classId,
          subjectId: input.subjectId,
          isCustom: input.isCustom,
          status: SystemStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return learningGoal;
    } catch (error) {
      logger.error('Error creating learning goal', { error, input });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create learning goal',
        cause: error,
      });
    }
  }

  /**
   * Update a learning goal
   */
  async updateLearningGoal(input: UpdateLearningGoalInput) {
    try {
      // Validate learning goal exists
      const learningGoal = await this.prisma.learningGoal.findUnique({
        where: { id: input.id }
      });

      if (!learningGoal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Learning goal not found',
        });
      }

      // Update learning goal
      const updatedLearningGoal = await this.prisma.learningGoal.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          progress: input.progress,
          total: input.total,
          updatedAt: new Date()
        }
      });

      return updatedLearningGoal;
    } catch (error) {
      logger.error('Error updating learning goal', { error, input });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update learning goal',
        cause: error,
      });
    }
  }

  /**
   * Get learning goals for a student
   */
  async getStudentLearningGoals(studentId: string, filters: LearningGoalFilters = {}) {
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

      if (filters.isCustom !== undefined) {
        where.isCustom = filters.isCustom;
      }

      // Get learning goals
      const learningGoals = await this.prisma.learningGoal.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return learningGoals;
    } catch (error) {
      logger.error('Error getting student learning goals', { error, studentId, filters });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get student learning goals',
        cause: error,
      });
    }
  }

  /**
   * Delete a learning goal
   */
  async deleteLearningGoal(id: string) {
    try {
      // Validate learning goal exists
      const learningGoal = await this.prisma.learningGoal.findUnique({
        where: { id }
      });

      if (!learningGoal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Learning goal not found',
        });
      }

      // Delete learning goal (soft delete)
      const deletedLearningGoal = await this.prisma.learningGoal.update({
        where: { id },
        data: {
          status: SystemStatus.DELETED,
          updatedAt: new Date()
        }
      });

      return deletedLearningGoal;
    } catch (error) {
      logger.error('Error deleting learning goal', { error, id });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete learning goal',
        cause: error,
      });
    }
  }
}
