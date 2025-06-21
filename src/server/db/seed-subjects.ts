import { PrismaClient } from '@prisma/client';
import { seedSubjects } from './seed-data/subjects';

const prisma = new PrismaClient();

/**
 * Main function to seed only subjects
 */
async function seedOnlySubjects() {
  console.log("Starting subjects seeding...");

  try {
    // First, check if we have courses in the database
    console.log("Fetching courses from database...");
    const courses = await prisma.course.findMany();

    if (courses.length === 0) {
      console.error("No courses found in the database. Cannot seed subjects without courses.");
      console.log("Please ensure courses are seeded first.");
      return;
    }

    console.log(`Found ${courses.length} courses in the database.`);
    
    // Seed subjects
    const createdSubjects = await seedSubjects(prisma, courses);
    
    console.log(`Successfully seeded ${createdSubjects.length} subjects!`);
  } catch (error) {
    console.error("Error during subjects seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedOnlySubjects()
  .catch((e) => {
    console.error("Error during subjects seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
