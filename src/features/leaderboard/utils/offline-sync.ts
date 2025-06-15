/**
 * Leaderboard Offline Synchronization Utilities
 *
 * This file provides utilities for offline data synchronization,
 * including conflict resolution and background sync.
 */

import {
  StandardLeaderboardEntry,
  StandardLeaderboardResponse,
  LeaderboardEntityType,
  TimeGranularity
} from '../types/standard-leaderboard';

// For offline storage
import { openDB, IDBPDatabase } from 'idb';

// Database name and version
const DB_NAME = 'leaderboard-db';
const DB_VERSION = 1;

// Database promise
let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Initialize the IndexedDB database
 */
async function initDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create leaderboard store
        if (!db.objectStoreNames.contains('leaderboard')) {
          const leaderboardStore = db.createObjectStore('leaderboard', { keyPath: 'id' });
          leaderboardStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncQueueStore.createIndex('by-timestamp', 'timestamp');
        }
      }
    });
  }

  return dbPromise;
}

/**
 * Get an item from IndexedDB
 * @param key The key to get
 * @param storeName The store name (default: 'leaderboard')
 * @returns The stored item or null if not found
 */
async function getItem(key: string, storeName: string = 'leaderboard'): Promise<any | null> {
  try {
    const db = await initDB();
    const item = await db.get(storeName, key);
    return item;
  } catch (error) {
    console.error(`Error getting item ${key} from IndexedDB:`, error);
    return null;
  }
}

/**
 * Set an item in IndexedDB
 * @param key The key to set
 * @param value The value to store
 * @param storeName The store name (default: 'leaderboard')
 */
