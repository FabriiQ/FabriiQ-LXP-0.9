import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to check activities for a specific class
 */
async function main() {
  const classId = 'cm9mvj67p005gz6rnedsh6jxn'; // The class ID provided by the user

  console.log(`Checking activities for class ID: ${classId}`);

  try {
    // First, verify the class exists
    const classObj = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        courseCampus: {
          include: {
            campus: true,
            programCampus: {
              include: {
                program: true
              }
            }
          }
        }
      }
    });

    if (!classObj) {
      console.error(`Class with ID ${classId} not found.`);
      return;
    }

    console.log(`Found class: ${classObj.name} (${classObj.code})`);

    // Count activities for this class
    const activitiesCount = await prisma.activity.count({
      where: { classId }
    });

    console.log(`Total activities for this class: ${activitiesCount}`);

    // Get a sample of activities for this class
    const activities = await prisma.activity.findMany({
      where: { classId },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    console.log('Sample of recent activities:');
    activities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.title} (${activity.learningType || 'No learning type'}) - Created at: ${activity.createdAt}`);
    });

    // Check activities by learning type
    const activityTypesCounts = await prisma.$queryRaw`
      SELECT "learningType", COUNT(*) as count
      FROM "Activity"
      WHERE "classId" = ${classId}
      GROUP BY "learningType"
    `;

    console.log('Activities by learning type:');
    console.dir(activityTypesCounts, { depth: null });

    // Check if there are any activities with null learningType
    const nullLearningTypeCount = await prisma.activity.count({
      where: {
        classId,
        learningType: null
      }
    });

    console.log(`Activities with null learningType: ${nullLearningTypeCount}`);

    // Check activities by purpose
    const purposeCounts = await prisma.$queryRaw`
      SELECT "purpose", COUNT(*) as count
      FROM "Activity"
      WHERE "classId" = ${classId}
      GROUP BY "purpose"
    `;

    console.log('Activities by purpose:');
    console.dir(purposeCounts, { depth: null });

  } catch (error) {
    console.error('Error checking class activities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('Check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during check:', error);
    process.exit(1);
  });
