/**
 * In-memory cache utility for Bloom's Taxonomy
 * 
 * This utility provides a simple in-memory cache with TTL support.
 */

interface CacheItem<T> {
  value: T;
  expiry: number;
}

/**
 * In-memory cache with TTL support
 */
export class MemoryCache<T> {
  private cache: Map<string, CacheItem<T>>;
  private prefix: string;
  private defaultTtl: number;

  /**
   * Create a new MemoryCache instance
   * @param prefix Prefix for cache keys
   * @param defaultTtl Default TTL in milliseconds
   */
  constructor(prefix: string = '', defaultTtl: number = 60 * 1000) {
    this.cache = new Map<string, CacheItem<T>>();
    this.prefix = prefix ? `${prefix}:` : '';
    this.defaultTtl = defaultTtl;

    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 60 * 1000); // Clean up every minute
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  get<U = T>(key: string): U | null {
    const prefixedKey = this.getPrefixedKey(key);
    const item = this.cache.get(prefixedKey);

    if (!item) {
      return null;
    }

    // Check if expired
    if (item.expiry < Date.now()) {
      this.cache.delete(prefixedKey);
      return null;
    }

    return item.value as unknown as U;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl TTL in milliseconds
   */
  set(key: string, value: T, ttl: number = this.defaultTtl): void {
    const prefixedKey = this.getPrefixedKey(key);
    const expiry = Date.now() + ttl;

    this.cache.set(prefixedKey, { value, expiry });
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    const prefixedKey = this.getPrefixedKey(key);
    this.cache.delete(prefixedKey);
  }

  /**
   * Check if a key exists in the cache
   * @param key Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const prefixedKey = this.getPrefixedKey(key);
    const item = this.cache.get(prefixedKey);

    if (!item) {
      return false;
    }

    // Check if expired
    if (item.expiry < Date.now()) {
      this.cache.delete(prefixedKey);
      return false;
    }

    return true;
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get all keys in the cache
   * @returns Array of keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys()).map(key => 
      key.startsWith(this.prefix) ? key.slice(this.prefix.length) : key
    );
  }

  /**
   * Get the size of the cache
   * @returns Number of items in the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired items
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get the prefixed key
   * @param key Cache key
   * @returns Prefixed key
   */
  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}
