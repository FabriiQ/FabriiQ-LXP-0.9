/**
 * Bloom's Taxonomy Cache Service
 *
 * This service provides caching functionality for Bloom's Taxonomy related data.
 * It uses the MemoryCache utility to cache data in memory with configurable TTL.
 */

// Define a simple MemoryCache class
class MemoryCache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();

  constructor(private prefix: string, private defaultTtl: number = 60 * 1000) {}

  get<U = T>(key: string): U | null {
    const item = this.cache.get(`${this.prefix}:${key}`);
    if (!item || item.expiry < Date.now()) return null;
    return item.value as unknown as U;
  }

  set(key: string, value: T, ttl: number = this.defaultTtl): void {
    this.cache.set(`${this.prefix}:${key}`, {
      value,
      expiry: Date.now() + ttl
    });
  }

  delete(key: string): void {
    this.cache.delete(`${this.prefix}:${key}`);
  }

  keys(): string[] {
    return Array.from(this.cache.keys()).map(k =>
      k.replace(`${this.prefix}:`, '')
    );
  }
}

import { unstable_cache } from 'next/cache';

// Define cache configuration constants
const CACHE_CONFIG = {
  DURATIONS: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },
  TAGS: {
    BLOOMS_TAXONOMY: 'blooms_taxonomy',
    BLOOMS_ANALYTICS: 'blooms_analytics',
    MASTERY: 'mastery',
    RUBRIC: 'rubric',
    REPORT: 'report',
  }
};

// Create cache instances for different parts of Bloom's Taxonomy
export const bloomsTaxonomyCache = new MemoryCache<any>("blooms:taxonomy", 24 * 60 * 60 * 1000); // 24 hours
export const bloomsAnalyticsCache = new MemoryCache<any>("blooms:analytics", 5 * 60 * 1000); // 5 minutes
export const masteryCache = new MemoryCache<any>("blooms:mastery", 10 * 60 * 1000); // 10 minutes
export const rubricCache = new MemoryCache<any>("blooms:rubric", 30 * 60 * 1000); // 30 minutes
export const reportCache = new MemoryCache<any>("blooms:report", 15 * 60 * 1000); // 15 minutes

/**
 * Cache a function with the specified tags and duration using Next.js unstable_cache
 */
export function cacheBloomsFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  tags: string[],
  duration: number = CACHE_CONFIG.DURATIONS.MEDIUM
): T {
  return unstable_cache(fn, tags, { revalidate: duration }) as T;
}

/**
 * Cache Bloom's Taxonomy query
 */
export function cacheBloomsTaxonomyQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheBloomsFunction(fn, [CACHE_CONFIG.TAGS.BLOOMS_TAXONOMY], CACHE_CONFIG.DURATIONS.LONG);
}

/**
 * Cache Bloom's Analytics query
 */
export function cacheBloomsAnalyticsQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheBloomsFunction(fn, [CACHE_CONFIG.TAGS.BLOOMS_ANALYTICS], CACHE_CONFIG.DURATIONS.MEDIUM);
}

/**
 * Cache Mastery query
 */
export function cacheMasteryQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheBloomsFunction(fn, [CACHE_CONFIG.TAGS.MASTERY], CACHE_CONFIG.DURATIONS.MEDIUM);
}

/**
 * Cache Rubric query
 */
export function cacheRubricQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheBloomsFunction(fn, [CACHE_CONFIG.TAGS.RUBRIC], CACHE_CONFIG.DURATIONS.MEDIUM);
}

/**
 * Cache Report query
 */
