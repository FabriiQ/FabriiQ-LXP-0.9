/**
 * Activity Batch Service
 *
 * This service provides batch processing capabilities for activity submissions,
 * allowing the system to handle high volumes of submissions efficiently.
 *
 * It uses a queue-based approach to process submissions in batches, reducing
 * database load and improving overall system performance.
 */

import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { logger } from '@/server/api/utils/logger';
import { processActivitySubmission } from './activity-submission.service';
import { ActivityCacheService } from './activity-cache.service';
import { ActivityRewardIntegration } from '@/features/rewards/activity-integration';

// Submission queue item interface
interface SubmissionQueueItem {
  id: string; // Unique ID for this queue item
  activityId: string;
  studentId: string;
  answers: any;
  clientResult?: any;
  options?: {
    storeDetailedResults?: boolean;
    updateGradebook?: boolean;
  };
  timestamp: number; // When this item was added to the queue
  priority: number; // Higher priority items are processed first
  retryCount: number; // Number of times this item has been retried
  timeSpentMinutes?: number; // Time spent on the activity in minutes
}

// Batch processing configuration
interface BatchConfig {
  batchSize: number; // Number of submissions to process in a batch
  processingInterval: number; // Interval between batch processing in milliseconds
  maxRetries: number; // Maximum number of retries for failed submissions
  maxQueueSize: number; // Maximum size of the queue
  priorityThreshold: number; // Threshold for high-priority processing
}

/**
 * Activity Batch Service
 *
 * This service manages batch processing of activity submissions.
 */
export class ActivityBatchService {
  private static instance: ActivityBatchService;
  private queue: SubmissionQueueItem[] = [];
  private processing: boolean = false;
  private config: BatchConfig;
  private prisma: PrismaClient;
  private processingTimer: NodeJS.Timeout | null = null;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor(prisma: PrismaClient, config?: Partial<BatchConfig>) {
    this.prisma = prisma;
    this.config = {
      batchSize: 200, // Process 200 submissions at a time for high concurrency
      processingInterval: 1000, // Process every 1 second for faster throughput
      maxRetries: 3, // Retry failed submissions up to 3 times
      maxQueueSize: 50000, // Maximum 50,000 items in the queue for high concurrency
      priorityThreshold: 20, // Process high-priority items when queue reaches 20 for faster response
      ...config
    };

    // Start the processing timer
    this.startProcessing();
  }

  /**
   * Get the singleton instance of the service
   *
   * @param prisma Prisma client instance
   * @param config Optional configuration
   * @returns The singleton instance
   */
  public static getInstance(prisma: PrismaClient, config?: Partial<BatchConfig>): ActivityBatchService {
    if (!ActivityBatchService.instance) {
      ActivityBatchService.instance = new ActivityBatchService(prisma, config);
    }
    return ActivityBatchService.instance;
  }

  /**
   * Add a submission to the processing queue
   *
   * @param activityId Activity ID
   * @param studentId Student ID
   * @param answers Student's answers
   * @param clientResult Optional client-side grading result
   * @param options Additional options for submission processing
   * @param priority Priority of this submission (higher values are processed first)
   * @returns A promise that resolves when the submission is queued
   */
  public async queueSubmission(
    activityId: string,
    studentId: string,
    answers: any,
    clientResult?: any,
    options?: {
      storeDetailedResults?: boolean;
      updateGradebook?: boolean;
    },
    priority: number = 1,
    timeSpentMinutes?: number
  ): Promise<string> {
    // Check if the queue is full
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('Submission queue is full. Please try again later.');
    }

    // Create a unique ID for this queue item
    const id = `${activityId}-${studentId}-${Date.now()}`;

    // Add the submission to the queue
    this.queue.push({
      id,
      activityId,
      studentId,
      answers,
      clientResult,
      options,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      timeSpentMinutes
    });

    logger.debug('Queued activity submission', { id, activityId, studentId });

