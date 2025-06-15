const { PrismaClient } = require('@prisma/client');

const prismaClient = new PrismaClient();

async function reseedDatabase() {
  console.log('Reseeding database...');

  try {
    // Delete all activities
    console.log('Deleting all activities...');
    await prismaClient.activityGrade.deleteMany({});
    await prismaClient.activity.deleteMany({});
    console.log('All activities deleted successfully!');

    // Run the seed script
    console.log('Running seed script...');
    await prismaClient.$runCommandRaw({
      dbStats: 1
    });
    console.log('Seed script completed successfully!');

    console.log('Database reseeded successfully!');
  } catch (error) {
    console.error('Error reseeding database:', error);
  } finally {
    await prismaClient.$disconnect();
  }
}

// Run the function
reseedDatabase()
  .then(() => console.log('Reseed completed'))
  .catch((error) => console.error('Reseed failed:', error));
