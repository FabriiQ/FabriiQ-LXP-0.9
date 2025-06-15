/**
 * System Job Manager
 * 
 * This module provides background jobs for system-wide tasks, including:
 * - Database maintenance
 * - Cache cleanup
 * - Session cleanup
 * - System health checks
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../api/utils/logger';
import { BackgroundJobSystem, JobFrequency, JobDefinition } from './background-job-system';
import { ActivityCacheService } from '../api/services/activity-cache.service';
import { ActivityArchivingService } from '../api/services/activity-archiving.service';

export class SystemJobManager {
  private prisma: PrismaClient;
  private jobSystem: BackgroundJobSystem;

  constructor(prisma: PrismaClient, jobSystem: BackgroundJobSystem) {
    this.prisma = prisma;
    this.jobSystem = jobSystem;
  }

  /**
   * Register all system jobs
   */
  registerJobs(): void {
    logger.info('Registering system background jobs');

    // Register cache cleanup jobs
    this.registerCacheCleanupJobs();

    // Register database maintenance jobs
    this.registerDatabaseMaintenanceJobs();

    // Register activity archiving jobs
    this.registerActivityArchivingJobs();
  }

  /**
   * Register cache cleanup jobs
   */
  private registerCacheCleanupJobs(): void {
    // Hourly cache cleanup
    const hourlyCacheCleanupJob: JobDefinition = {
      id: 'system-hourly-cache-cleanup',
      name: 'Hourly Cache Cleanup',
      description: 'Cleans up expired cache entries',
      frequency: JobFrequency.HOURLY,
      handler: async () => {
        logger.info('Running hourly cache cleanup');
        
        // Clean up activity cache
        ActivityCacheService.cleanup();
        
        return { success: true };
      },
      priority: 8,
      timeout: 5 * 60 * 1000, // 5 minutes
      retryCount: 2,
      retryDelay: 10 * 60 * 1000, // 10 minutes
      enabled: true
    };
    this.jobSystem.registerJob(hourlyCacheCleanupJob);
  }

  /**
   * Register database maintenance jobs
   */
  private registerDatabaseMaintenanceJobs(): void {
    // Daily session cleanup
    const dailySessionCleanupJob: JobDefinition = {
      id: 'system-daily-session-cleanup',
      name: 'Daily Session Cleanup',
      description: 'Cleans up expired sessions from the database',
      frequency: JobFrequency.DAILY,
      handler: async () => {
        logger.info('Running daily session cleanup');
        
        // Delete expired sessions (older than 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const result = await this.prisma.session.deleteMany({
          where: {
            expires: {
              lt: thirtyDaysAgo
            }
          }
        });
        
        logger.info(`Deleted ${result.count} expired sessions`);
        
        return { deletedSessions: result.count };
      },
      priority: 3,
      timeout: 10 * 60 * 1000, // 10 minutes
      retryCount: 2,
      retryDelay: 30 * 60 * 1000, // 30 minutes
      enabled: true
    };
    this.jobSystem.registerJob(dailySessionCleanupJob);

    // Weekly database vacuum
    const weeklyDatabaseVacuumJob: JobDefinition = {
      id: 'system-weekly-database-vacuum',
      name: 'Weekly Database Vacuum',
      description: 'Performs database vacuum to reclaim space and update statistics',
      frequency: JobFrequency.WEEKLY,
      handler: async () => {
        logger.info('Running weekly database vacuum');
        
        // This would typically run a database-specific vacuum command
        // For PostgreSQL, it would be something like:
        // await this.prisma.$executeRaw`VACUUM ANALYZE;`;
        
        // Since we can't directly execute raw SQL for all database types safely,
        // we'll just log a message for now
        logger.info('Database vacuum operation would run here');
        
        return { success: true };
      },
      priority: 1,
      timeout: 60 * 60 * 1000, // 1 hour
      retryCount: 1,
      retryDelay: 2 * 60 * 60 * 1000, // 2 hours
      enabled: true
    };
    this.jobSystem.registerJob(weeklyDatabaseVacuumJob);
  }

  /**
   * Register activity archiving jobs
   */
  private registerActivityArchivingJobs(): void {
    // Monthly activity archiving
    const monthlyActivityArchivingJob: JobDefinition = {
      id: 'system-monthly-activity-archiving',
      name: 'Monthly Activity Archiving',
      description: 'Archives old activity grades to maintain database performance',
      frequency: JobFrequency.MONTHLY,
      handler: async () => {
        logger.info('Running monthly activity archiving');
        
        // Create archiving service
        const archivingService = new ActivityArchivingService(this.prisma, {
          ageThresholdDays: 365, // Archive activities older than 1 year
          batchSize: 100,
          preserveDetailedResults: false
        });
        
        // Archive old grades
        const result = await archivingService.archiveOldGrades({
          // No specific class or user, archive all eligible grades
          dryRun: false
        });
        
        logger.info(`Archived ${result.totalArchived} activity grades, ${result.totalFailed} failed`);
        
        return result;
      },
      priority: 2,
      timeout: 60 * 60 * 1000, // 1 hour
      retryCount: 2,
      retryDelay: 2 * 60 * 60 * 1000, // 2 hours
      enabled: true
    };
    this.jobSystem.registerJob(monthlyActivityArchivingJob);
  }

  /**
   * Run all system jobs manually
   * @returns Results of all jobs
   */
  async runAllJobs(): Promise<Record<string, any>> {
    logger.info('Manually running all system jobs');
    
    const results: Record<string, any> = {};
    
    // Get all system job IDs
    const systemJobIds = Array.from(this.jobSystem.getAllJobs().keys())
      .filter(id => id.startsWith('system-'));
    
    // Execute each job
    for (const jobId of systemJobIds) {
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
