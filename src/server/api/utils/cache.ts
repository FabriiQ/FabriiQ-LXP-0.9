/**
 * Caching Utility
 * Provides in-memory and persistent caching mechanisms for the application
 */

import { logger } from "./logger";

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  namespace?: string; // Cache namespace for grouping related items
}

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory cache implementation
 */
class MemoryCache {
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private namespace: string;
  private defaultTTL: number;

  constructor(namespace = "default", defaultTTL = 60000) {
    this.namespace = namespace;
    this.defaultTTL = defaultTTL;
    
    // Set up periodic cleanup of expired items
    setInterval(() => this.cleanup(), 60000);
    
    logger.debug(`Initialized memory cache for namespace: ${namespace}`);
  }

  /**
   * Generates a namespaced key
   */
  private getNamespacedKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Sets a value in the cache
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const namespacedKey = this.getNamespacedKey(key);
    const ttl = options.ttl ?? this.defaultTTL;
    const expiresAt = Date.now() + ttl;
    
    this.cache.set(namespacedKey, { value, expiresAt });
    logger.debug(`Cache set: ${namespacedKey}, expires in ${ttl}ms`);
  }

  /**
   * Gets a value from the cache
   */
  get<T>(key: string): T | null {
    const namespacedKey = this.getNamespacedKey(key);
    const item = this.cache.get(namespacedKey) as CacheItem<T> | undefined;
    
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
   * Deletes a value from the cache
   */
  delete(key: string): boolean {
    const namespacedKey = this.getNamespacedKey(key);
    const result = this.cache.delete(namespacedKey);
    
    if (result) {
      logger.debug(`Cache delete: ${namespacedKey}`);
    }
    
    return result;
  }

  /**
   * Clears all values in this namespace
   */
  clear(): void {
    const keysToDelete: string[] = [];
    
    // Find all keys in this namespace
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${this.namespace}:`)) {
        keysToDelete.push(key);
      }
    }
    
    // Delete the keys
    keysToDelete.forEach(key => this.cache.delete(key));
    logger.debug(`Cache cleared for namespace: ${this.namespace}, removed ${keysToDelete.length} items`);
  }

  /**
   * Cleans up expired cache items
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logger.debug(`Cache cleanup: removed ${expiredCount} expired items`);
    }
  }

  /**
   * Gets or sets a value in the cache
   * If the key doesn't exist or is expired, the factory function is called to generate the value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cachedValue = this.get<T>(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    // Generate the value
    const value = await factory();
    this.set(key, value, options);
    return value;
  }
}

// Create cache instances for different parts of the application
export const appCache = new MemoryCache("app", 300000); // 5 minutes
export const userCache = new MemoryCache("user", 60000); // 1 minute
export const dataCache = new MemoryCache("data", 600000); // 10 minutes

/**
 * Creates a new cache instance with the specified namespace and TTL
 */
export function createCache(namespace: string, defaultTTL = 60000): MemoryCache {
  return new MemoryCache(namespace, defaultTTL);
}

/**
 * Decorator for caching the results of service methods
 */
export function cacheable(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const namespace = options.namespace || target.constructor.name;
    const cache = new MemoryCache(namespace, options.ttl);
    
    descriptor.value = async function (...args: any[]) {
      // Generate a cache key based on the method name and arguments
      const key = `${propertyKey}:${JSON.stringify(args)}`;
      
      return cache.getOrSet(key, () => originalMethod.apply(this, args), options);
    };
    
    return descriptor;
  };
} 