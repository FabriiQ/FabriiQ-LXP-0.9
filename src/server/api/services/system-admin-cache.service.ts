/**
 * System Admin Cache Service
 *
 * Provides caching mechanisms for system admin data to improve performance
 * when dealing with large datasets (200,000+ students and users).
 */

import { logger } from '../utils/logger';
import { unstable_cache } from 'next/cache';

// Cache configuration
const CACHE_CONFIG = {
  TAGS: {
    SYSTEM_STUDENTS: 'system:students',
    SYSTEM_USERS: 'system:users',
    SYSTEM_ANALYTICS: 'system:analytics',
  },
  DURATIONS: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 1800, // 30 minutes
    VERY_LONG: 3600, // 1 hour
  },
};

// Memory cache for in-memory caching
class MemoryCache<T = any> {
  private cache = new Map<string, { value: T; expiresAt: number }>();
  private namespace: string;
  private defaultTTL: number;
  private maxSize: number;

  constructor(namespace: string, defaultTTL = 60000, maxSize = 1000) {
    this.namespace = namespace;
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
  }

  /**
   * Get a namespaced key
   */
  private getNamespacedKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Evict the oldest entry from the cache
   */
  private evictOldest(): void {
    if (this.cache.size === 0) return;

    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < oldestTime) {
        oldestKey = key;
        oldestTime = item.expiresAt;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`Cache evicted oldest item: ${oldestKey}`);
    }
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, ttl?: number): void {
    const namespacedKey = this.getNamespacedKey(key);

    // Ensure we don't exceed the maximum cache size
    if (this.cache.size >= this.maxSize && !this.cache.has(namespacedKey)) {
      this.evictOldest();
    }

    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    this.cache.set(namespacedKey, { value, expiresAt });
    logger.debug(`Cache set: ${namespacedKey}, expires in ${ttl || this.defaultTTL}ms`);
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | null {
    const namespacedKey = this.getNamespacedKey(key);
    const item = this.cache.get(namespacedKey);

    if (!item) {
      logger.debug(`Cache miss: ${namespacedKey}`);
      return null;
    }

    // Check if the item has expired
    if (item.expiresAt < Date.now()) {
      logger.debug(`Cache expired: ${namespacedKey}`);
      this.cache.delete(namespacedKey);
      return null;
    }

    logger.debug(`Cache hit: ${namespacedKey}`);
    return item.value;
  }

  /**
   * Get a value from the cache or set it if it doesn't exist
   */
  async getOrSet(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = this.get(key);
    if (cachedValue !== null) {
      return cachedValue;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    const namespacedKey = this.getNamespacedKey(key);
    return this.cache.delete(namespacedKey);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    logger.debug(`Cache cleared for namespace: ${this.namespace}`);
  }
}

// Create cache instances for different parts of the system admin
const systemStudentsCache = new MemoryCache<any>("system:students", 5 * 60 * 1000); // 5 minutes
const systemUsersCache = new MemoryCache<any>("system:users", 5 * 60 * 1000); // 5 minutes
const systemAnalyticsCache = new MemoryCache<any>("system:analytics", 15 * 60 * 1000); // 15 minutes

/**
 * Cache a function with the specified tags and duration using Next.js unstable_cache
 */
export function cacheSystemFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  tags: string[],
  duration: number = CACHE_CONFIG.DURATIONS.MEDIUM
): T {
  return unstable_cache(fn, tags, { revalidate: duration }) as T;
}

/**
 * Cache system students query
 */
export function cacheSystemStudentsQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheSystemFunction(fn, [CACHE_CONFIG.TAGS.SYSTEM_STUDENTS], CACHE_CONFIG.DURATIONS.MEDIUM);
}

/**
 * Cache system users query
 */
export function cacheSystemUsersQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheSystemFunction(fn, [CACHE_CONFIG.TAGS.SYSTEM_USERS], CACHE_CONFIG.DURATIONS.MEDIUM);
}

/**
 * Cache system analytics query
 */
export function cacheSystemAnalyticsQuery<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cacheSystemFunction(fn, [CACHE_CONFIG.TAGS.SYSTEM_ANALYTICS], CACHE_CONFIG.DURATIONS.LONG);
}

/**
 * Generate a cache key based on query parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  const paramsString = sortedParams.map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('&');
  return `${prefix}:${paramsString}`;
}

/**
 * System Admin Cache Service
 */
export class SystemAdminCacheService {
  // Expose cache instances
  static systemStudentsCache = systemStudentsCache;
  static systemUsersCache = systemUsersCache;
  static systemAnalyticsCache = systemAnalyticsCache;

  /**
   * Cache system students data
   */
  static async cacheStudents(params: any, dataFn: () => Promise<any>): Promise<any> {
    const cacheKey = generateCacheKey('students', params);
    return systemStudentsCache.getOrSet(cacheKey, dataFn);
  }

  /**
   * Cache system users data
   */
  static async cacheUsers(params: any, dataFn: () => Promise<any>): Promise<any> {
    const cacheKey = generateCacheKey('users', params);
    return systemUsersCache.getOrSet(cacheKey, dataFn);
  }

  /**
   * Cache system analytics data
   */
  static async cacheAnalytics(params: any, dataFn: () => Promise<any>): Promise<any> {
    const cacheKey = generateCacheKey('analytics', params);
    return systemAnalyticsCache.getOrSet(cacheKey, dataFn);
  }

  /**
   * Invalidate system students cache
   */
  static invalidateStudentsCache(): void {
    systemStudentsCache.clear();
  }

  /**
   * Invalidate system users cache
   */
  static invalidateUsersCache(): void {
    systemUsersCache.clear();
  }

  /**
   * Invalidate system analytics cache
   */
  static invalidateAnalyticsCache(): void {
    systemAnalyticsCache.clear();
  }

  /**
   * Invalidate all system admin caches
   */
  static invalidateAllCaches(): void {
    SystemAdminCacheService.invalidateStudentsCache();
    SystemAdminCacheService.invalidateUsersCache();
    SystemAdminCacheService.invalidateAnalyticsCache();
  }
}

export default SystemAdminCacheService;
