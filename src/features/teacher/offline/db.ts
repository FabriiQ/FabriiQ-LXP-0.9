'use client';

import { openDB, IDBPDatabase } from 'idb';
import { trackOfflineStorageError } from './analytics';

// Database name and version
const DB_NAME = 'teacher-portal-db';
const DB_VERSION = 1;

// Database promise
let dbPromise: Promise<IDBPDatabase<TeacherDB>> | null = null;

// Database schema
interface TeacherDB {
  classes: {
    key: string;
    value: {
      id: string;
      data: any;
      lastUpdated: number;
    };
    indexes: { 'by-last-updated': number };
  };

  students: {
    key: string;
    value: {
      id: string;
      classId: string;
      data: any;
      lastUpdated: number;
    };
    indexes: { 'by-class': string; 'by-last-updated': number };
  };

  attendance: {
    key: string;
    value: {
      id: string;
      classId: string;
      date: string;
      records: any[];
      synced: boolean;
      lastUpdated: number;
    };
    indexes: {
      'by-class': string;
      'by-date': string;
      'by-synced': boolean;
      'by-last-updated': number
    };
  };

  assessments: {
    key: string;
    value: {
      id: string;
      classId: string;
      data: any;
      grades: any[];
      synced: boolean;
      lastUpdated: number;
    };
    indexes: {
      'by-class': string;
      'by-synced': boolean;
      'by-last-updated': number
    };
  };
}

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase<TeacherDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TeacherDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create classes store
        if (!db.objectStoreNames.contains('classes')) {
          const classesStore = db.createObjectStore('classes', { keyPath: 'id' });
          classesStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create students store
        if (!db.objectStoreNames.contains('students')) {
          const studentsStore = db.createObjectStore('students', { keyPath: 'id' });
          studentsStore.createIndex('by-class', 'classId');
          studentsStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create attendance store
        if (!db.objectStoreNames.contains('attendance')) {
          const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id' });
          attendanceStore.createIndex('by-class', 'classId');
          attendanceStore.createIndex('by-date', 'date');
          attendanceStore.createIndex('by-synced', 'synced');
          attendanceStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Create assessments store
        if (!db.objectStoreNames.contains('assessments')) {
          const assessmentsStore = db.createObjectStore('assessments', { keyPath: 'id' });
          assessmentsStore.createIndex('by-class', 'classId');
          assessmentsStore.createIndex('by-synced', 'synced');
          assessmentsStore.createIndex('by-last-updated', 'lastUpdated');
        }
      }
    });
  }

  return dbPromise;
}

// Class-related functions

/**
 * Save a class to IndexedDB
 * @param classId Unique identifier for the class
 * @param classData Class data to save
 */
