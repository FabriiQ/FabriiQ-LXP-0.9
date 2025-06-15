'use client';

import { logger } from '@/server/api/utils/logger';
import { getSyncQueue, removeFromSyncQueue, updateSyncQueueItem } from './db';
import { api } from '@/trpc/react'; // Or wherever the client is correctly imported from for background tasks
                                       // Note: Using the React query client directly in a non-React context (like a sync script
                                       // that might eventually run in a SW or a dedicated worker) can be problematic.
                                       // For now, we assume this sync.ts runs in a context where this client is available.
                                       // A more robust solution might involve a separate, non-React tRPC client or direct fetch calls
                                       // if this script is intended for true background SW sync.
                                       // Given current structure, it's client-initiated, so React client might be okay.

// Sync status enum
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Type for sync listeners
type SyncListener = (status: SyncStatus, progress?: number) => void;

// Array to store sync listeners
const syncListeners: SyncListener[] = [];

// Variable to track online status
let online = typeof navigator !== 'undefined' ? navigator.onLine : true;

// Variable to track if sync is in progress
let syncing = false;

const COORDINATOR_SYNC_LOCK_NAME = 'coordinator_data_sync_lock'; // Define a lock name

/**
 * Check if the device is online
 */
export function isOnline(): boolean {
  return online;
}

/**
 * Register connectivity listeners
 */
export function registerConnectivityListeners(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Update online status
  const updateOnlineStatus = () => {
    const wasOnline = online;
    online = navigator.onLine;

    // Log status change
    if (wasOnline !== online) {
      if (online) {
        logger.info('Device is now online');
      } else {
        logger.info('Device is now offline');
      }
    }

    // Notify listeners of status change
    notifySyncListeners(SyncStatus.IDLE);
  };

  // Add event listeners
  window.addEventListener('online', () => {
    updateOnlineStatus();
    // Attempt to sync when coming back online
    syncCoordinatorData().catch(error => {
      logger.error('Error syncing data after coming online', { error });
    });
  });
  
  window.addEventListener('offline', updateOnlineStatus);

  // Initialize status
  updateOnlineStatus();
}

/**
 * Add a sync listener
 * @param listener Function to call when sync status changes
 */
export function addSyncListener(listener: SyncListener): void {
  syncListeners.push(listener);
}

/**
 * Remove a sync listener
 * @param listener Function to remove from listeners
 */
export function removeSyncListener(listener: SyncListener): void {
  const index = syncListeners.indexOf(listener);
  if (index !== -1) {
    syncListeners.splice(index, 1);
  }
}

/**
 * Notify all sync listeners of a status change
 * @param status Current sync status
 * @param progress Optional progress value (0-100)
 */
function notifySyncListeners(status: SyncStatus, progress?: number): void {
  syncListeners.forEach(listener => {
    try {
      listener(status, progress);
    } catch (error) {
      logger.error('Error in sync listener', { error });
    }
  });
}

/**
 * Sync coordinator data with the server
 */
