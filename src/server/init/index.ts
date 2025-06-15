/**
 * Server Initialization
 * 
 * This module initializes various server components when the application starts.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../api/utils/logger';
import { initBackgroundJobs } from './background-jobs';

/**
 * Initialize server components
 * @param prisma Prisma client instance
 */
export function initializeServer(prisma: PrismaClient): void {
  try {
    logger.info('Starting server initialization');
    
    // Initialize background jobs
    initBackgroundJobs(prisma);
    
    // Add other initialization steps here as needed
    
    logger.info('Server initialization completed');
  } catch (error) {
    logger.error('Error during server initialization', { error });
  }
}
