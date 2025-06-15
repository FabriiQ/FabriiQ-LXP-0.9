/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse by limiting request frequency
 */

import { initTRPC } from '@trpc/server';
import { TRPCError } from '@trpc/server';
import { appCache } from '@/server/api/utils/cache';
import { logger } from '@/server/api/utils/logger';
import { createTRPCContext } from '@/server/api/trpc';

// Initialize tRPC for middleware creation
const t = initTRPC.context<typeof createTRPCContext>().create();

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit?: number;
  /** Time window in seconds */
  windowInSeconds?: number;
  /** Whether to use IP address for rate limiting (default: true) */
  useIp?: boolean;
  /** Whether to use user ID for rate limiting if available (default: true) */
  useUserId?: boolean;
  /** Custom identifier function */
  identifierFn?: (ctx: any) => string;
}

/**
 * Middleware that implements rate limiting
 */
export const rateLimitMiddleware = t.middleware(async ({ ctx, path, next, meta }) => {
  // Skip rate limiting if no options are provided
  if (!(meta as Record<string, unknown>)?.rateLimit) {
    return next();
  }

  const options: RateLimitOptions = (meta as Record<string, unknown>).rateLimit as RateLimitOptions;
  const limit = options.limit || 100; // Default: 100 requests
  const windowInSeconds = options.windowInSeconds || 60; // Default: 60 seconds
  const useIp = options.useIp !== false;
  const useUserId = options.useUserId !== false;

  // Determine the identifier for rate limiting
  let identifier: string;
  
  if (options.identifierFn) {
    identifier = options.identifierFn(ctx);
  } else {
    // Default identifier strategy
    // Access IP from request headers or connection info if available
    const ipAddress = (ctx as any).ip || 'unknown';
    const userId = ctx.session?.user?.id;
    
    if (useUserId && userId) {
      identifier = `user:${userId}`;
    } else if (useIp) {
      identifier = `ip:${ipAddress}`;
    } else {
      // If no identifier strategy is available, skip rate limiting
      logger.warn('No rate limit identifier available, skipping rate limiting', { path });
      return next();
    }
  }

  const cacheKey = `ratelimit:${path}:${identifier}`;
  
  try {
    // Get current count from cache
    const currentCount = (await appCache.get<number>(cacheKey)) || 0;
    
    // Check if limit is exceeded
    if (currentCount >= limit) {
      logger.warn('Rate limit exceeded', { path, identifier, limit });
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${windowInSeconds} seconds.`,
      });
    }
    
    // Increment count
    await appCache.set(cacheKey, currentCount + 1, { ttl: windowInSeconds });
    
    // Execute the procedure
    return next();
  } catch (error) {
    // If it's already a TRPCError (like our rate limit error), just rethrow it
    if (error instanceof TRPCError) {
      throw error;
    }
    
    // Otherwise log and throw a generic error
    logger.error('Error in rate limit middleware', { path, error });
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while processing the request',
      cause: error,
    });
  }
});

/**
 * Helper to apply rate limit middleware with options
 */
export function withRateLimit(options: RateLimitOptions = {}) {
  return {
    rateLimit: options,
  };
} 