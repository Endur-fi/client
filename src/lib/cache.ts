/**
 * Simple in-memory cache utility for expensive operations
 * Uses Map with TTL (time-to-live) for automatic expiration
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Creates a cached version of an async function
 * @param fn - The async function to cache
 * @param ttlMs - Time to live in milliseconds (default: 3 minutes)
 * @returns Wrapped function that caches results based on stringified arguments
 */
export function createCachedFunction<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  ttlMs: number = 3 * 60 * 1000 // 3 minutes default
): (...args: TArgs) => Promise<TReturn> {
  const cache = new Map<string, CacheEntry<TReturn>>();

  return async (...args: TArgs): Promise<TReturn> => {
    // Create cache key from arguments
    const cacheKey = JSON.stringify(args);
    const now = Date.now();

    // Check if cached value exists and is not expired
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    // Call the original function
    const value = await fn(...args);

    // Store in cache with expiration time
    cache.set(cacheKey, {
      value,
      expiresAt: now + ttlMs,
    });

    // Clean up expired entries periodically (every 100 calls)
    if (Math.random() < 0.01) {
      for (const [key, entry] of cache.entries()) {
        if (entry.expiresAt <= now) {
          cache.delete(key);
        }
      }
    }

    return value;
  };
}

/**
 * Clears all cached data for a specific function
 * Note: This requires keeping a reference to the cache, so we export a cache manager
 */
export class CacheManager {
  private caches = new Map<string, Map<string, CacheEntry<any>>>();

  createCachedFunction<TArgs extends any[], TReturn>(
    name: string,
    fn: (...args: TArgs) => Promise<TReturn>,
    ttlMs: number = 3 * 60 * 1000
  ): (...args: TArgs) => Promise<TReturn> {
    const cache = new Map<string, CacheEntry<TReturn>>();
    this.caches.set(name, cache);

    return async (...args: TArgs): Promise<TReturn> => {
      const cacheKey = JSON.stringify(args);
      const now = Date.now();

      const cached = cache.get(cacheKey);
      if (cached && cached.expiresAt > now) {
        return cached.value;
      }

      const value = await fn(...args);

      cache.set(cacheKey, {
        value,
        expiresAt: now + ttlMs,
      });

      // Periodic cleanup
      if (Math.random() < 0.01) {
        for (const [key, entry] of cache.entries()) {
          if (entry.expiresAt <= now) {
            cache.delete(key);
          }
        }
      }

      return value;
    };
  }

  clear(name?: string): void {
    if (name) {
      this.caches.get(name)?.clear();
    } else {
      this.caches.forEach((cache) => cache.clear());
    }
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

