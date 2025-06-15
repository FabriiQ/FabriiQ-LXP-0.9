'use client';

import { logger } from '@/server/api/utils/logger';

// Define the structure for offline activity data
export interface OfflineActivity {
  id: string;
  activityId: string;
  studentId: string;
  content: any;
  score?: number;
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_SYNC';
  submittedAt: string;
  syncAttempts: number;
  lastSyncAttempt?: string;
}

// Define the structure for the offline storage
export interface OfflineStorage {
  activities: Record<string, OfflineActivity>;
  lastSyncTime: string;
}

// Default empty storage
const DEFAULT_STORAGE: OfflineStorage = {
  activities: {},
  lastSyncTime: new Date().toISOString(),
};

// Storage keys
const STORAGE_KEYS = {
  ACTIVITIES: 'offline-activities',
};

/**
 * Initialize offline storage
 * @returns The current offline storage state
 */
export function initOfflineStorage(): OfflineStorage {
  if (typeof window === 'undefined') {
    return DEFAULT_STORAGE;
  }

  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (!storedData) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(DEFAULT_STORAGE));
      return DEFAULT_STORAGE;
    }
    return JSON.parse(storedData);
  } catch (error) {
    logger.error('Error initializing offline storage', { error });
    return DEFAULT_STORAGE;
  }
}

/**
 * Save activity data for offline use
 * @param activity The activity data to save
 */
export function saveOfflineActivity(activity: OfflineActivity): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const storage = initOfflineStorage();
    storage.activities[activity.id] = activity;
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(storage));
  } catch (error) {
    logger.error('Error saving offline activity', { error, activity });
  }
}

/**
 * Get all pending offline activities that need to be synced
 * @returns Array of activities pending synchronization
 */
export function getPendingOfflineActivities(): OfflineActivity[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storage = initOfflineStorage();
    return Object.values(storage.activities).filter(
      (activity) => activity.status === 'PENDING_SYNC'
    );
  } catch (error) {
    logger.error('Error getting pending offline activities', { error });
    return [];
  }
}

/**
 * Mark an activity as synced and remove it from pending
 * @param activityId The ID of the activity to mark as synced
 */
export function markActivitySynced(activityId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const storage = initOfflineStorage();
    delete storage.activities[activityId];
    storage.lastSyncTime = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(storage));
  } catch (error) {
    logger.error('Error marking activity as synced', { error, activityId });
  }
}

/**
 * Mark an activity sync as failed
 * @param activityId The ID of the activity that failed to sync
 */
export function markActivitySyncFailed(activityId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const storage = initOfflineStorage();
    const activity = storage.activities[activityId];
    if (activity) {
      activity.syncAttempts += 1;
      activity.lastSyncAttempt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(storage));
    }
  } catch (error) {
    logger.error('Error marking activity sync as failed', { error, activityId });
  }
}

/**
 * Synchronize all pending offline activities with the server
 * @param syncFunction Function to call to sync an activity with the server
 * @returns Promise that resolves when all activities are synced or failed
 */
export async function syncOfflineActivities(
  syncFunction: (activity: OfflineActivity) => Promise<boolean>
): Promise<{ success: number; failed: number }> {
  const pendingActivities = getPendingOfflineActivities();
  let success = 0;
  let failed = 0;

  for (const activity of pendingActivities) {
    try {
      const result = await syncFunction(activity);
      if (result) {
        markActivitySynced(activity.id);
        success++;
      } else {
        markActivitySyncFailed(activity.id);
        failed++;
      }
    } catch (error) {
      logger.error('Error syncing activity', { error, activity });
      markActivitySyncFailed(activity.id);
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Check if the device is currently online
 * @returns Boolean indicating if the device is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Register event listeners for online/offline events
 * @param onOnline Function to call when the device goes online
 * @param onOffline Function to call when the device goes offline
 * @returns Function to remove the event listeners
 */
export function registerConnectivityListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
