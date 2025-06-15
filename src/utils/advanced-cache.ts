// This file must be used on the server side only

import { unstable_cache } from 'next/cache';
import { logger } from '@/server/api/utils/logger';

// Cache TTLs in seconds - much longer for better performance with large user bases
export const CACHE_TTL = {
  USER: 24 * 60 * 60, // 24 hours
  STUDENT_PROFILE: 24 * 60 * 60, // 24 hours
  ACTIVITIES: 30 * 60, // 30 minutes (keep short as activities change frequently)
  GRADES: 24 * 60 * 60, // 24 hours
  ATTENDANCE: 24 * 60 * 60, // 24 hours
  ANNOUNCEMENTS: 2 * 60 * 60, // 2 hours (keep short as announcements change frequently)
  LEADERBOARD: 4 * 60 * 60, // 4 hours (keep as is)
};

// Cache tags for better invalidation
export const CACHE_TAGS = {
  USER: (userId: string) => [`user-${userId}`],
  STUDENT: (studentId: string) => [`student-${studentId}`],
  CLASS: (classId: string) => [`class-${classId}`],
  CAMPUS: (campusId: string) => [`campus-${campusId}`],
  ACTIVITY: (activityId: string) => [`activity-${activityId}`],
  SUBJECT: (subjectId: string) => [`subject-${subjectId}`],
};

/**
 * Create a cached function with proper error handling and logging
 * @param fn The function to cache
 * @param tags Cache tags for invalidation
 * @param ttl Time to live in seconds
 * @returns Cached function
 */
export function createCachedFunction<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  getTags: (...args: Args) => string[],
  ttl: number = CACHE_TTL.USER
) {

  return unstable_cache(
    async (...args: Args) => {
      try {
        return await fn(...args);
      } catch (error) {
        logger.error(`Cache function error: ${error instanceof Error ? error.message : 'Unknown error'}`, { error });
        throw error;
      }
    },
    // Use the function name and a unique identifier as the cache key
    ['advanced-cache', fn.name],
    {
      revalidate: ttl,
      // Use static tags for invalidation
      tags: ['cache-function']
    }
  );
}

/**
 * Create a cached function with user-specific caching
 * @param fn The function to cache
 * @param ttl Time to live in seconds
 * @returns Cached function that takes userId as first parameter
 */
export function createUserCachedFunction<T, Args extends any[]>(
  fn: (userId: string, ...args: Args) => Promise<T>,
  ttl: number = CACHE_TTL.USER
) {
  return unstable_cache(
    async (userId: string, ...args: Args) => {
      try {
        return await fn(userId, ...args);
      } catch (error) {
        logger.error(`User cache function error: ${error instanceof Error ? error.message : 'Unknown error'}`, { error, userId });
        throw error;
      }
    },
    ['user-cache', fn.name],
    {
      revalidate: ttl,
      tags: ['user', 'cache-function']
    }
  );
}

/**
 * Create a cached function with student-specific caching
 * @param fn The function to cache
 * @param ttl Time to live in seconds
 * @returns Cached function that takes studentId as first parameter
 */
export function createStudentCachedFunction<T, Args extends any[]>(
  fn: (studentId: string, ...args: Args) => Promise<T>,
  ttl: number = CACHE_TTL.STUDENT_PROFILE
) {
  return unstable_cache(
    async (studentId: string, ...args: Args) => {
      try {
        return await fn(studentId, ...args);
      } catch (error) {
        logger.error(`Student cache function error: ${error instanceof Error ? error.message : 'Unknown error'}`, { error, studentId });
        throw error;
      }
    },
    ['student-cache', fn.name],
    {
      revalidate: ttl,
      tags: ['student', 'cache-function']
    }
  );
}

/**
 * Create a cached function with class-specific caching
 * @param fn The function to cache
 * @param ttl Time to live in seconds
 * @returns Cached function that takes classId as first parameter
 */
export function createClassCachedFunction<T, Args extends any[]>(
  fn: (classId: string, ...args: Args) => Promise<T>,
  ttl: number = CACHE_TTL.ACTIVITIES
) {
  return unstable_cache(
    async (classId: string, ...args: Args) => {
      try {
        return await fn(classId, ...args);
      } catch (error) {
        logger.error(`Class cache function error: ${error instanceof Error ? error.message : 'Unknown error'}`, { error, classId });
        throw error;
      }
    },
    ['class-cache', fn.name],
    {
      revalidate: ttl,
      tags: ['class', 'cache-function']
    }
  );
}
