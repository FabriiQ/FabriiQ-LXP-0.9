'use client';

/**
 * Offline Analytics for Rewards
 * 
 * This module provides functions for tracking offline-related events in the rewards system.
 */

// Define offline event types
export type OfflineEventType =
  | 'offline_mode_enter'
  | 'offline_mode_exit'
  | 'offline_achievement_saved'
  | 'offline_points_saved'
  | 'offline_level_saved'
  | 'offline_rewards_loaded'
  | 'offline_sync_start'
  | 'offline_sync_complete'
  | 'offline_sync_error'
  | 'offline_storage_quota_exceeded'
  | 'offline_storage_error';

// Analytics manager (simplified for now)
const analyticsManager = {
  trackEvent: (eventType: string, eventData: any) => {
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(eventType, eventData);
    } else {
      console.log(`[Analytics] ${eventType}:`, eventData);
    }
  }
};

/**
 * Track when a user enters offline mode
 * @param studentId The ID of the student
 * @param context The context (e.g., 'rewards', 'achievements')
 */
export function trackOfflineModeEnter(studentId: string, context: string): void {
  analyticsManager.trackEvent('offline_mode_enter', {
    studentId,
    context,
    timestamp: Date.now()
  });
}

/**
 * Track when a user exits offline mode
 * @param studentId The ID of the student
 * @param context The context (e.g., 'rewards', 'achievements')
 * @param offlineDuration Duration in milliseconds spent offline
 */
export function trackOfflineModeExit(
  studentId: string, 
  context: string, 
  offlineDuration: number
): void {
  analyticsManager.trackEvent('offline_mode_exit', {
    studentId,
    context,
    offlineDuration,
    timestamp: Date.now()
  });
}

/**
 * Track when an achievement is saved offline
 * @param achievementId The ID of the achievement
 * @param studentId The ID of the student
 * @param type The type of achievement
 */
export function trackOfflineAchievementSaved(
  achievementId: string, 
  studentId: string, 
  type: string
): void {
  analyticsManager.trackEvent('offline_achievement_saved', {
    achievementId,
    studentId,
    type,
    timestamp: Date.now()
  });
}

/**
 * Track when points are saved offline
 * @param pointsId The ID of the points record
 * @param studentId The ID of the student
 * @param amount The amount of points
 * @param source The source of the points
 */
export function trackOfflinePointsSaved(
  pointsId: string, 
  studentId: string, 
  amount: number,
  source: string
): void {
  analyticsManager.trackEvent('offline_points_saved', {
    pointsId,
    studentId,
    amount,
    source,
    timestamp: Date.now()
  });
}

/**
 * Track when a level is saved offline
 * @param levelId The ID of the level record
 * @param studentId The ID of the student
 * @param level The level number
 */
export function trackOfflineLevelSaved(
  levelId: string, 
  studentId: string, 
  level: number
): void {
  analyticsManager.trackEvent('offline_level_saved', {
    levelId,
    studentId,
    level,
    timestamp: Date.now()
  });
}

/**
 * Track when rewards data is loaded from offline storage
 * @param studentId The ID of the student
 * @param dataType The type of data loaded (achievements, points, level)
 * @param count The number of items loaded
 */
export function trackOfflineRewardsLoaded(
  studentId: string, 
  dataType: 'achievements' | 'points' | 'level',
  count: number
): void {
  analyticsManager.trackEvent('offline_rewards_loaded', {
    studentId,
    dataType,
    count,
    timestamp: Date.now()
  });
}

/**
 * Track when sync starts
 * @param itemCount Number of items being synced
 */
export function trackOfflineSyncStart(itemCount: number): void {
  analyticsManager.trackEvent('offline_sync_start', {
    itemCount,
    timestamp: Date.now()
  });
}

/**
 * Track when sync completes
 * @param successCount Number of items successfully synced
 * @param failedCount Number of items that failed to sync
 * @param syncDuration Duration of the sync process in milliseconds
 */
export function trackOfflineSyncComplete(
  successCount: number, 
  failedCount: number, 
  syncDuration: number
): void {
  analyticsManager.trackEvent('offline_sync_complete', {
    successCount,
    failedCount,
    totalCount: successCount + failedCount,
    syncDuration,
    timestamp: Date.now()
  });
}

/**
 * Track when sync encounters an error
 * @param errorMessage Error message
 * @param dataType Optional type of data that caused the error
 * @param itemId Optional ID of the item that caused the error
 */
export function trackOfflineSyncError(
  errorMessage: string, 
  dataType?: string,
  itemId?: string
): void {
  analyticsManager.trackEvent('offline_sync_error', {
    errorMessage,
    dataType,
    itemId,
    timestamp: Date.now()
  });
}

/**
 * Track when storage quota is exceeded
 * @param quotaSize Size of the quota in bytes
 * @param usedSize Size used in bytes
 */
export function trackOfflineStorageQuotaExceeded(
  quotaSize: number, 
  usedSize: number
): void {
  analyticsManager.trackEvent('offline_storage_quota_exceeded', {
    quotaSize,
    usedSize,
    percentUsed: (usedSize / quotaSize) * 100,
    timestamp: Date.now()
  });
}

/**
 * Track when a storage error occurs
 * @param errorMessage Error message
 * @param operation Operation that was being performed
 */
export function trackOfflineStorageError(
  errorMessage: string, 
  operation: 'read' | 'write' | 'delete'
): void {
  analyticsManager.trackEvent('offline_storage_error', {
    errorMessage,
    operation,
    timestamp: Date.now()
  });
}
