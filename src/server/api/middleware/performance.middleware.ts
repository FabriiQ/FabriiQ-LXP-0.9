/**
 * Performance Monitoring Middleware
 * Tracks execution time of tRPC procedures
 */

import { initTRPC } from '@trpc/server';
import { logger } from '@/server/api/utils/logger';

// Initialize a middleware creator
const t = initTRPC.create();

export interface PerformanceOptions {
  /** Threshold in milliseconds to log as warning */
  warnThreshold?: number;
  /** Threshold in milliseconds to log as error */
  errorThreshold?: number;
  /** Whether to log all procedure executions */
  logAll?: boolean;
}

/**
 * Middleware that monitors procedure execution time
 */
export const performanceMiddleware = t.middleware(async ({ ctx, path, rawInput, next, meta }) => {
  // Use type assertion to access the performance property
  const options: PerformanceOptions = ((meta as Record<string, unknown>)?.performance as PerformanceOptions) || {};
  const warnThreshold = options.warnThreshold || 500; // Default: 500ms
  const errorThreshold = options.errorThreshold || 1000; // Default: 1000ms
  const logAll = options.logAll || false;

  // Record start time
  const startTime = performance.now();
  
  // Execute the procedure
  const result = await next();
  
  // Calculate execution time
  const executionTime = performance.now() - startTime;
  
  // Log based on thresholds
  if (executionTime >= errorThreshold) {
    logger.error('Slow procedure execution', {
      path,
      executionTime: `${executionTime.toFixed(2)}ms`,
      threshold: `${errorThreshold}ms`,
    });
  } else if (executionTime >= warnThreshold) {
    logger.warn('Procedure execution approaching threshold', {
      path,
      executionTime: `${executionTime.toFixed(2)}ms`,
      threshold: `${warnThreshold}ms`,
    });
  } else if (logAll) {
    logger.info('Procedure execution time', {
      path,
      executionTime: `${executionTime.toFixed(2)}ms`,
    });
  }
  
  return result;
});

/**
 * Helper to apply performance middleware with options
 */
export function withPerformanceMonitoring(options: PerformanceOptions = {}) {
  return {
    performance: options,
  };
} 