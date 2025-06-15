/**
 * Activity Submission Service
 *
 * This service handles the storage and processing of activity submissions,
 * including detailed feedback and analytics.
 */

import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { logger } from '@/server/api/utils/logger';
import { gradeActivity } from './activity-grading-registry';
import { ActivityRewardIntegration } from '@/features/rewards/activity-integration';
import { CommitmentContractService } from './commitment-contract.service';

interface SubmissionResult {
  success: boolean;
  gradeId: string;
  score: number | null;
  maxScore: number | null;
  feedback: string | null;
  isGraded: boolean;
  detailedResults?: any;
}

interface SubmissionOptions {
  storeDetailedResults?: boolean;
  updateGradebook?: boolean;
}

/**
 * Process an activity submission
 *
 * This function handles the entire submission process including:
 * - Grading the activity
 * - Storing the submission in the database
 * - Updating the gradebook
 * - Storing detailed feedback
 *
 * @param prisma Prisma client instance
 * @param activityId ID of the activity being submitted
 * @param studentId ID of the student profile
 * @param answers Student's answers
 * @param clientResult Optional client-side grading result
 * @param options Additional options for submission processing
 * @returns Submission result with grade information
 */
export async function processActivitySubmission(
  prisma: PrismaClient,
  activityId: string,
  studentId: string,
  answers: any,
  clientResult?: any,
  options: SubmissionOptions = {},
  timeSpentMinutes?: number
): Promise<SubmissionResult> {
  const { storeDetailedResults = true, updateGradebook = true } = options;

  try {
    // Check if the activity exists and get its details
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    // Get the activity content and type
    const activityContent = activity.content as any;
    // Use learningType instead of activityType (which has been replaced in the schema)
    const learningType = activity.learningType || activityContent?.learningType;
    // Convert learningType enum to activity type ID format for the grading registry
    const activityType = learningType ? learningType.toLowerCase().replace(/_/g, '-') : activityContent?.activityType;

    // Initialize grade data
    let score: number | null = null;
    let feedback: string | null = null;
    let gradingResult: any = null;
    let status: SubmissionStatus = SubmissionStatus.SUBMITTED;
    let detailedResults: any = null;

    // Check if this is a non-gradable completion
    const isNonGradableCompletion = clientResult?.isNonGradableCompletion || answers?.isNonGradableCompletion;

    // For non-gradable activities that are explicitly marked as completed
    if (isNonGradableCompletion) {
      logger.debug('Processing non-gradable activity completion', {
        activityId,
        activityType,
        learningType
      });

      // Use GRADED status for non-gradable activities (will be updated to COMPLETED after schema migration)
      status = SubmissionStatus.GRADED;

      // Set a default score of 100% for non-gradable activities
      score = 100;
      feedback = "Activity completed successfully";

      // Create basic completion details
      detailedResults = {
        completedAt: new Date(),
        timeSpent: clientResult?.timeSpent || null
      };
    }
    // Use client-side result if available, otherwise grade server-side
    else if (clientResult && activity.isGradable) {
      // Use the client-side grading result
      logger.debug('Using client-side grading result', {
        activityId,
        activityType,
        learningType,
        score: clientResult.score,
        maxScore: clientResult.maxScore
      });

      gradingResult = clientResult;
      score = clientResult.score;
      feedback = clientResult.overallFeedback || null;
      status = SubmissionStatus.GRADED;

      // Store detailed results if available
      if (storeDetailedResults && clientResult.questionResults) {
        detailedResults = {
          questionResults: clientResult.questionResults,
          completedAt: clientResult.completedAt || new Date(),
          timeSpent: clientResult.timeSpent || null
        };
      }
    }
    // Grade the activity server-side if it's gradable
    else if (activity.isGradable && activityType) {
      try {
        // Apply the appropriate grading function
        gradingResult = gradeActivity(activityType, activityContent, answers);

        if (gradingResult) {
          // Extract score and feedback
          score = gradingResult.score;
          feedback = gradingResult.overallFeedback || null;

          // Update status to GRADED since we auto-graded it
          status = SubmissionStatus.GRADED;

          // Store detailed results
          if (storeDetailedResults) {
            detailedResults = {
              questionResults: gradingResult.questionResults || [],
              completedAt: gradingResult.completedAt || new Date(),
              timeSpent: gradingResult.timeSpent || null
            };
          }

          logger.debug('Activity graded successfully (server-side)', {
            activityId,
            activityType,
            learningType,
            score,
            maxScore: gradingResult.maxScore
          });
        }
      } catch (gradingError) {
        logger.error('Error grading activity', {
          activityId,
          activityType,
          learningType,
          error: gradingError
        });
        // Continue with submission even if grading fails
      }
    }

    // Check if the student already has a grade for this activity
    const existingGrade = await prisma.activityGrade.findFirst({
      where: {
        activityId,
        studentId,
      },
    });

    // Prepare the submission data
    const submissionData: any = {
      status,
      content: answers,
      submittedAt: new Date(),
      score,
      feedback,
      gradedAt: status === SubmissionStatus.GRADED ? new Date() : null,
      // Store detailed results as JSON in the attachments field
      attachments: storeDetailedResults && detailedResults ? {
        ...((existingGrade?.attachments as any) || {}),
        detailedResults,
        attemptHistory: [
          ...((existingGrade?.attachments as any)?.attemptHistory || []),
          {
            submittedAt: new Date(),
            score,
            status
          }
        ]
      } : existingGrade?.attachments
    };

    // Add learning time fields if provided
    if (timeSpentMinutes) {
      const now = new Date();
      submissionData.timeSpentMinutes = timeSpentMinutes;
      submissionData.learningCompletedAt = now;
      submissionData.learningStartedAt = new Date(now.getTime() - timeSpentMinutes * 60 * 1000);

      // Also add to content for backward compatibility
      if (typeof submissionData.content === 'object' && submissionData.content !== null) {
        submissionData.content.timeSpent = timeSpentMinutes;
      }
    }

    // Update or create the grade record
    let grade: any;
    if (existingGrade) {
      logger.debug('Updating existing activity grade', {
        activityId,
        studentId,
        existingStatus: existingGrade.status,
        newStatus: submissionData.status,
        gradeId: existingGrade.id
      });

      grade = await prisma.activityGrade.update({
        where: { id: existingGrade.id },
        data: submissionData,
      });
    } else {
      logger.debug('Creating new activity grade', {
        activityId,
        studentId,
        status: submissionData.status
      });

      grade = await prisma.activityGrade.create({
        data: {
          activityId,
          studentId,
          ...submissionData,
        },
      });
    }

    logger.debug('Activity grade saved successfully', {
      activityId,
      studentId,
      gradeId: grade.id,
      status: grade.status
    });

    // Update the gradebook if needed
    if (updateGradebook && activity.isGradable && score !== null) {
      await updateStudentGradebook(
        prisma,
        activityId,
        studentId,
        grade,
        activity.maxScore || 100
      );
    }

    // Process rewards for activity completion
    try {
      const activityRewards = new ActivityRewardIntegration(prisma);
      const rewardResult = await activityRewards.processActivityCompletion(
        studentId,
        activityId,
        {
          gradePercentage: score !== null && gradingResult?.maxScore ?
            Math.round((score / gradingResult.maxScore) * 100) : undefined,
          isGraded: activity.isGradable,
          complexity: (activityContent?.complexity || 'medium') as 'low' | 'medium' | 'high'
        }
      );

      logger.debug('Processed activity rewards', {
        activityId,
        studentId,
        pointsAwarded: rewardResult.points,
        levelUp: rewardResult.levelUp,
        achievementsUnlocked: rewardResult.achievements.length
      });
    } catch (rewardError) {
      logger.error('Error processing activity rewards', {
        error: rewardError,
        activityId,
        studentId
      });
      // Continue even if reward processing fails
    }

    // Create a learning time record if time spent is provided
    if (timeSpentMinutes) {
      try {
        const now = new Date();
        const startedAt = new Date(now.getTime() - timeSpentMinutes * 60 * 1000);
        const partitionKey = `class_${activity.classId}_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;

        await prisma.learningTimeRecord.create({
          data: {
            studentId,
            activityId,
            classId: activity.classId,
            timeSpentMinutes,
            startedAt,
            completedAt: now,
            partitionKey
          }
        });

        logger.debug('Created learning time record', {
          activityId,
          studentId,
          timeSpentMinutes
        });
      } catch (timeRecordError) {
        logger.error('Error creating learning time record', {
          error: timeRecordError,
          activityId,
          studentId
        });
        // Continue even if learning time record creation fails
      }
    }

    // Update commitment status if this activity is part of a commitment
    try {
      // Check if the schema has been updated with commitment fields
      // This is a safe approach that will work whether the schema has been updated or not
      const commitmentService = new CommitmentContractService({ prisma });

      // Use a try-catch block to handle potential schema issues
      try {
        await commitmentService.updateCommitmentStatusForActivity(grade.id);

        logger.debug('Updated commitment status for activity', {
          activityId,
          studentId,
          gradeId: grade.id
        });
      } catch (schemaError) {
        // If there's a schema error, log it but don't fail the submission
        logger.warn('Schema might not be updated yet for commitment tracking', {
          error: schemaError,
          activityId,
          studentId
        });
      }
    } catch (commitmentError) {
      logger.error('Error updating commitment status', {
        error: commitmentError,
        activityId,
        studentId
      });
      // Continue even if commitment processing fails
    }

    return {
      success: true,
      gradeId: grade.id,
      score,
      maxScore: gradingResult?.maxScore || null,
      feedback,
      isGraded: status === SubmissionStatus.GRADED,
      detailedResults: storeDetailedResults ? detailedResults : undefined
    };
  } catch (error) {
    logger.error('Error processing activity submission', { error });
    throw error;
  }
}

/**
 * Update the student's gradebook with the activity grade
 *
 * @param prisma Prisma client instance
 * @param activityId ID of the activity
 * @param studentId ID of the student
 * @param grade The activity grade record
 * @param maxScore Maximum possible score for the activity
 */
async function updateStudentGradebook(
  prisma: PrismaClient,
  activityId: string,
  studentId: string,
  grade: any,
  maxScore: number
): Promise<void> {
  try {
    // Find the activity to get its class ID
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { classId: true }
    });

    if (!activity) {
      throw new Error('Activity not found');
    }

    // Find the gradebook for this activity's class
    const gradeBook = await prisma.gradeBook.findFirst({
      where: {
        classId: activity.classId
      },
      select: { id: true }
    });

    if (!gradeBook) {
      logger.warn('No gradebook found for class', { classId: activity.classId });
      return;
    }

    // Find the student's grade record in the gradebook
    let studentGrade = await prisma.studentGrade.findUnique({
      where: {
        gradeBookId_studentId: {
          gradeBookId: gradeBook.id,
          studentId
        }
      }
    });

    // If no student grade record exists, create one
    if (!studentGrade) {
      studentGrade = await prisma.studentGrade.create({
        data: {
          gradeBookId: gradeBook.id,
          studentId,
          assessmentGrades: {},
          activityGrades: {
            [activityId]: {
              id: grade.id,
              score: grade.score,
              maxScore,
              submittedAt: grade.submittedAt,
              gradedAt: grade.gradedAt,
              status: grade.status
            }
          }
        }
      });

      logger.debug('Created new student grade record with activity grade', {
        gradeBookId: gradeBook.id,
        studentId,
        activityGradeId: grade.id
      });
    } else {
      // Get the current activity grades or initialize an empty object
      const currentActivityGrades = studentGrade.activityGrades as Record<string, any> || {};

      // Update the activity grade in the record
      const updatedActivityGrades = {
        ...currentActivityGrades,
        [activityId]: {
          id: grade.id,
          score: grade.score,
          maxScore,
          submittedAt: grade.submittedAt,
          gradedAt: grade.gradedAt,
          status: grade.status
        }
      };

      // Update the student grade record
      await prisma.studentGrade.update({
        where: {
          id: studentGrade.id
        },
        data: {
          activityGrades: updatedActivityGrades,
          updatedAt: new Date()
        }
      });

      logger.debug('Updated student grade record with activity grade', {
        gradeBookId: gradeBook.id,
        studentId,
        activityGradeId: grade.id
      });
    }
  } catch (error) {
    logger.error('Error updating gradebook', { error });
    // Continue even if gradebook update fails
  }
}
