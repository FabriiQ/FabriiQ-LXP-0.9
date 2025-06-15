/**
 * Server-side caching utilities for API routes
 */

import { unstable_cache } from 'next/cache';

/**
 * Cache configuration for different resources
 */
export const CACHE_CONFIG = {
  // Cache durations in seconds
  DURATIONS: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },
  
  // Cache tags for different resources
  TAGS: {
    WORKSHEET: 'worksheet',
    ACTIVITY: 'activity',
    SUBJECT: 'subject',
    TOPIC: 'topic',
    TEACHER: 'teacher',
    CLASS: 'class',
  },
};

/**
 * Cache a function with the specified tags and duration
 * @param fn The function to cache
 * @param tags Cache tags for invalidation
 * @param duration Cache duration in seconds
 * @returns The cached function
 */
export function cacheFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  tags: string[],
  duration: number = CACHE_CONFIG.DURATIONS.MEDIUM
): T {
  return unstable_cache(fn, tags, { revalidate: duration }) as T;
}

/**
 * Cache a worksheet query
 * @param fn The worksheet query function
 * @returns The cached function
 */
export function cacheWorksheetQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheFunction(fn, [CACHE_CONFIG.TAGS.WORKSHEET], CACHE_CONFIG.DURATIONS.MEDIUM);
}

/**
 * Cache a subject query
 * @param fn The subject query function
 * @returns The cached function
 */
export function cacheSubjectQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheFunction(fn, [CACHE_CONFIG.TAGS.SUBJECT], CACHE_CONFIG.DURATIONS.LONG);
}

/**
 * Cache a topic query
 * @param fn The topic query function
 * @returns The cached function
 */
export function cacheTopicQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheFunction(fn, [CACHE_CONFIG.TAGS.TOPIC], CACHE_CONFIG.DURATIONS.LONG);
}

/**
 * Cache a teacher query
 * @param fn The teacher query function
 * @returns The cached function
 */
export function cacheTeacherQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheFunction(fn, [CACHE_CONFIG.TAGS.TEACHER], CACHE_CONFIG.DURATIONS.LONG);
}

/**
 * Cache a class query
 * @param fn The class query function
 * @returns The cached function
 */
export function cacheClassQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheFunction(fn, [CACHE_CONFIG.TAGS.CLASS], CACHE_CONFIG.DURATIONS.LONG);
}

/**
 * Cache an activity query
 * @param fn The activity query function
 * @returns The cached function
 */
export function cacheActivityQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheFunction(fn, [CACHE_CONFIG.TAGS.ACTIVITY], CACHE_CONFIG.DURATIONS.MEDIUM);
}
