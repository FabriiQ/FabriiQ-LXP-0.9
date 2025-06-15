'use client';

import { toast } from '@/components/ui/feedback/toast';
import { trackOfflineSyncStart, trackOfflineSyncComplete, trackOfflineSyncError } from '../analytics/offline-analytics';

// Mock implementations for database functions since the actual module is not available
// These will be replaced with actual implementations when the database module is available

// Mock function for getting unsynced achievements
async function getUnsyncedAchievements(): Promise<any[]> {
  console.warn('Using mock getUnsyncedAchievements');
  return [];
}

// Mock function for getting unsynced points
async function getUnsyncedPoints(): Promise<any[]> {
  console.warn('Using mock getUnsyncedPoints');
  return [];
}

// Mock function for getting unsynced levels
async function getUnsyncedLevels(): Promise<any[]> {
  console.warn('Using mock getUnsyncedLevels');
  return [];
}

// Mock function for marking achievement as synced
async function markAchievementAsSynced(achievementId: string): Promise<void> {
  console.warn('Using mock markAchievementAsSynced', achievementId);
}

// Mock function for marking points as synced
async function markPointsAsSynced(pointsId: string): Promise<void> {
  console.warn('Using mock markPointsAsSynced', pointsId);
}

// Mock function for marking level as synced
async function markLevelAsSynced(levelId: string): Promise<void> {
  console.warn('Using mock markLevelAsSynced', levelId);
}

// Sync status
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Sync result
interface SyncResult {
  status: SyncStatus;
  syncedCount: number;
  failedCount: number;
  errors: Error[];
}

// Sync listeners
type SyncListener = (status: SyncStatus, progress?: number) => void;
const syncListeners: SyncListener[] = [];
let isSyncInProgress = false;

/**
 * Check if the device is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Add a sync status listener
 * @param listener Function to call when sync status changes
 */
export function addSyncListener(listener: SyncListener): void {
  syncListeners.push(listener);
}

/**
 * Remove a sync status listener
 * @param listener Function to remove
 */
export function removeSyncListener(listener: SyncListener): void {
  const index = syncListeners.indexOf(listener);
  if (index !== -1) {
    syncListeners.splice(index, 1);
  }
}

/**
 * Notify all sync listeners of a status change
 * @param status New sync status
 * @param progress Optional sync progress (0-100)
 */
function notifySyncListeners(status: SyncStatus, progress?: number): void {
  syncListeners.forEach(listener => listener(status, progress));
}

/**
 * Sync rewards data with the server
 * @param forceSync Force sync even if already in progress
 */