    // Process high-priority items immediately if:
    // 1. This submission has high priority (> 1)
    // 2. The queue has reached the priority threshold
    if (priority > 1 || this.queue.length >= this.config.priorityThreshold) {
      // Process immediately for better user experience
      this.processHighPriorityItems();
    }

    return id;
  }

  /**
   * Start the batch processing timer
   *
   * @private
   */
  private startProcessing(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }

    this.processingTimer = setInterval(() => {
      this.processBatch();
    }, this.config.processingInterval);

    logger.debug('Started activity batch processing', {
      interval: this.config.processingInterval,
      batchSize: this.config.batchSize
    });
  }

  /**
   * Stop the batch processing timer
   */
  public stopProcessing(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }

    logger.debug('Stopped activity batch processing');
  }

  /**
   * Process a batch of submissions
   *
   * @private
   */
  private async processBatch(): Promise<void> {
    // If already processing or queue is empty, do nothing
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      // Sort the queue by priority (higher first) and timestamp (older first)
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.timestamp - b.timestamp; // Older items first
      });

      // Take a batch of items from the queue
      const batch = this.queue.slice(0, this.config.batchSize);

      // Process each item in the batch with concurrency control
      // Split the batch into smaller chunks to avoid overwhelming the system
      const chunkSize = 50; // Process 50 items at a time
      const chunks: SubmissionQueueItem[][] = [];

      for (let i = 0; i < batch.length; i += chunkSize) {
        chunks.push(batch.slice(i, i + chunkSize));
      }

      // Process each chunk sequentially, but items within a chunk in parallel
      const results: PromiseSettledResult<void>[] = [];
      for (const chunk of chunks) {
        const chunkResults = await Promise.allSettled(
          chunk.map((item: SubmissionQueueItem) => this.processSubmission(item))
        );
        results.push(...chunkResults);
      }

      // Remove successfully processed items from the queue
      const successfulIds = new Set<string>();
      const failedItems: SubmissionQueueItem[] = [];

      results.forEach((result, index) => {
        const item = batch[index];

        if (result.status === 'fulfilled') {
          successfulIds.add(item.id);
        } else {
          // Increment retry count and add back to failed items if under max retries
          item.retryCount++;
          if (item.retryCount < this.config.maxRetries) {
            failedItems.push(item);
          } else {
            logger.error('Failed to process submission after max retries', {
              id: item.id,
              activityId: item.activityId,
              studentId: item.studentId,
              error: result.reason
            });
          }
        }
      });

      // Update the queue to remove processed items and add back failed items
      this.queue = [
        ...this.queue.filter(item => !batch.some(b => b.id === item.id)),
        ...failedItems
      ];

      logger.debug('Processed activity submission batch', {
        batchSize: batch.length,
        successful: batch.length - failedItems.length,
        failed: failedItems.length,
        remainingInQueue: this.queue.length
      });
    } catch (error) {
      logger.error('Error processing activity submission batch', { error });
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process high-priority items immediately
   *
   * @private
   */
  private async processHighPriorityItems(): Promise<void> {
    // If already processing, do nothing
    if (this.processing) {
      // Even if we're already processing, we should trigger another batch soon
      // to ensure high-priority items are processed quickly
      if (this.processingTimer) {
        clearInterval(this.processingTimer);
        this.processingTimer = setInterval(() => {
          this.processBatch();
        }, 500); // Use a shorter interval for high-priority processing
      }
      return;
    }

    this.processing = true;

    try {
      // Sort the queue by priority (higher first)
      this.queue.sort((a, b) => b.priority - a.priority);

      // Take high-priority items (priority > 1)
      // Process more high-priority items at once (up to 20)
      const highPriorityItems = this.queue
        .filter(item => item.priority > 1)
        .slice(0, 20);

      if (highPriorityItems.length === 0) {
        return;
      }

      // Process high-priority items with concurrency control
      // Split into smaller chunks for better performance
      const chunkSize = 20; // Process 20 high-priority items at a time
      const chunks: SubmissionQueueItem[][] = [];

      for (let i = 0; i < highPriorityItems.length; i += chunkSize) {
        chunks.push(highPriorityItems.slice(i, i + chunkSize));
      }

      // Process each chunk sequentially, but items within a chunk in parallel
      const results: PromiseSettledResult<void>[] = [];
      for (const chunk of chunks) {
        const chunkResults = await Promise.allSettled(
          chunk.map((item: SubmissionQueueItem) => this.processSubmission(item))
        );
        results.push(...chunkResults);
      }

      // Remove successfully processed items from the queue
      const successfulIds = new Set<string>();
      const failedItems: SubmissionQueueItem[] = [];

      results.forEach((result, index) => {
        const item = highPriorityItems[index];

        if (result.status === 'fulfilled') {
          successfulIds.add(item.id);
        } else {
          // Increment retry count and add back to failed items if under max retries
          item.retryCount++;
          if (item.retryCount < this.config.maxRetries) {
            failedItems.push(item);
          } else {
            logger.error('Failed to process high-priority submission after max retries', {
              id: item.id,
              activityId: item.activityId,
              studentId: item.studentId,
              error: result.reason
            });
          }
        }
      });

      // Update the queue to remove processed items and add back failed items
      this.queue = [
        ...this.queue.filter(item => !highPriorityItems.some(hp => hp.id === item.id)),
        ...failedItems
      ];

      logger.debug('Processed high-priority activity submissions', {
        count: highPriorityItems.length,
        successful: highPriorityItems.length - failedItems.length,
        failed: failedItems.length,
        remainingInQueue: this.queue.length
      });
    } catch (error) {
      logger.error('Error processing high-priority activity submissions', { error });
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a single submission with optimized error handling
   *
   * @param item Submission queue item
   * @private
   */
  private async processSubmission(item: SubmissionQueueItem): Promise<void> {
    const startTime = performance.now();

    try {
      // Process the submission
      const result = await processActivitySubmission(
        this.prisma,
        item.activityId,
        item.studentId,
        item.answers,
        item.clientResult,
        item.options,
        item.timeSpentMinutes
      );

      // Batch cache invalidations for better performance
      // Only invalidate caches if the processing was successful
      if (result && result.success) {
        // Use Promise.all to run cache invalidations in parallel
        await Promise.all([
          ActivityCacheService.invalidateStudentStats(item.studentId),
          ActivityCacheService.invalidateActivityStats(item.activityId),
          result.gradeId ? ActivityCacheService.invalidateSubmissionDetails(result.gradeId) : Promise.resolve()
        ]);
      }

      const processingTime = performance.now() - startTime;

      // Only log detailed information for slow operations (> 500ms)
      if (processingTime > 500) {
        logger.debug('Processed activity submission from queue (slow operation)', {
          id: item.id,
          activityId: item.activityId,
          studentId: item.studentId,
          score: result.score,
          processingTime: `${processingTime.toFixed(2)}ms`
        });
      }
    } catch (error) {
      logger.error('Error processing activity submission from queue', {
        id: item.id,
        activityId: item.activityId,
        studentId: item.studentId,
        error,
        processingTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      throw error;
    }
  }

  /**
   * Get the current queue status
   *
   * @returns Queue status information
   */
  public getQueueStatus(): {
    queueLength: number;
    processing: boolean;
    highPriorityCount: number;
  } {
    const highPriorityCount = this.queue.filter(item => item.priority > 1).length;

    return {
      queueLength: this.queue.length,
      processing: this.processing,
      highPriorityCount
    };
  }

  /**
   * Clear the submission queue
   *
   * @returns The number of items cleared from the queue
   */
  public clearQueue(): number {
    const count = this.queue.length;
    this.queue = [];
    return count;
  }
}
