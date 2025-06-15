import { PrismaClient } from '@prisma/client';
import { BackgroundJobService, JobType } from '../api/services/background-job.service';
import { ActivityGradeService } from '../api/services/activity-grade.service';
import { logger } from '../api/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { SubmissionStatus } from '../api/constants';

const prisma = new PrismaClient();
const jobService = new BackgroundJobService({ prisma });
const activityGradeService = new ActivityGradeService({ prisma });

/**
 * Process a CREATE_ACTIVITY_GRADES job
 *
 * This job creates ActivityGrade records for all students in a class when a new activity is created
 */
async function processCreateActivityGradesJob(job: any): Promise<any> {
  const { activityId, classId } = job.data;

  try {
    logger.info('Processing CREATE_ACTIVITY_GRADES job', { jobId: job.id, activityId, classId });

    // Get the activity
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      throw new Error(`Activity ${activityId} not found`);
    }

    // Get all students in the class
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        classId,
        status: 'ACTIVE'
      },
      select: {
        studentId: true
      }
    });

    logger.info(`Creating activity grades for ${enrollments.length} students`, { activityId });

    // Create activity grades in batches
    const batchSize = 100;
    const batches = Math.ceil(enrollments.length / batchSize);
    let createdCount = 0;

    for (let i = 0; i < batches; i++) {
      const batchEnrollments = enrollments.slice(i * batchSize, (i + 1) * batchSize);

      // Create activity grades for this batch
      const createPromises = batchEnrollments.map(enrollment =>
        prisma.activityGrade.upsert({
          where: {
            activityId_studentId: {
              activityId,
              studentId: enrollment.studentId
            }
          },
          update: {}, // No update if it exists
          create: {
            id: uuidv4(),
            activityId,
            studentId: enrollment.studentId,
            status: 'UNATTEMPTED' as any, // Using string literal to avoid type issues
            submittedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      );

      const results = await Promise.allSettled(createPromises);

      // Count successful creations
      createdCount += results.filter(r => r.status === 'fulfilled').length;

      // Log progress
      logger.info(`Created batch ${i + 1}/${batches} of activity grades`, {
        activityId,
        batchSize: batchEnrollments.length,
        successCount: results.filter(r => r.status === 'fulfilled').length,
        failureCount: results.filter(r => r.status === 'rejected').length
      });
    }

    return {
      success: true,
      message: `Created ${createdCount} activity grades for activity ${activityId}`,
      data: {
        activityId,
        classId,
        totalStudents: enrollments.length,
        createdCount
      }
    };
  } catch (error) {
    logger.error('Error processing CREATE_ACTIVITY_GRADES job', {
      jobId: job.id,
      activityId,
      classId,
      error
    });

    throw error;
  }
}

/**
 * Process an ARCHIVE_ACTIVITY_GRADES job
 *
 * This job archives old ActivityGrade records to improve performance
 */
async function processArchiveActivityGradesJob(job: any): Promise<any> {
  const { classId, beforeDate } = job.data;

  try {
    logger.info('Processing ARCHIVE_ACTIVITY_GRADES job', { jobId: job.id, classId, beforeDate });

    // Get activities for this class
    const activities = await prisma.activity.findMany({
      where: {
        classId,
        createdAt: {
          lt: new Date(beforeDate)
        }
      },
      select: {
        id: true
      }
    });

    const activityIds = activities.map(a => a.id);

    logger.info(`Found ${activityIds.length} activities to archive`, { classId });

    if (activityIds.length === 0) {
      return {
        success: true,
        message: 'No activities to archive',
        data: {
          classId,
          beforeDate,
          archivedCount: 0
        }
      };
    }

    // Archive activity grades in batches
    const batchSize = 500;
    let archivedCount = 0;
    let offset = 0;

    while (true) {
      // Get a batch of activity grades
      const activityGrades = await prisma.activityGrade.findMany({
        where: {
          activityId: {
            in: activityIds
          },
          isArchived: false
        },
        take: batchSize,
        skip: offset
      });

      if (activityGrades.length === 0) {
        break;
      }

      // Archive this batch
      const archivePromises = activityGrades.map(grade =>
        prisma.archivedActivityGrade.create({
          data: {
            id: uuidv4(),
            originalId: grade.id,
            activityId: grade.activityId,
            studentId: grade.studentId,
            score: grade.score,
            status: grade.status,
            submittedAt: grade.submittedAt,
            gradedAt: grade.gradedAt,
            content: grade.content as any, // Using type assertion to avoid type issues
            summary: {
              // Create a simple summary with default values since these fields might not exist in the schema yet
              points: 0,
              isCommitted: false,
              commitmentMet: null
            },
            archivedAt: new Date(),
            academicYear: job.data.academicYear,
            termId: job.data.termId
          }
        })
      );

      await Promise.all(archivePromises);

      // Mark original records as archived
      await prisma.activityGrade.updateMany({
        where: {
          id: {
            in: activityGrades.map(g => g.id)
          }
        },
        data: {
          isArchived: true
        }
      });

      archivedCount += activityGrades.length;
      offset += activityGrades.length;

      // Log progress
      logger.info(`Archived ${archivedCount} activity grades so far`, { classId });
    }

    return {
      success: true,
      message: `Archived ${archivedCount} activity grades for class ${classId}`,
      data: {
        classId,
        beforeDate,
        archivedCount
      }
    };
  } catch (error) {
    logger.error('Error processing ARCHIVE_ACTIVITY_GRADES job', {
      jobId: job.id,
      classId,
      beforeDate,
      error
    });

    throw error;
  }
}

/**
 * Main worker function
 */
async function processNextJob() {
  try {
    // Get the next job
    const job = await jobService.getNextJob();

    if (!job) {
      return;
    }

    logger.info('Processing job', { jobId: job.id, type: job.type });

    let result: any;

    // Process the job based on its type
    switch (job.type) {
      case JobType.CREATE_ACTIVITY_GRADES:
        result = await processCreateActivityGradesJob(job);
        break;
      case JobType.ARCHIVE_ACTIVITY_GRADES:
        result = await processArchiveActivityGradesJob(job);
        break;
      default:
        throw new Error(`Unsupported job type: ${job.type}`);
    }

    // Mark the job as completed
    await jobService.completeJob(job.id, result);

    logger.info('Job completed successfully', { jobId: job.id, type: job.type });
  } catch (error) {
    logger.error('Error processing job', { error });
  }
}

/**
 * Start the worker
 */
export function startWorker(intervalMs = 5000) {
  logger.info('Starting activity grade worker');

  // Process jobs at regular intervals
  setInterval(processNextJob, intervalMs);

  // Process the first job immediately
  processNextJob();
}
