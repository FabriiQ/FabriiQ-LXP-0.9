import { PrismaClient } from '@prisma/client';
import { seedActivitiesByType } from './seed-data/activities-seed';

const prisma = new PrismaClient();

/**
 * Script to seed activities by type
 * This can be run independently to add activities by type without running the full seed
 */
async function main() {
  console.log('Starting activities by type seeding...');

  try {
    // Get subjects
    console.log('Fetching subjects...');
    const subjects = await prisma.subject.findMany();
    if (subjects.length === 0) {
      throw new Error('No subjects found. Please run the full seed first.');
    }
    console.log(`Found ${subjects.length} subjects`);

    // Get classes
    console.log('Fetching classes...');
    const classes = await prisma.class.findMany();
    if (classes.length === 0) {
      throw new Error('No classes found. Please run the full seed first.');
    }
    console.log(`Found ${classes.length} classes`);

    // Check if we have topics
    console.log('Checking for topics...');
    const topicsCount = await prisma.subjectTopic.count();
    if (topicsCount === 0) {
      throw new Error('No subject topics found. Please run the subject topics seed first using: npm run db:seed-subject-topics');
    }
    console.log(`Found ${topicsCount} subject topics`);

    // Seed activities by type
    console.log('Starting to seed activities by type...');
    await seedActivitiesByType(prisma, subjects, classes);
    console.log('Activities by type seeded successfully');
  } catch (error) {
    console.error('Error seeding activities by type:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('Activities by type seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error during activities by type seeding:', error);
      process.exit(1);
    });
}
