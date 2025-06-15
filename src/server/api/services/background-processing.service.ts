/**
 * Background Processing Service
 *
 * This service provides functionality for running complex calculations
 * in the background to avoid blocking the main thread or API responses.
 *
 * It implements:
 * 1. Job queue for processing tasks asynchronously
 * 2. Scheduled recalculation of leaderboard data
 * 3. Batched processing of heavy operations
 */

import { PrismaClient, SystemStatus } from '@prisma/client';
import { logger } from '@/server/api/utils/logger';
import { LeaderboardPartitioningService, EntityType, TimeGranularity } from './leaderboard-partitioning.service';
import { OptimizedLeaderboardService } from './leaderboard.service.optimized';
import { invalidateLeaderboardCache } from '@/server/api/cache/rewards';

// Job types
export enum JobType {
  RECALCULATE_LEADERBOARD = 'recalculate_leaderboard',
  UPDATE_POINTS_AGGREGATES = 'update_points_aggregates',
  ARCHIVE_OLD_SNAPSHOTS = 'archive_old_snapshots',
  GENERATE_ANALYTICS = 'generate_analytics',
}

// Job status
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Job interface
export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  data: any;
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export class BackgroundProcessingService {
  private prisma: PrismaClient;
  private leaderboardPartitioning: LeaderboardPartitioningService;
  private leaderboardService: OptimizedLeaderboardService;
  private jobQueue: Job[] = [];
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.leaderboardPartitioning = new LeaderboardPartitioningService(prisma);
    this.leaderboardService = new OptimizedLeaderboardService({ prisma });

    // Start processing loop
    this.startProcessing();

    // Schedule recurring jobs
    this.scheduleRecurringJobs();

    logger.info('Background processing service initialized');
  }

  /**
   * Start the job processing loop
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.processNextJob();
    }, 1000); // Check for new jobs every second
  }

  /**
   * Schedule recurring jobs
   */
  private scheduleRecurringJobs(): void {
    // Schedule daily leaderboard recalculation (at 3 AM)
    this.scheduleJob('daily-leaderboard-recalculation', '0 3 * * *', () => {
      this.addJob({
        type: JobType.RECALCULATE_LEADERBOARD,
        data: { recalculateAll: true },
        priority: 5,
      });
    });

    // Schedule weekly archiving of old snapshots (at 2 AM on Sundays)
    this.scheduleJob('weekly-archive-snapshots', '0 2 * * 0', () => {
      this.addJob({
        type: JobType.ARCHIVE_OLD_SNAPSHOTS,
        data: {},
        priority: 3,
      });
    });

    // Schedule hourly points aggregates update
    this.scheduleJob('hourly-points-aggregates', '0 * * * *', () => {
      this.addJob({
        type: JobType.UPDATE_POINTS_AGGREGATES,
        data: {},
        priority: 7,
      });
    });
  }

  /**
   * Schedule a job to run at a specific cron schedule
   *
   * @param jobId Unique identifier for the scheduled job
   * @param cronSchedule Cron schedule expression
   * @param callback Function to execute on schedule
   */
  private scheduleJob(jobId: string, cronSchedule: string, callback: () => void): void {
    // For simplicity, we're using setInterval instead of actual cron
    // In a production environment, use a proper cron library or job scheduler

    // Parse the cron schedule (simplified for this example)
    const [minute, hour, , , dayOfWeek] = cronSchedule.split(' ').map(Number);

    // Calculate the interval in milliseconds (simplified)
    let interval = 60 * 60 * 1000; // Default to hourly

    if (dayOfWeek !== undefined && !isNaN(dayOfWeek)) {
      interval = 7 * 24 * 60 * 60 * 1000; // Weekly
    } else if (hour !== undefined && !isNaN(hour)) {
      interval = 24 * 60 * 60 * 1000; // Daily
    }

    // Schedule the job
    const timeoutId = setInterval(callback, interval);
    this.scheduledJobs.set(jobId, timeoutId);

    logger.info(`Scheduled recurring job: ${jobId}`);
  }

  /**
   * Add a job to the queue
   *
   * @param jobData Job data
   * @returns The created job
   */
  public addJob(jobData: {
    type: JobType;
    data: any;
    priority: number;
  }): Job {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: jobData.type,
      status: JobStatus.PENDING,
      data: jobData.data,
      priority: jobData.priority,
      createdAt: new Date(),
    };

    this.jobQueue.push(job);

    // Sort the queue by priority (higher priority first)
    this.jobQueue.sort((a, b) => b.priority - a.priority);

    logger.info(`Added job to queue: ${job.id} (${job.type})`);

    return job;
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob(): Promise<void> {
    if (this.isProcessing || this.jobQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const job = this.jobQueue.shift();

      if (!job) {
        this.isProcessing = false;
        return;
      }

      // Update job status
      job.status = JobStatus.RUNNING;
      job.startedAt = new Date();

      logger.info(`Processing job: ${job.id} (${job.type})`);

      // Process the job based on its type
      try {
        switch (job.type) {
          case JobType.RECALCULATE_LEADERBOARD:
            await this.recalculateLeaderboard(job);
            break;
          case JobType.UPDATE_POINTS_AGGREGATES:
            await this.updatePointsAggregates(job);
            break;
          case JobType.ARCHIVE_OLD_SNAPSHOTS:
            await this.archiveOldSnapshots(job);
            break;
          case JobType.GENERATE_ANALYTICS:
            await this.generateAnalytics(job);
            break;
          default:
            throw new Error(`Unknown job type: ${job.type}`);
        }

        // Update job status
        job.status = JobStatus.COMPLETED;
        job.completedAt = new Date();

        logger.info(`Completed job: ${job.id} (${job.type})`);
      } catch (error) {
        // Update job status
        job.status = JobStatus.FAILED;
        job.error = error instanceof Error ? error.message : String(error);

        logger.error(`Failed to process job: ${job.id} (${job.type})`, { error });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Recalculate leaderboard data
   *
   * @param job The job to process
   */
  private async recalculateLeaderboard(job: Job): Promise<void> {
    const { recalculateAll, entityType, referenceId, timeGranularity } = job.data;

    if (recalculateAll) {
      // Get all active classes
      const classes = await this.prisma.class.findMany({
        where: { status: SystemStatus.ACTIVE },
        select: { id: true },
      });

      // Recalculate leaderboards for all classes
      for (const classData of classes) {
        await this.leaderboardPartitioning.createPartitionedSnapshot({
          type: EntityType.CLASS,
          referenceId: classData.id,
          timeGranularity: TimeGranularity.DAILY,
          institutionId: 'default', // This would need to be fetched in a real implementation
          limit: 100,
        });

        // Invalidate cache
        invalidateLeaderboardCache('class', classData.id);
      }

      // Get all active subjects
      const subjects = await this.prisma.subject.findMany({
        where: { status: SystemStatus.ACTIVE },
        select: { id: true },
      });

      // Recalculate leaderboards for all subjects
      for (const subjectData of subjects) {
        await this.leaderboardPartitioning.createPartitionedSnapshot({
          type: EntityType.SUBJECT,
          referenceId: subjectData.id,
          timeGranularity: TimeGranularity.DAILY,
          institutionId: 'default', // This would need to be fetched in a real implementation
          limit: 100,
        });

        // Invalidate cache
        invalidateLeaderboardCache('subject', subjectData.id);
      }

      // Get all active campuses
      const campuses = await this.prisma.campus.findMany({
        where: { status: SystemStatus.ACTIVE },
        select: { id: true },
      });

      // Recalculate leaderboards for all campuses
      for (const campusData of campuses) {
        await this.leaderboardPartitioning.createPartitionedSnapshot({
          type: EntityType.CAMPUS,
          referenceId: campusData.id,
          timeGranularity: TimeGranularity.DAILY,
          institutionId: 'default', // This would need to be fetched in a real implementation
          limit: 100,
        });

        // Invalidate cache
        invalidateLeaderboardCache('overall', campusData.id);
      }
    } else if (entityType && referenceId && timeGranularity) {
      // Recalculate specific leaderboard
      await this.leaderboardPartitioning.createPartitionedSnapshot({
        type: entityType as EntityType,
        referenceId,
        timeGranularity: timeGranularity as TimeGranularity,
        institutionId: 'default', // This would need to be fetched in a real implementation
        limit: 100,
      });

      // Invalidate cache
      const cacheType = entityType === EntityType.CAMPUS ? 'overall' : entityType.toLowerCase();
      invalidateLeaderboardCache(cacheType as string, referenceId);
    } else {
      throw new Error('Invalid job data for recalculating leaderboard');
    }
  }

  /**
   * Update points aggregates
   *
   * @param job The job to process
   */
  private async updatePointsAggregates(job: Job): Promise<void> {
    // Implementation would depend on the specific requirements
    // This is a placeholder for the actual implementation
    logger.info('Updating points aggregates');
  }

  /**
   * Archive old snapshots
   *
   * @param job The job to process
   */
  private async archiveOldSnapshots(job: Job): Promise<void> {
    await this.leaderboardPartitioning.applyLinearArchiving();
  }

  /**
   * Generate analytics
   *
   * @param job The job to process
   */
  private async generateAnalytics(job: Job): Promise<void> {
    // Implementation would depend on the specific requirements
    // This is a placeholder for the actual implementation
    logger.info('Generating analytics');
  }

  /**
   * Destroy the service and clean up resources
   */
  public destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Clear all scheduled jobs
    for (const timeoutId of this.scheduledJobs.values()) {
      clearInterval(timeoutId);
    }

    this.scheduledJobs.clear();

    logger.info('Background processing service destroyed');
  }
}
