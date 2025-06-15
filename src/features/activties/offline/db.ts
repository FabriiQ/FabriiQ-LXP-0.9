'use client';

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  trackOfflineActivitySaved,
  trackOfflineActivityLoaded,
  trackOfflineStorageError,
  trackOfflineStorageQuotaExceeded
} from '../analytics/offline-analytics';

// Define the database schema
interface RewardsDB extends DBSchema {
  activities: {
    key: string;
    value: {
      id: string;
      data: any;
      lastUpdated: number;
    };
    indexes: { 'by-last-updated': number };
  };
  
  activityStates: {
    key: string;
    value: {
      id: string;
      state: any;
      lastUpdated: number;
    };
    indexes: { 'by-last-updated': number };
  };
  
  results: {
    key: string;
    value: {
      id: string;
      activityId: string;
      userId: string;
      attemptId: string;
      result: any;
      synced: boolean;
      lastUpdated: number;
    };
    indexes: { 'by-activity': string; 'by-user': string; 'by-synced': boolean; 'by-last-updated': number };
  };

  // New tables for rewards
  achievements: {
    key: string;
    value: {
      id: string;
      studentId: string;
      title: string;
      description: string;
      type: string;
      classId?: string;
      subjectId?: string;
      progress: number;
      total: number;
      unlocked: boolean;
      unlockedAt?: number; // Timestamp
      icon?: string;
      synced: boolean;
      lastUpdated: number;
    };
    indexes: { 
      'by-student': string; 
      'by-type': string; 
      'by-synced': boolean; 
      'by-unlocked': boolean;
      'by-last-updated': number 
    };
  };

  points: {
    key: string;
    value: {
      id: string;
      studentId: string;
      amount: number;
      source: string;
      sourceId?: string;
      classId?: string;
      subjectId?: string;
      description?: string;
      synced: boolean;
      lastUpdated: number;
    };
    indexes: { 
      'by-student': string; 
      'by-source': string; 
      'by-synced': boolean; 
      'by-last-updated': number 
    };
  };

  levels: {
    key: string;
    value: {
      id: string;
      studentId: string;
      level: number;
      currentExp: number;
      requiredExp: number;
      classId?: string;
      synced: boolean;
      lastUpdated: number;
    };
    indexes: { 
      'by-student': string; 
      'by-synced': boolean; 
      'by-last-updated': number 
    };
  };
}

// Database name and version
const DB_NAME = 'rewards-offline-db';
const DB_VERSION = 1;

// Database connection
let dbPromise: Promise<IDBPDatabase<RewardsDB>> | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase<RewardsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RewardsDB>(DB_NAME, DB_VERSION, {
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
          resultsStore.createIndex('by-synced', 'synced');
          resultsStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create achievements store
        if (!db.objectStoreNames.contains('achievements')) {
          const achievementsStore = db.createObjectStore('achievements', { keyPath: 'id' });
          achievementsStore.createIndex('by-student', 'studentId');
          achievementsStore.createIndex('by-type', 'type');
          achievementsStore.createIndex('by-synced', 'synced');
          achievementsStore.createIndex('by-unlocked', 'unlocked');
          achievementsStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create points store
        if (!db.objectStoreNames.contains('points')) {
          const pointsStore = db.createObjectStore('points', { keyPath: 'id' });
          pointsStore.createIndex('by-student', 'studentId');
          pointsStore.createIndex('by-source', 'source');
          pointsStore.createIndex('by-synced', 'synced');
          pointsStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create levels store
        if (!db.objectStoreNames.contains('levels')) {
          const levelsStore = db.createObjectStore('levels', { keyPath: 'id' });
          levelsStore.createIndex('by-student', 'studentId');
          levelsStore.createIndex('by-synced', 'synced');
          levelsStore.createIndex('by-last-updated', 'lastUpdated');
        }
      }
    });
  }
  
  return dbPromise;
}

// Activity-related functions

/**
 * Save an activity to IndexedDB
 * @param activityId Unique identifier for the activity
 * @param activityData Activity data to save
 */
