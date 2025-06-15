/**
 * Reward Processing Background Jobs
 *
 * This module provides background processing for the reward system, including:
 * - Leaderboard calculation and snapshot creation
 * - Achievement checking for large student populations
 * - Point aggregation and data archiving
 */

import { PrismaClient, SystemStatus } from '@prisma/client';
import { RewardSystem } from '../../features/rewards';
import { logger } from '../api/utils/logger';
import { RewardSystemPrismaClient } from '../../features/rewards/types';
import { getRewardSystemPrisma } from '../../features/rewards/utils';
import { LeaderboardArchivingJobs } from './leaderboard-archiving';

// Define interfaces for type safety
interface ClassWithSubject {
  id: string;
  name: string;
  subjectId?: string;
}

interface EnrollmentWithClass {
  classId: string;
  class?: ClassWithSubject;
}

export class RewardProcessingJobs {
  private prisma: RewardSystemPrismaClient;
  private rewardSystem: RewardSystem;
  private leaderboardArchivingJobs: LeaderboardArchivingJobs;

  constructor(prisma: PrismaClient) {
    this.prisma = getRewardSystemPrisma(prisma);
    this.rewardSystem = new RewardSystem({ prisma });
    this.leaderboardArchivingJobs = new LeaderboardArchivingJobs(prisma);
  }

  /**
   * Create leaderboard snapshots for all classes
   */
  async createClassLeaderboardSnapshots(): Promise<{
    success: boolean;
    processed: number;
    errors: number;
  }> {
    try {
      logger.info('Starting class leaderboard snapshot creation');

      // Get all active classes
      const classes = await this.prisma.class.findMany({
        where: {
          status: SystemStatus.ACTIVE,
        },
        select: {
          id: true,
          name: true,
        },
      });

      logger.info(`Found ${classes.length} active classes`);

      let processed = 0;
      let errors = 0;

      // Process each class in batches
      for (let i = 0; i < classes.length; i += 10) {
        const batch = classes.slice(i, i + 10);

        // Process batch in parallel
        await Promise.all(
          batch.map(async (classEntity) => {
            try {
              await this.rewardSystem.createLeaderboardSnapshot({
                type: 'CLASS',
                referenceId: classEntity.id,
                limit: 100,
              });
              processed++;
            } catch (error) {
              logger.error(`Error creating leaderboard snapshot for class ${classEntity.id}`, { error });
              errors++;
            }
          })
        );

        // Log progress
        logger.info(`Processed ${i + batch.length} of ${classes.length} classes`);
      }

      logger.info(`Completed class leaderboard snapshot creation: ${processed} processed, ${errors} errors`);

      return {
        success: true,
        processed,
        errors,
      };
    } catch (error) {
      logger.error('Error creating class leaderboard snapshots', { error });
      return {
        success: false,
        processed: 0,
        errors: 1,
      };
    }
  }

  /**
   * Create leaderboard snapshots for all subjects
   */
  async createSubjectLeaderboardSnapshots(): Promise<{
    success: boolean;
    processed: number;
    errors: number;
  }> {
    try {
      logger.info('Starting subject leaderboard snapshot creation');

      // Get all active subjects
      const subjects = await this.prisma.subject.findMany({
        where: {
          status: SystemStatus.ACTIVE,
        },
        select: {
          id: true,
          name: true,
        },
      });

      logger.info(`Found ${subjects.length} active subjects`);

      let processed = 0;
      let errors = 0;

      // Process each subject in batches
      for (let i = 0; i < subjects.length; i += 10) {
        const batch = subjects.slice(i, i + 10);

        // Process batch in parallel
        await Promise.all(
          batch.map(async (subject) => {
            try {
              await this.rewardSystem.createLeaderboardSnapshot({
                type: 'SUBJECT',
                referenceId: subject.id,
                limit: 100,
              });
              processed++;
            } catch (error) {
              logger.error(`Error creating leaderboard snapshot for subject ${subject.id}`, { error });
              errors++;
            }
          })
        );

        // Log progress
        logger.info(`Processed ${i + batch.length} of ${subjects.length} subjects`);
      }

      logger.info(`Completed subject leaderboard snapshot creation: ${processed} processed, ${errors} errors`);

      return {
        success: true,
        processed,
        errors,
      };
    } catch (error) {
      logger.error('Error creating subject leaderboard snapshots', { error });
      return {
        success: false,
        processed: 0,
        errors: 1,
      };
    }
  }

