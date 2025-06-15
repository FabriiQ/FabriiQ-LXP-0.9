import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to clean up activities except those with activity grades
 */
async function main() {
  console.log('Starting activities cleanup...');

  try {
    // Find activities with grades (these will be preserved)
    const activitiesWithGrades = await prisma.activityGrade.findMany({
      select: {
        activityId: true
      }
    });

    const activityIdsToPreserve = [...new Set(activitiesWithGrades.map(ag => ag.activityId))];
    
    console.log(`Found ${activityIdsToPreserve.length} activities with grades that will be preserved`);

    // Count total activities before cleanup
    const totalActivitiesBefore = await prisma.activity.count();
    console.log(`Total activities before cleanup: ${totalActivitiesBefore}`);

    // Delete activities without grades
    const deleteResult = await prisma.activity.deleteMany({
      where: {
        id: {
          notIn: activityIdsToPreserve
        }
      }
    });

    console.log(`Deleted ${deleteResult.count} activities`);

    // Count total activities after cleanup
    const totalActivitiesAfter = await prisma.activity.count();
    console.log(`Total activities after cleanup: ${totalActivitiesAfter}`);
    console.log(`Preserved ${totalActivitiesAfter} activities with grades`);

  } catch (error) {
    console.error('Error cleaning up activities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('Activities cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during activities cleanup:', error);
    process.exit(1);
  });
