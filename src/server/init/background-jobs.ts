/**
 * Background Jobs Initialization
 * 
 * This module initializes the background jobs system when the server starts.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../api/utils/logger';
import { initializeBackgroundJobs, shutdownBackgroundJobs } from '../jobs';

let initialized = false;

/**
 * Initialize background jobs system
 * @param prisma Prisma client instance
 */
export function initBackgroundJobs(prisma: PrismaClient): void {
  if (initialized) {
    logger.info('Background jobs system already initialized');
    return;
  }

  try {
    logger.info('Initializing background jobs system');
    
    // Initialize the background jobs system
    initializeBackgroundJobs(prisma);
    
    // Set up shutdown handler
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down background jobs system');
      shutdownBackgroundJobs();
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down background jobs system');
      shutdownBackgroundJobs();
    });
    
    initialized = true;
    logger.info('Background jobs system initialized successfully');
  } catch (error) {
    logger.error('Error initializing background jobs system', { error });
  }
}