export async function saveActivity(activityId: string, activityData: any): Promise<void> {
  try {
    const db = await initDB();
    
    await db.put('activities', {
      id: activityId,
      data: activityData,
      lastUpdated: Date.now()
    });

    // Track analytics
    trackOfflineActivitySaved(activityId, activityData.activityType || 'unknown');
  } catch (error) {
    console.error('Error saving activity:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get an activity from IndexedDB
 * @param activityId Unique identifier for the activity
 */
export async function getActivity(activityId: string): Promise<any | null> {
  try {
    const db = await initDB();
    
    const activity = await db.get('activities', activityId);
    
    // Track analytics
    if (activity) {
      trackOfflineActivityLoaded(activityId, activity.data.activityType || 'unknown');
    }
    
    return activity ? activity.data : null;
  } catch (error) {
    console.error('Error getting activity:', error);
    trackOfflineStorageError(String(error), 'read');
    throw error;
  }
}

/**
 * Save activity state to IndexedDB
 * @param stateId Unique identifier for the state
 * @param state Activity state to save
 */
export async function saveActivityState(stateId: string, state: any): Promise<void> {
  try {
    const db = await initDB();
    
    await db.put('activityStates', {
      id: stateId,
      state,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('Error saving activity state:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get activity state from IndexedDB
 * @param stateId Unique identifier for the state
 */
export async function getActivityState(stateId: string): Promise<any | null> {
  try {
    const db = await initDB();
    
    const stateRecord = await db.get('activityStates', stateId);
    return stateRecord ? stateRecord.state : null;
  } catch (error) {
    console.error('Error getting activity state:', error);
    trackOfflineStorageError(String(error), 'read');
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
  try {
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
  } catch (error) {
    console.error('Error saving activity result:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get unsynced activity results from IndexedDB
 */
export async function getUnsyncedResults(): Promise<any[]> {
  try {
    const db = await initDB();
    
    return await db.getAllFromIndex('results', 'by-synced', false);
  } catch (error) {
    console.error('Error getting unsynced results:', error);
    trackOfflineStorageError(String(error), 'read');
    throw error;
  }
}

/**
 * Mark an activity result as synced
 * @param resultId Unique identifier for the result
 */
export async function markResultAsSynced(resultId: string): Promise<void> {
  try {
    const db = await initDB();
    
    const result = await db.get('results', resultId);
    if (result) {
      result.synced = true;
      result.lastUpdated = Date.now();
      await db.put('results', result);
    }
  } catch (error) {
    console.error('Error marking result as synced:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

// Rewards-related functions

/**
 * Save achievement to IndexedDB
 * @param achievement Achievement data to save
 */
export async function saveAchievement(achievement: {
  id: string;
  studentId: string;
  title: string;
  description: string;
  type: string;
  classId?: string;
  subjectId?: string;
  progress: number;
  total: number;
  unlocked: boolean;
  unlockedAt?: number;
  icon?: string;
  synced?: boolean;
}): Promise<void> {
  try {
    const db = await initDB();
    
    await db.put('achievements', {
      ...achievement,
      synced: achievement.synced ?? false,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('Error saving achievement:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get achievements for a student from IndexedDB
 * @param studentId Student ID
 */
export async function getStudentAchievements(studentId: string): Promise<any[]> {
  try {
    const db = await initDB();
    
    return await db.getAllFromIndex('achievements', 'by-student', studentId);
  } catch (error) {
    console.error('Error getting student achievements:', error);
    trackOfflineStorageError(String(error), 'read');
    throw error;
  }
}

/**
 * Get unsynced achievements from IndexedDB
 */
export async function getUnsyncedAchievements(): Promise<any[]> {
  try {
    const db = await initDB();
    
    return await db.getAllFromIndex('achievements', 'by-synced', false);
  } catch (error) {
    console.error('Error getting unsynced achievements:', error);
    trackOfflineStorageError(String(error), 'read');
    throw error;
  }
}

/**
 * Mark an achievement as synced
 * @param achievementId Achievement ID
 */
export async function markAchievementAsSynced(achievementId: string): Promise<void> {
  try {
    const db = await initDB();
    
    const achievement = await db.get('achievements', achievementId);
    if (achievement) {
      achievement.synced = true;
      achievement.lastUpdated = Date.now();
      await db.put('achievements', achievement);
    }
  } catch (error) {
    console.error('Error marking achievement as synced:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Update achievement progress
 * @param achievementId Achievement ID
 * @param progress New progress value
 * @param unlocked Whether the achievement is unlocked
 */
export async function updateAchievementProgress(
  achievementId: string,
  progress: number,
  unlocked?: boolean
): Promise<void> {
  try {
    const db = await initDB();
    
    const achievement = await db.get('achievements', achievementId);
    if (achievement) {
      achievement.progress = progress;
      
      // If unlocked is provided, use it; otherwise, calculate based on progress
      if (unlocked !== undefined) {
        achievement.unlocked = unlocked;
      } else {
        achievement.unlocked = progress >= achievement.total;
      }
      
      // If newly unlocked, set unlockedAt
      if (achievement.unlocked && !achievement.unlockedAt) {
        achievement.unlockedAt = Date.now();
      }
      
      achievement.synced = false;
      achievement.lastUpdated = Date.now();
      
      await db.put('achievements', achievement);
    }
  } catch (error) {
    console.error('Error updating achievement progress:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Save points to IndexedDB
 * @param points Points data to save
 */
export async function savePoints(points: {
  id: string;
  studentId: string;
  amount: number;
  source: string;
  sourceId?: string;
  classId?: string;
  subjectId?: string;
  description?: string;
  synced?: boolean;
}): Promise<void> {
  try {
    const db = await initDB();
    
    await db.put('points', {
      ...points,
      synced: points.synced ?? false,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('Error saving points:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get points for a student from IndexedDB
 * @param studentId Student ID
 */
export async function getStudentPoints(studentId: string): Promise<any[]> {
  try {
    const db = await initDB();
    
    return await db.getAllFromIndex('points', 'by-student', studentId);
  } catch (error) {
    console.error('Error getting student points:', error);
    trackOfflineStorageError(String(error), 'read');
    throw error;
  }
}

/**
 * Get unsynced points from IndexedDB
 */
export async function getUnsyncedPoints(): Promise<any[]> {
  try {
    const db = await initDB();
    
    return await db.getAllFromIndex('points', 'by-synced', false);
  } catch (error) {
    console.error('Error getting unsynced points:', error);
    trackOfflineStorageError(String(error), 'read');
    throw error;
  }
}

/**
 * Mark points as synced
 * @param pointsId Points ID
 */
export async function markPointsAsSynced(pointsId: string): Promise<void> {
  try {
    const db = await initDB();
    
    const points = await db.get('points', pointsId);
    if (points) {
      points.synced = true;
      points.lastUpdated = Date.now();
      await db.put('points', points);
    }
  } catch (error) {
    console.error('Error marking points as synced:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Save level to IndexedDB
 * @param level Level data to save
 */
export async function saveLevel(level: {
  id: string;
  studentId: string;
  level: number;
  currentExp: number;
  requiredExp: number;
  classId?: string;
  synced?: boolean;
}): Promise<void> {
  try {
    const db = await initDB();
    
    await db.put('levels', {
      ...level,
      synced: level.synced ?? false,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('Error saving level:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get level for a student from IndexedDB
 * @param studentId Student ID
 */
export async function getStudentLevel(studentId: string): Promise<any | null> {
  try {
    const db = await initDB();
    
    const levels = await db.getAllFromIndex('levels', 'by-student', studentId);
    return levels.length > 0 ? levels[0] : null;
  } catch (error) {
    console.error('Error getting student level:', error);
    trackOfflineStorageError(String(error), 'read');
    throw error;
  }
}

/**
 * Get unsynced levels from IndexedDB
 */
export async function getUnsyncedLevels(): Promise<any[]> {
  try {
    const db = await initDB();
    
    return await db.getAllFromIndex('levels', 'by-synced', false);
  } catch (error) {
    console.error('Error getting unsynced levels:', error);
    trackOfflineStorageError(String(error), 'read');
    throw error;
  }
}

/**
 * Mark level as synced
 * @param levelId Level ID
 */
export async function markLevelAsSynced(levelId: string): Promise<void> {
  try {
    const db = await initDB();
    
    const level = await db.get('levels', levelId);
    if (level) {
      level.synced = true;
      level.lastUpdated = Date.now();
      await db.put('levels', level);
    }
  } catch (error) {
    console.error('Error marking level as synced:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Clear old data from IndexedDB (older than specified days)
 * @param days Number of days to keep data
 */
export async function clearOldData(days: number = 30): Promise<void> {
  try {
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
    
    // Clear old results (only if synced)
    const oldResults = await db.getAllFromIndex('results', 'by-last-updated');
    for (const result of oldResults) {
      if (result.lastUpdated < cutoffTime && result.synced) {
        await db.delete('results', result.id);
      }
    }
    
    // Clear old achievements (only if synced)
    const oldAchievements = await db.getAllFromIndex('achievements', 'by-last-updated');
    for (const achievement of oldAchievements) {
      if (achievement.lastUpdated < cutoffTime && achievement.synced) {
        await db.delete('achievements', achievement.id);
      }
    }
    
    // Clear old points (only if synced)
    const oldPoints = await db.getAllFromIndex('points', 'by-last-updated');
    for (const points of oldPoints) {
      if (points.lastUpdated < cutoffTime && points.synced) {
        await db.delete('points', points.id);
      }
    }
    
    // Clear old levels (only if synced)
    const oldLevels = await db.getAllFromIndex('levels', 'by-last-updated');
    for (const level of oldLevels) {
      if (level.lastUpdated < cutoffTime && level.synced) {
        await db.delete('levels', level.id);
      }
    }
  } catch (error) {
    console.error('Error clearing old data:', error);
    trackOfflineStorageError(String(error), 'delete');
    throw error;
  }
}

/**
 * Resolve conflicts between offline and online data
 * @param offlineData Offline data
 * @param onlineData Online data
 */
export function resolveConflict<T extends { lastUpdated: number }>(offlineData: T, onlineData: T): T {
  // Simple last-write-wins strategy
  return offlineData.lastUpdated > onlineData.lastUpdated ? offlineData : onlineData;
}
