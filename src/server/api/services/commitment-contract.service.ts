import { PrismaClient, SystemStatus, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { logger } from '@/server/api/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { SubmissionStatus } from '@/server/api/constants';

interface CommitmentContractServiceConfig {
  prisma: PrismaClient;
}

interface CreateCommitmentContractInput {
  studentId: string;
  title: string;
  description?: string;
  deadline: Date;
  classId?: string;
  subjectId?: string;
  metadata?: Record<string, any>;
}

interface CreateActivityCommitmentInput {
  studentId: string;
  activities: string[];
  title: string;
  description?: string;
  deadline: Date;
  classId?: string;
  subjectId?: string;
}

interface UpdateCommitmentContractInput {
  id: string;
  title?: string;
  description?: string;
  deadline?: Date;
  isCompleted?: boolean;
  completedAt?: Date;
}

interface CommitmentContractFilters {
  classId?: string;
  subjectId?: string;
  isCompleted?: boolean;
  includeExpired?: boolean;
}

export class CommitmentContractService {
  private prisma: PrismaClient;

  constructor(config: CommitmentContractServiceConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Create a new commitment contract
   */
  async createCommitmentContract(input: CreateCommitmentContractInput) {
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

      // Create commitment contract
      const commitmentContract = await this.prisma.commitmentContract.create({
        data: {
          id: uuidv4(),
          studentId: input.studentId,
          title: input.title,
          description: input.description,
          deadline: input.deadline,
          classId: input.classId,
          subjectId: input.subjectId,
          isCompleted: false,
          metadata: input.metadata as any,
          status: SystemStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return commitmentContract;
    } catch (error) {
      logger.error('Error creating commitment contract', { error, input });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create commitment contract',
        cause: error,
      });
    }
  }

  /**
   * Update a commitment contract
   */
  async updateCommitmentContract(input: UpdateCommitmentContractInput) {
    try {
      // Validate commitment contract exists
      const commitmentContract = await this.prisma.commitmentContract.findUnique({
        where: { id: input.id }
      });

      if (!commitmentContract) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Commitment contract not found',
        });
      }

      // Update commitment contract
      const updatedCommitmentContract = await this.prisma.commitmentContract.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          deadline: input.deadline,
          isCompleted: input.isCompleted,
          completedAt: input.isCompleted ? (input.completedAt || new Date()) : undefined,
          updatedAt: new Date()
        }
      });

      return updatedCommitmentContract;
    } catch (error) {
      logger.error('Error updating commitment contract', { error, input });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update commitment contract',
        cause: error,
      });
    }
  }

  /**
   * Get commitment contracts for a student
   */
  async getStudentCommitmentContracts(studentId: string, filters: CommitmentContractFilters = {}) {
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

      if (filters.isCompleted !== undefined) {
        where.isCompleted = filters.isCompleted;
      }

      // If includeExpired is false, only include contracts that haven't expired
      if (filters.includeExpired === false) {
        where.deadline = {
          gte: new Date()
        };
      }

      // Get commitment contracts
      const commitmentContracts = await this.prisma.commitmentContract.findMany({
        where,
        orderBy: [
          {
            isCompleted: 'asc'
          },
          {
            deadline: 'asc'
          }
        ]
      });

      return commitmentContracts;
    } catch (error) {
      logger.error('Error getting student commitment contracts', { error, studentId, filters });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get student commitment contracts',
        cause: error,
      });
    }
  }

  /**
   * Complete a commitment contract
   */
  async completeCommitmentContract(id: string) {
    try {
      // Validate commitment contract exists
      const commitmentContract = await this.prisma.commitmentContract.findUnique({
        where: { id }
      });

      if (!commitmentContract) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Commitment contract not found',
        });
      }

      // If already completed, return as is
      if (commitmentContract.isCompleted) {
        return commitmentContract;
      }

      // Complete commitment contract
      const completedCommitmentContract = await this.prisma.commitmentContract.update({
        where: { id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          updatedAt: new Date()
        }
      });

      return completedCommitmentContract;
    } catch (error) {
      logger.error('Error completing commitment contract', { error, id });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to complete commitment contract',
        cause: error,
      });
    }
  }

  /**
   * Delete a commitment contract
   */
  async deleteCommitmentContract(id: string) {
    try {
      // Validate commitment contract exists
      const commitmentContract = await this.prisma.commitmentContract.findUnique({
        where: { id }
      });

      if (!commitmentContract) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Commitment contract not found',
        });
      }

      // Delete commitment contract (soft delete)
      const deletedCommitmentContract = await this.prisma.commitmentContract.update({
        where: { id },
        data: {
          status: SystemStatus.DELETED,
          updatedAt: new Date()
        }
      });

      return deletedCommitmentContract;
    } catch (error) {
      logger.error('Error deleting commitment contract', { error, id });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete commitment contract',
        cause: error,
      });
    }
  }

  /**
   * Create a commitment contract for activity completion
   */
  async createActivityCommitment(input: CreateActivityCommitmentInput) {
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

      // Validate activities exist
      const activities = await this.prisma.activity.findMany({
        where: {
          id: { in: input.activities },
          status: SystemStatus.ACTIVE
        }
      });

      if (activities.length !== input.activities.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or more activities not found',
        });
      }

      // Create the commitment contract
      const commitmentContract = await this.prisma.commitmentContract.create({
        data: {
          id: uuidv4(),
          studentId: input.studentId,
          title: input.title,
          description: input.description,
          deadline: input.deadline,
          classId: input.classId,
          subjectId: input.subjectId,
          isCompleted: false,
          metadata: {
            type: 'ACTIVITY_COMPLETION',
            targetValue: input.activities.length,
            currentValue: 0,
            activities: input.activities
          } as any,
          status: SystemStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Update ActivityGrade records for the committed activities
      // Since the schema might not be updated yet, we'll use a raw query
      // This will be executed after the migration is applied
      try {
        await this.prisma.$executeRaw`
          UPDATE activity_grades
          SET
            is_committed = true,
            commitment_id = ${commitmentContract.id},
            commitment_deadline = ${input.deadline}
          WHERE
            student_id = ${input.studentId}
            AND activity_id IN (${Prisma.join(input.activities)})
        `;

        logger.debug('Updated activity grades with commitment information', {
          studentId: input.studentId,
          activitiesCount: input.activities.length,
          commitmentId: commitmentContract.id
        });
      } catch (updateError) {
        logger.error('Error updating activity grades with commitment', {
          error: updateError,
          commitmentId: commitmentContract.id
        });
        // Continue even if update fails - the schema might not be updated yet
      }

      return commitmentContract;
    } catch (error) {
      logger.error('Error creating activity commitment', { error, input });
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create activity commitment',
        cause: error,
      });
    }
  }

  /**
   * Update commitment status based on activity completion
   */
  async updateCommitmentStatusForActivity(activityGradeId: string) {
    try {
      // Since the schema might not be updated yet, we'll use a raw query to get commitment info
      // This will be executed after the migration is applied
      const activityGradeInfo = await this.prisma.$queryRaw`
        SELECT
          student_id as "studentId",
          submitted_at as "submittedAt",
          commitment_id as "commitmentId",
          is_committed as "isCommitted",
          commitment_deadline as "commitmentDeadline"
        FROM activity_grades
        WHERE id = ${activityGradeId}
      ` as any[];

      // Check if we got results and if the activity is part of a commitment
      if (activityGradeInfo && activityGradeInfo.length > 0) {
        const activityGrade = activityGradeInfo[0];

        if (activityGrade.isCommitted && activityGrade.commitmentId) {
          // Check if completed before deadline
          const submittedAt = new Date(activityGrade.submittedAt);
          const commitmentDeadline = new Date(activityGrade.commitmentDeadline);
          const completedOnTime = submittedAt <= commitmentDeadline;

          // Update the activity grade commitment status using raw query
          await this.prisma.$executeRaw`
            UPDATE activity_grades
            SET commitment_met = ${completedOnTime}
            WHERE id = ${activityGradeId}
          `;

          // Get the commitment contract
          const commitment = await this.prisma.commitmentContract.findUnique({
            where: { id: activityGrade.commitmentId },
            select: {
              id: true,
              metadata: true,
              isCompleted: true,
              studentId: true
            }
          });

          if (commitment && !commitment.isCompleted) {
            // Get the metadata with type assertion
            const metadata = commitment.metadata as any;

            if (metadata?.type === 'ACTIVITY_COMPLETION' && completedOnTime) {
              // Increment the current value
              const currentValue = (metadata.currentValue || 0) + 1;
              const targetValue = metadata.targetValue || 0;

              // Update the commitment contract
              await this.prisma.commitmentContract.update({
                where: { id: commitment.id },
                data: {
                  metadata: {
                    ...metadata,
                    currentValue
                  } as any,
                  isCompleted: currentValue >= targetValue,
                  completedAt: currentValue >= targetValue ? new Date() : undefined,
                  updatedAt: new Date()
                }
              });

              // If commitment is now complete, award points
              if (currentValue >= targetValue) {
                try {
                  // Award points for commitment completion using direct database insert
                  // instead of using the RewardSystem class
                  await this.prisma.studentPoints.create({
                    data: {
                      studentId: commitment.studentId,
                      amount: 50, // Bonus points for completing commitment
                      source: 'commitment',
                      sourceId: commitment.id,
                      description: 'Completed activity commitment',
                      createdAt: new Date(),
                      status: SystemStatus.ACTIVE
                    }
                  });

                  logger.debug('Awarded points for commitment completion', {
                    studentId: commitment.studentId,
                    commitmentId: commitment.id,
                    points: 50
                  });
                } catch (rewardError) {
                  logger.error('Error awarding points for commitment completion', {
                    error: rewardError,
                    commitmentId: commitment.id
                  });
                  // Continue even if reward processing fails
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error updating commitment status for activity', { error, activityGradeId });
      // Don't throw error to prevent activity submission from failing
    }
  }
}
