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

// Lock name for cross-tab synchronization
const SYNC_LOCK_NAME = 'teacher_data_sync_lock';

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
  if (!isOnline()) {
    return { status: SyncStatus.ERROR, syncedCount: 0, failedCount: 0, errors: [new Error('Cannot sync while offline')] };
  }

  // navigator.locks.request returns null if the lock is not granted (due to ifAvailable: true)
  const lockAcquiredResult = await navigator.locks.request(SYNC_LOCK_NAME, { ifAvailable: true }, async (lock) => {
    if (!lock) {
      // This callback is not executed if the lock is not acquired with ifAvailable: true.
      // This path should ideally not be hit if ifAvailable: true is correctly handled by the API.
      // If it were to be hit, it means the lock was granted but then immediately became null (edge case).
      console.log('[Sync] Lock granted but then became null (unexpected). Returning IDLE.');
      // Notifying listeners or returning specific error might be too aggressive if this path is truly an edge case.
      // The outer check (lockAcquiredResult === null) is the primary gate for non-acquisition.
      return { status: SyncStatus.IDLE, syncedCount: 0, failedCount: 0, errors: [new Error('Sync lock issue (granted then null).')] };
    }

    // Lock is acquired
    console.log('[Sync] Acquired sync lock.');

    if (isSyncInProgress && !forceSync) {
      console.log('[Sync] Sync already in progress in this tab.');
      // Lock will be released as we exit this callback.
      return { status: SyncStatus.SYNCING, syncedCount: 0, failedCount: 0, errors: [] };
    }

    isSyncInProgress = true;
    notifySyncListeners(SyncStatus.SYNCING, 0);
    const syncStartTime = Date.now();
    let currentSyncedCount = 0;
    let currentFailedCount = 0;
    const currentErrors: Error[] = [];
    let totalItemsToProcess = 0; // For accurate failure count in general catch

    try {
      let unsyncedAttendance: any[] = []; // Use any[] or specific type if available
      try {
        unsyncedAttendance = await getUnsyncedAttendance();
      } catch (e) {
        console.error('Error getting unsynced attendance:', e);
        trackOfflineSyncError(String(e), 'attendance-fetch');
        // Optionally, add to currentErrors here if this should stop the whole sync
      }

      let unsyncedAssessments: any[] = []; // Use any[] or specific type
      try {
        unsyncedAssessments = await getUnsyncedAssessments();
      } catch (e) {
        console.error('Error getting unsynced assessments:', e);
        trackOfflineSyncError(String(e), 'assessment-fetch');
        // Optionally, add to currentErrors
      }

      totalItemsToProcess = unsyncedAttendance.length + unsyncedAssessments.length;
      trackOfflineSyncStart(totalItemsToProcess);

      if (totalItemsToProcess === 0) {
        notifySyncListeners(SyncStatus.SUCCESS, 100);
        trackOfflineSyncComplete(0, 0, Date.now() - syncStartTime);
        return { status: SyncStatus.SUCCESS, syncedCount: 0, failedCount: 0, errors: [] };
      }

      let processedItems = 0;
      // Sync attendance
      for (const attendance of unsyncedAttendance) {
        processedItems++;
        notifySyncListeners(SyncStatus.SYNCING, Math.round((processedItems / totalItemsToProcess) * 100));
        try {
          await syncAttendanceToServer(attendance);
          await markAttendanceAsSynced(attendance.id);
          currentSyncedCount++;
        } catch (e) {
          currentFailedCount++;
          const err = e instanceof Error ? e : new Error(String(e));
          currentErrors.push(err);
          trackOfflineSyncError(err.message, 'attendance', attendance.id);
        }
      }
      // Sync assessments
      for (const assessment of unsyncedAssessments) {
        processedItems++;
        notifySyncListeners(SyncStatus.SYNCING, Math.round((processedItems / totalItemsToProcess) * 100));
        try {
          await syncAssessmentToServer(assessment);
          await markAssessmentAsSynced(assessment.id);
          currentSyncedCount++;
        } catch (e) {
          currentFailedCount++;
          const err = e instanceof Error ? e : new Error(String(e));
          currentErrors.push(err);
          trackOfflineSyncError(err.message, 'assessment', assessment.id);
        }
      }

      const finalStatus = currentFailedCount > 0 ? SyncStatus.ERROR : SyncStatus.SUCCESS;
      notifySyncListeners(finalStatus, 100);
      trackOfflineSyncComplete(currentSyncedCount, currentFailedCount, Date.now() - syncStartTime);
      return { status: finalStatus, syncedCount: currentSyncedCount, failedCount: currentFailedCount, errors: currentErrors };

    } catch (error) { // Catch general errors within the locked operation
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error('[Sync] General error during sync operation inside lock:', errorObj);
      notifySyncListeners(SyncStatus.ERROR);
      trackOfflineSyncError(errorObj.message, 'general-lock');
      currentErrors.push(errorObj);
      // Determine failed count more accurately if possible, or assume all remaining items failed.
      return {
        status: SyncStatus.ERROR,
        syncedCount: currentSyncedCount,
        // If totalItemsToProcess was fetched, use it, otherwise this might be inaccurate
        failedCount: totalItemsToProcess - currentSyncedCount,
        errors: currentErrors
      };
    } finally {
      isSyncInProgress = false; // Reset for this tab
      console.log('[Sync] Sync operation finished. Lock released implicitly as callback scope ends.');
    }
  }); // End of navigator.locks.request callback

  if (lockAcquiredResult === null) {
    // Lock was not acquired because another tab holds it (ifAvailable: true was used)
    console.log('[Sync] Lock not acquired, another tab is likely syncing.');
    // Potentially notify listeners that sync was skipped due to lock
    // notifySyncListeners(SyncStatus.IDLE); // Or a new status like SKIPPED
    return {
      status: SyncStatus.IDLE, // Or a new status like 'SKIPPED_CONCURRENCY'
      syncedCount: 0,
      failedCount: 0,
      errors: [new Error('Sync lock not acquired; another tab may be syncing.')]
    };
  }

  // If lockAcquiredResult is not null, it means the lock was acquired and the callback executed.
  // The result of the callback (a SyncResult object) is in lockAcquiredResult.
  return lockAcquiredResult; // This will be the SyncResult from the callback (or the SYNCING/IDLE from within the lock)
}
