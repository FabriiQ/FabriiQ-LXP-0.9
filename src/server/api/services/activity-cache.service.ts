/**
 * Activity Cache Service
 * 
 * This service provides caching functionality for frequently accessed activity data,
 * such as student statistics, activity performance metrics, and submission results.
 * 
 * It uses a simple in-memory cache with TTL (time-to-live) for each entry.
 * For production environments, consider using Redis or another distributed cache.
 */

import { logger } from '@/server/api/utils/logger';

// Cache entry interface
interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Timestamp when this entry expires
}

// Cache configuration
interface CacheConfig {
  defaultTtl: number; // Default time-to-live in milliseconds
  maxSize: number; // Maximum number of entries in the cache
}

/**
 * In-memory cache implementation with TTL
 */
class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTtl: 5 * 60 * 1000, // 5 minutes by default
      maxSize: 1000, // Maximum 1000 entries by default
      ...config
    };
  }

  /**
   * Get a value from the cache
   * 
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if the entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  /**
   * Set a value in the cache
   * 
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time-to-live in milliseconds (optional, uses default if not provided)
   */
  set(key: string, value: T, ttl?: number): void {
    // Ensure we don't exceed the maximum cache size
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }
    
    const expiresAt = Date.now() + (ttl || this.config.defaultTtl);
    
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Delete a value from the cache
   * 
   * @param key Cache key
   * @returns True if the key was found and deleted, false otherwise
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the number of entries in the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Evict the oldest entry from the cache
   * 
   * @private
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < oldestTime) {
        oldestTime = entry.expiresAt;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Remove all expired entries from the cache
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create cache instances for different types of data
const studentStatsCache = new MemoryCache<any>({ defaultTtl: 5 * 60 * 1000 }); // 5 minutes
const activityStatsCache = new MemoryCache<any>({ defaultTtl: 15 * 60 * 1000 }); // 15 minutes
const submissionDetailsCache = new MemoryCache<any>({ defaultTtl: 10 * 60 * 1000 }); // 10 minutes

/**
 * Activity Cache Service
 * 
 * This service provides methods for caching and retrieving activity-related data.
 */
export class ActivityCacheService {
  /**
   * Get student activity statistics from cache or compute them
   * 
   * @param studentId Student ID
   * @param filters Optional filters for the statistics
   * @param compute Function to compute the statistics if not in cache
   * @returns The student statistics
   */
  static async getStudentStats(
    studentId: string,
    filters: Record<string, any>,
    compute: () => Promise<any>
  ): Promise<any> {
    // Create a cache key based on the student ID and filters
    const cacheKey = `student-stats:${studentId}:${JSON.stringify(filters)}`;
    
    // Try to get from cache
    const cached = studentStatsCache.get(cacheKey);
    if (cached) {
      logger.debug('Student stats cache hit', { studentId });
      return cached;
    }
    
    // Compute the statistics
    logger.debug('Student stats cache miss, computing', { studentId });
    const stats = await compute();
    
    // Cache the result
    studentStatsCache.set(cacheKey, stats);
    
    return stats;
  }

  /**
   * Get activity statistics from cache or compute them
   * 
   * @param activityId Activity ID
   * @param filters Optional filters for the statistics
   * @param compute Function to compute the statistics if not in cache
   * @returns The activity statistics
   */
  static async getActivityStats(
    activityId: string,
    filters: Record<string, any>,
    compute: () => Promise<any>
  ): Promise<any> {
    // Create a cache key based on the activity ID and filters
    const cacheKey = `activity-stats:${activityId}:${JSON.stringify(filters)}`;
    
    // Try to get from cache
    const cached = activityStatsCache.get(cacheKey);
    if (cached) {
      logger.debug('Activity stats cache hit', { activityId });
      return cached;
    }
    
    // Compute the statistics
    logger.debug('Activity stats cache miss, computing', { activityId });
    const stats = await compute();
    
    // Cache the result
    activityStatsCache.set(cacheKey, stats);
    
    return stats;
  }

  /**
   * Get submission details from cache or compute them
   * 
   * @param submissionId Submission ID
   * @param compute Function to compute the details if not in cache
   * @returns The submission details
   */
  static async getSubmissionDetails(
    submissionId: string,
    compute: () => Promise<any>
  ): Promise<any> {
    // Create a cache key based on the submission ID
    const cacheKey = `submission:${submissionId}`;
    
    // Try to get from cache
    const cached = submissionDetailsCache.get(cacheKey);
    if (cached) {
      logger.debug('Submission details cache hit', { submissionId });
      return cached;
    }
    
    // Compute the details
    logger.debug('Submission details cache miss, computing', { submissionId });
    const details = await compute();
    
    // Cache the result
    submissionDetailsCache.set(cacheKey, details);
    
    return details;
  }

  /**
   * Invalidate student statistics cache for a student
   * 
   * @param studentId Student ID
   */
  static invalidateStudentStats(studentId: string): void {
    // Find and delete all cache entries for this student
    const prefix = `student-stats:${studentId}:`;
    
    for (let i = 0; i < studentStatsCache.size(); i++) {
      const key = `student-stats:${studentId}:${i}`;
      if (studentStatsCache.get(key)) {
        studentStatsCache.delete(key);
      }
    }
    
    logger.debug('Invalidated student stats cache', { studentId });
  }

  /**
   * Invalidate activity statistics cache for an activity
   * 
   * @param activityId Activity ID
   */
  static invalidateActivityStats(activityId: string): void {
    // Find and delete all cache entries for this activity
    const prefix = `activity-stats:${activityId}:`;
    
    for (let i = 0; i < activityStatsCache.size(); i++) {
      const key = `activity-stats:${activityId}:${i}`;
      if (activityStatsCache.get(key)) {
        activityStatsCache.delete(key);
      }
    }
    
    logger.debug('Invalidated activity stats cache', { activityId });
  }

  /**
   * Invalidate submission details cache for a submission
   * 
   * @param submissionId Submission ID
   */
  static invalidateSubmissionDetails(submissionId: string): void {
    const key = `submission:${submissionId}`;
    submissionDetailsCache.delete(key);
    
    logger.debug('Invalidated submission details cache', { submissionId });
  }

  /**
   * Run cache cleanup to remove expired entries
   * 
   * This should be called periodically, e.g., by a cron job
   */
  static cleanup(): void {
    studentStatsCache.cleanup();
    activityStatsCache.cleanup();
    submissionDetailsCache.cleanup();
    
    logger.debug('Cleaned up activity caches');
  }
}