  /**
   * Create leaderboard snapshots for all campuses
   */
  async createCampusLeaderboardSnapshots(): Promise<{
    success: boolean;
    processed: number;
    errors: number;
  }> {
    try {
      logger.info('Starting campus leaderboard snapshot creation');

      // Get all active campuses
      const campuses = await this.prisma.campus.findMany({
        where: {
          status: SystemStatus.ACTIVE,
        },
        select: {
          id: true,
          name: true,
        },
      });

      logger.info(`Found ${campuses.length} active campuses`);

      let processed = 0;
      let errors = 0;

      // Process each campus
      for (const campus of campuses) {
        try {
          await this.rewardSystem.createLeaderboardSnapshot({
            type: 'CAMPUS',
            referenceId: campus.id,
            limit: 100,
          });
          processed++;
        } catch (error) {
          logger.error(`Error creating leaderboard snapshot for campus ${campus.id}`, { error });
          errors++;
        }
      }

      logger.info(`Completed campus leaderboard snapshot creation: ${processed} processed, ${errors} errors`);

      return {
        success: true,
        processed,
        errors,
      };
    } catch (error) {
      logger.error('Error creating campus leaderboard snapshots', { error });
      return {
        success: false,
        processed: 0,
        errors: 1,
      };
    }
  }

  /**
   * Update point aggregates for all students
   */
  async updatePointAggregates(): Promise<{
    success: boolean;
    processed: number;
    errors: number;
  }> {
    try {
      logger.info('Starting point aggregate update');

      // Get all active students
      const students = await this.prisma.studentProfile.findMany({
        where: {
          user: {
            status: SystemStatus.ACTIVE,
          },
        },
        select: {
          id: true,
        },
      });

      logger.info(`Found ${students.length} active students`);

      let processed = 0;
      let errors = 0;

      // Process each student in batches
      for (let i = 0; i < students.length; i += 50) {
        const batch = students.slice(i, i + 50);

        // Process batch in parallel
        await Promise.all(
          batch.map(async (student) => {
            try {
              await this.updateStudentPointAggregates(student.id);
              processed++;
            } catch (error) {
              logger.error(`Error updating point aggregates for student ${student.id}`, { error });
              errors++;
            }
          })
        );

        // Log progress
        logger.info(`Processed ${i + batch.length} of ${students.length} students`);
      }

      logger.info(`Completed point aggregate update: ${processed} processed, ${errors} errors`);

      return {
        success: true,
        processed,
        errors,
      };
    } catch (error) {
      logger.error('Error updating point aggregates', { error });
      return {
        success: false,
        processed: 0,
        errors: 1,
      };
    }
  }

  /**
   * Update point aggregates for a single student
   */
  private async updateStudentPointAggregates(studentId: string): Promise<void> {
    try {
      // Get student enrollments with class information
      const enrollments = await this.prisma.studentEnrollment.findMany({
        where: {
          studentId,
          status: SystemStatus.ACTIVE,
        },
        include: {
          class: true, // Include the full class object
        },
      }) as unknown as Array<EnrollmentWithClass>; // Type assertion for TypeScript

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if aggregate exists for today
      const existingAggregate = await this.prisma.studentPointsAggregate.findFirst({
        where: {
          studentId,
          classId: null,
          subjectId: null,
          date: today,
        },
      });

      if (existingAggregate) {
        // Skip if already updated today
        return;
      }

      // Calculate point totals
      const totalPoints = await this.calculateTotalPoints(studentId);
      const dailyPoints = await this.calculateDailyPoints(studentId);
      const weeklyPoints = await this.calculateWeeklyPoints(studentId);
      const monthlyPoints = await this.calculateMonthlyPoints(studentId);

      // Create overall aggregate
      await this.prisma.studentPointsAggregate.create({
        data: {
          studentId,
          date: today,
          dailyPoints,
          weeklyPoints,
          monthlyPoints,
          termPoints: totalPoints, // Simplified
          totalPoints,
        },
      });

      // Create class-specific aggregates
      for (const enrollment of enrollments) {
        const classTotalPoints = await this.calculateTotalPoints(studentId, enrollment.classId);
        const classDailyPoints = await this.calculateDailyPoints(studentId, enrollment.classId);
        const classWeeklyPoints = await this.calculateWeeklyPoints(studentId, enrollment.classId);
        const classMonthlyPoints = await this.calculateMonthlyPoints(studentId, enrollment.classId);

        await this.prisma.studentPointsAggregate.create({
          data: {
            studentId,
            classId: enrollment.classId,
            date: today,
            dailyPoints: classDailyPoints,
            weeklyPoints: classWeeklyPoints,
            monthlyPoints: classMonthlyPoints,
            termPoints: classTotalPoints, // Simplified
            totalPoints: classTotalPoints,
          },
        });

        // Create subject-specific aggregates
        if (enrollment.class?.subjectId) {
          const subjectId = enrollment.class.subjectId;
          const subjectTotalPoints = await this.calculateTotalPoints(studentId, null, subjectId);
          const subjectDailyPoints = await this.calculateDailyPoints(studentId, null, subjectId);
          const subjectWeeklyPoints = await this.calculateWeeklyPoints(studentId, null, subjectId);
          const subjectMonthlyPoints = await this.calculateMonthlyPoints(studentId, null, subjectId);

          await this.prisma.studentPointsAggregate.create({
            data: {
              studentId,
              subjectId,
              date: today,
              dailyPoints: subjectDailyPoints,
              weeklyPoints: subjectWeeklyPoints,
              monthlyPoints: subjectMonthlyPoints,
              termPoints: subjectTotalPoints, // Simplified
              totalPoints: subjectTotalPoints,
            },
          });
        }
      }
    } catch (error) {
      logger.error('Error updating student point aggregates', { error, studentId });
      throw error;
    }
  }

