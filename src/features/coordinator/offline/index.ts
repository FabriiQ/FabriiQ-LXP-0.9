'use client';

// Export database functions
export * from './db';

// Export sync functionality
export * from './sync';

// Export storage functions
export { saveOfflineData, getOfflineData, deleteOfflineData } from './storage';

// Export hooks
export { useOfflineStorage, DEFAULT_OFFLINE_CONFIG } from './hooks/use-offline-storage';
export type { OfflineConfig } from './hooks/use-offline-storage';

// Export offline storage type enum
export enum OfflineStorageType {
  TEACHERS = 'teachers',
  STUDENTS = 'students',
  CLASSES = 'classes',
  PROGRAMS = 'programs',
  ANALYTICS = 'analytics'
}
