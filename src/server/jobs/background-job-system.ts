/**
 * Background Job System
 * 
 * This module provides a centralized system for managing and executing background jobs.
 * It supports:
 * - Job scheduling with different frequencies (daily, hourly, etc.)
 * - Job prioritization
 * - Job status tracking
 * - Error handling and retries
 * - Logging and monitoring
 */

import { PrismaClient, SystemStatus } from '@prisma/client';
import { logger } from '../api/utils/logger';

// Job frequency types
export enum JobFrequency {
  MINUTELY = 'MINUTELY',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM'
}

// Job status types
export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Job definition interface
export interface JobDefinition {
  id: string;
  name: string;
  description: string;
  frequency: JobFrequency;
  customInterval?: number; // in milliseconds, for CUSTOM frequency
  handler: () => Promise<any>;
  priority: number; // 1 (lowest) to 10 (highest)
  timeout?: number; // in milliseconds
  retryCount?: number;
  retryDelay?: number; // in milliseconds
  enabled: boolean;
}

// Job execution result
export interface JobResult {
  jobId: string;
  status: JobStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  result?: any;
  error?: any;
}

// Job execution history
interface JobHistory {
  [jobId: string]: JobResult[];
}

export class BackgroundJobSystem {
  private prisma: PrismaClient;
  private jobs: Map<string, JobDefinition>;
  private timers: Map<string, NodeJS.Timeout>;
  private runningJobs: Map<string, Promise<any>>;
  private jobHistory: JobHistory;
  private maxHistoryPerJob: number;

  constructor(prisma: PrismaClient, options?: { maxHistoryPerJob?: number }) {
    this.prisma = prisma;
    this.jobs = new Map();
    this.timers = new Map();
    this.runningJobs = new Map();
    this.jobHistory = {};
    this.maxHistoryPerJob = options?.maxHistoryPerJob || 10;
  }

  /**
   * Register a new job
   * @param job Job definition
   * @returns Success status
   */
  registerJob(job: JobDefinition): boolean {
    try {
      if (this.jobs.has(job.id)) {
        logger.warn(`Job with ID ${job.id} already exists. Updating.`);
        this.unregisterJob(job.id);
      }

      this.jobs.set(job.id, job);
      this.jobHistory[job.id] = [];

      if (job.enabled) {
        this.scheduleJob(job);
      }

      logger.info(`Registered job: ${job.name} (${job.id})`);
      return true;
    } catch (error) {
      logger.error(`Error registering job ${job.id}`, { error });
      return false;
    }
  }

  /**
   * Unregister a job
   * @param jobId Job ID
   * @returns Success status
   */
  unregisterJob(jobId: string): boolean {
    try {
      if (!this.jobs.has(jobId)) {
        logger.warn(`Job with ID ${jobId} does not exist.`);
        return false;
      }

      // Clear any scheduled timers
      if (this.timers.has(jobId)) {
        clearTimeout(this.timers.get(jobId)!);
        this.timers.delete(jobId);
      }

      this.jobs.delete(jobId);
      logger.info(`Unregistered job: ${jobId}`);
      return true;
    } catch (error) {
      logger.error(`Error unregistering job ${jobId}`, { error });
      return false;
    }
  }

  /**
   * Schedule a job based on its frequency
   * @param job Job definition
   */
  private scheduleJob(job: JobDefinition): void {
    let interval: number;

    switch (job.frequency) {
      case JobFrequency.MINUTELY:
        interval = 60 * 1000; // 1 minute
        break;
      case JobFrequency.HOURLY:
        interval = 60 * 60 * 1000; // 1 hour
        break;
      case JobFrequency.DAILY:
        interval = 24 * 60 * 60 * 1000; // 1 day
        break;
      case JobFrequency.WEEKLY:
        interval = 7 * 24 * 60 * 60 * 1000; // 1 week
        break;
      case JobFrequency.MONTHLY:
        interval = 30 * 24 * 60 * 60 * 1000; // ~1 month (30 days)
        break;
      case JobFrequency.CUSTOM:
        interval = job.customInterval || 60 * 60 * 1000; // Default to 1 hour
        break;
      default:
        interval = 60 * 60 * 1000; // Default to 1 hour
    }

    // Schedule the job
    const timer = setInterval(() => {
      this.executeJob(job.id).catch(error => {
        logger.error(`Error executing scheduled job ${job.id}`, { error });
      });
    }, interval);

    this.timers.set(job.id, timer);
    logger.info(`Scheduled job ${job.id} with interval ${interval}ms`);
  }

