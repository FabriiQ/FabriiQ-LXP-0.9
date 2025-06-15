import { PrismaClient } from '@prisma/client';
import { seedBulkStudents } from './seed-data/bulk-students-seed';

const prisma = new PrismaClient();

/**
 * Script to seed 500 students per class
 * This can be run independently to add students without running the full seed
 */
async function main() {
  console.log('Starting bulk students seeding...');

  try {
    // Check if we have classes
    console.log('Checking for classes...');
    const classesCount = await prisma.class.count();
    if (classesCount === 0) {
      throw new Error('No classes found. Please run the full seed first.');
    }
    console.log(`Found ${classesCount} classes`);

    // Check if we have an institution
    console.log('Checking for institution...');
    const institutionCount = await prisma.institution.count();
    if (institutionCount === 0) {
      throw new Error('No institution found. Please run the full seed first.');
    }
    console.log(`Found ${institutionCount} institution(s)`);

    // Seed bulk students (500 per class)
    console.log('Starting to seed bulk students...');
    const totalStudents = await seedBulkStudents(prisma, 500);
    console.log(`Successfully created ${totalStudents} students`);
  } catch (error) {
    console.error('Error seeding bulk students:', error);
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
      console.log('Bulk students seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error during bulk students seeding:', error);
      process.exit(1);
    });
}