  /**
   * Calculate total points
   */
  private async calculateTotalPoints(
    studentId: string,
    classId?: string | null,
    subjectId?: string | null
  ): Promise<number> {
    const result = await this.prisma.studentPoints.aggregate({
      where: {
        studentId,
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        status: SystemStatus.ACTIVE,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  /**
   * Calculate daily points
   */
  private async calculateDailyPoints(
    studentId: string,
    classId?: string | null,
    subjectId?: string | null
  ): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.studentPoints.aggregate({
      where: {
        studentId,
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        createdAt: { gte: today },
        status: SystemStatus.ACTIVE,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  /**
   * Calculate weekly points
   */
  private async calculateWeeklyPoints(
    studentId: string,
    classId?: string | null,
    subjectId?: string | null
  ): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const result = await this.prisma.studentPoints.aggregate({
      where: {
        studentId,
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        createdAt: { gte: oneWeekAgo },
        status: SystemStatus.ACTIVE,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  /**
   * Calculate monthly points
   */
  private async calculateMonthlyPoints(
    studentId: string,
    classId?: string | null,
    subjectId?: string | null
  ): Promise<number> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const result = await this.prisma.studentPoints.aggregate({
      where: {
        studentId,
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        createdAt: { gte: oneMonthAgo },
        status: SystemStatus.ACTIVE,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  /**
   * Archive old leaderboard snapshots
   */
  async archiveOldLeaderboardSnapshots(
    olderThanDays: number = 90
  ): Promise<{
    success: boolean;
    archived: number;
  }> {
    try {
      logger.info(`Starting archival of leaderboard snapshots older than ${olderThanDays} days`);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Archive old snapshots
      const result = await this.prisma.leaderboardSnapshot.updateMany({
        where: {
          snapshotDate: { lt: cutoffDate },
          status: SystemStatus.ACTIVE,
        },
        data: {
          status: SystemStatus.ARCHIVED,
        },
      });

      logger.info(`Archived ${result.count} leaderboard snapshots`);

      return {
        success: true,
        archived: result.count,
      };
    } catch (error) {
      logger.error('Error archiving old leaderboard snapshots', { error, olderThanDays });
      return {
        success: false,
        archived: 0,
      };
    }
  }

  /**
   * Run all scheduled jobs
   */
  async runAllJobs(): Promise<{
    success: boolean;
    results: Record<string, any>;
  }> {
    try {
      logger.info('Starting all reward processing jobs');

      const results: Record<string, any> = {};

      // Update point aggregates
      results.pointAggregates = await this.updatePointAggregates();

      // Run leaderboard partitioning and archiving jobs
      results.leaderboardJobs = await this.leaderboardArchivingJobs.runAllJobs();

      // For backward compatibility, also run the old snapshot creation methods
      // These can be removed once the new system is fully tested
      results.classLeaderboards = await this.createClassLeaderboardSnapshots();
      results.subjectLeaderboards = await this.createSubjectLeaderboardSnapshots();
      results.campusLeaderboards = await this.createCampusLeaderboardSnapshots();

      // Archive old data using the linear archiving methodology
      results.linearArchiving = await this.leaderboardArchivingJobs.applyLinearArchiving();

      // For backward compatibility, also run the old archiving method
      results.archiveSnapshots = await this.archiveOldLeaderboardSnapshots();

      logger.info('Completed all reward processing jobs', { results });

      return {
        success: true,
        results,
      };
    } catch (error) {
      logger.error('Error running all reward processing jobs', { error });
      return {
        success: false,
        results: {},
      };
    }
  }
}
