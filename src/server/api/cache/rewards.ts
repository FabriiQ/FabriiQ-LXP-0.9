/**
 * Rewards Caching System
 * 
 * This module provides a tiered caching system for the rewards functionality,
 * including leaderboards, achievements, and points data.
 * 
 * The implementation uses in-memory caching with different TTLs for different
 * data types, but is designed to be easily migrated to Redis or another
 * distributed cache in the future.
 */

import { logger } from '@/server/api/utils/logger';

// Cache TTLs in milliseconds
export const CACHE_TTL = {
  // Leaderboard data
  LEADERBOARD_DAILY: 5 * 60 * 1000, // 5 minutes
  LEADERBOARD_WEEKLY: 15 * 60 * 1000, // 15 minutes
  LEADERBOARD_MONTHLY: 60 * 60 * 1000, // 1 hour
  LEADERBOARD_TERM: 3 * 60 * 60 * 1000, // 3 hours
  LEADERBOARD_ALL_TIME: 6 * 60 * 60 * 1000, // 6 hours
  
  // Student data
  STUDENT_POINTS: 10 * 60 * 1000, // 10 minutes
  STUDENT_ACHIEVEMENTS: 30 * 60 * 1000, // 30 minutes
  STUDENT_LEVEL: 30 * 60 * 1000, // 30 minutes
  
  // Aggregated data
  POINTS_AGGREGATES: 60 * 60 * 1000, // 1 hour
  ACHIEVEMENT_STATS: 2 * 60 * 60 * 1000, // 2 hours
};

// Cache item interface
interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

/**
 * Tiered cache implementation with different TTLs for different data types
 */
export class RewardsCache {
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize = 10000) {
    this.maxSize = maxSize;
    
    // Set up periodic cleanup of expired items
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // Clean up every 5 minutes
    
    logger.debug(`Initialized rewards cache with max size: ${maxSize}`);
  }

  /**
   * Generates a namespaced key
   */
  private getNamespacedKey(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }

  /**
   * Sets a value in the cache
   */
  set<T>(namespace: string, key: string, value: T, ttl: number): void {
    const namespacedKey = this.getNamespacedKey(namespace, key);
    const expiresAt = Date.now() + ttl;
    
    // Check if we need to evict items
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(namespacedKey, { value, expiresAt });
    logger.debug(`Cache set: ${namespacedKey}, expires in ${ttl}ms`);
  }

  /**
   * Gets a value from the cache
   */
  get<T>(namespace: string, key: string): T | null {
    const namespacedKey = this.getNamespacedKey(namespace, key);
    const item = this.cache.get(namespacedKey) as CacheItem<T> | undefined;
    
    if (!item) {
      return null;
    }
    
    // Check if the item has expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(namespacedKey);
      return null;
    }
    
    return item.value;
  }

  /**
   * Gets a value from the cache or sets it if not found
   */
  async getOrSet<T>(
    namespace: string,
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const cachedValue = this.get<T>(namespace, key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    // Fetch the value
    const value = await fetchFn();
    
    // Cache the value
    this.set(namespace, key, value, ttl);
    
    return value;
  }

  /**
   * Deletes a value from the cache
   */
  delete(namespace: string, key: string): void {
    const namespacedKey = this.getNamespacedKey(namespace, key);
    this.cache.delete(namespacedKey);
  }

  /**
   * Deletes all values with the given namespace
   */
  deleteNamespace(namespace: string): void {
    const prefix = `${namespace}:`;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
    
    logger.debug(`Cleared cache namespace: ${namespace}`);
  }

  /**
   * Cleans up expired items
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logger.debug(`Cleaned up ${expiredCount} expired cache items`);
    }
  }

  /**
   * Evicts the oldest items from the cache
   */
  private evictOldest(): void {
    // Sort keys by expiration time and remove the 10% oldest
    const keys = Array.from(this.cache.entries())
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt)
      .slice(0, Math.ceil(this.cache.size * 0.1))
      .map(([key]) => key);
    
    keys.forEach(key => this.cache.delete(key));
    logger.debug(`Evicted ${keys.length} oldest cache items`);
  }

  /**
   * Destroys the cache and cleans up resources
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
    logger.debug('Rewards cache destroyed');
  }
}

// Create cache instances for different reward data types
export const leaderboardCache = new RewardsCache(5000); // Larger cache for leaderboards
export const studentCache = new RewardsCache(10000); // Larger cache for student data
export const aggregateCache = new RewardsCache(1000); // Smaller cache for aggregates

/**
 * Cache a leaderboard query
 * @param type Leaderboard type (class, subject, overall)
 * @param referenceId Reference ID (classId, subjectId, etc.)
 * @param timeframe Timeframe (daily, weekly, monthly, term, all-time)
 * @param limit Number of entries to return
 * @param offset Pagination offset
 * @param fetchFn Function to fetch the leaderboard data
 * @returns Leaderboard data
 */
