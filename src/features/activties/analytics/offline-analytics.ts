'use client';

import analyticsManager from './activity-analytics';

/**
 * Offline Analytics
 * 
 * This module provides functions for tracking offline-related events in activities.
 */

// Define offline event types
export type OfflineEventType =
  | 'offline_mode_enter'
  | 'offline_mode_exit'
  | 'offline_activity_saved'
  | 'offline_activity_loaded'
  | 'offline_sync_start'
  | 'offline_sync_complete'
  | 'offline_sync_error'
  | 'offline_storage_quota_exceeded'
  | 'offline_storage_error';

/**
 * Track when a user enters offline mode
 * @param activityId The ID of the activity
 * @param activityType The type of activity
 */
export function trackOfflineModeEnter(activityId: string, activityType: string): void {
  analyticsManager.trackEvent('offline_mode_enter' as any, {
    activityId,
    activityType,
    timestamp: Date.now()
  });
}

/**
 * Track when a user exits offline mode
 * @param activityId The ID of the activity
 * @param activityType The type of activity
 * @param offlineDuration Duration in milliseconds spent offline
 */
export function trackOfflineModeExit(
  activityId: string, 
  activityType: string, 
  offlineDuration: number
): void {
  analyticsManager.trackEvent('offline_mode_exit' as any, {
    activityId,
    activityType,
    offlineDuration,
    timestamp: Date.now()
  });
}

/**
 * Track when an activity is saved offline
 * @param activityId The ID of the activity
 * @param activityType The type of activity
 * @param dataSize Size of the saved data in bytes (approximate)
 */
export function trackOfflineActivitySaved(
  activityId: string, 
  activityType: string, 
  dataSize?: number
): void {
  analyticsManager.trackEvent('offline_activity_saved' as any, {
    activityId,
    activityType,
    dataSize,
    timestamp: Date.now()
  });
}

/**
 * Track when an activity is loaded from offline storage
 * @param activityId The ID of the activity
 * @param activityType The type of activity
 * @param loadTime Time taken to load the activity in milliseconds
 */
export function trackOfflineActivityLoaded(
  activityId: string, 
  activityType: string, 
  loadTime?: number
): void {
  analyticsManager.trackEvent('offline_activity_loaded' as any, {
    activityId,
    activityType,
    loadTime,
    timestamp: Date.now()
  });
}

/**
 * Track when sync starts
 * @param activityCount Number of activities being synced
 */
export function trackOfflineSyncStart(activityCount: number): void {
  analyticsManager.trackEvent('offline_sync_start' as any, {
    activityCount,
    timestamp: Date.now()
  });
}

/**
 * Track when sync completes
 * @param successCount Number of activities successfully synced
 * @param failedCount Number of activities that failed to sync
 * @param syncDuration Duration of the sync process in milliseconds
 */
export function trackOfflineSyncComplete(
  successCount: number, 
  failedCount: number, 
  syncDuration: number
): void {
  analyticsManager.trackEvent('offline_sync_complete' as any, {
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
 * @param activityId Optional ID of the activity that caused the error
 */
export function trackOfflineSyncError(
  errorMessage: string, 
  activityId?: string
): void {
  analyticsManager.trackEvent('offline_sync_error' as any, {
    errorMessage,
    activityId,
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
  analyticsManager.trackEvent('offline_storage_quota_exceeded' as any, {
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
  analyticsManager.trackEvent('offline_storage_error' as any, {
    errorMessage,
    operation,
    timestamp: Date.now()
  });
}
