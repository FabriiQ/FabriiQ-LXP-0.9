'use client';

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { logger } from '@/server/api/utils/logger';

// Database name and version
const DB_NAME = 'coordinator-portal-db';
const DB_VERSION = 1;

// Database schema
interface CoordinatorDB extends DBSchema {
  'teachers': {
    key: string;
    value: {
      id: string;
      data: any;
      lastUpdated: number;
    };
    indexes: {
      'by-last-updated': number;
    };
  };
  'students': {
    key: string;
    value: {
      id: string;
      classId: string;
      data: any;
      lastUpdated: number;
    };
    indexes: {
      'by-class': string;
      'by-last-updated': number;
    };
  };
  'classes': {
    key: string;
    value: {
      id: string;
      data: any;
      lastUpdated: number;
    };
    indexes: {
      'by-last-updated': number;
    };
  };
  'analytics': {
    key: string;
    value: {
      id: string; // e.g., 'teacher-{teacherId}-{timeframe}'
      type: string; // e.g., 'teacher', 'class', 'subject'
      referenceId: string; // teacherId, classId, or subjectId
      data: any;
      lastUpdated: number;
    };
    indexes: {
      'by-type': string;
      'by-reference': string;
      'by-last-updated': number;
    };
  };
  'syncQueue': {
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

// Database promise
let dbPromise: Promise<IDBPDatabase<CoordinatorDB>> | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase<CoordinatorDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CoordinatorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create teachers store
        if (!db.objectStoreNames.contains('teachers')) {
          const teachersStore = db.createObjectStore('teachers', { keyPath: 'id' });
          teachersStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create students store
        if (!db.objectStoreNames.contains('students')) {
          const studentsStore = db.createObjectStore('students', { keyPath: 'id' });
          studentsStore.createIndex('by-class', 'classId');
          studentsStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create classes store
        if (!db.objectStoreNames.contains('classes')) {
          const classesStore = db.createObjectStore('classes', { keyPath: 'id' });
          classesStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create analytics store
        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id' });
          analyticsStore.createIndex('by-type', 'type');
          analyticsStore.createIndex('by-reference', 'referenceId');
          analyticsStore.createIndex('by-last-updated', 'lastUpdated');
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

// Teacher-related functions

/**
 * Save teacher data to IndexedDB
 */
export async function saveTeacher(teacherId: string, teacherData: any): Promise<void> {
  try {
    const db = await initDB();

    await db.put('teachers', {
      id: teacherId,
      data: teacherData,
      lastUpdated: Date.now()
    });

    logger.debug('Teacher data saved to IndexedDB', { teacherId });
  } catch (error) {
    logger.error('Error saving teacher data to IndexedDB', { error, teacherId });
    throw error;
  }
}

/**
 * Get teacher data from IndexedDB
 */
export async function getTeacher(teacherId: string): Promise<any | null> {
  try {
    const db = await initDB();
    const teacher = await db.get('teachers', teacherId);

    return teacher?.data || null;
  } catch (error) {
    logger.error('Error getting teacher data from IndexedDB', { error, teacherId });
    return null;
  }
}

/**
 * Get all teachers from IndexedDB
 */
export async function getAllTeachers(): Promise<any[]> {
  try {
    const db = await initDB();
    const teachers = await db.getAll('teachers');

    return teachers.map(teacher => teacher.data);
  } catch (error) {
    logger.error('Error getting all teachers from IndexedDB', { error });
    return [];
  }
}

// Student-related functions

/**
 * Save student data to IndexedDB
 */
export async function saveStudent(studentId: string, classId: string, studentData: any): Promise<void> {
  try {
    const db = await initDB();

    await db.put('students', {
      id: studentId,
      classId,
      data: studentData,
      lastUpdated: Date.now()
    });

    logger.debug('Student data saved to IndexedDB', { studentId, classId });
  } catch (error) {
    logger.error('Error saving student data to IndexedDB', { error, studentId, classId });
    throw error;
  }
}

/**
 * Get student data from IndexedDB
 */
export async function getStudent(studentId: string): Promise<any | null> {
  try {
    const db = await initDB();
    const student = await db.get('students', studentId);

    return student?.data || null;
  } catch (error) {
    logger.error('Error getting student data from IndexedDB', { error, studentId });
    return null;
  }
}

/**
 * Get all students from IndexedDB
 */
export async function getAllStudents(classId?: string): Promise<any[]> {
  try {
    const db = await initDB();

    if (classId) {
      // Get students by class
      const index = db.transaction('students').store.index('by-class');
      const students = await index.getAll(classId);
      return students.map(student => student.data);
    } else {
      // Get all students
      const students = await db.getAll('students');
      return students.map(student => student.data);
    }
  } catch (error) {
    logger.error('Error getting students from IndexedDB', { error, classId });
    return [];
  }
}

// Class-related functions

/**
 * Save class data to IndexedDB
 */
export async function saveClass(classId: string, classData: any): Promise<void> {
  try {
    const db = await initDB();

    await db.put('classes', {
      id: classId,
      data: classData,
      lastUpdated: Date.now()
    });

    logger.debug('Class data saved to IndexedDB', { classId });
  } catch (error) {
    logger.error('Error saving class data to IndexedDB', { error, classId });
    throw error;
  }
}

/**
 * Get class data from IndexedDB
 */
export async function getClass(classId: string): Promise<any | null> {
  try {
    const db = await initDB();
    const classData = await db.get('classes', classId);

    return classData?.data || null;
  } catch (error) {
    logger.error('Error getting class data from IndexedDB', { error, classId });
    return null;
  }
}

/**
 * Get all classes from IndexedDB
 */
export async function getAllClasses(): Promise<any[]> {
  try {
    const db = await initDB();
    const classes = await db.getAll('classes');

    return classes.map(classData => classData.data);
  } catch (error) {
    logger.error('Error getting all classes from IndexedDB', { error });
    return [];
  }
}

// Analytics-related functions

/**
 * Save analytics data to IndexedDB
 */
export async function saveAnalytics(
  type: string,
  referenceId: string,
  data: any,
  timeframe?: string
): Promise<void> {
  try {
    const db = await initDB();
    const id = timeframe
      ? `${type}-${referenceId}-${timeframe}`
      : `${type}-${referenceId}`;

    await db.put('analytics', {
      id,
      type,
      referenceId,
      data,
      lastUpdated: Date.now()
    });

    logger.debug('Analytics data saved to IndexedDB', { type, referenceId });
  } catch (error) {
    logger.error('Error saving analytics data to IndexedDB', { error, type, referenceId });
    throw error;
  }
}

/**
 * Get analytics data from IndexedDB
 */
export async function getAnalytics(
  type: string,
  referenceId: string,
  timeframe?: string
): Promise<any | null> {
  try {
    const db = await initDB();
    const id = timeframe
      ? `${type}-${referenceId}-${timeframe}`
      : `${type}-${referenceId}`;

    const analytics = await db.get('analytics', id);

    return analytics?.data || null;
  } catch (error) {
    logger.error('Error getting analytics data from IndexedDB', { error, type, referenceId });
    return null;
  }
}

// Sync queue functions

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

    logger.debug('Operation added to sync queue', { operation, storeName });
  } catch (error) {
    logger.error('Error adding operation to sync queue', { error, operation, storeName });
    throw error;
  }
}

/**
 * Get all items in sync queue
 */
export async function getSyncQueue(): Promise<any[]> {
  try {
    const db = await initDB();
    return db.getAll('syncQueue');
  } catch (error) {
    logger.error('Error getting sync queue', { error });
    return [];
  }
}

/**
 * Remove item from sync queue
 */
export async function removeFromSyncQueue(id: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete('syncQueue', id);
  } catch (error) {
    logger.error('Error removing item from sync queue', { error, id });
    throw error;
  }
}

/**
 * Update sync queue item
 */
export async function updateSyncQueueItem(id: string, updates: Partial<any>): Promise<void> {
  try {
    const db = await initDB();
    const item = await db.get('syncQueue', id);

    if (item) {
      await db.put('syncQueue', {
        ...item,
        ...updates,
        lastAttempt: Date.now()
      });
    }
  } catch (error) {
    logger.error('Error updating sync queue item', { error, id });
    throw error;
  }
}

/**
 * Delete teacher data from IndexedDB
 */
export async function deleteTeacher(teacherId: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete('teachers', teacherId);
    logger.debug('Teacher data deleted from IndexedDB', { teacherId });
  } catch (error) {
    logger.error('Error deleting teacher data from IndexedDB', { error, teacherId });
    throw error;
  }
}

/**
 * Delete student data from IndexedDB
 */
export async function deleteStudent(studentId: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete('students', studentId);
    logger.debug('Student data deleted from IndexedDB', { studentId });
  } catch (error) {
    logger.error('Error deleting student data from IndexedDB', { error, studentId });
    throw error;
  }
}

/**
 * Delete class data from IndexedDB
 */
export async function deleteClass(classId: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete('classes', classId);
    logger.debug('Class data deleted from IndexedDB', { classId });
  } catch (error) {
    logger.error('Error deleting class data from IndexedDB', { error, classId });
    throw error;
  }
}

/**
 * Delete analytics data from IndexedDB
 */
export async function deleteAnalytics(
  type: string,
  referenceId: string,
  timeframe?: string
): Promise<void> {
  try {
    const db = await initDB();
    const id = timeframe
      ? `${type}-${referenceId}-${timeframe}`
      : `${type}-${referenceId}`;

    await db.delete('analytics', id);
    logger.debug('Analytics data deleted from IndexedDB', { type, referenceId });
  } catch (error) {
    logger.error('Error deleting analytics data from IndexedDB', { error, type, referenceId });
    throw error;
  }
}