export async function saveClass(classId: string, classData: any): Promise<void> {
  try {
    const db = await initDB();

    await db.put('classes', {
      id: classId,
      data: classData,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('Error saving class:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get a class from IndexedDB
 * @param classId Class ID
 */
export async function getClass(classId: string): Promise<any | null> {
  try {
    const db = await initDB();

    const classData = await db.get('classes', classId);
    return classData?.data || null;
  } catch (error) {
    console.error('Error getting class:', error);
    trackOfflineStorageError(String(error), 'read');
    throw error;
  }
}

// Student-related functions

/**
 * Save a student to IndexedDB
 * @param studentId Student ID
 * @param classId Class ID
 * @param studentData Student data to save
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
  } catch (error) {
    console.error('Error saving student:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get students for a class from IndexedDB
 * @param classId Class ID
 */
export async function getStudentsByClass(classId: string): Promise<any[]> {
  try {
    const db = await initDB();

    const students = await db.getAllFromIndex('students', 'by-class', classId);
    return students.map(student => student.data);
  } catch (error) {
    console.error('Error getting students by class:', error);
    trackOfflineStorageError(String(error), 'read');
    throw error;
  }
}

// Attendance-related functions

/**
 * Save attendance to IndexedDB
 * @param attendanceId Unique identifier for the attendance record
 * @param classId Class ID
 * @param date Date of attendance
 * @param records Attendance records
 * @param synced Whether the attendance has been synced to the server
 */
export async function saveAttendance(
  attendanceId: string,
  classId: string,
  date: string,
  records: any[],
  synced: boolean = false
): Promise<void> {
  try {
    const db = await initDB();

    await db.put('attendance', {
      id: attendanceId,
      classId,
      date,
      records,
      synced,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get unsynced attendance from IndexedDB
 */
export async function getUnsyncedAttendance(): Promise<any[]> {
  try {
    const db = await initDB();

    // Use a transaction to safely query the index
    const tx = db.transaction('attendance', 'readonly');
    const index = tx.store.index('by-synced');

    // Use cursor instead of getAllFromIndex to handle potential key issues
    const unsyncedAttendance = [];
    let cursor = await index.openCursor();

    while (cursor) {
      // Only include records where synced is explicitly false
      if (cursor.value.synced === false) {
        unsyncedAttendance.push(cursor.value);
      }
      cursor = await cursor.continue();
    }

    return unsyncedAttendance;
  } catch (error) {
    console.error('Error getting unsynced attendance:', error);
    trackOfflineStorageError(String(error), 'read');
    return []; // Return empty array instead of throwing to prevent sync failures
  }
}

/**
 * Mark attendance as synced in IndexedDB
 * @param attendanceId Attendance ID
 */
export async function markAttendanceAsSynced(attendanceId: string): Promise<void> {
  try {
    const db = await initDB();

    const attendance = await db.get('attendance', attendanceId);
    if (attendance) {
      attendance.synced = true;
      attendance.lastUpdated = Date.now();
      await db.put('attendance', attendance);
    }
  } catch (error) {
    console.error('Error marking attendance as synced:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

// Assessment-related functions

/**
 * Save assessment to IndexedDB
 * @param assessmentId Unique identifier for the assessment
 * @param classId Class ID
 * @param assessmentData Assessment data
 * @param grades Assessment grades
 * @param synced Whether the assessment has been synced to the server
 */
export async function saveAssessment(
  assessmentId: string,
  classId: string,
  assessmentData: any,
  grades: any[] = [],
  synced: boolean = false
): Promise<void> {
  try {
    const db = await initDB();

    await db.put('assessments', {
      id: assessmentId,
      classId,
      data: assessmentData,
      grades,
      synced,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('Error saving assessment:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}

/**
 * Get unsynced assessments from IndexedDB
 */
export async function getUnsyncedAssessments(): Promise<any[]> {
  try {
    const db = await initDB();

    // Use a transaction to safely query the index
    const tx = db.transaction('assessments', 'readonly');
    const index = tx.store.index('by-synced');

    // Use cursor instead of getAllFromIndex to handle potential key issues
    const unsyncedAssessments = [];
    let cursor = await index.openCursor();

    while (cursor) {
      // Only include records where synced is explicitly false
      if (cursor.value.synced === false) {
        unsyncedAssessments.push(cursor.value);
      }
      cursor = await cursor.continue();
    }

    return unsyncedAssessments;
  } catch (error) {
    console.error('Error getting unsynced assessments:', error);
    trackOfflineStorageError(String(error), 'read');
    return []; // Return empty array instead of throwing to prevent sync failures
  }
}

/**
 * Mark assessment as synced in IndexedDB
 * @param assessmentId Assessment ID
 */
export async function markAssessmentAsSynced(assessmentId: string): Promise<void> {
  try {
    const db = await initDB();

    const assessment = await db.get('assessments', assessmentId);
    if (assessment) {
      assessment.synced = true;
      assessment.lastUpdated = Date.now();
      await db.put('assessments', assessment);
    }
  } catch (error) {
    console.error('Error marking assessment as synced:', error);
    trackOfflineStorageError(String(error), 'write');
    throw error;
  }
}
