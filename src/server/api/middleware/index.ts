/**
 * Middleware Index
 * Exports all middleware for convenient importing
 */

export { errorHandlingMiddleware } from './error-handling.middleware';
export { performanceMiddleware } from './performance.middleware';
export { rateLimitMiddleware } from './rate-limit.middleware';
export { isAuthenticated, requirePermission, isResourceOwner } from './authorization';
export { cacheMiddleware } from './cache.middleware';

// Re-export middleware helper functions
export { withCache } from './cache.middleware';
export { withRateLimit } from './rate-limit.middleware';
export { withPerformanceMonitoring } from './performance.middleware';

/**
 * Helper to combine multiple middleware options
 */
export const combineMiddlewareHelpers = (...helpers: Record<string, unknown>[]) => {
  return helpers.reduce((acc, helper) => ({ ...acc, ...helper }), {});
}; 