  /**
   * Execute a job immediately
   * @param jobId Job ID
   * @returns Job result
   */
  async executeJob(jobId: string): Promise<JobResult> {
    const job = this.jobs.get(jobId);
    if (!job) {
      const error = new Error(`Job with ID ${jobId} does not exist.`);
      logger.error(`Error executing job`, { error, jobId });
      return {
        jobId,
        status: JobStatus.FAILED,
        startTime: new Date(),
        error
      };
    }

    // Check if job is already running
    if (this.runningJobs.has(jobId)) {
      logger.warn(`Job ${jobId} is already running. Skipping execution.`);
      return {
        jobId,
        status: JobStatus.PENDING,
        startTime: new Date(),
        error: new Error('Job is already running')
      };
    }

    logger.info(`Executing job: ${job.name} (${jobId})`);
    const startTime = new Date();
    const result: JobResult = {
      jobId,
      status: JobStatus.RUNNING,
      startTime
    };

    // Add to running jobs
    const jobPromise = this.executeJobWithTimeout(job);
    this.runningJobs.set(jobId, jobPromise);

    try {
      const jobResult = await jobPromise;
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      result.status = JobStatus.COMPLETED;
      result.endTime = endTime;
      result.duration = duration;
      result.result = jobResult;

      logger.info(`Job completed: ${job.name} (${jobId})`, { 
        duration: `${duration}ms`,
        result: jobResult
      });
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      result.status = JobStatus.FAILED;
      result.endTime = endTime;
      result.duration = duration;
      result.error = error;

      logger.error(`Job failed: ${job.name} (${jobId})`, { 
        duration: `${duration}ms`,
        error
      });

      // Handle retries if configured
      if (job.retryCount && job.retryCount > 0) {
        this.scheduleRetry(job);
      }
    } finally {
      // Remove from running jobs
      this.runningJobs.delete(jobId);

      // Add to job history
      this.addToJobHistory(jobId, result);
    }

    return result;
  }

  /**
   * Execute a job with timeout
   * @param job Job definition
   * @returns Job result
   */
  private async executeJobWithTimeout(job: JobDefinition): Promise<any> {
    if (!job.timeout) {
      return job.handler();
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Job ${job.id} timed out after ${job.timeout}ms`));
      }, job.timeout);

      job.handler()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Schedule a job retry
   * @param job Job definition
   */
  private scheduleRetry(job: JobDefinition): void {
    const retryDelay = job.retryDelay || 60000; // Default to 1 minute
    
    logger.info(`Scheduling retry for job ${job.id} in ${retryDelay}ms`);
    
    setTimeout(() => {
      this.executeJob(job.id).catch(error => {
        logger.error(`Error executing retry for job ${job.id}`, { error });
      });
    }, retryDelay);
  }

  /**
   * Add job result to history
   * @param jobId Job ID
   * @param result Job result
   */
  private addToJobHistory(jobId: string, result: JobResult): void {
    if (!this.jobHistory[jobId]) {
      this.jobHistory[jobId] = [];
    }

    this.jobHistory[jobId].unshift(result);

    // Trim history if it exceeds max size
    if (this.jobHistory[jobId].length > this.maxHistoryPerJob) {
      this.jobHistory[jobId] = this.jobHistory[jobId].slice(0, this.maxHistoryPerJob);
    }
  }

  /**
   * Get job history
   * @param jobId Job ID (optional, if not provided returns all history)
   * @returns Job history
   */
  getJobHistory(jobId?: string): JobHistory | JobResult[] {
    if (jobId) {
      return this.jobHistory[jobId] || [];
    }
    return this.jobHistory;
  }

  /**
   * Get job status
   * @param jobId Job ID
   * @returns Job status
   */
  getJobStatus(jobId: string): {
    job: JobDefinition | undefined;
    isRunning: boolean;
    lastResult: JobResult | undefined;
  } {
    const job = this.jobs.get(jobId);
    const isRunning = this.runningJobs.has(jobId);
    const history = this.jobHistory[jobId] || [];
    const lastResult = history.length > 0 ? history[0] : undefined;

    return {
      job,
      isRunning,
      lastResult
    };
  }

  /**
   * Get all jobs
   * @returns Map of all jobs
   */
  getAllJobs(): Map<string, JobDefinition> {
    return this.jobs;
  }

  /**
   * Get running jobs
   * @returns Map of running jobs
   */
  getRunningJobs(): string[] {
    return Array.from(this.runningJobs.keys());
  }

  /**
   * Enable a job
   * @param jobId Job ID
   * @returns Success status
   */
  enableJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      logger.warn(`Job with ID ${jobId} does not exist.`);
      return false;
    }

    job.enabled = true;
    this.jobs.set(jobId, job);

    // Schedule the job if it's not already scheduled
    if (!this.timers.has(jobId)) {
      this.scheduleJob(job);
    }

    logger.info(`Enabled job: ${job.name} (${jobId})`);
    return true;
  }

  /**
   * Disable a job
   * @param jobId Job ID
   * @returns Success status
   */
  disableJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      logger.warn(`Job with ID ${jobId} does not exist.`);
      return false;
    }

    job.enabled = false;
    this.jobs.set(jobId, job);

    // Clear any scheduled timers
    if (this.timers.has(jobId)) {
      clearTimeout(this.timers.get(jobId)!);
      this.timers.delete(jobId);
    }

    logger.info(`Disabled job: ${job.name} (${jobId})`);
    return true;
  }

  /**
   * Stop all jobs
   */
  stopAllJobs(): void {
    // Clear all timers
    for (const [jobId, timer] of this.timers.entries()) {
      clearTimeout(timer);
      logger.info(`Stopped job: ${jobId}`);
    }
    this.timers.clear();
  }

  /**
   * Start all enabled jobs
   */
  startAllJobs(): void {
    for (const job of this.jobs.values()) {
      if (job.enabled && !this.timers.has(job.id)) {
        this.scheduleJob(job);
      }
    }
  }

  /**
   * Shutdown the job system
   */
  shutdown(): void {
    logger.info('Shutting down background job system');
    this.stopAllJobs();
  }
}
