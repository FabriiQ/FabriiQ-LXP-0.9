/**
 * Background Jobs Router
 *
 * This router provides API endpoints for managing background jobs.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { UserType } from "@prisma/client";
import {
  getBackgroundJobSystem,
  getRewardJobManager,
  getSystemJobManager,
  initializeBackgroundJobs
} from "../../jobs";
import { updateClassPerformanceMetrics, updateClassPerformanceMetricsForClass } from "../jobs/update-class-performance";
import { JobStatus } from "../../jobs/background-job-system";

// Define allowed admin roles
const ADMIN_ROLES = [
  UserType.SYSTEM_ADMIN,
  UserType.SYSTEM_MANAGER,
] as const;

export const backgroundJobsRouter = createTRPCRouter({
  // Get all jobs
  getAllJobs: protectedProcedure
    .query(async ({ ctx }) => {
      // Check permissions
      if (!ADMIN_ROLES.includes(ctx.session.user.userType as UserType)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Initialize job system if not already initialized
      const { jobSystem } = initializeBackgroundJobs(ctx.prisma);

      // Get all jobs
      const jobs = Array.from(jobSystem.getAllJobs().entries()).map(([id, job]) => {
        const status = jobSystem.getJobStatus(id);
        return {
          id: job.id,
          name: job.name,
          description: job.description,
          frequency: job.frequency,
          priority: job.priority,
          enabled: job.enabled,
          isRunning: status.isRunning,
          lastRun: status.lastResult?.startTime,
          lastStatus: status.lastResult?.status,
          lastDuration: status.lastResult?.duration,
        };
      });

      return jobs;
    }),

  // Get job details
  getJobDetails: protectedProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (!ADMIN_ROLES.includes(ctx.session.user.userType as UserType)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Initialize job system if not already initialized
      const { jobSystem } = initializeBackgroundJobs(ctx.prisma);

      // Get job details
      const status = jobSystem.getJobStatus(input.jobId);

      if (!status.job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Job with ID ${input.jobId} not found`,
        });
      }

      // Get job history
      const history = jobSystem.getJobHistory(input.jobId);

      return {
        job: {
          id: status.job.id,
          name: status.job.name,
          description: status.job.description,
          frequency: status.job.frequency,
          customInterval: status.job.customInterval,
          priority: status.job.priority,
          timeout: status.job.timeout,
          retryCount: status.job.retryCount,
          retryDelay: status.job.retryDelay,
          enabled: status.job.enabled,
        },
        status: {
          isRunning: status.isRunning,
          lastResult: status.lastResult,
        },
        history,
      };
    }),

  // Run a job
  runJob: protectedProcedure
    .input(z.object({
      jobId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!ADMIN_ROLES.includes(ctx.session.user.userType as UserType)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Initialize job system if not already initialized
      const { jobSystem } = initializeBackgroundJobs(ctx.prisma);

      // Check if job exists
      const status = jobSystem.getJobStatus(input.jobId);

      if (!status.job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Job with ID ${input.jobId} not found`,
        });
      }

      // Check if job is already running
      if (status.isRunning) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Job ${input.jobId} is already running`,
        });
      }

      // Run the job
      const result = await jobSystem.executeJob(input.jobId);

      return result;
    }),

  // Enable/disable a job
  setJobEnabled: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!ADMIN_ROLES.includes(ctx.session.user.userType as UserType)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Initialize job system if not already initialized
      const { jobSystem } = initializeBackgroundJobs(ctx.prisma);

      // Check if job exists
      const status = jobSystem.getJobStatus(input.jobId);

      if (!status.job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Job with ID ${input.jobId} not found`,
        });
      }

      // Enable or disable the job
      let result: boolean;
      if (input.enabled) {
        result = jobSystem.enableJob(input.jobId);
      } else {
        result = jobSystem.disableJob(input.jobId);
      }

      return {
        success: result,
        jobId: input.jobId,
        enabled: input.enabled,
      };
    }),

  // Run all reward jobs
  runAllRewardJobs: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Check permissions
      if (!ADMIN_ROLES.includes(ctx.session.user.userType as UserType)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Initialize job system if not already initialized
      const { rewardJobManager } = initializeBackgroundJobs(ctx.prisma);

      // Run all reward jobs
      const results = await rewardJobManager.runAllJobs();

      return results;
    }),

  // Run all system jobs
  runAllSystemJobs: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Check permissions
      if (!ADMIN_ROLES.includes(ctx.session.user.userType as UserType)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Initialize job system if not already initialized
      const { systemJobManager } = initializeBackgroundJobs(ctx.prisma);

      // Run all system jobs
      const results = await systemJobManager.runAllJobs();

      return results;
    }),

  // Get running jobs
  getRunningJobs: protectedProcedure
    .query(async ({ ctx }) => {
      // Check permissions
      if (!ADMIN_ROLES.includes(ctx.session.user.userType as UserType)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Initialize job system if not already initialized
      const { jobSystem } = initializeBackgroundJobs(ctx.prisma);

      // Get running jobs
      const runningJobIds = jobSystem.getRunningJobs();

      // Get details for each running job
      const runningJobs = runningJobIds.map(jobId => {
        const status = jobSystem.getJobStatus(jobId);
        return {
          id: jobId,
          name: status.job?.name || jobId,
          startTime: status.lastResult?.startTime,
          duration: status.lastResult ?
            Date.now() - status.lastResult.startTime.getTime() :
            undefined,
        };
      });

      return runningJobs;
    }),

  // Run class performance update job
  updateClassPerformance: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Check permissions
      if (!ADMIN_ROLES.includes(ctx.session.user.userType as UserType)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Run the job
        await updateClassPerformanceMetrics();

        return {
          success: true,
          message: "Class performance update job started successfully"
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start class performance update job",
          cause: error
        });
      }
    }),

  // Update class performance for a specific class
  updateClassPerformanceForClass: protectedProcedure
    .input(z.object({
      classId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!ADMIN_ROLES.includes(ctx.session.user.userType as UserType)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Run the job
        await updateClassPerformanceMetricsForClass(input.classId);

        return {
          success: true,
          message: `Class performance update for class ${input.classId} started successfully`
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to start class performance update for class ${input.classId}`,
          cause: error
        });
      }
    }),
});
