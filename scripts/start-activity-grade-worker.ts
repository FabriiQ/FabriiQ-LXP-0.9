/**
 * Start the activity grade worker
 * 
 * This script starts the background worker that processes activity grade jobs.
 * 
 * Run with: npx ts-node -r tsconfig-paths/register scripts/start-activity-grade-worker.ts
 */

import { startWorker } from '../src/server/workers/activity-grade-worker';
import { logger } from '../src/server/api/utils/logger';

// Set up process signal handlers
process.on('SIGINT', () => {
  logger.info('Received SIGINT signal, shutting down worker');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM signal, shutting down worker');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
});

// Start the worker
logger.info('Starting activity grade worker process');
startWorker(5000); // Process jobs every 5 seconds

logger.info('Worker started successfully');