export async function syncCoordinatorData(): Promise<boolean> {
  if (!isOnline()) { // Use the module's isOnline() function
    logger.info('[Coordinator Sync] Cannot sync while offline.');
    return false;
  }

  // Attempt to acquire the lock.
  // navigator.locks.request returns null if the lock is not granted (due to ifAvailable: true)
  const lockAcquiredResult = await navigator.locks.request(
    COORDINATOR_SYNC_LOCK_NAME,
    { ifAvailable: true },
    async (lock) => {
      if (!lock) {
        // This callback should not execute if lock is not acquired with ifAvailable: true.
        // This path indicates an unexpected state or that the lock was granted then immediately became null.
        logger.warn('[Coordinator Sync] Lock granted but then became null (unexpected). Sync aborted.');
        return false; // Indicate sync did not proceed successfully
      }

      // Lock is acquired
      logger.info('[Coordinator Sync] Acquired sync lock.');

      if (syncing) { // Use module's 'syncing' flag for same-tab re-entrancy
        logger.info('[Coordinator Sync] Sync already in progress in this tab.');
        return false; // Indicate sync did not proceed (or was already in progress)
      }

      syncing = true;
      notifySyncListeners(SyncStatus.SYNCING, 0);
      let overallSuccess = true;

      try {
        const syncItems = await getSyncQueue();

        if (syncItems.length === 0) {
          logger.info('[Coordinator Sync] No items in sync queue.');
          notifySyncListeners(SyncStatus.SUCCESS, 100);
          return true; // Successfully did nothing
        }

        logger.info(`[Coordinator Sync] Starting sync of ${syncItems.length} items.`);
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < syncItems.length; i++) {
          const item = syncItems[i];
          // Progress based on item completion (item i+1 out of total)
          const progress = Math.round(((i + 1) / syncItems.length) * 100);

          try {
            let itemSuccess = false;
            logger.debug(`[Coordinator Sync] Processing item ${item.id}`, { operation: item.operation, store: item.storeName });
            switch (item.operation) {
              case 'create':
                itemSuccess = await handleCreateOperation(item);
                break;
              case 'update':
                itemSuccess = await handleUpdateOperation(item);
                break;
              case 'delete':
                itemSuccess = await handleDeleteOperation(item);
                break;
              default:
                logger.warn('[Coordinator Sync] Unknown operation type in queue', { operation: item.operation });
                itemSuccess = false; // Treat as failure
            }

            if (itemSuccess) {
              await removeFromSyncQueue(item.id);
              successCount++;
              logger.debug(`[Coordinator Sync] Item ${item.id} processed and removed from queue.`);
            } else {
              logger.warn(`[Coordinator Sync] Item ${item.id} failed to process. Attempts: ${item.attempts + 1}`);
              await updateSyncQueueItem(item.id, { attempts: item.attempts + 1 });
              errorCount++;
              overallSuccess = false; // Mark overall sync as not fully successful
            }
          } catch (error) {
            logger.error(`[Coordinator Sync] Error processing sync item ${item.id}`, { error });
            await updateSyncQueueItem(item.id, { attempts: item.attempts + 1 });
            errorCount++;
            overallSuccess = false;
          }
          // Notify progress after each item is attempted
          notifySyncListeners(SyncStatus.SYNCING, progress);
        }

        logger.info('[Coordinator Sync] Sync completed.', { total: syncItems.length, success: successCount, error: errorCount });
        const finalStatus = overallSuccess ? SyncStatus.SUCCESS : SyncStatus.ERROR;
        notifySyncListeners(finalStatus, 100);
        return overallSuccess;

      } catch (error) { // Catch errors in the main try block (e.g., getting sync queue)
        logger.error('[Coordinator Sync] General error during sync operation inside lock:', { error });
        notifySyncListeners(SyncStatus.ERROR, 100); // Mark as 100% as it's a final error state
        return false; // Indicate sync failed
      } finally {
        syncing = false; // Reset for this tab
        logger.info('[Coordinator Sync] Sync operation finished. Lock released implicitly.');
      }
    }
  ); // End of navigator.locks.request callback

  if (lockAcquiredResult === null) {
    // Lock was not acquired (another tab/process holds it)
    logger.info('[Coordinator Sync] Lock not acquired, another tab is likely syncing. Sync deferred for this tab.');
    // Optionally notify listeners that this tab's sync was skipped
    // notifySyncListeners(SyncStatus.IDLE); // Or a specific "SKIPPED" status
    return false; // Indicate sync did not run or complete successfully in this instance
  }

  // lockAcquiredResult is the boolean returned by the lock callback.
  return lockAcquiredResult;
}

/**
 * Handle create operation
 * @param item Sync queue item { storeName: string; data: any; id: string /* syncQueue item id */ }
 */
