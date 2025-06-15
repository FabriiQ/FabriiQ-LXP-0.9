/**
 * Session Cleanup Script
 * 
 * This script cleans up expired and inactive sessions from the database.
 * It can be run as a scheduled task (e.g., via cron) to keep the sessions table clean.
 * 
 * Usage:
 * - Run directly: `npx ts-node scripts/cleanup-sessions.ts`
 * - Schedule with cron: `0 0 * * * npx ts-node scripts/cleanup-sessions.ts` (runs daily at midnight)
 */

import { PrismaClient } from '@prisma/client';
import { SessionCleanup } from '../src/server/api/utils/session-cleanup';
import { SessionMonitor } from '../src/server/api/utils/session-monitor';

// Initialize Prisma client
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting session cleanup job...');
    
    // Initialize session cleanup and monitoring utilities
    const sessionCleanup = new SessionCleanup(prisma);
    const sessionMonitor = new SessionMonitor(prisma);
    
    // Get session metrics before cleanup
    console.log('Fetching session metrics before cleanup...');
    const metricsBefore = await sessionMonitor.getSessionMetrics();
    console.log('Session metrics before cleanup:', {
      totalSessions: metricsBefore.totalSessions,
      activeSessions: metricsBefore.activeSessions,
      expiredSessions: metricsBefore.expiredSessions,
      sessionsPerUser: metricsBefore.sessionsPerUser,
      oldestSessionAge: `${metricsBefore.oldestSessionAge.toFixed(1)} days`,
      averageSessionAge: `${metricsBefore.averageSessionAge.toFixed(1)} days`
    });
    
    // Clean up expired sessions
    console.log('Cleaning up expired sessions...');
    const expiredSessionsDeleted = await sessionCleanup.cleanupExpiredSessions();
    console.log(`Deleted ${expiredSessionsDeleted} expired sessions`);
    
    // Clean up inactive sessions
    console.log('Cleaning up inactive sessions...');
    const inactiveSessionsDeleted = await sessionCleanup.cleanupInactiveSessions();
    console.log(`Deleted ${inactiveSessionsDeleted} inactive sessions older than 30 days`);
    
    // Clean up duplicate sessions
    console.log('Cleaning up duplicate sessions...');
    const duplicateSessionsDeleted = await sessionCleanup.cleanupDuplicateSessions();
    console.log(`Deleted ${duplicateSessionsDeleted} duplicate sessions`);
    
    // Get session metrics after cleanup
    console.log('Fetching session metrics after cleanup...');
    const metricsAfter = await sessionMonitor.getSessionMetrics();
    console.log('Session metrics after cleanup:', {
      totalSessions: metricsAfter.totalSessions,
      activeSessions: metricsAfter.activeSessions,
      expiredSessions: metricsAfter.expiredSessions,
      sessionsPerUser: metricsAfter.sessionsPerUser,
      oldestSessionAge: `${metricsAfter.oldestSessionAge.toFixed(1)} days`,
      averageSessionAge: `${metricsAfter.averageSessionAge.toFixed(1)} days`
    });
    
    // Calculate total sessions deleted
    const totalSessionsDeleted = expiredSessionsDeleted + inactiveSessionsDeleted + duplicateSessionsDeleted;
    console.log(`Total sessions deleted: ${totalSessionsDeleted}`);
    
    console.log('Session cleanup job completed successfully');
  } catch (error) {
    console.error('Error in session cleanup job:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function
main()
  .catch((error) => {
    console.error('Unhandled error in session cleanup job:', error);
    process.exit(1);
  });

// Export for programmatic usage
export default main; 