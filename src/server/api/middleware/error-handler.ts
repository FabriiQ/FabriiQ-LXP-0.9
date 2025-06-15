/**
 * Error Handler Middleware
 * Re-exports error handling and performance middleware with simplified names
 */

import { errorHandlingMiddleware } from './error-handling.middleware';
import { performanceMiddleware } from './performance.middleware';

// Export the error handling middleware with a simpler name
export const errorHandler = errorHandlingMiddleware;

// Export a function that returns the performance middleware
export const performanceLogger = () => performanceMiddleware; 