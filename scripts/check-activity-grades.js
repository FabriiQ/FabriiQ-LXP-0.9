// Script to check existing ActivityGrade records
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkActivityGrades() {
  console.log('Checking ActivityGrade records...');
  
  // Count total ActivityGrade records
  const totalCount = await prisma.activityGrade.count();
  console.log(`Total ActivityGrade records: ${totalCount}`);
  
  // Count by status
  const statusCounts = await prisma.activityGrade.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });
  
  console.log('Counts by status:');
  statusCounts.forEach(status => {
    console.log(`${status.status}: ${status._count.status}`);
  });
  
  // Get a sample of records
  const sampleRecords = await prisma.activityGrade.findMany({
    take: 5,
    include: {
      activity: {
        select: {
          title: true,
          isGradable: true
        }
      },
      student: {
        select: {
          enrollmentNumber: true
        }
      }
    }
  });
  
  console.log('\nSample records:');
  sampleRecords.forEach(record => {
    console.log(`ID: ${record.id}`);
    console.log(`Activity: ${record.activity.title} (Gradable: ${record.activity.isGradable})`);
    console.log(`Student: ${record.student.enrollmentNumber}`);
    console.log(`Status: ${record.status}`);
    console.log(`Score: ${record.score}`);
    console.log(`Points: ${record.points}`);
    console.log(`Submitted At: ${record.submittedAt}`);
    console.log(`Graded At: ${record.gradedAt}`);
    console.log(`Is Committed: ${record.isCommitted}`);
    console.log('---');
  });
}

checkActivityGrades()
  .catch(e => {
    console.error('Error checking ActivityGrade records:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
