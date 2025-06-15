const { PrismaClient } = require('@prisma/client');

const prismaClient = new PrismaClient();

async function deleteAllActivities() {
  console.log('Deleting all activities from the database...');

  try {
    // First delete all activity grades (foreign key constraint)
    console.log('Deleting all activity grades...');
    const deletedGrades = await prismaClient.activityGrade.deleteMany({});
    console.log(`Deleted ${deletedGrades.count} activity grades.`);

    // Then delete all activities
    console.log('Deleting all activities...');
    const deletedActivities = await prismaClient.activity.deleteMany({});
    console.log(`Deleted ${deletedActivities.count} activities.`);

    console.log('All activities deleted successfully!');
  } catch (error) {
    console.error('Error deleting activities:', error);
  } finally {
    await prismaClient.$disconnect();
  }
}

// Run the function
deleteAllActivities()
  .then(() => console.log('Delete operation completed'))
  .catch((error) => console.error('Delete operation failed:', error));
