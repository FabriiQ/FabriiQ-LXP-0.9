/**
 * Topic Cache Service
 * Provides caching for topic queries to improve performance
 */

import { SubjectTopic } from '@prisma/client';

// Cache configuration
const CACHE_TTL = 60 * 5; // 5 minutes
const CACHE_CHECK_PERIOD = 60; // 1 minute

// Simple in-memory cache implementation
class SimpleCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  set(key: string, data: any, ttl: number = CACHE_TTL): void {
    const expiry = Date.now() + ttl * 1000;
    this.cache.set(key, { data, expiry });
  }

  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.data as T;
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  flushAll(): void {
    this.cache.clear();
  }
}

// Create a cache instance
const topicCache = new SimpleCache();

// Define the cache key generator
function generateCacheKey(subjectId: string, page: number, pageSize: number, search?: string): string {
  return `topics:${subjectId}:${page}:${pageSize}:${search || ''}`;
}

// Define the cached data interface
interface CachedTopicData {
  data: SubjectTopic[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Cache wrapper for topic queries
 * @param queryFn The function that performs the actual query
 * @returns A function that returns cached data or performs the query
 */
export function cacheTopicsQuery<T extends CachedTopicData>(
  queryFn: (subjectId: string, page: number, pageSize: number, search?: string) => Promise<T>
) {
  return async (subjectId: string, page: number, pageSize: number, search?: string): Promise<T> => {
    const cacheKey = generateCacheKey(subjectId, page, pageSize, search);
    
    // Try to get from cache
    const cachedData = topicCache.get<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, perform the query
    const data = await queryFn(subjectId, page, pageSize, search);
    
    // Store in cache
    topicCache.set(cacheKey, data);
    
    return data;
  };
}

/**
 * Invalidate cache for a specific subject
 * @param subjectId The subject ID
 */
export function invalidateSubjectCache(subjectId: string): void {
  const keys = topicCache.keys();
  const subjectKeys = keys.filter(key => key.startsWith(`topics:${subjectId}:`));
  
  subjectKeys.forEach(key => {
    topicCache.del(key);
  });
}

/**
 * Clear the entire topic cache
 */
export function clearTopicCache(): void {
  topicCache.flushAll();
}
