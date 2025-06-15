// CommonJS version of the migration script
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

console.log('Starting migration script...');
console.log('Initializing Prisma client...');
const prisma = new PrismaClient();
console.log('Prisma client initialized.');

async function createMissingActivityGrades() {
  console.log('Starting migration of activity grades...');

  // Get all active classes
  const classes = await prisma.class.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true }
  });

  console.log(`Found ${classes.length} active classes`);

  let totalActivities = 0;
  let totalStudents = 0;
  let totalCreated = 0;

  for (const classObj of classes) {
    // Get all activities for this class
    const activities = await prisma.activity.findMany({
      where: { classId: classObj.id, status: 'ACTIVE' },
      select: { id: true, isGradable: true }
    });

    totalActivities += activities.length;
    console.log(`Processing ${activities.length} activities for class ${classObj.id}`);

    // Get all students enrolled in this class
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { classId: classObj.id, status: 'ACTIVE' },
      select: { studentId: true }
    });

    totalStudents += enrollments.length;
    console.log(`Processing ${enrollments.length} students for class ${classObj.id}`);

    // Prepare batch data
    const batchData = [];

    // For each activity and student combination
    for (const activity of activities) {
      for (const enrollment of enrollments) {
        // Check if an ActivityGrade already exists
        const existingGrade = await prisma.activityGrade.findUnique({
          where: {
            activityId_studentId: {
              activityId: activity.id,
              studentId: enrollment.studentId
            }
          }
        });

        // If no grade exists, add to batch
        if (!existingGrade) {
          batchData.push({
            id: uuidv4(),
            activityId: activity.id,
            studentId: enrollment.studentId,
            status: 'UNATTEMPTED',
            submittedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    // Batch insert if we have data
    if (batchData.length > 0) {
      // Insert in batches of 1000 to avoid memory issues
      const batchSize = 1000;
      for (let i = 0; i < batchData.length; i += batchSize) {
        const batch = batchData.slice(i, i + batchSize);
        await prisma.activityGrade.createMany({
          data: batch,
          skipDuplicates: true
        });
        console.log(`Created ${batch.length} activity grades (batch ${i/batchSize + 1})`);
      }
      totalCreated += batchData.length;
    }
  }

  console.log('Migration complete!');
  console.log(`Processed ${totalActivities} activities for ${totalStudents} students`);
  console.log(`Created ${totalCreated} new ActivityGrade records`);
}

createMissingActivityGrades()
  .catch(e => {
    console.error('Error during migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
