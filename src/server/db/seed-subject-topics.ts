import { PrismaClient } from '@prisma/client';
import { seedSubjectTopics } from './seed-data/subject-topics';

const prisma = new PrismaClient();

/**
 * Main function to seed only subject topics
 */
async function seedOnlySubjectTopics() {
  console.log("Starting subject topics seeding...");

  try {
    // Fetch all subjects from the database
    console.log("Fetching subjects from database...");
    const subjects = await prisma.subject.findMany({
      where: {
        code: {
          in: ['PYP-CL3-MATH', 'PYP-CL3-ENG', 'PYP-CL3-SCI', 'PYP-CL3-PE']
        }
      }
    });

    if (subjects.length === 0) {
      console.error("No subjects found in the database. Cannot seed subject topics.");
      return;
    }

    console.log(`Found ${subjects.length} subjects in the database.`);
    
    // Seed subject topics
    await seedSubjectTopics(prisma, subjects);
    
    console.log("Subject topics seeding completed successfully!");
  } catch (error) {
    console.error("Error during subject topics seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedOnlySubjectTopics()
  .catch((e) => {
    console.error("Error during subject topics seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
