/**
 * Migration script to add points to ActivityGrade records
 *
 * This script:
 * 1. Adds the points field to ActivityGrade records
 * 2. Calculates points for completed activities
 * 3. Records points in the StudentPoints table
 *
 * Run with: npx ts-node -r tsconfig-paths/register scripts/migrate-activity-points.ts
 */

import { PrismaClient, SubmissionStatus, SystemStatus } from '@prisma/client';
import { ActivityPointsService } from '../src/server/api/services/activity-points.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration of ActivityGrade records to add points...');

  // Get all completed or graded activity grades
  const completedGrades = await prisma.activityGrade.findMany({
    where: {
      OR: [
        { status: 'COMPLETED' as any }, // Using string literal to avoid type issues
        { status: SubmissionStatus.GRADED }
      ],
      // We'll filter records without points in the application code
    },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          classId: true,
          subjectId: true,
          learningType: true,
          purpose: true,
          isGradable: true
        }
      }
    }
  });

  // Filter out records that already have points
  const gradesWithoutPoints = completedGrades.filter(grade => !(grade as any).points);

  console.log(`Found ${gradesWithoutPoints.length} completed activity grades without points`);

  // Create points service
  const pointsService = new ActivityPointsService({ prisma });

  // Process each activity grade
  let processed = 0;
  let errors = 0;

  for (const grade of gradesWithoutPoints) {
    try {
      // Calculate points for the activity
      const points = await pointsService.calculateActivityPoints(grade.activityId);

      // Update the activity grade with points
      await prisma.activityGrade.update({
        where: { id: grade.id },
        data: { points } as any // Using type assertion to avoid type issues
      });

      // Record points in student points table
      await prisma.studentPoints.create({
        data: {
          studentId: grade.studentId,
          amount: points,
          source: 'ACTIVITY',
          sourceId: grade.activityId,
          description: `Points for completing activity (migration)`,
          classId: (grade as any).activity?.classId,
          subjectId: (grade as any).activity?.subjectId,
          status: SystemStatus.ACTIVE,
        }
      });

      processed++;

      // Log progress every 100 records
      if (processed % 100 === 0) {
        console.log(`Processed ${processed} of ${gradesWithoutPoints.length} records`);
      }
    } catch (error) {
      console.error(`Error processing activity grade ${grade.id}:`, error);
      errors++;
    }
  }

  console.log(`Migration completed. Processed ${processed} records with ${errors} errors.`);
}

main()
  .catch((e) => {
    console.error('Error in migration script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
