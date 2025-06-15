// Script to update ActivityGrade status for non-gradable activities
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateActivityGradeStatus() {
  console.log('Updating ActivityGrade status for non-gradable activities...');
  
  // Find all non-gradable activities
  const nonGradableActivities = await prisma.activity.findMany({
    where: { 
      isGradable: false,
      status: 'ACTIVE'
    },
    select: { 
      id: true,
      title: true
    }
  });
  
  console.log(`Found ${nonGradableActivities.length} non-gradable activities`);
  
  // Update ActivityGrade records for non-gradable activities with SUBMITTED status to COMPLETED
  const updatedSubmitted = await prisma.activityGrade.updateMany({
    where: {
      activityId: {
        in: nonGradableActivities.map(activity => activity.id)
      },
      status: 'SUBMITTED'
    },
    data: {
      status: 'COMPLETED'
    }
  });
  
  console.log(`Updated ${updatedSubmitted.count} records from SUBMITTED to COMPLETED`);
  
  // Update ActivityGrade records for non-gradable activities with GRADED status to COMPLETED
  const updatedGraded = await prisma.activityGrade.updateMany({
    where: {
      activityId: {
        in: nonGradableActivities.map(activity => activity.id)
      },
      status: 'GRADED'
    },
    data: {
      status: 'COMPLETED'
    }
  });
  
  console.log(`Updated ${updatedGraded.count} records from GRADED to COMPLETED`);
  
  // Count total ActivityGrade records by status after update
  const statusCounts = await prisma.activityGrade.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });
  
  console.log('\nCurrent counts by status:');
  statusCounts.forEach(status => {
    console.log(`${status.status}: ${status._count.status}`);
  });
  
  console.log('\nUpdate complete!');
}

updateActivityGradeStatus()
  .catch(e => {
    console.error('Error updating ActivityGrade status:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
