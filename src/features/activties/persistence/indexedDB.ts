'use client';

import { openDB, IDBPDatabase } from 'idb';
import {
  trackOfflineActivitySaved,
  trackOfflineActivityLoaded,
  trackOfflineStorageError,
  trackOfflineStorageQuotaExceeded
} from '../analytics/offline-analytics';

// Database promise
let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Initialize the database
 */
export async function initDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB('activities-db', 1, {
      upgrade(db) {
        // Create activities store
        if (!db.objectStoreNames.contains('activities')) {
          const activitiesStore = db.createObjectStore('activities', { keyPath: 'id' });
          activitiesStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create activity states store
        if (!db.objectStoreNames.contains('activityStates')) {
          const statesStore = db.createObjectStore('activityStates', { keyPath: 'id' });
          statesStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create results store
        if (!db.objectStoreNames.contains('results')) {
          const resultsStore = db.createObjectStore('results', { keyPath: 'id' });
          resultsStore.createIndex('by-activity', 'activityId');
          resultsStore.createIndex('by-user', 'userId');
          // Use a derived key function for synced status (0 for false, 1 for true)
          resultsStore.createIndex('by-synced', 'synced');
          resultsStore.createIndex('by-last-updated', 'lastUpdated');
        }
      }
    });
  }

  return dbPromise;
}

/**
 * Save an activity to IndexedDB
 * @param activityId Unique identifier for the activity
 * @param activityData Activity data to save
 */
export async function saveActivity(activityId: string, activityData: any): Promise<void> {
  const db = await initDB();

  await db.put('activities', {
    id: activityId,
    data: activityData,
    lastUpdated: Date.now()
  });
}

/**
 * Get an activity from IndexedDB
 * @param activityId Unique identifier for the activity
 */
export async function getActivity(activityId: string): Promise<any | null> {
  const db = await initDB();

  const activityRecord = await db.get('activities', activityId);
  return activityRecord ? activityRecord.data : null;
}

/**
 * Save activity state to IndexedDB
 * @param stateId Unique identifier for the state
 * @param state Activity state to save
 */
export async function saveActivityState(stateId: string, state: any): Promise<void> {
  try {
    const db = await initDB();

    // Estimate data size for analytics
    const dataSize = JSON.stringify(state).length;

    await db.put('activityStates', {
      id: stateId,
      state,
      lastUpdated: Date.now()
    });

    // Track successful save with analytics
    const activityId = typeof state.activity === 'object' && state.activity !== null ?
      (state.activity as any).id || stateId :
      stateId;
    const activityType = typeof state.activity === 'object' && state.activity !== null ?
      (state.activity as any).activityType || 'unknown' :
      'unknown';

    trackOfflineActivitySaved(activityId, activityType, dataSize);
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      trackOfflineStorageQuotaExceeded(0, 0); // We don't have actual quota info
      console.error('Storage quota exceeded when saving activity state');
    } else {
      // Track other errors
      trackOfflineStorageError(
        error instanceof Error ? error.message : 'Unknown error saving activity state',
        'write'
      );
      console.error('Error saving activity state:', error);
    }

    // Re-throw the error
    throw error;
  }
}

/**
 * Get activity state from IndexedDB
 * @param stateId Unique identifier for the state
 */
export async function getActivityState(stateId: string): Promise<any | null> {
  try {
    const startTime = performance.now();
    const db = await initDB();

    const stateRecord = await db.get('activityStates', stateId);

    if (stateRecord) {
      // Track successful load with analytics
      const state = stateRecord.state;
      const activityId = typeof state.activity === 'object' && state.activity !== null ?
        (state.activity as any).id || stateId :
        stateId;
      const activityType = typeof state.activity === 'object' && state.activity !== null ?
        (state.activity as any).activityType || 'unknown' :
        'unknown';

      const loadTime = performance.now() - startTime;
      trackOfflineActivityLoaded(activityId, activityType, loadTime);

      return state;
    }

    return null;
  } catch (error) {
    // Track error with analytics
    trackOfflineStorageError(
      error instanceof Error ? error.message : 'Unknown error loading activity state',
      'read'
    );
    console.error('Error loading activity state:', error);

    // Re-throw the error
    throw error;
  }
}

/**
 * Save activity result to IndexedDB
 * @param resultId Unique identifier for the result
 * @param activityId Activity ID
 * @param userId User ID
 * @param attemptId Attempt ID
 * @param result Grading result
 * @param synced Whether the result has been synced to the server
 */
export async function saveActivityResult(
  resultId: string,
  activityId: string,
  userId: string,
  attemptId: string,
  result: any,
  synced: boolean = false
): Promise<void> {
  const db = await initDB();

  await db.put('results', {
    id: resultId,
    activityId,
    userId,
    attemptId,
    result,
    synced,
    lastUpdated: Date.now()
  });
}

/**
 * Get activity result from IndexedDB
 * @param resultId Unique identifier for the result
 */
export async function getActivityResult(resultId: string): Promise<any | null> {
  const db = await initDB();

  const resultRecord = await db.get('results', resultId);
  return resultRecord ? resultRecord.result : null;
}

/**
 * Get all unsynced activity results
 */
export async function getUnsyncedResults(): Promise<any[]> {
  const db = await initDB();

  // Use 0 as the key for false in the index
  return db.getAllFromIndex('results', 'by-synced', 0);
}

/**
 * Mark activity result as synced
 * @param resultId Unique identifier for the result
 */
export async function markResultAsSynced(resultId: string): Promise<void> {
  const db = await initDB();

  const resultRecord = await db.get('results', resultId);
  if (resultRecord) {
    resultRecord.synced = true;
    resultRecord.lastUpdated = Date.now();
    await db.put('results', resultRecord);
  }
}

/**
 * Clear old data from IndexedDB (older than specified days)
 * @param days Number of days to keep data
 */
export async function clearOldData(days: number = 30): Promise<void> {
  const db = await initDB();
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

  // Clear old activities
  const oldActivities = await db.getAllFromIndex('activities', 'by-last-updated');
  for (const activity of oldActivities) {
    if (activity.lastUpdated < cutoffTime) {
      await db.delete('activities', activity.id);
    }
  }

  // Clear old states
  const oldStates = await db.getAllFromIndex('activityStates', 'by-last-updated');
  for (const state of oldStates) {
    if (state.lastUpdated < cutoffTime) {
      await db.delete('activityStates', state.id);
    }
  }

  // Clear old results (only synced ones)
  const oldResults = await db.getAllFromIndex('results', 'by-last-updated');
  for (const result of oldResults) {
    if (result.lastUpdated < cutoffTime && result.synced) {
      await db.delete('results', result.id);
    }
  }
}
