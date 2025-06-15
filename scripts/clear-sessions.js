/**
 * Clear Sessions Script
 * 
 * This script clears all sessions from the database.
 * It can be run before starting the server to ensure a clean authentication state.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearSessions() {
  try {
    console.log('Clearing all sessions from the database...');
    
    const result = await prisma.session.deleteMany({});
    
    console.log(`Successfully deleted ${result.count} sessions.`);
    
    return { success: true, count: result.count };
  } catch (error) {
    console.error('Error clearing sessions:', error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  clearSessions()
    .then((result) => {
      if (result.success) {
        console.log('Session cleanup completed successfully.');
        process.exit(0);
      } else {
        console.error('Session cleanup failed.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Unexpected error during session cleanup:', error);
      process.exit(1);
    });
}

module.exports = clearSessions; 