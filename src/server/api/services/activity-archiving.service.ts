/**
 * Activity Archiving Service
 *
 * This service provides functionality for archiving old activity grades
 * to maintain database performance while preserving historical data.
 *
 * It implements a linear archiving strategy that moves old submissions
 * to an archive table with summarized data for long-term storage.
 */

import { PrismaClient, SubmissionStatus, Prisma } from '@prisma/client';
import { logger } from '@/server/api/utils/logger';
import { ActivityCacheService } from './activity-cache.service';

// Archiving configuration
interface ArchivingConfig {
  ageThresholdDays: number; // Age in days before a submission is eligible for archiving
  batchSize: number; // Number of submissions to archive in a batch
  preserveDetailedResults: boolean; // Whether to preserve detailed results in the archive
  academicYearFormat: (date: Date) => string; // Function to determine academic year from a date
}

/**
 * Activity Archiving Service
 *
 * This service manages the archiving of old activity grades.
 */
export class ActivityArchivingService {
  private prisma: PrismaClient;
  private config: ArchivingConfig;

  /**
   * Create a new ActivityArchivingService instance
   *
   * @param prisma Prisma client instance
   * @param config Optional configuration
   */
  constructor(
    prisma: PrismaClient,
    config?: Partial<ArchivingConfig>
  ) {
    this.prisma = prisma;
    this.config = {
      ageThresholdDays: 365, // Archive submissions older than 1 year by default
      batchSize: 100, // Process 100 submissions at a time
      preserveDetailedResults: false, // Don't preserve detailed results by default
      academicYearFormat: (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        // If before August, it's the previous academic year
        return month < 7 ? `${year-1}-${year}` : `${year}-${year+1}`;
      },
      ...config
    };
  }

  /**
   * Archive old activity grades
   *
   * @param options Optional archiving options
   * @returns Statistics about the archiving operation
   */
  async archiveOldGrades(
    options?: {
      classId?: string; // Limit to a specific class
      beforeDate?: Date; // Override the age threshold with a specific date
      userId?: string; // User performing the archiving
      dryRun?: boolean; // If true, don't actually archive, just report what would be archived
    }
  ): Promise<{
    totalArchived: number;
    totalFailed: number;
    details: any[];
  }> {
    const { classId, beforeDate, userId, dryRun = false } = options || {};

    // Calculate the cutoff date
    const cutoffDate = beforeDate || new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.ageThresholdDays);

    // Build the query to find eligible grades
    const whereClause: any = {
      submittedAt: {
        lt: cutoffDate
      },
      isArchived: false
    };

    if (classId) {
      whereClause.activity = {
        classId
      };
    }

    // Get the total count of eligible grades
    const totalEligible = await this.prisma.activityGrade.count({
      where: whereClause
    });

    logger.info('Starting activity grade archiving', {
      totalEligible,
      cutoffDate,
      classId,
      dryRun
    });

    if (dryRun) {
      return {
        totalArchived: 0,
        totalFailed: 0,
        details: [{
          message: 'Dry run completed',
          totalEligible,
          cutoffDate
        }]
      };
    }

    // Process in batches
    let totalArchived = 0;
    let totalFailed = 0;
    const details: any[] = [];

