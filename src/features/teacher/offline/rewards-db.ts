'use client';

import { openDB, IDBPDatabase } from 'idb';
import { trackOfflineStorageError } from './analytics';

// Database name and version
const DB_NAME = 'teacher-rewards-db';
const DB_VERSION = 1;

// Database promise
let dbPromise: Promise<IDBPDatabase<RewardsDB>> | null = null;

// Database schema
interface RewardsDB {
  classRewards: {
    key: string;
    value: {
      classId: string;
      data: any;
      lastUpdated: number;
    };
    indexes: { 'by-last-updated': number };
  };

  studentPoints: {
    key: string;
    value: {
      id: string;
      classId: string;
      studentId: string;
      data: any;
      lastUpdated: number;
    };
    indexes: {
      'by-class': string;
      'by-student': string;
      'by-last-updated': number;
    };
  };

  leaderboard: {
    key: string;
    value: {
      classId: string;
      period: string;
      data: any;
      lastUpdated: number;
    };
    indexes: {
      'by-class': string;
      'by-period': string;
      'by-last-updated': number;
    };
  };

  pointsHistory: {
    key: string;
    value: {
      studentId: string;
      classId: string;
      data: any;
      lastUpdated: number;
    };
    indexes: {
      'by-student': string;
      'by-class': string;
      'by-last-updated': number;
    };
  };

  syncQueue: {
    key: string;
    value: {
      id: string;
      operation: 'create' | 'update' | 'delete';
      storeName: string;
      data: any;
      attempts: number;
      lastAttempt: number | null;
      createdAt: number;
    };
    indexes: {
      'by-operation': string;
      'by-store': string;
      'by-attempts': number;
      'by-created': number;
    };
  };
}

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase<RewardsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RewardsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create class rewards store
        if (!db.objectStoreNames.contains('classRewards')) {
          const classRewardsStore = db.createObjectStore('classRewards', { keyPath: 'classId' });
          classRewardsStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create student points store
        if (!db.objectStoreNames.contains('studentPoints')) {
          const studentPointsStore = db.createObjectStore('studentPoints', { keyPath: 'id' });
          studentPointsStore.createIndex('by-class', 'classId');
          studentPointsStore.createIndex('by-student', 'studentId');
          studentPointsStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create leaderboard store
        if (!db.objectStoreNames.contains('leaderboard')) {
          const leaderboardStore = db.createObjectStore('leaderboard', { keyPath: 'id' });
          leaderboardStore.createIndex('by-class', 'classId');
          leaderboardStore.createIndex('by-period', 'period');
          leaderboardStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create points history store
        if (!db.objectStoreNames.contains('pointsHistory')) {
          const pointsHistoryStore = db.createObjectStore('pointsHistory', { keyPath: 'id' });
          pointsHistoryStore.createIndex('by-student', 'studentId');
          pointsHistoryStore.createIndex('by-class', 'classId');
          pointsHistoryStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncQueueStore.createIndex('by-operation', 'operation');
          syncQueueStore.createIndex('by-store', 'storeName');
          syncQueueStore.createIndex('by-attempts', 'attempts');
          syncQueueStore.createIndex('by-created', 'createdAt');
        }
      }
    });
  }

  return dbPromise;
}

/**
 * Save class rewards data to IndexedDB
 */
export async function saveClassRewards(classId: string, data: any): Promise<void> {
  try {
    const db = await initDB();

    await db.put('classRewards', {
      classId,
      data,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('Error saving class rewards:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get class rewards data from IndexedDB
 */
export async function getClassRewards(classId: string): Promise<any | null> {
  try {
    const db = await initDB();
    const record = await db.get('classRewards', classId);
    return record?.data || null;
  } catch (error) {
    console.error('Error getting class rewards:', error);
    trackOfflineStorageError(String(error), 'read');
    return null;
  }
}

/**
 * Save leaderboard data to IndexedDB
 */
export async function saveLeaderboard(classId: string, period: string, data: any): Promise<void> {
  try {
    const db = await initDB();
    const id = `${classId}-${period}`;

    await db.put('leaderboard', {
      id,
      classId,
      period,
      data,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('Error saving leaderboard:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get leaderboard data from IndexedDB
 */
export async function getLeaderboard(classId: string, period: string): Promise<any | null> {
  try {
    const db = await initDB();
    const id = `${classId}-${period}`;
    const record = await db.get('leaderboard', id);
    return record?.data || null;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    trackOfflineStorageError(String(error), 'read');
    return null;
  }
}

/**
 * Save student points data to IndexedDB
 */
export async function saveStudentPoints(id: string, classId: string, studentId: string, data: any): Promise<void> {
  try {
    const db = await initDB();

    await db.put('studentPoints', {
      id,
      classId,
      studentId,
      data,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('Error saving student points:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get student points data from IndexedDB
 */
export async function getStudentPoints(id: string): Promise<any | null> {
  try {
    const db = await initDB();
    const record = await db.get('studentPoints', id);
    return record?.data || null;
  } catch (error) {
    console.error('Error getting student points:', error);
    trackOfflineStorageError(String(error), 'read');
    return null;
  }
}

/**
 * Get all student points for a class from IndexedDB
 */
export async function getAllStudentPointsByClass(classId: string): Promise<any[]> {
  try {
    const db = await initDB();
    const records = await db.getAllFromIndex('studentPoints', 'by-class', classId);
    return records.map(record => record.data) || [];
  } catch (error) {
    console.error('Error getting all student points by class:', error);
    trackOfflineStorageError(String(error), 'read');
    return [];
  }
}

/**
 * Save points history data to IndexedDB
 */
export async function savePointsHistory(id: string, studentId: string, classId: string, data: any): Promise<void> {
  try {
    const db = await initDB();

    await db.put('pointsHistory', {
      id,
      studentId,
      classId,
      data,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('Error saving points history:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get points history data from IndexedDB
 */
export async function getPointsHistory(studentId: string, classId: string): Promise<any | null> {
  try {
    const db = await initDB();
    const id = `${studentId}-${classId}`;
    const record = await db.get('pointsHistory', id);
    return record?.data || null;
  } catch (error) {
    console.error('Error getting points history:', error);
    trackOfflineStorageError(String(error), 'read');
    return null;
  }
}

/**
 * Add operation to sync queue
 */
export async function addToSyncQueue(
  operation: 'create' | 'update' | 'delete',
  storeName: string,
  data: any
): Promise<void> {
  try {
    const db = await initDB();

    await db.put('syncQueue', {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      operation,
      storeName,
      data,
      attempts: 0,
      lastAttempt: null,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error('Error adding operation to sync queue:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get all pending sync operations
 */
export async function getPendingSyncOperations(): Promise<any[]> {
  try {
    const db = await initDB();
    return db.getAll('syncQueue');
  } catch (error) {
    console.error('Error getting pending sync operations:', error);
    trackOfflineStorageError(String(error), 'read');
    return [];
  }
}

/**
 * Remove sync operation from queue
 */
export async function removeSyncOperation(id: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete('syncQueue', id);
  } catch (error) {
    console.error('Error removing sync operation:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Update sync operation attempts
 */
export async function updateSyncOperationAttempts(id: string, attempts: number): Promise<void> {
  try {
    const db = await initDB();
    const record = await db.get('syncQueue', id);

    if (record) {
      record.attempts = attempts;
      record.lastAttempt = Date.now();
      await db.put('syncQueue', record);
    }
  } catch (error) {
    console.error('Error updating sync operation attempts:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}