async function setItem(key: string, value: any, storeName: string = 'leaderboard'): Promise<void> {
  try {
    const db = await initDB();
    await db.put(storeName, {
      id: key,
      ...value,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error(`Error setting item ${key} in IndexedDB:`, error);
  }
}

/**
 * Remove an item from IndexedDB
 * @param key The key to remove
 * @param storeName The store name (default: 'leaderboard')
 */
async function removeItem(key: string, storeName: string = 'leaderboard'): Promise<void> {
  try {
    const db = await initDB();
    await db.delete(storeName, key);
  } catch (error) {
    console.error(`Error removing item ${key} from IndexedDB:`, error);
  }
}

/**
 * Get all items from IndexedDB
 * @param storeName The store name (default: 'leaderboard')
 * @returns All stored items
 */
async function getAllItems(storeName: string = 'leaderboard'): Promise<any[]> {
  try {
    const db = await initDB();
    return await db.getAll(storeName);
  } catch (error) {
    console.error(`Error getting all items from IndexedDB:`, error);
    return [];
  }
}

// For event handling
type SyncEventListener = (event: SyncEvent) => void;

// Sync event types
export enum SyncEventType {
  SYNC_STARTED = 'sync_started',
  SYNC_COMPLETED = 'sync_completed',
  SYNC_FAILED = 'sync_failed',
  CONFLICT_DETECTED = 'conflict_detected',
  CONFLICT_RESOLVED = 'conflict_resolved',
}

// Sync event interface
export interface SyncEvent {
  type: SyncEventType;
  timestamp: number;
  entityType?: LeaderboardEntityType | string;
  entityId?: string;
  timeGranularity?: TimeGranularity;
  error?: Error;
  conflictDetails?: {
    localData: any;
    serverData: any;
    resolution: 'local' | 'server' | 'merged';
  };
}

// Sync queue item interface
export interface SyncQueueItem {
  id: string;
  entityType: LeaderboardEntityType | string;
  entityId: string;
  timeGranularity: TimeGranularity;
  timestamp: number;
  retryCount: number;
  lastAttempt?: number;
  data?: any;
}

// Singleton class for managing offline synchronization
class LeaderboardSyncManager {
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing = false;
  private eventListeners: SyncEventListener[] = [];
  private syncInterval: NodeJS.Timeout | null = null;

  // Initialize the sync manager
  async initialize() {
    // Load sync queue from storage
    try {
      const storedQueue = await getItem('leaderboard_sync_queue');
      if (storedQueue) {
        this.syncQueue = storedQueue;
      }
    } catch (error) {
      console.error('Error loading sync queue', error);
    }

    // Start background sync if online
    if (typeof window !== 'undefined' && navigator.onLine) {
      this.startBackgroundSync();
    }

    // Add event listeners for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  // Clean up resources
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }

  // Handle online event
  private handleOnline = () => {
    this.startBackgroundSync();
  };

  // Handle offline event
  private handleOffline = () => {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  };

  // Start background sync
  startBackgroundSync(intervalMs = 60000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Perform initial sync
    this.syncAll();

    // Set up interval for regular syncing
    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, intervalMs);
  }

  // Stop background sync
  stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Add item to sync queue
  addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>) {
    const queueItem: SyncQueueItem = {
      id: `${item.entityType}_${item.entityId}_${item.timeGranularity}_${Date.now()}`,
      timestamp: Date.now(),
      retryCount: 0,
      ...item
    };

    this.syncQueue.push(queueItem);
    this.saveSyncQueue();

    // Try to sync immediately if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.syncAll();
    }
  }

  // Save sync queue to storage
  private async saveSyncQueue() {
    try {
      await setItem('leaderboard_sync_queue', this.syncQueue);
    } catch (error) {
      console.error('Error saving sync queue', error);
    }
  }

  // Sync all items in the queue
  async syncAll() {
    if (this.isSyncing || this.syncQueue.length === 0 || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return;
    }

    this.isSyncing = true;
    this.dispatchEvent({
      type: SyncEventType.SYNC_STARTED,
      timestamp: Date.now()
    });

    try {
      // Process queue items
      const itemsToProcess = [...this.syncQueue];
      const successfulItems: string[] = [];

      for (const item of itemsToProcess) {
        try {
          await this.syncItem(item);
          successfulItems.push(item.id);
        } catch (error) {
          // Increment retry count
          item.retryCount++;
          item.lastAttempt = Date.now();

          // Remove from queue if too many retries
          if (item.retryCount > 5) {
            successfulItems.push(item.id);
            this.dispatchEvent({
              type: SyncEventType.SYNC_FAILED,
              timestamp: Date.now(),
              entityType: item.entityType,
              entityId: item.entityId,
              timeGranularity: item.timeGranularity,
              error: error as Error
            });
          }
        }
      }

      // Remove successful items from queue
      this.syncQueue = this.syncQueue.filter(item => !successfulItems.includes(item.id));
      this.saveSyncQueue();

      this.dispatchEvent({
        type: SyncEventType.SYNC_COMPLETED,
        timestamp: Date.now()
      });
    } catch (error) {
      this.dispatchEvent({
        type: SyncEventType.SYNC_FAILED,
        timestamp: Date.now(),
        error: error as Error
      });
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync a single item
  private async syncItem(item: SyncQueueItem) {
    // This is a placeholder implementation
    // In a real implementation, we would:
    // 1. Fetch the latest data from the server
    // 2. Compare with local data
    // 3. Resolve conflicts
    // 4. Update the server or local data as needed

    // For now, we'll just simulate a successful sync
    await new Promise(resolve => setTimeout(resolve, 500));

    // Clear the cached data to force a fresh fetch
    const cacheKey = `leaderboard:${item.entityType}:${item.entityId}:${item.timeGranularity}`;
    await removeItem(cacheKey);

    return true;
  }

  // Add event listener
  addEventListener(listener: SyncEventListener) {
    this.eventListeners.push(listener);
  }

  // Remove event listener
  removeEventListener(listener: SyncEventListener) {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
  }

  // Dispatch event
  private dispatchEvent(event: SyncEvent) {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in sync event listener', error);
      }
    });
  }

  // Get sync status
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      lastSyncAttempt: this.syncQueue.length > 0
        ? Math.max(...this.syncQueue.filter(item => item.lastAttempt).map(item => item.lastAttempt || 0))
        : undefined
    };
  }

  // Resolve conflict
  resolveConflict(
    entityType: LeaderboardEntityType | string,
    entityId: string,
    timeGranularity: TimeGranularity,
    resolution: 'local' | 'server' | 'merged',
    mergedData?: any
  ) {
    // This is a placeholder implementation
    // In a real implementation, we would:
    // 1. Get the local and server data
    // 2. Apply the resolution strategy
    // 3. Update the local or server data as needed

    const cacheKey = `leaderboard:${entityType}:${entityId}:${timeGranularity}`;

    this.dispatchEvent({
      type: SyncEventType.CONFLICT_RESOLVED,
      timestamp: Date.now(),
      entityType,
      entityId,
      timeGranularity,
      conflictDetails: {
        localData: {},
        serverData: {},
        resolution
      }
    });
  }
}

