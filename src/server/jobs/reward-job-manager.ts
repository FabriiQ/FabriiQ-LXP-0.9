/**
 * Reward Job Manager
 * 
 * This module provides background jobs for the reward system, including:
 * - Leaderboard calculation
 * - Achievement checking
 * - Point aggregation
 * - Data archiving
 */

import { PrismaClient, SystemStatus } from '@prisma/client';
import { logger } from '../api/utils/logger';
import { BackgroundJobSystem, JobFrequency, JobDefinition } from './background-job-system';
import { RewardProcessingJobs } from './reward-processing';
import { LeaderboardArchivingJobs } from './leaderboard-archiving';
import { LeaderboardPartitioningService } from '../api/services/leaderboard-partitioning.service';

export class RewardJobManager {
  private prisma: PrismaClient;
  private jobSystem: BackgroundJobSystem;
  private rewardProcessingJobs: RewardProcessingJobs;
  private leaderboardArchivingJobs: LeaderboardArchivingJobs;
  private partitioningService: LeaderboardPartitioningService;

  constructor(prisma: PrismaClient, jobSystem: BackgroundJobSystem) {
    this.prisma = prisma;
    this.jobSystem = jobSystem;
    this.rewardProcessingJobs = new RewardProcessingJobs(prisma);
    this.leaderboardArchivingJobs = new LeaderboardArchivingJobs(prisma);
    this.partitioningService = new LeaderboardPartitioningService(prisma);
  }

  /**
   * Register all reward-related jobs
   */
  registerJobs(): void {
    logger.info('Registering reward system background jobs');

    // Register leaderboard calculation jobs
    this.registerLeaderboardCalculationJobs();

    // Register achievement checking jobs
    this.registerAchievementCheckingJobs();

    // Register point aggregation jobs
    this.registerPointAggregationJobs();

    // Register data archiving jobs
    this.registerDataArchivingJobs();
  }

  /**
   * Register leaderboard calculation jobs
   */
  private registerLeaderboardCalculationJobs(): void {
    // Daily class leaderboard calculation
    const dailyClassLeaderboardJob: JobDefinition = {
      id: 'reward-daily-class-leaderboard',
      name: 'Daily Class Leaderboard Calculation',
      description: 'Creates daily snapshots of class leaderboards',
      frequency: JobFrequency.DAILY,
      handler: async () => {
        logger.info('Running daily class leaderboard calculation');
        return this.leaderboardArchivingJobs.createClassLeaderboardPartitions();
      },
      priority: 5,
      timeout: 10 * 60 * 1000, // 10 minutes
      retryCount: 3,
      retryDelay: 5 * 60 * 1000, // 5 minutes
      enabled: true
    };
    this.jobSystem.registerJob(dailyClassLeaderboardJob);

    // Weekly subject leaderboard calculation
    const weeklySubjectLeaderboardJob: JobDefinition = {
      id: 'reward-weekly-subject-leaderboard',
      name: 'Weekly Subject Leaderboard Calculation',
      description: 'Creates weekly snapshots of subject leaderboards',
      frequency: JobFrequency.WEEKLY,
      handler: async () => {
        logger.info('Running weekly subject leaderboard calculation');
        return this.leaderboardArchivingJobs.createSubjectLeaderboardPartitions();
      },
      priority: 4,
      timeout: 15 * 60 * 1000, // 15 minutes
      retryCount: 3,
      retryDelay: 10 * 60 * 1000, // 10 minutes
      enabled: true
    };
    this.jobSystem.registerJob(weeklySubjectLeaderboardJob);

    // Weekly campus leaderboard calculation
    const weeklyCampusLeaderboardJob: JobDefinition = {
      id: 'reward-weekly-campus-leaderboard',
      name: 'Weekly Campus Leaderboard Calculation',
      description: 'Creates weekly snapshots of campus leaderboards',
      frequency: JobFrequency.WEEKLY,
      handler: async () => {
        logger.info('Running weekly campus leaderboard calculation');
        return this.leaderboardArchivingJobs.createCampusLeaderboardPartitions();
      },
      priority: 3,
      timeout: 20 * 60 * 1000, // 20 minutes
      retryCount: 3,
      retryDelay: 15 * 60 * 1000, // 15 minutes
      enabled: true
    };
    this.jobSystem.registerJob(weeklyCampusLeaderboardJob);
  }

  /**
   * Register achievement checking jobs
   */
  private registerAchievementCheckingJobs(): void {
    // Daily achievement checking
    const dailyAchievementCheckJob: JobDefinition = {
      id: 'reward-daily-achievement-check',
      name: 'Daily Achievement Check',
      description: 'Checks for new achievements based on student activity',
      frequency: JobFrequency.DAILY,
      handler: async () => {
        logger.info('Running daily achievement check');
        
        // Get active students
        const students = await this.prisma.studentProfile.findMany({
          where: { status: SystemStatus.ACTIVE },
          select: { id: true },
        });
        
        logger.info(`Found ${students.length} active students for achievement check`);
        
        // Process students in batches to avoid memory issues
        const batchSize = 50;
        let processed = 0;
        let achievements = 0;
        
        for (let i = 0; i < students.length; i += batchSize) {
          const batch = students.slice(i, i + batchSize);
          
          // Process each student in the batch
          const results = await Promise.allSettled(
            batch.map(student => this.checkStudentAchievements(student.id))
          );
          
          // Count successful checks and new achievements
          for (const result of results) {
            if (result.status === 'fulfilled') {
              processed++;
              achievements += result.value;
            }
          }
          
          logger.info(`Processed ${processed}/${students.length} students, found ${achievements} new achievements`);
        }
        
        return { processed, achievements };
      },
      priority: 6,
      timeout: 30 * 60 * 1000, // 30 minutes
      retryCount: 2,
      retryDelay: 60 * 60 * 1000, // 1 hour
      enabled: true
    };
    this.jobSystem.registerJob(dailyAchievementCheckJob);
  }