export async function syncRewardsData(forceSync: boolean = false): Promise<SyncResult> {
  // If already syncing and not forced, return
  if (isSyncInProgress && !forceSync) {
    return {
      status: SyncStatus.SYNCING,
      syncedCount: 0,
      failedCount: 0,
      errors: []
    };
  }

  // If offline, return error
  if (!isOnline()) {
    return {
      status: SyncStatus.ERROR,
      syncedCount: 0,
      failedCount: 0,
      errors: [new Error('Cannot sync while offline')]
    };
  }

  // Set syncing status
  isSyncInProgress = true;
  notifySyncListeners(SyncStatus.SYNCING, 0);

  // Start sync time tracking
  const syncStartTime = Date.now();

  try {
    // Get unsynced data
    const unsyncedAchievements = await getUnsyncedAchievements();
    const unsyncedPoints = await getUnsyncedPoints();
    const unsyncedLevels = await getUnsyncedLevels();

    const totalItems = unsyncedAchievements.length + unsyncedPoints.length + unsyncedLevels.length;

    // Track sync start with analytics
    trackOfflineSyncStart(totalItems);

    // If no unsynced data, return success
    if (totalItems === 0) {
      isSyncInProgress = false;
      notifySyncListeners(SyncStatus.SUCCESS, 100);

      // Track sync complete with analytics (0 items)
      trackOfflineSyncComplete(0, 0, Date.now() - syncStartTime);

      return {
        status: SyncStatus.SUCCESS,
        syncedCount: 0,
        failedCount: 0,
        errors: []
      };
    }

    // Sync data
    let syncedCount = 0;
    let failedCount = 0;
    const errors: Error[] = [];
    let processedItems = 0;

    // Sync achievements
    for (const achievement of unsyncedAchievements) {
      try {
        // Update progress
        processedItems++;
        const progress = Math.round((processedItems / totalItems) * 100);
        notifySyncListeners(SyncStatus.SYNCING, progress);

        // Send to server
        await syncAchievementToServer(achievement);

        // Mark as synced
        await markAchievementAsSynced(achievement.id);
        syncedCount++;
      } catch (error) {
        failedCount++;
        const errorObj = error instanceof Error ? error : new Error(String(error));
        errors.push(errorObj);

        // Track sync error with analytics
        trackOfflineSyncError(errorObj.message, 'achievement', achievement.id);
      }
    }

    // Sync points
    for (const points of unsyncedPoints) {
      try {
        // Update progress
        processedItems++;
        const progress = Math.round((processedItems / totalItems) * 100);
        notifySyncListeners(SyncStatus.SYNCING, progress);

        // Send to server
        await syncPointsToServer(points);

        // Mark as synced
        await markPointsAsSynced(points.id);
        syncedCount++;
      } catch (error) {
        failedCount++;
        const errorObj = error instanceof Error ? error : new Error(String(error));
        errors.push(errorObj);

        // Track sync error with analytics
        trackOfflineSyncError(errorObj.message, 'points', points.id);
      }
    }

    // Sync levels
    for (const level of unsyncedLevels) {
      try {
        // Update progress
        processedItems++;
        const progress = Math.round((processedItems / totalItems) * 100);
        notifySyncListeners(SyncStatus.SYNCING, progress);

        // Send to server
        await syncLevelToServer(level);

        // Mark as synced
        await markLevelAsSynced(level.id);
        syncedCount++;
      } catch (error) {
        failedCount++;
        const errorObj = error instanceof Error ? error : new Error(String(error));
        errors.push(errorObj);

        // Track sync error with analytics
        trackOfflineSyncError(errorObj.message, 'level', level.id);
      }
    }

    // Set success status
    isSyncInProgress = false;
    notifySyncListeners(SyncStatus.SUCCESS, 100);

    // Track sync complete with analytics
    trackOfflineSyncComplete(syncedCount, failedCount, Date.now() - syncStartTime);

    // Show toast notification
    if (syncedCount > 0) {
      toast({
        title: "Rewards sync complete",
        description: `Successfully synced ${syncedCount} items${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        variant: failedCount > 0 ? "warning" : "success",
      });
    }

    return {
      status: SyncStatus.SUCCESS,
      syncedCount,
      failedCount,
      errors
    };
  } catch (error) {
    // Set error status
    isSyncInProgress = false;
    notifySyncListeners(SyncStatus.ERROR);

    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Track sync error with analytics
    trackOfflineSyncError(errorObj.message);

    // Show error toast
    toast({
      title: "Rewards sync failed",
      description: errorObj.message || "Failed to sync rewards data",
      variant: "error",
    });

    return {
      status: SyncStatus.ERROR,
      syncedCount: 0,
      failedCount: 0,
      errors: [errorObj]
    };
  }
}

/**
 * Sync achievement to server
 * @param achievement Achievement to sync
 */
async function syncAchievementToServer(achievement: any): Promise<boolean> {
  try {
    // Call the API to sync achievement
    const response = await fetch('/api/trpc/rewards.syncAchievement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          id: achievement.id,
          studentId: achievement.studentId,
          title: achievement.title,
          description: achievement.description,
          type: achievement.type,
          classId: achievement.classId,
          subjectId: achievement.subjectId,
          progress: achievement.progress,
          total: achievement.total,
          unlocked: achievement.unlocked,
          unlockedAt: achievement.unlockedAt ? new Date(achievement.unlockedAt) : null,
          icon: achievement.icon
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync achievement: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error syncing achievement:', error);
    throw error;
  }
}

/**
 * Sync points to server
 * @param points Points to sync
 */
async function syncPointsToServer(points: any): Promise<boolean> {
  try {
    // Call the API to sync points
    const response = await fetch('/api/trpc/rewards.syncPoints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          id: points.id,
          studentId: points.studentId,
          amount: points.amount,
          source: points.source,
          sourceId: points.sourceId,
          classId: points.classId,
          subjectId: points.subjectId,
          description: points.description
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync points: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error syncing points:', error);
    throw error;
  }
}

/**
 * Sync level to server
 * @param level Level to sync
 */
async function syncLevelToServer(level: any): Promise<boolean> {
  try {
    // Call the API to sync level
    const response = await fetch('/api/trpc/rewards.syncLevel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          id: level.id,
          studentId: level.studentId,
          level: level.level,
          currentExp: level.currentExp,
          requiredExp: level.requiredExp,
          classId: level.classId
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync level: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error syncing level:', error);
    throw error;
  }
}

/**
 * Register connectivity listeners
 */
export function registerConnectivityListeners(): void {
  if (typeof window !== 'undefined') {
    // Add online/offline event listeners
    window.addEventListener('online', () => {
      notifySyncListeners(SyncStatus.IDLE);

      // Start sync
      syncRewardsData();
    });

    window.addEventListener('offline', () => {
      notifySyncListeners(SyncStatus.IDLE);
    });
  }
}

/**
 * Initialize offline support
 */
export async function initOfflineSupport(): Promise<boolean> {
  // Register connectivity listeners
  registerConnectivityListeners();

  return true;
}
