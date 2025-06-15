import { appCache, dataCache } from "@/server/api/utils/cache";
import { logger } from "@/server/api/utils/logger";

// Cache keys
const CACHE_KEYS = {
  STUDENT_PROFILE: (userId: string) => `student_profile:${userId}`,
  STUDENT_ACTIVITIES: (studentId: string) => `student_activities:${studentId}`,
  STUDENT_GRADES: (studentId: string) => `student_grades:${studentId}`,
  STUDENT_ANNOUNCEMENTS: (studentId: string) => `student_announcements:${studentId}`,
  STUDENT_LEADERBOARD: (campusId: string) => `student_leaderboard:${campusId}`,
  STUDENT_METRICS: (studentId: string) => `student_metrics:${studentId}`,
};

// Cache TTLs in milliseconds
const CACHE_TTL = {
  PROFILE: 5 * 60 * 1000, // 5 minutes
  ACTIVITIES: 2 * 60 * 1000, // 2 minutes
  GRADES: 5 * 60 * 1000, // 5 minutes
  ANNOUNCEMENTS: 5 * 60 * 1000, // 5 minutes
  LEADERBOARD: 10 * 60 * 1000, // 10 minutes
  METRICS: 2 * 60 * 1000, // 2 minutes
};

/**
 * Get data from cache or fetch it using the provided function
 * @param key Cache key
 * @param fetchFn Function to fetch data if not in cache
 * @param ttl Time to live in milliseconds
 * @returns Cached or freshly fetched data
 */
export async function getOrFetchData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.PROFILE
): Promise<T> {
  try {
    // Try to get from cache first
    const cachedData = dataCache.get<T>(key);
    if (cachedData) {
      logger.debug(`Cache hit for ${key}`);
      return cachedData;
    }

    // If not in cache, fetch fresh data
    logger.debug(`Cache miss for ${key}, fetching fresh data`);
    const freshData = await fetchFn();
    
    // Store in cache
    dataCache.set(key, freshData, { ttl });
    
    return freshData;
  } catch (error) {
    logger.error(`Error in getOrFetchData for key ${key}`, { error });
    throw error;
  }
}

/**
 * Invalidate cache for a specific key
 * @param key Cache key to invalidate
 */
export function invalidateCache(key: string): void {
  dataCache.delete(key);
  logger.debug(`Cache invalidated for ${key}`);
}

/**
 * Invalidate all student-related caches for a specific student
 * @param userId User ID
 * @param studentId Student profile ID
 * @param campusId Campus ID
 */
export function invalidateStudentCaches(
  userId: string,
  studentId: string,
  campusId?: string
): void {
  invalidateCache(CACHE_KEYS.STUDENT_PROFILE(userId));
  invalidateCache(CACHE_KEYS.STUDENT_ACTIVITIES(studentId));
  invalidateCache(CACHE_KEYS.STUDENT_GRADES(studentId));
  invalidateCache(CACHE_KEYS.STUDENT_ANNOUNCEMENTS(studentId));
  invalidateCache(CACHE_KEYS.STUDENT_METRICS(studentId));
  
  if (campusId) {
    invalidateCache(CACHE_KEYS.STUDENT_LEADERBOARD(campusId));
  }
  
  logger.debug(`All student caches invalidated for user ${userId}`);
}

export { CACHE_KEYS, CACHE_TTL };
