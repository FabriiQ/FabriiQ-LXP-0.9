import { PrismaClient, SystemStatus, ActivityPurpose, LearningActivityType } from '@prisma/client';
import { seedActivitiesByType } from './seed-data/activities-seed';

const prisma = new PrismaClient();

/**
 * Script to add seeded activities to a specific class
 */
async function main() {
  const classId = 'cm9mvj67p005gz6rnedsh6jxn'; // The specific class ID
  
  console.log(`Adding seeded activities to class ID: ${classId}`);

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

    console.log(`Found class: ${classObj.name || classObj.code}`);

    // Get all subjects
    const subjects = await prisma.subject.findMany({
      where: { status: SystemStatus.ACTIVE }
    });

    if (subjects.length === 0) {
      console.error('No subjects found. Cannot create activities.');
      return;
    }

    console.log(`Found ${subjects.length} subjects`);

    // Create a classes array with just this class
    const classes = [classObj];

    // Call the seed function to add activities to this specific class
    console.log('Calling seedActivitiesByType to add activities to the class...');
    await seedActivitiesByType(prisma, subjects, classes);
    
    // Count activities for this class after seeding
    const activitiesCount = await prisma.activity.count({
      where: { classId }
    });

    console.log(`Total activities for class after seeding: ${activitiesCount}`);

  } catch (error) {
    console.error('Error adding seeded activities to class:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('Seeded activities added to class successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during adding seeded activities to class:', error);
    process.exit(1);
  });