export function cacheReportQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheBloomsFunction(fn, [CACHE_CONFIG.TAGS.REPORT], CACHE_CONFIG.DURATIONS.MEDIUM);
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
  subjectId?: string,
  startDate?: Date,
  endDate?: Date
): string {
  return `student:${studentId}:performance:${classId || 'all'}:${subjectId || 'all'}:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}`;
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
 * Generate a cache key for assessment comparison data
 */
export function generateAssessmentComparisonCacheKey(
  assessmentIds: string[]
): string {
  return `assessment:comparison:${assessmentIds.sort().join(':')}`;
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
 * Generate a cache key for student analytics data
 */
export function generateStudentAnalyticsCacheKey(
  studentId: string,
  subjectId?: string
): string {
  return `student:${studentId}:analytics:${subjectId || 'all'}`;
}

/**
 * Generate a cache key for class analytics data
 */
export function generateClassAnalyticsCacheKey(
  classId: string,
  subjectId?: string
): string {
  return `class:${classId}:analytics:${subjectId || 'all'}`;
}

/**
 * Generate a cache key for report data
 */
export function generateReportCacheKey(
  reportId: string
): string {
  return `report:${reportId}`;
}

/**
 * BloomsCacheService class for managing Bloom's Taxonomy related caching
 */
export class BloomsCacheService {
  /**
   * Get cached class performance data or fetch it using the provided function
   */
  static async getCachedClassPerformance<T>(
    classId: string,
    fetchFn: () => Promise<T>,
    startDate?: Date,
    endDate?: Date,
    ttl: number = 5 * 60 * 1000 // 5 minutes
  ): Promise<T> {
    const cacheKey = generateClassPerformanceCacheKey(classId, startDate, endDate);
    const cachedData = bloomsAnalyticsCache.get<T>(cacheKey);

    if (cachedData !== null) {
      return cachedData;
    }

    const data = await fetchFn();
    bloomsAnalyticsCache.set(cacheKey, data, ttl);
    return data;
  }

  /**
   * Get cached student performance data or fetch it using the provided function
   */
  static async getCachedStudentPerformance<T>(
    studentId: string,
    fetchFn: () => Promise<T>,
    classId?: string,
    subjectId?: string,
    startDate?: Date,
    endDate?: Date,
    ttl: number = 5 * 60 * 1000 // 5 minutes
  ): Promise<T> {
    const cacheKey = generateStudentPerformanceCacheKey(studentId, classId, subjectId, startDate, endDate);
    const cachedData = bloomsAnalyticsCache.get<T>(cacheKey);

    if (cachedData !== null) {
      return cachedData;
    }

    const data = await fetchFn();
    bloomsAnalyticsCache.set(cacheKey, data, ttl);
    return data;
  }

  /**
   * Get cached assessment performance data or fetch it using the provided function
   */
  static async getCachedAssessmentPerformance<T>(
    assessmentId: string,
    fetchFn: () => Promise<T>,
    ttl: number = 10 * 60 * 1000 // 10 minutes
  ): Promise<T> {
    const cacheKey = generateAssessmentPerformanceCacheKey(assessmentId);
    const cachedData = bloomsAnalyticsCache.get<T>(cacheKey);

    if (cachedData !== null) {
      return cachedData;
    }

    const data = await fetchFn();
    bloomsAnalyticsCache.set(cacheKey, data, ttl);
    return data;
  }

  /**
   * Get cached topic mastery data or fetch it using the provided function
   */
  static async getCachedTopicMastery<T>(
    studentId: string,
    topicId: string,
    fetchFn: () => Promise<T>,
    ttl: number = 10 * 60 * 1000 // 10 minutes
  ): Promise<T> {
    const cacheKey = generateTopicMasteryCacheKey(studentId, topicId);
    const cachedData = masteryCache.get<T>(cacheKey);

    if (cachedData !== null) {
      return cachedData;
    }

    const data = await fetchFn();
    masteryCache.set(cacheKey, data, ttl);
    return data;
  }

  /**
   * Invalidate all caches related to a class
   */
  static invalidateClassCaches(classId: string): void {
    // Clear all class-related caches
    bloomsAnalyticsCache.keys().forEach((key: string) => {
      if (key.includes(`class:${classId}`)) {
        bloomsAnalyticsCache.delete(key);
      }
    });
  }

  /**
   * Invalidate all caches related to a student
   */
  static invalidateStudentCaches(studentId: string): void {
    // Clear all student-related caches
    bloomsAnalyticsCache.keys().forEach((key: string) => {
      if (key.includes(`student:${studentId}`)) {
        bloomsAnalyticsCache.delete(key);
      }
    });

    masteryCache.keys().forEach((key: string) => {
      if (key.includes(`student:${studentId}`)) {
        masteryCache.delete(key);
      }
    });
  }

  /**
   * Invalidate all caches related to an assessment
   */
  static invalidateAssessmentCaches(assessmentId: string): void {
    // Clear all assessment-related caches
    bloomsAnalyticsCache.keys().forEach((key: string) => {
      if (key.includes(`assessment:${assessmentId}`)) {
        bloomsAnalyticsCache.delete(key);
      }
    });
  }
}
