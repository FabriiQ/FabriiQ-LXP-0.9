/**
 * Client-side caching utility for Bloom's Taxonomy components
 *
 * This utility provides caching functionality for client-side data to improve UI performance.
 * It uses localStorage for persistent caching and memory for session caching.
 */

// Default cache durations
const DEFAULT_MEMORY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_STORAGE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Cache prefixes
const MEMORY_CACHE_PREFIX = 'bloom_memory_cache_';
const STORAGE_CACHE_PREFIX = 'bloom_storage_cache_';

// Memory cache object
const memoryCache: Record<string, { data: any; expiry: number }> = {};

/**
 * Cache item interface
 */
interface CacheItem<T> {
  data: T;
  expiry: number;
}

/**
 * Cache options interface
 */
export interface CacheOptions {
  duration?: number;
  useStorage?: boolean;
}

/**
 * Set an item in the cache
 * @param key Cache key
 * @param data Data to cache
 * @param options Cache options
 */
export function setCacheItem<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): void {
  const {
    duration = DEFAULT_MEMORY_CACHE_DURATION,
    useStorage = false
  } = options;

  const expiry = Date.now() + duration;
  const cacheItem: CacheItem<T> = { data, expiry };

  // Always set in memory cache
  memoryCache[`${MEMORY_CACHE_PREFIX}${key}`] = cacheItem;

  // Optionally set in localStorage
  if (useStorage) {
    try {
      localStorage.setItem(
        `${STORAGE_CACHE_PREFIX}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.warn('Failed to set cache item in localStorage:', error);
    }
  }
}

/**
 * Get an item from the cache
 * @param key Cache key
 * @param options Cache options
 * @returns Cached data or null if not found or expired
 */
export function getCacheItem<T>(
  key: string,
  options: CacheOptions = {}
): T | null {
  const { useStorage = false } = options;
  const now = Date.now();

  // Try memory cache first
  const memoryCacheKey = `${MEMORY_CACHE_PREFIX}${key}`;
  const memoryCacheItem = memoryCache[memoryCacheKey];

  if (memoryCacheItem && memoryCacheItem.expiry > now) {
    return memoryCacheItem.data as T;
  }

  // If not in memory cache or expired, try localStorage if enabled
  if (useStorage) {
    try {
      const storageCacheKey = `${STORAGE_CACHE_PREFIX}${key}`;
      const storageCacheItemJson = localStorage.getItem(storageCacheKey);

      if (storageCacheItemJson) {
        const storageCacheItem: CacheItem<T> = JSON.parse(storageCacheItemJson);

        if (storageCacheItem.expiry > now) {
          // Update memory cache with the storage cache item
          memoryCache[memoryCacheKey] = storageCacheItem;
          return storageCacheItem.data;
        } else {
          // Remove expired item from localStorage
          localStorage.removeItem(storageCacheKey);
        }
      }
    } catch (error) {
      console.warn('Failed to get cache item from localStorage:', error);
    }
  }

  return null;
}

/**
 * Remove an item from the cache
 * @param key Cache key
 * @param options Cache options
 */
export function removeCacheItem(
  key: string,
  options: CacheOptions = {}
): void {
  const { useStorage = false } = options;

  // Remove from memory cache
  delete memoryCache[`${MEMORY_CACHE_PREFIX}${key}`];

  // Remove from localStorage if enabled
  if (useStorage) {
    try {
      localStorage.removeItem(`${STORAGE_CACHE_PREFIX}${key}`);
    } catch (error) {
      console.warn('Failed to remove cache item from localStorage:', error);
    }
  }
}

/**
 * Clear all cache items with a specific prefix
 * @param prefix Cache key prefix
 * @param options Cache options
 */
export function clearCacheByPrefix(
  prefix: string,
  options: CacheOptions = {}
): void {
  const { useStorage = false } = options;

  // Clear from memory cache
  Object.keys(memoryCache).forEach(key => {
    if (key.startsWith(`${MEMORY_CACHE_PREFIX}${prefix}`)) {
      delete memoryCache[key];
    }
  });

  // Clear from localStorage if enabled
  if (useStorage) {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`${STORAGE_CACHE_PREFIX}${prefix}`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache items from localStorage:', error);
    }
  }
}

/**
 * Clear all cache items
 * @param options Cache options
 */
export function clearAllCache(options: CacheOptions = {}): void {
  const { useStorage = false } = options;

  // Clear all memory cache
  Object.keys(memoryCache).forEach(key => {
    if (key.startsWith(MEMORY_CACHE_PREFIX)) {
      delete memoryCache[key];
    }
  });

  // Clear all localStorage cache if enabled
  if (useStorage) {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear all cache items from localStorage:', error);
    }
  }
}

/**
 * Generate a cache key for class performance data
 */
export function generateClassPerformanceCacheKey(
  classId: string,
  startDate?: Date,
  endDate?: Date
): string {
  return `class:${classId}:performance:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}`;
}

/**
 * Generate a cache key for student performance data
 */
export function generateStudentPerformanceCacheKey(
  studentId: string,
  classId?: string,
  subjectId?: string
): string {
  return `student:${studentId}:performance:${classId || 'all'}:${subjectId || 'all'}`;
}

/**
 * Generate a cache key for assessment performance data
 */
export function generateAssessmentPerformanceCacheKey(
  assessmentId: string
): string {
  return `assessment:${assessmentId}:performance`;
}

/**
 * Generate a cache key for topic mastery data
 */
export function generateTopicMasteryCacheKey(
  studentId: string,
  topicId: string
): string {
  return `student:${studentId}:topic:${topicId}:mastery`;
}

/**
 * Generate a cache key for rubric data
 */
export function generateRubricCacheKey(
  rubricId: string
): string {
  return `rubric:${rubricId}`;
}

/**
 * Generate a cache key for report data
 */
export function generateReportCacheKey(
  reportId: string
): string {
  return `report:${reportId}`;
}
