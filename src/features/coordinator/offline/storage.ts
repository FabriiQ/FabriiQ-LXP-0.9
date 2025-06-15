'use client';

import { logger } from '@/server/api/utils/logger';
import * as db from './db';

/**
 * Save data to offline storage
 * @param storeName The name of the store
 * @param id The ID of the data
 * @param data The data to save
 * @param cacheKey Optional cache key for more specific storage
 */
export async function saveOfflineData(
  storeName: string,
  id: string,
  data: any,
  cacheKey?: string
): Promise<void> {
  try {
    switch (storeName) {
      case 'courseAnalytics':
        return await db.saveAnalytics(id, data, cacheKey);
      case 'programAnalytics':
        return await db.saveAnalytics(id, data, cacheKey);
      case 'classAnalytics':
        return await db.saveAnalytics(id, data, cacheKey);
      case 'teachers':
        return await db.saveTeacher(id, data);
      case 'students':
        return await db.saveStudent(id, data, cacheKey);
      case 'classes':
        return await db.saveClass(id, data);
      default:
        logger.warn(`Unknown store: ${storeName}`);
    }
  } catch (error) {
    logger.error('Error saving offline data', { error, storeName, id });
    throw error;
  }
}

/**
 * Get data from offline storage
 * @param storeName The name of the store
 * @param id The ID of the data
 * @param cacheKey Optional cache key for more specific retrieval
 */
export function getOfflineData(
  storeName: string,
  id: string,
  cacheKey?: string
): any {
  try {
    switch (storeName) {
      case 'courseAnalytics':
        return db.getAnalytics(id, cacheKey);
      case 'programAnalytics':
        return db.getAnalytics(id, cacheKey);
      case 'classAnalytics':
        return db.getAnalytics(id, cacheKey);
      case 'teachers':
        return db.getTeacher(id);
      case 'students':
        return db.getStudent(id);
      case 'classes':
        return db.getClass(id);
      default:
        logger.warn(`Unknown store: ${storeName}`);
        return null;
    }
  } catch (error) {
    logger.error('Error getting offline data', { error, storeName, id });
    return null;
  }
}

/**
 * Delete data from offline storage
 * @param storeName The name of the store
 * @param id The ID of the data
 * @param cacheKey Optional cache key for more specific deletion
 */
export async function deleteOfflineData(
  storeName: string,
  id: string,
  cacheKey?: string
): Promise<void> {
  try {
    switch (storeName) {
      case 'courseAnalytics':
        return await db.deleteAnalytics(id, cacheKey);
      case 'programAnalytics':
        return await db.deleteAnalytics(id, cacheKey);
      case 'classAnalytics':
        return await db.deleteAnalytics(id, cacheKey);
      case 'teachers':
        return await db.deleteTeacher(id);
      case 'students':
        return await db.deleteStudent(id);
      case 'classes':
        return await db.deleteClass(id);
      default:
        logger.warn(`Unknown store: ${storeName}`);
    }
  } catch (error) {
    logger.error('Error deleting offline data', { error, storeName, id });
    throw error;
  }
}