async function handleCreateOperation(item: { storeName: string; data: any; id: string }): Promise<boolean> {
  logger.debug('[Coordinator Sync] Processing CREATE operation', { storeName: item.storeName, dataId: item.data.id });
  try {
    switch (item.storeName) {
      case 'teachers':
        // Assuming item.data is the complete input for the createTeacher mutation
        // And assuming a tRPC procedure like `api.coordinator.createTeacher.mutateAsync` exists.
        // const createdTeacher = await api.coordinator.createTeacher.mutateAsync(item.data);
        // logger.info('[Coordinator Sync] Teacher created on server:', { id: createdTeacher.id });
        logger.warn(`[Coordinator Sync] TODO: Implement actual tRPC call for CREATE ${item.storeName}`);
        await new Promise(resolve => setTimeout(resolve, 300)); // Keep simulation for now
        return true; // Return true if API call is successful

      // Add cases for other storeNames like 'students', 'classes', 'analytics'
      // case 'students':
      //   await api.coordinator.createStudent.mutateAsync(item.data);
      //   return true;

      default:
        logger.warn('[Coordinator Sync] Unknown storeName for CREATE operation:', { storeName: item.storeName });
        return false; // Or treat as error / retry later
    }
  } catch (error) {
    logger.error(`[Coordinator Sync] API Error during CREATE ${item.storeName}`, { error, data: item.data });
    return false;
  }
}

/**
 * Handle update operation
 * @param item Sync queue item { storeName: string; data: any; id: string }
 */
async function handleUpdateOperation(item: { storeName: string; data: any; id: string }): Promise<boolean> {
  logger.debug('[Coordinator Sync] Processing UPDATE operation', { storeName: item.storeName, dataId: item.data.id });
  try {
    switch (item.storeName) {
      case 'teachers':
        // Assuming item.data includes 'id' and other fields to update.
        // const updatedTeacher = await api.coordinator.updateTeacher.mutateAsync(item.data);
        // logger.info('[Coordinator Sync] Teacher updated on server:', { id: updatedTeacher.id });
        logger.warn(`[Coordinator Sync] TODO: Implement actual tRPC call for UPDATE ${item.storeName}`);
        await new Promise(resolve => setTimeout(resolve, 300)); // Keep simulation
        return true;

      // Add cases for other storeNames
      default:
        logger.warn('[Coordinator Sync] Unknown storeName for UPDATE operation:', { storeName: item.storeName });
        return false;
    }
  } catch (error) {
    logger.error(`[Coordinator Sync] API Error during UPDATE ${item.storeName}`, { error, data: item.data });
    return false;
  }
}

/**
 * Handle delete operation
 * @param item Sync queue item { storeName: string; data: { id: string }; id: string }
 */
async function handleDeleteOperation(item: { storeName: string; data: { id: string }; id: string }): Promise<boolean> { // data likely just contains id
  logger.debug('[Coordinator Sync] Processing DELETE operation', { storeName: item.storeName, dataId: item.data.id });
  try {
    switch (item.storeName) {
      case 'teachers':
        // Assuming item.data.id is the ID of the teacher to delete.
        // await api.coordinator.deleteTeacher.mutateAsync({ id: item.data.id });
        // logger.info('[Coordinator Sync] Teacher deleted on server:', { id: item.data.id });
        logger.warn(`[Coordinator Sync] TODO: Implement actual tRPC call for DELETE ${item.storeName}`);
        await new Promise(resolve => setTimeout(resolve, 300)); // Keep simulation
        return true;

      // Add cases for other storeNames
      default:
        logger.warn('[Coordinator Sync] Unknown storeName for DELETE operation:', { storeName: item.storeName });
        return false;
    }
  } catch (error) {
    logger.error(`[Coordinator Sync] API Error during DELETE ${item.storeName}`, { error, dataId: item.data.id });
    return false;
  }
}

// Initialize connectivity listeners if in browser environment
if (typeof window !== 'undefined') {
  registerConnectivityListeners();
}