  /**
   * Check achievements for a student
   * @param studentId Student ID
   * @returns Number of new achievements found
   */
  private async checkStudentAchievements(studentId: string): Promise<number> {
    try {
      // This would call into the achievement service to check various achievement types
      // For now, we'll just return a placeholder
      return 0;
    } catch (error) {
      logger.error(`Error checking achievements for student ${studentId}`, { error });
      return 0;
    }
  }

  /**
   * Register point aggregation jobs
   */
  private registerPointAggregationJobs(): void {
    // Hourly point aggregation
    const hourlyPointAggregationJob: JobDefinition = {
      id: 'reward-hourly-point-aggregation',
      name: 'Hourly Point Aggregation',
      description: 'Aggregates student points for faster leaderboard queries',
      frequency: JobFrequency.HOURLY,
      handler: async () => {
        logger.info('Running hourly point aggregation');
        return this.rewardProcessingJobs.updatePointAggregates();
      },
      priority: 7,
      timeout: 15 * 60 * 1000, // 15 minutes
      retryCount: 3,
      retryDelay: 10 * 60 * 1000, // 10 minutes
      enabled: true
    };
    this.jobSystem.registerJob(hourlyPointAggregationJob);
  }

  /**
   * Register data archiving jobs
   */
  private registerDataArchivingJobs(): void {
    // Weekly leaderboard archiving
    const weeklyLeaderboardArchivingJob: JobDefinition = {
      id: 'reward-weekly-leaderboard-archiving',
      name: 'Weekly Leaderboard Archiving',
      description: 'Archives old leaderboard snapshots using linear archiving methodology',
      frequency: JobFrequency.WEEKLY,
      handler: async () => {
        logger.info('Running weekly leaderboard archiving');
        return this.leaderboardArchivingJobs.applyLinearArchiving();
      },
      priority: 2,
      timeout: 30 * 60 * 1000, // 30 minutes
      retryCount: 2,
      retryDelay: 60 * 60 * 1000, // 1 hour
      enabled: true
    };
    this.jobSystem.registerJob(weeklyLeaderboardArchivingJob);

    // Monthly old data archiving
    const monthlyDataArchivingJob: JobDefinition = {
      id: 'reward-monthly-data-archiving',
      name: 'Monthly Data Archiving',
      description: 'Archives old reward data to maintain database performance',
      frequency: JobFrequency.MONTHLY,
      handler: async () => {
        logger.info('Running monthly data archiving');
        
        // Archive old leaderboard snapshots (older than 90 days)
        const leaderboardResult = await this.rewardProcessingJobs.archiveOldLeaderboardSnapshots(90);
        
        // Archive old point records (older than 365 days)
        const pointsResult = await this.archiveOldPointRecords(365);
        
        return {
          leaderboard: leaderboardResult,
          points: pointsResult
        };
      },
      priority: 1,
      timeout: 60 * 60 * 1000, // 1 hour
      retryCount: 2,
      retryDelay: 2 * 60 * 60 * 1000, // 2 hours
      enabled: true
    };
    this.jobSystem.registerJob(monthlyDataArchivingJob);
  }

  /**
   * Archive old point records
   * @param olderThanDays Days threshold for archiving
   * @returns Result of the archiving operation
   */
  private async archiveOldPointRecords(olderThanDays: number): Promise<{
    success: boolean;
    archived: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      // Find records to archive
      const pointsToArchive = await this.prisma.studentPoints.findMany({
        where: {
          createdAt: { lt: cutoffDate },
          status: SystemStatus.ACTIVE
        },
        take: 1000 // Limit to 1000 records per run to avoid memory issues
      });
      
      if (pointsToArchive.length === 0) {
        logger.info(`No point records older than ${olderThanDays} days found to archive`);
        return { success: true, archived: 0 };
      }
      
      logger.info(`Found ${pointsToArchive.length} point records to archive`);
      
      // Archive records (in a real implementation, this would move data to an archive table)
      // For now, we'll just mark them as archived
      const updateResult = await this.prisma.studentPoints.updateMany({
        where: {
          id: { in: pointsToArchive.map(p => p.id) }
        },
        data: {
          status: SystemStatus.ARCHIVED
        }
      });
      
      logger.info(`Archived ${updateResult.count} point records`);
      
      return {
        success: true,
        archived: updateResult.count
      };
    } catch (error) {
      logger.error('Error archiving old point records', { error, olderThanDays });
      return {
        success: false,
        archived: 0
      };
    }
  }

  /**
   * Run all reward jobs manually
   * @returns Results of all jobs
   */
  async runAllJobs(): Promise<Record<string, any>> {
    logger.info('Manually running all reward jobs');
    
    const results: Record<string, any> = {};
    
    // Get all reward job IDs
    const rewardJobIds = Array.from(this.jobSystem.getAllJobs().keys())
      .filter(id => id.startsWith('reward-'));
    
    // Execute each job
    for (const jobId of rewardJobIds) {
      try {
        results[jobId] = await this.jobSystem.executeJob(jobId);
      } catch (error) {
        logger.error(`Error executing job ${jobId}`, { error });
        results[jobId] = { error: error.message };
      }
    }
    
    return results;
  }
}
