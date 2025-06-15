'use client';

import { logger } from '@/server/api/utils/logger';
import { OfflineActivity, getPendingOfflineActivities, markActivitySynced, markActivitySyncFailed } from '@/utils/offline-storage';

/**
 * Service for synchronizing offline activities with the server
 */
export class ActivitySyncService {
  private static instance: ActivitySyncService;
  private isSyncing: boolean = false;
  private syncQueue: OfflineActivity[] = [];
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Private constructor to enforce singleton
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ActivitySyncService {
    if (!ActivitySyncService.instance) {
      ActivitySyncService.instance = new ActivitySyncService();
    }
    return ActivitySyncService.instance;
  }

  /**
   * Start the sync service
   * @param intervalMs How often to check for pending activities (in milliseconds)
   */
  public start(intervalMs: number = 60000): void {
    if (this.syncInterval) {
      this.stop();
    }

    this.syncInterval = setInterval(() => {
      this.syncPendingActivities();
    }, intervalMs);

    // Initial sync
    this.syncPendingActivities();
  }

  /**
   * Stop the sync service
   */
  public stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Manually trigger synchronization
   */
  public async syncNow(): Promise<{ success: number; failed: number }> {
    return await this.syncPendingActivities();
  }

  /**
   * Synchronize all pending activities
   */
  private async syncPendingActivities(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      return { success: 0, failed: 0 };
    }

    try {
      this.isSyncing = true;
      this.syncQueue = getPendingOfflineActivities();

      if (this.syncQueue.length === 0) {
        return { success: 0, failed: 0 };
      }

      logger.debug(`Starting sync of ${this.syncQueue.length} offline activities`);

      let success = 0;
      let failed = 0;

      for (const activity of this.syncQueue) {
        try {
          const result = await this.syncActivity(activity);
          if (result) {
            markActivitySynced(activity.id);
            success++;
          } else {
            markActivitySyncFailed(activity.id);
            failed++;
          }
        } catch (error) {
          logger.error('Error syncing activity', { error, activityId: activity.id });
          markActivitySyncFailed(activity.id);
          failed++;
        }
      }

      logger.debug(`Sync completed: ${success} succeeded, ${failed} failed`);
      return { success, failed };
    } finally {
      this.isSyncing = false;
      this.syncQueue = [];
    }
  }

  /**
   * Synchronize a single activity with the server
   * @param activity The activity to synchronize
   * @returns Promise that resolves to true if sync was successful
   */
  private async syncActivity(activity: OfflineActivity): Promise<boolean> {
    try {
      // Make API call to submit the activity
      const response = await fetch('/api/activities/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: activity.activityId,
          studentId: activity.studentId,
          content: activity.content,
          score: activity.score,
          submittedAt: activity.submittedAt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('Activity sync API error', { 
          status: response.status, 
          error: errorData,
          activityId: activity.id 
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Activity sync network error', { error, activityId: activity.id });
      return false;
    }
  }
}