    // Continue processing batches until we've archived everything
    let hasMore = true;
    while (hasMore) {
      // Get a batch of grades to archive
      const grades = await this.prisma.activityGrade.findMany({
        where: whereClause,
        include: {
          activity: {
            select: {
              id: true,
              title: true,
              classId: true,
              class: {
                select: {
                  termId: true
                }
              }
            }
          }
        },
        take: this.config.batchSize,
        orderBy: {
          submittedAt: 'asc' // Archive oldest first
        }
      });

      if (grades.length === 0) {
        hasMore = false;
        continue;
      }

      // Process each grade in the batch
      const results = await Promise.allSettled(
        grades.map(grade => this.archiveGrade(grade, userId))
      );

      // Count successes and failures
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          totalArchived++;
        } else {
          totalFailed++;
          details.push({
            gradeId: grades[index].id,
            error: result.reason
          });
        }
      });

      logger.info('Archived batch of activity grades', {
        batchSize: grades.length,
        totalArchived,
        totalFailed
      });
    }

    return {
      totalArchived,
      totalFailed,
      details
    };
  }

  /**
   * Archive a single activity grade
   *
   * @param grade The grade to archive
   * @param userId Optional ID of the user performing the archiving
   * @private
   */
  private async archiveGrade(grade: any, userId?: string): Promise<void> {
    try {
      // Extract the term ID from the activity's class
      const termId = grade.activity.class?.termId;

      // Determine the academic year
      const academicYear = this.config.academicYearFormat(grade.submittedAt);

      // Create a summary of the submission
      const summary = this.createSubmissionSummary(grade);

      // Create the archived record
      await this.prisma.archivedActivityGrade.create({
        data: {
          id: `archived_${grade.id}`,
          originalId: grade.id,
          activityId: grade.activityId,
          studentId: grade.studentId,
          score: grade.score,
          status: grade.status,
          submittedAt: grade.submittedAt,
          gradedAt: grade.gradedAt,
          content: this.config.preserveDetailedResults ? grade.content : null,
          summary,
          archivedAt: new Date(),
          archivedById: userId,
          academicYear,
          termId
        }
      });

      // Mark the original grade as archived
      await this.prisma.activityGrade.update({
        where: { id: grade.id },
        data: {
          attachments: {
            ...(grade.attachments || {}),
            isArchived: true
          }
        }
      });

      // Invalidate relevant caches
      ActivityCacheService.invalidateStudentStats(grade.studentId);
      ActivityCacheService.invalidateActivityStats(grade.activityId);
      ActivityCacheService.invalidateSubmissionDetails(grade.id);

      logger.debug('Archived activity grade', {
        gradeId: grade.id,
        activityId: grade.activityId,
        studentId: grade.studentId
      });
    } catch (error) {
      logger.error('Failed to archive activity grade', {
        gradeId: grade.id,
        error
      });
      throw error;
    }
  }

  /**
   * Create a summary of a submission for archiving
   *
   * @param grade The grade to summarize
   * @returns A summary object
   * @private
   */
  private createSubmissionSummary(grade: any): any {
    // Extract detailed results if available
    const detailedResults = (grade.attachments as any)?.detailedResults;

    // Basic summary
    const summary: any = {
      activityTitle: grade.activity.title,
      score: grade.score,
      maxScore: detailedResults?.maxScore,
      percentage: detailedResults?.percentage,
      passed: detailedResults?.passed,
      submittedAt: grade.submittedAt,
      gradedAt: grade.gradedAt,
      status: grade.status
    };

    // Add question summary if available
    if (detailedResults?.questionResults) {
      summary.questions = detailedResults.questionResults.map((q: any) => ({
        questionId: q.questionId,
        isCorrect: q.isCorrect,
        points: q.points,
        maxPoints: q.maxPoints
      }));

      // Calculate statistics
      const totalQuestions = summary.questions.length;
      const correctQuestions = summary.questions.filter((q: any) => q.isCorrect).length;

      summary.questionStats = {
        total: totalQuestions,
        correct: correctQuestions,
        correctPercentage: totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0
      };
    }

    return summary;
  }

  /**
   * Restore an archived grade
   *
   * @param archivedGradeId ID of the archived grade to restore
   * @returns The restored grade
   */
  async restoreArchivedGrade(archivedGradeId: string): Promise<any> {
    // Get the archived grade using Prisma
    const archivedGrade = await this.prisma.archivedActivityGrade.findUnique({
      where: { id: archivedGradeId }
    });

    if (!archivedGrade) {
      throw new Error(`Archived grade not found: ${archivedGradeId}`);
    }

    // Check if the original grade still exists
    const originalGrade = await this.prisma.activityGrade.findUnique({
      where: { id: archivedGrade.originalId }
    });

    if (originalGrade) {
      // Update the original grade to mark it as not archived
      await this.prisma.activityGrade.update({
        where: { id: originalGrade.id },
        data: {
          attachments: {
            ...(originalGrade.attachments || {}),
            isArchived: false
          }
        }
      });

      // Delete the archived grade
      await this.prisma.archivedActivityGrade.delete({
        where: { id: archivedGradeId }
      });

      // Invalidate relevant caches
      ActivityCacheService.invalidateStudentStats(originalGrade.studentId);
      ActivityCacheService.invalidateActivityStats(originalGrade.activityId);
      ActivityCacheService.invalidateSubmissionDetails(originalGrade.id);

      return originalGrade;
    } else {
      // Original grade doesn't exist, recreate it
      const newGrade = await this.prisma.activityGrade.create({
        data: {
          activityId: archivedGrade.activityId,
          studentId: archivedGrade.studentId,
          score: archivedGrade.score,
          status: archivedGrade.status,
          submittedAt: archivedGrade.submittedAt,
          gradedAt: archivedGrade.gradedAt,
          content: archivedGrade.content,
          attachments: { isArchived: false }
        }
      });

      // Delete the archived grade
      await this.prisma.archivedActivityGrade.delete({
        where: { id: archivedGradeId }
      });

      // Invalidate relevant caches
      ActivityCacheService.invalidateStudentStats(newGrade.studentId);
      ActivityCacheService.invalidateActivityStats(newGrade.activityId);

      return newGrade;
    }
  }

  /**
   * Get archived grades for a student
   *
   * @param studentId Student ID
   * @param options Optional filters
   * @returns Archived grades for the student
   */
  async getArchivedGradesForStudent(
    studentId: string,
    options?: {
      academicYear?: string;
      termId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<any> {
    const { academicYear, termId, limit = 50, offset = 0 } = options || {};

    // Build the where clause for Prisma queries
    const whereClause: any = {
      studentId
    };

    if (academicYear) {
      whereClause.academicYear = academicYear;
    }

    if (termId) {
      whereClause.termId = termId;
    }

    // Get the total count using Prisma
    const totalCount = await this.prisma.archivedActivityGrade.count({
      where: whereClause
    });

    // Get the archived grades using Prisma
    const archivedGrades = await this.prisma.archivedActivityGrade.findMany({
      where: whereClause,
      orderBy: {
        submittedAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    return {
      grades: archivedGrades,
      totalCount,
      limit,
      offset
    };
  }

  /**
   * Get archived grades for an activity
   *
   * @param activityId Activity ID
   * @param options Optional filters
   * @returns Archived grades for the activity
   */
  async getArchivedGradesForActivity(
    activityId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<any> {
    const { limit = 50, offset = 0 } = options || {};

    // Get the total count using Prisma
    const totalCount = await this.prisma.archivedActivityGrade.count({
      where: { activityId }
    });

    // Get the archived grades using Prisma
    const archivedGrades = await this.prisma.archivedActivityGrade.findMany({
      where: { activityId },
      orderBy: {
        submittedAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    return {
      grades: archivedGrades,
      totalCount,
      limit,
      offset
    };
  }
}
