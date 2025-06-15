'use client';

/**
 * Track when a user enters offline mode
 * @param userId User ID
 * @param feature Feature being used
 */
export function trackOfflineModeEnter(userId: string, feature: string): void {
  try {
    // In a real implementation, this would send analytics to a server or log locally
    console.log(`[Analytics] User ${userId} entered offline mode for ${feature}`);

    // Example of what would be tracked in a real implementation:
    // analytics.track('offline_mode_enter', {
    //   userId,
    //   feature,
    //   timestamp: Date.now(),
    //   userAgent: navigator.userAgent,
    // });
  } catch (error) {
    console.error('Failed to track offline mode enter:', error);
  }
}

/**
 * Track when a user exits offline mode
 * @param userId User ID
 * @param feature Feature being used
 * @param duration Duration in offline mode (ms)
 */
export function trackOfflineModeExit(userId: string, feature: string, duration: number): void {
  try {
    // In a real implementation, this would send analytics to a server or log locally
    console.log(`[Analytics] User ${userId} exited offline mode for ${feature} after ${duration}ms`);

    // Example of what would be tracked in a real implementation:
    // analytics.track('offline_mode_exit', {
    //   userId,
    //   feature,
    //   duration,
    //   timestamp: Date.now(),
    //   userAgent: navigator.userAgent,
    // });
  } catch (error) {
    console.error('Failed to track offline mode exit:', error);
  }
}

/**
 * Track when offline sync starts
 * @param itemCount Number of items to sync
 */
export function trackOfflineSyncStart(itemCount: number): void {
  try {
    // In a real implementation, this would send analytics to a server or log locally
    console.log(`[Analytics] Offline sync started with ${itemCount} items`);

    // Example of what would be tracked in a real implementation:
    // analytics.track('offline_sync_start', {
    //   itemCount,
    //   timestamp: Date.now(),
    //   userAgent: navigator.userAgent,
    // });
  } catch (error) {
    console.error('Failed to track offline sync start:', error);
  }
}

/**
 * Track when offline sync completes
 * @param syncedCount Number of items synced successfully
 * @param failedCount Number of items that failed to sync
 * @param duration Duration of sync operation (ms)
 */
export function trackOfflineSyncComplete(syncedCount: number, failedCount: number, duration: number): void {
  try {
    // In a real implementation, this would send analytics to a server or log locally
    console.log(`[Analytics] Offline sync completed: ${syncedCount} synced, ${failedCount} failed, ${duration}ms`);

    // Example of what would be tracked in a real implementation:
    // analytics.track('offline_sync_complete', {
    //   syncedCount,
    //   failedCount,
    //   duration,
    //   timestamp: Date.now(),
    //   userAgent: navigator.userAgent,
    // });
  } catch (error) {
    console.error('Failed to track offline sync complete:', error);
  }
}

/**
 * Track when an error occurs during offline sync
 * @param errorMessage Error message
 * @param dataType Type of data being synced
 * @param itemId ID of the item that failed to sync
 */
export function trackOfflineSyncError(errorMessage: string, dataType: string, itemId?: string): void {
  try {
    // In a real implementation, this would send analytics to a server or log locally
    console.log(`[Analytics] Offline sync error: ${errorMessage} (${dataType}${itemId ? `, ${itemId}` : ''})`);

    // Example of what would be tracked in a real implementation:
    // analytics.track('offline_sync_error', {
    //   errorMessage,
    //   dataType,
    //   itemId,
    //   timestamp: Date.now(),
    //   userAgent: navigator.userAgent,
    // });
  } catch (error) {
    console.error('Failed to track offline sync error:', error);
  }
}

/**
 * Track when a storage error occurs
 * @param errorMessage Error message
 * @param operation Operation that was being performed (read/write/delete)
 */
export function trackOfflineStorageError(errorMessage: string, operation: 'read' | 'write' | 'delete'): void {
  try {
    // In a real implementation, this would send analytics to a server or log locally
    console.log(`[Analytics] Offline storage error: ${errorMessage} (${operation})`);

    // Example of what would be tracked in a real implementation:
    // analytics.track('offline_storage_error', {
    //   errorMessage,
    //   operation,
    //   timestamp: Date.now(),
    //   userAgent: navigator.userAgent,
    // });
  } catch (error) {
    console.error('Failed to track offline storage error:', error);
  }
}
