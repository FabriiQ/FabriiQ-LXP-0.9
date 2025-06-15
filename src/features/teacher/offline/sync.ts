'use client';

import { getUnsyncedAttendance, getUnsyncedAssessments, markAttendanceAsSynced, markAssessmentAsSynced } from './db';
import { syncAttendanceToServer, syncAssessmentToServer } from './api';
import { trackOfflineSyncStart, trackOfflineSyncComplete, trackOfflineSyncError } from './analytics';

// Sync status enum
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Sync result interface
export interface SyncResult {
  status: SyncStatus;
  syncedCount: number;
  failedCount: number;
  errors: Error[];
}

// Sync listener type
type SyncListener = (status: SyncStatus, progress?: number) => void;

// Sync listeners
const syncListeners: SyncListener[] = [];

// Sync in progress flag
let isSyncInProgress = false;

/**
 * Check if the device is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Add a sync listener
 * @param listener The listener function
 */
export function addSyncListener(listener: SyncListener): void {
  syncListeners.push(listener);
}

/**
 * Remove a sync listener
 * @param listener The listener function
 */
export function removeSyncListener(listener: SyncListener): void {
  const index = syncListeners.indexOf(listener);
  if (index !== -1) {
    syncListeners.splice(index, 1);
  }
}

/**
 * Notify sync listeners of status change
 * @param status The sync status
 * @param progress The sync progress (0-100)
 */
function notifySyncListeners(status: SyncStatus, progress?: number): void {
  syncListeners.forEach(listener => listener(status, progress));
}

/**
 * Sync teacher data with the server
 * @param forceSync Force sync even if already in progress
 */
export async function syncTeacherData(forceSync: boolean = false): Promise<SyncResult> {
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
    // Get unsynced data with error handling
    let unsyncedAttendance = [];
    let unsyncedAssessments = [];

    try {
      unsyncedAttendance = await getUnsyncedAttendance();
    } catch (error) {
      console.error('Error getting unsynced attendance:', error);
      // Continue with empty array instead of failing the entire sync
      trackOfflineSyncError(String(error), 'attendance-fetch');
    }

    try {
      unsyncedAssessments = await getUnsyncedAssessments();
    } catch (error) {
      console.error('Error getting unsynced assessments:', error);
      // Continue with empty array instead of failing the entire sync
      trackOfflineSyncError(String(error), 'assessment-fetch');
    }

    const totalItems = unsyncedAttendance.length + unsyncedAssessments.length;

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

    // Sync attendance
    for (const attendance of unsyncedAttendance) {
      try {
        // Update progress
        processedItems++;
        const progress = Math.round((processedItems / totalItems) * 100);
        notifySyncListeners(SyncStatus.SYNCING, progress);

        // Send to server
        await syncAttendanceToServer(attendance);

        // Mark as synced
        await markAttendanceAsSynced(attendance.id);
        syncedCount++;
      } catch (error) {
        failedCount++;
        const errorObj = error instanceof Error ? error : new Error(String(error));
        errors.push(errorObj);

        // Track sync error with analytics
        trackOfflineSyncError(errorObj.message, 'attendance', attendance.id);
      }
    }

    // Sync assessments
    for (const assessment of unsyncedAssessments) {
      try {
        // Update progress
        processedItems++;
        const progress = Math.round((processedItems / totalItems) * 100);
        notifySyncListeners(SyncStatus.SYNCING, progress);

        // Send to server
        await syncAssessmentToServer(assessment);

        // Mark as synced
        await markAssessmentAsSynced(assessment.id);
        syncedCount++;
      } catch (error) {
        failedCount++;
        const errorObj = error instanceof Error ? error : new Error(String(error));
        errors.push(errorObj);

        // Track sync error with analytics
        trackOfflineSyncError(errorObj.message, 'assessment', assessment.id);
      }
    }

    // Set sync status
    const status = failedCount > 0 ? SyncStatus.ERROR : SyncStatus.SUCCESS;
    notifySyncListeners(status, 100);

    // Track sync complete with analytics
    trackOfflineSyncComplete(syncedCount, failedCount, Date.now() - syncStartTime);

    // Reset sync in progress flag
    isSyncInProgress = false;

    return {
      status,
      syncedCount,
      failedCount,
      errors
    };
  } catch (error) {
    // Set error status
    notifySyncListeners(SyncStatus.ERROR);

    // Reset sync in progress flag
    isSyncInProgress = false;

    // Track sync error with analytics
    const errorObj = error instanceof Error ? error : new Error(String(error));
    trackOfflineSyncError(errorObj.message, 'general');

    return {
      status: SyncStatus.ERROR,
      syncedCount: 0,
      failedCount: 0,
      errors: [errorObj]
    };
  }
}
