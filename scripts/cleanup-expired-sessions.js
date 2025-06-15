/**
 * Cleanup Expired Sessions Script
 * 
 * This script cleans up expired sessions from the database.
 * It can be run as a scheduled task to keep the sessions table clean.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupExpiredSessions() {
  try {
    console.log('Cleaning up expired sessions...');
    
    const now = new Date();
    
    // Delete all sessions that have expired
    const result = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: now
        }
      }
    });
    
    console.log(`Successfully deleted ${result.count} expired sessions.`);
    
    return { success: true, count: result.count };
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  cleanupExpiredSessions()
    .then((result) => {
      if (result.success) {
        console.log('Expired session cleanup completed successfully.');
        process.exit(0);
      } else {
        console.error('Expired session cleanup failed.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Unexpected error during expired session cleanup:', error);
      process.exit(1);
    });
}

module.exports = cleanupExpiredSessions; 