// Create singleton instance
export const leaderboardSyncManager = new LeaderboardSyncManager();

// Initialize on import
if (typeof window !== 'undefined') {
  leaderboardSyncManager.initialize();
}

/**
 * Cache leaderboard data for offline use
 *
 * @param entityType Entity type
 * @param entityId Entity ID
 * @param timeGranularity Time granularity
 * @param data Leaderboard data
 */
export async function cacheLeaderboardData(
  entityType: LeaderboardEntityType | string,
  entityId: string,
  timeGranularity: TimeGranularity,
  data: StandardLeaderboardResponse
) {
  const cacheKey = `leaderboard:${entityType}:${entityId}:${timeGranularity}`;

  await setItem(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Get cached leaderboard data
 *
 * @param entityType Entity type
 * @param entityId Entity ID
 * @param timeGranularity Time granularity
 * @param maxAge Maximum age in milliseconds
 * @returns Cached leaderboard data or null if not found or too old
 */
export async function getCachedLeaderboardData(
  entityType: LeaderboardEntityType | string,
  entityId: string,
  timeGranularity: TimeGranularity,
  maxAge = 24 * 60 * 60 * 1000 // 24 hours
): Promise<StandardLeaderboardResponse | null> {
  const cacheKey = `leaderboard:${entityType}:${entityId}:${timeGranularity}`;

  try {
    const cachedItem = await getItem(cacheKey);

    if (cachedItem && cachedItem.data) {
      // Check if cache is too old
      const isCacheStale = Date.now() - cachedItem.timestamp > maxAge;

      if (!isCacheStale) {
        return cachedItem.data;
      }
    }
  } catch (error) {
    console.error('Error getting cached leaderboard data', error);
  }

  return null;
}

/**
 * Apply optimistic update to cached leaderboard data
 *
 * @param entityType Entity type
 * @param entityId Entity ID
 * @param timeGranularity Time granularity
 * @param updateFn Function to update the data
 */
export async function applyOptimisticUpdate(
  entityType: LeaderboardEntityType | string,
  entityId: string,
  timeGranularity: TimeGranularity,
  updateFn: (data: StandardLeaderboardResponse) => StandardLeaderboardResponse
) {
  const cacheKey = `leaderboard:${entityType}:${entityId}:${timeGranularity}`;

  try {
    const cachedItem = await getItem(cacheKey);

    if (cachedItem && cachedItem.data) {
      const updatedData = updateFn(cachedItem.data);

      await setItem(cacheKey, {
        data: updatedData,
        timestamp: Date.now()
      });

      // Add to sync queue
      leaderboardSyncManager.addToSyncQueue({
        entityType,
        entityId,
        timeGranularity,
        data: updatedData
      });
    }
  } catch (error) {
    console.error('Error applying optimistic update', error);
  }
}
