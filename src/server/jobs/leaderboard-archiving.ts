/**
 * Leaderboard Archiving Jobs
 * 
 * This module provides background jobs for archiving leaderboard data
 * using the linear archiving methodology.
 */

import { PrismaClient, SystemStatus } from '@prisma/client';
import { logger } from '@/server/api/utils/logger';
import { LeaderboardPartitioningService, TimeGranularity, EntityType } from '@/server/api/services/leaderboard-partitioning.service';
import { subDays, subMonths, format } from 'date-fns';

export class LeaderboardArchivingJobs {
  private prisma: PrismaClient;
  private partitioningService: LeaderboardPartitioningService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.partitioningService = new LeaderboardPartitioningService(prisma);
  }

  /**
   * Create partitioned snapshots for all classes
   */
  async createClassLeaderboardPartitions(): Promise<{
    success: boolean;
    processed: number;
    errors: number;
  }> {
    try {
      logger.info('Starting class leaderboard partition creation');

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
              // Create daily snapshot
              await this.partitioningService.createPartitionedSnapshot({
                type: EntityType.CLASS,
                referenceId: classEntity.id,
                timeGranularity: TimeGranularity.DAILY,
                limit: 20, // Smaller limit for daily snapshots
              });

              // Create weekly snapshot
              await this.partitioningService.createPartitionedSnapshot({
                type: EntityType.CLASS,
                referenceId: classEntity.id,
                timeGranularity: TimeGranularity.WEEKLY,
                limit: 50, // Medium limit for weekly snapshots
              });

              // Create monthly snapshot
              await this.partitioningService.createPartitionedSnapshot({
                type: EntityType.CLASS,
                referenceId: classEntity.id,
                timeGranularity: TimeGranularity.ALL_TIME,
                limit: 100, // Larger limit for all-time snapshots
              });

              processed++;
            } catch (error) {
              logger.error(`Error creating leaderboard partitions for class ${classEntity.id}`, { error });
              errors++;
            }
          })
        );

        // Log progress
        logger.info(`Processed ${i + batch.length} of ${classes.length} classes`);
      }

      logger.info(`Completed class leaderboard partition creation: ${processed} processed, ${errors} errors`);

      return {
        success: true,
        processed,
        errors,
      };
    } catch (error) {
      logger.error('Error creating class leaderboard partitions', { error });
      return {
        success: false,
        processed: 0,
        errors: 1,
      };
    }
  }

  /**
   * Create partitioned snapshots for all subjects
   */
  async createSubjectLeaderboardPartitions(): Promise<{
    success: boolean;
    processed: number;
    errors: number;
  }> {
    try {
      logger.info('Starting subject leaderboard partition creation');

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
              // Create weekly snapshot
              await this.partitioningService.createPartitionedSnapshot({
                type: EntityType.SUBJECT,
                referenceId: subject.id,
                timeGranularity: TimeGranularity.WEEKLY,
                limit: 50,
              });

              // Create monthly snapshot
              await this.partitioningService.createPartitionedSnapshot({
                type: EntityType.SUBJECT,
                referenceId: subject.id,
                timeGranularity: TimeGranularity.MONTHLY,
                limit: 100,
              });

              processed++;
            } catch (error) {
              logger.error(`Error creating leaderboard partitions for subject ${subject.id}`, { error });
              errors++;
            }
          })
        );

        // Log progress
        logger.info(`Processed ${i + batch.length} of ${subjects.length} subjects`);
      }

      logger.info(`Completed subject leaderboard partition creation: ${processed} processed, ${errors} errors`);

      return {
        success: true,
        processed,
        errors,
      };
    } catch (error) {
      logger.error('Error creating subject leaderboard partitions', { error });
      return {
        success: false,
        processed: 0,
        errors: 1,
      };
    }
  }

  /**
   * Create partitioned snapshots for all campuses
   */
  async createCampusLeaderboardPartitions(): Promise<{
    success: boolean;
    processed: number;
    errors: number;
  }> {
    try {
      logger.info('Starting campus leaderboard partition creation');

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
          // Create weekly snapshot
          await this.partitioningService.createPartitionedSnapshot({
            type: EntityType.CAMPUS,
            referenceId: campus.id,
            timeGranularity: TimeGranularity.WEEKLY,
            limit: 100,
          });

          // Create monthly snapshot
          await this.partitioningService.createPartitionedSnapshot({
            type: EntityType.CAMPUS,
            referenceId: campus.id,
            timeGranularity: TimeGranularity.MONTHLY,
            limit: 200,
          });

          // Create all-time snapshot
          await this.partitioningService.createPartitionedSnapshot({
            type: EntityType.CAMPUS,
            referenceId: campus.id,
            timeGranularity: TimeGranularity.ALL_TIME,
            limit: 500,
          });

          processed++;
        } catch (error) {
          logger.error(`Error creating leaderboard partitions for campus ${campus.id}`, { error });
          errors++;
        }
      }

      logger.info(`Completed campus leaderboard partition creation: ${processed} processed, ${errors} errors`);

      return {
        success: true,
        processed,
        errors,
      };
    } catch (error) {
      logger.error('Error creating campus leaderboard partitions', { error });
      return {
        success: false,
        processed: 0,
        errors: 1,
      };
    }
  }

  /**
   * Apply linear archiving to leaderboard snapshots
   */
  async applyLinearArchiving(): Promise<{
    success: boolean;
    results: Record<string, any>;
  }> {
    try {
      logger.info('Starting linear archiving for leaderboard snapshots');

      const results = await this.partitioningService.applyLinearArchiving();

      logger.info('Completed linear archiving for leaderboard snapshots', { results });

      return results;
    } catch (error) {
      logger.error('Error applying linear archiving', { error });
      return {
        success: false,
        results: {},
      };
    }
  }

  /**
   * Run all leaderboard archiving jobs
   */
  async runAllJobs(): Promise<{
    success: boolean;
    results: Record<string, any>;
  }> {
    try {
      logger.info('Starting all leaderboard archiving jobs');

      const results: Record<string, any> = {};

      // Create partitioned snapshots
      results.classPartitions = await this.createClassLeaderboardPartitions();
      results.subjectPartitions = await this.createSubjectLeaderboardPartitions();
      results.campusPartitions = await this.createCampusLeaderboardPartitions();

      // Apply linear archiving
      results.linearArchiving = await this.applyLinearArchiving();

      logger.info('Completed all leaderboard archiving jobs', { results });

      return {
        success: true,
        results,
      };
    } catch (error) {
      logger.error('Error running all leaderboard archiving jobs', { error });
      return {
        success: false,
        results: {},
      };
    }
  }
}
