'use client';

import { logger } from '@/server/api/utils/logger';
import { getSyncQueue, removeFromSyncQueue, updateSyncQueueItem } from './db';

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
  // Don't sync if offline or already syncing
  if (!online || syncing) {
    return false;
  }

  syncing = true;
  notifySyncListeners(SyncStatus.SYNCING, 0);

  try {
    // Get all items in sync queue
    const syncItems = await getSyncQueue();
    
    if (syncItems.length === 0) {
      // Nothing to sync
      syncing = false;
      notifySyncListeners(SyncStatus.SUCCESS, 100);
      return true;
    }

    logger.info('Starting sync of coordinator data', { itemCount: syncItems.length });

    // Process each item in the queue
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < syncItems.length; i++) {
      const item = syncItems[i];
      const progress = Math.round((i / syncItems.length) * 100);
      
      notifySyncListeners(SyncStatus.SYNCING, progress);

      try {
        // Process based on operation type
        let success = false;

        switch (item.operation) {
          case 'create':
            success = await handleCreateOperation(item);
            break;
          case 'update':
            success = await handleUpdateOperation(item);
            break;
          case 'delete':
            success = await handleDeleteOperation(item);
            break;
          default:
            logger.warn('Unknown operation type', { operation: item.operation });
            success = false;
        }

        if (success) {
          // Remove from queue if successful
          await removeFromSyncQueue(item.id);
          successCount++;
        } else {
          // Update attempts count
          await updateSyncQueueItem(item.id, {
            attempts: item.attempts + 1
          });
          errorCount++;
        }
      } catch (error) {
        logger.error('Error processing sync item', { error, itemId: item.id });
        
        // Update attempts count
        await updateSyncQueueItem(item.id, {
          attempts: item.attempts + 1
        });
        
        errorCount++;
      }
    }

    // Log sync results
    logger.info('Coordinator data sync completed', {
      total: syncItems.length,
      success: successCount,
      error: errorCount
    });

    // Notify listeners of completion
    const finalStatus = errorCount === 0 ? SyncStatus.SUCCESS : SyncStatus.ERROR;
    notifySyncListeners(finalStatus, 100);

    syncing = false;
    return errorCount === 0;
  } catch (error) {
    logger.error('Error syncing coordinator data', { error });
    notifySyncListeners(SyncStatus.ERROR, 100);
    syncing = false;
    return false;
  }
}

/**
 * Handle create operation
 * @param item Sync queue item
 */
async function handleCreateOperation(item: any): Promise<boolean> {
  // This would be implemented with actual API calls
  // For now, just log and return success
  logger.debug('Processing create operation', { storeName: item.storeName });
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return true;
}

/**
 * Handle update operation
 * @param item Sync queue item
 */
async function handleUpdateOperation(item: any): Promise<boolean> {
  // This would be implemented with actual API calls
  // For now, just log and return success
  logger.debug('Processing update operation', { storeName: item.storeName });
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return true;
}

/**
 * Handle delete operation
 * @param item Sync queue item
 */
async function handleDeleteOperation(item: any): Promise<boolean> {
  // This would be implemented with actual API calls
  // For now, just log and return success
  logger.debug('Processing delete operation', { storeName: item.storeName });
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return true;
}

// Initialize connectivity listeners if in browser environment
if (typeof window !== 'undefined') {
  registerConnectivityListeners();
}
