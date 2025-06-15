import { PrismaClient, SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { logger } from '@/server/api/utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface BackgroundJobServiceConfig {
  prisma: PrismaClient;
}

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum JobType {
  CREATE_ACTIVITY_GRADES = 'CREATE_ACTIVITY_GRADES',
  BATCH_GRADE_ACTIVITIES = 'BATCH_GRADE_ACTIVITIES',
  ARCHIVE_ACTIVITY_GRADES = 'ARCHIVE_ACTIVITY_GRADES',
  CALCULATE_STUDENT_POINTS = 'CALCULATE_STUDENT_POINTS'
}

export interface JobData {
  [key: string]: any;
}

export interface CreateJobInput {
  type: JobType;
  data: JobData;
  priority?: number;
  scheduledFor?: Date;
}

export interface JobResult {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * BackgroundJobService
 * 
 * This service handles the creation and management of background jobs.
 */
export class BackgroundJobService {
  private prisma: PrismaClient;

  constructor(config: BackgroundJobServiceConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Create a new background job
   */
  async createJob(input: CreateJobInput): Promise<any> {
    try {
      const job = await this.prisma.$queryRaw`
        INSERT INTO "background_jobs" (
          "id", "type", "status", "data", "priority", "scheduled_for", "created_at", "updated_at"
        ) VALUES (
          ${uuidv4()}, ${input.type}, ${JobStatus.PENDING}, ${JSON.stringify(input.data)}, 
          ${input.priority || 0}, ${input.scheduledFor || new Date()}, 
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING *
      `;

      return Array.isArray(job) ? job[0] : job;
    } catch (error) {
      logger.error('Error creating background job', { error, input });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create background job',
        cause: error,
      });
    }
  }

  /**
   * Get the next job to process
   */
  async getNextJob(): Promise<any> {
    try {
      // Get the next pending job ordered by priority and scheduled time
      const jobs = await this.prisma.$queryRaw`
        UPDATE "background_jobs"
        SET "status" = ${JobStatus.PROCESSING}, "started_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = (
          SELECT "id" FROM "background_jobs"
          WHERE "status" = ${JobStatus.PENDING}
          AND "scheduled_for" <= CURRENT_TIMESTAMP
          ORDER BY "priority" DESC, "scheduled_for" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *
      `;

      return Array.isArray(jobs) && jobs.length > 0 ? jobs[0] : null;
    } catch (error) {
      logger.error('Error getting next job', { error });
      return null;
    }
  }

  /**
   * Complete a job with result
   */
  async completeJob(jobId: string, result: JobResult): Promise<any> {
    try {
      const job = await this.prisma.$queryRaw`
        UPDATE "background_jobs"
        SET "status" = ${JobStatus.COMPLETED}, 
            "result" = ${JSON.stringify(result)}, 
            "completed_at" = CURRENT_TIMESTAMP,
            "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${jobId}
        RETURNING *
      `;

      return Array.isArray(job) ? job[0] : job;
    } catch (error) {
      logger.error('Error completing job', { error, jobId });
      return null;
    }
  }

  /**
   * Mark a job as failed
   */
  async failJob(jobId: string, error: any): Promise<any> {
    try {
      const job = await this.prisma.$queryRaw`
        UPDATE "background_jobs"
        SET "status" = ${JobStatus.FAILED}, 
            "result" = ${JSON.stringify({ success: false, error: error.message || String(error) })}, 
            "completed_at" = CURRENT_TIMESTAMP,
            "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${jobId}
        RETURNING *
      `;

      return Array.isArray(job) ? job[0] : job;
    } catch (error) {
      logger.error('Error marking job as failed', { error, jobId });
      return null;
    }
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string): Promise<any> {
    try {
      const job = await this.prisma.$queryRaw`
        UPDATE "background_jobs"
        SET "status" = ${JobStatus.CANCELLED}, 
            "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${jobId} AND "status" = ${JobStatus.PENDING}
        RETURNING *
      `;

      return Array.isArray(job) ? job[0] : job;
    } catch (error) {
      logger.error('Error cancelling job', { error, jobId });
      return null;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    try {
      const jobs = await this.prisma.$queryRaw`
        SELECT * FROM "background_jobs"
        WHERE "id" = ${jobId}
      `;

      return Array.isArray(jobs) && jobs.length > 0 ? jobs[0] : null;
    } catch (error) {
      logger.error('Error getting job status', { error, jobId });
      return null;
    }
  }
}