export async function cacheLeaderboard<T>(
  type: string,
  referenceId: string,
  timeframe: string,
  limit: number,
  offset: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const key = `${type}:${referenceId}:${timeframe}:${limit}:${offset}`;
  let ttl = CACHE_TTL.LEADERBOARD_DAILY;
  
  // Set TTL based on timeframe
  switch (timeframe) {
    case 'daily':
      ttl = CACHE_TTL.LEADERBOARD_DAILY;
      break;
    case 'weekly':
      ttl = CACHE_TTL.LEADERBOARD_WEEKLY;
      break;
    case 'monthly':
      ttl = CACHE_TTL.LEADERBOARD_MONTHLY;
      break;
    case 'term':
      ttl = CACHE_TTL.LEADERBOARD_TERM;
      break;
    case 'all-time':
      ttl = CACHE_TTL.LEADERBOARD_ALL_TIME;
      break;
  }
  
  return leaderboardCache.getOrSet('leaderboard', key, fetchFn, ttl);
}

/**
 * Cache student points data
 * @param studentId Student ID
 * @param fetchFn Function to fetch the student points data
 * @returns Student points data
 */
export async function cacheStudentPoints<T>(
  studentId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return studentCache.getOrSet('points', studentId, fetchFn, CACHE_TTL.STUDENT_POINTS);
}

/**
 * Cache student achievements data
 * @param studentId Student ID
 * @param fetchFn Function to fetch the student achievements data
 * @returns Student achievements data
 */
export async function cacheStudentAchievements<T>(
  studentId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return studentCache.getOrSet('achievements', studentId, fetchFn, CACHE_TTL.STUDENT_ACHIEVEMENTS);
}

/**
 * Cache student level data
 * @param studentId Student ID
 * @param fetchFn Function to fetch the student level data
 * @returns Student level data
 */
export async function cacheStudentLevel<T>(
  studentId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return studentCache.getOrSet('level', studentId, fetchFn, CACHE_TTL.STUDENT_LEVEL);
}

/**
 * Cache points aggregates data
 * @param key Aggregate key
 * @param fetchFn Function to fetch the points aggregates data
 * @returns Points aggregates data
 */
export async function cachePointsAggregates<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return aggregateCache.getOrSet('points-aggregates', key, fetchFn, CACHE_TTL.POINTS_AGGREGATES);
}

/**
 * Invalidate leaderboard cache
 * @param type Leaderboard type (class, subject, overall)
 * @param referenceId Reference ID (classId, subjectId, etc.)
 */
export function invalidateLeaderboardCache(type: string, referenceId?: string): void {
  if (referenceId) {
    // Invalidate specific leaderboard
    const prefix = `${type}:${referenceId}`;
    const keys = Array.from(leaderboardCache['cache'].keys())
      .filter(key => key.startsWith(`leaderboard:${prefix}`));
    
    keys.forEach(key => leaderboardCache['cache'].delete(key));
    logger.debug(`Invalidated leaderboard cache for ${prefix}`);
  } else {
    // Invalidate all leaderboards of this type
    const prefix = `${type}:`;
    const keys = Array.from(leaderboardCache['cache'].keys())
      .filter(key => key.startsWith(`leaderboard:${prefix}`));
    
    keys.forEach(key => leaderboardCache['cache'].delete(key));
    logger.debug(`Invalidated all ${type} leaderboard caches`);
  }
}

/**
 * Invalidate student cache
 * @param studentId Student ID
 * @param namespace Cache namespace (points, achievements, level)
 */
export function invalidateStudentCache(studentId: string, namespace?: string): void {
  if (namespace) {
    // Invalidate specific namespace for student
    studentCache.delete(namespace, studentId);
    logger.debug(`Invalidated ${namespace} cache for student ${studentId}`);
  } else {
    // Invalidate all student data
    studentCache.delete('points', studentId);
    studentCache.delete('achievements', studentId);
    studentCache.delete('level', studentId);
    logger.debug(`Invalidated all cache for student ${studentId}`);
  }
}
