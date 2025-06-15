'use client';

import { getUnsyncedResults, markResultAsSynced } from './indexedDB';
import { toast } from '@/components/ui/feedback/toast';
import {
  trackOfflineSyncStart,
  trackOfflineSyncComplete,
  trackOfflineSyncError,
  trackOfflineModeEnter,
  trackOfflineModeExit
} from '../analytics/offline-analytics';

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

// Sync state
let isSyncInProgress = false;

/**
 * Check if online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Add sync listener
 * @param listener Function to call when sync status changes
 */
export function addSyncListener(listener: SyncListener): void {
  syncListeners.push(listener);
}

/**
 * Remove sync listener
 * @param listener Function to remove from listeners
 */
export function removeSyncListener(listener: SyncListener): void {
  const index = syncListeners.indexOf(listener);
  if (index !== -1) {
    syncListeners.splice(index, 1);
  }
}

/**
 * Notify sync listeners
 * @param status Current sync status
 * @param progress Optional progress percentage (0-100)
 */
function notifySyncListeners(status: SyncStatus, progress?: number): void {
  syncListeners.forEach(listener => listener(status, progress));
}

/**
 * Sync a single result to the server
 * @param result Result to sync
 */
async function syncResultToServer(result: any): Promise<boolean> {
  try {
    // Use the API to submit the result
    const response = await fetch('/api/activities/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activityId: result.activityId,
        userId: result.userId,
        attemptId: result.attemptId,
        content: result.result,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync result: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error syncing result to server:', error);
    return false;
  }
}

/**
 * Sync activity results with the server
 * @param forceSync Force sync even if already in progress
 */
export async function syncActivityResults(forceSync: boolean = false): Promise<SyncResult> {
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
    // Get unsynced results
    const unsyncedResults = await getUnsyncedResults();

    // Track sync start with analytics
    trackOfflineSyncStart(unsyncedResults.length);

    // If no unsynced results, return success
    if (unsyncedResults.length === 0) {
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

    // Sync results
    let syncedCount = 0;
    let failedCount = 0;
    const errors: Error[] = [];

    // Process each result
    for (let i = 0; i < unsyncedResults.length; i++) {
      const result = unsyncedResults[i];

      // Update progress
      const progress = Math.round((i / unsyncedResults.length) * 100);
      notifySyncListeners(SyncStatus.SYNCING, progress);

      try {
        // Send result to server
        const success = await syncResultToServer(result);

        if (success) {
          // Mark as synced
          await markResultAsSynced(result.id);
          syncedCount++;
        } else {
          failedCount++;
          const error = new Error(`Failed to sync result ${result.id}`);
          errors.push(error);

          // Track sync error with analytics
          trackOfflineSyncError(error.message, result.activityId);
        }
      } catch (error) {
        failedCount++;
        const errorObj = error instanceof Error ? error : new Error(String(error));
        errors.push(errorObj);

        // Track sync error with analytics
        trackOfflineSyncError(errorObj.message, result.activityId);
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
        title: "Sync complete",
        description: `Successfully synced ${syncedCount} activities${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
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
      title: "Sync failed",
      description: errorObj.message || "Failed to sync activities",
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
 * Register for background sync
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('activity-results-sync');
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }

  return false;
}

/**
 * Register service worker
 */
async function registerServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/service-worker.js');
      return true;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return false;
    }
  }

  return false;
}

/**
 * Initialize offline support
 */
export async function initOfflineSupport(): Promise<boolean> {
  // Register service worker
  const serviceWorkerRegistered = await registerServiceWorker();

  // Register for background sync
  const backgroundSyncRegistered = await registerBackgroundSync();

  // Add online/offline event listeners
  window.addEventListener('online', () => {
    notifySyncListeners(SyncStatus.IDLE);

    // Track offline mode exit with analytics
    trackOfflineModeExit('global', 'all', 0); // Duration will be tracked in components

    // Start sync
    syncActivityResults();
  });

  window.addEventListener('offline', () => {
    notifySyncListeners(SyncStatus.IDLE);

    // Track offline mode enter with analytics
    trackOfflineModeEnter('global', 'all');
  });

  return serviceWorkerRegistered && backgroundSyncRegistered;
}

/**
 * Register connectivity listeners
 * @param onlineCallback Function to call when online
 * @param offlineCallback Function to call when offline
 * @returns Cleanup function
 */
export function registerConnectivityListeners(
  onlineCallback: () => void,
  offlineCallback: () => void
): () => void {
  // Add event listeners
  window.addEventListener('online', onlineCallback);
  window.addEventListener('offline', offlineCallback);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onlineCallback);
    window.removeEventListener('offline', offlineCallback);
  };
}
