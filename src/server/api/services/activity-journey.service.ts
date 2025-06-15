/**
 * Activity Journey Service
 *
 * This service is responsible for creating journey events from completed activities.
 * It integrates with the JourneyEventService to create events when activities are completed.
 */

import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { JourneyEventService } from './journey-event.service';
import { logger } from '@/server/api/utils/logger';

interface ActivityJourneyServiceConfig {
  prisma: PrismaClient;
}

export class ActivityJourneyService {
  private prisma: PrismaClient;
  private journeyEventService: JourneyEventService;

  constructor(config: ActivityJourneyServiceConfig) {
    this.prisma = config.prisma;
    this.journeyEventService = new JourneyEventService({ prisma: this.prisma });
  }

  /**
   * Create a journey event for a completed activity
   */
  async createActivityJourneyEvent(activityGradeId: string) {
    try {
      // Get the activity grade with activity details
      const activityGrade = await this.prisma.activityGrade.findUnique({
        where: { id: activityGradeId },
        include: {
          activity: {
            select: {
              id: true,
              title: true,
              classId: true,
              subjectId: true,
              learningType: true,
              content: true,
            }
          }
        }
      });

      if (!activityGrade) {
        logger.error('Activity grade not found', { activityGradeId });
        return null;
      }

      // Only create journey events for submitted or graded activities
      if (activityGrade.status !== SubmissionStatus.SUBMITTED &&
          activityGrade.status !== SubmissionStatus.GRADED) {
        logger.info('Activity not submitted or graded, skipping journey event', {
          activityGradeId,
          status: activityGrade.status
        });
        return null;
      }

      // Get activity type from learningType or content
      let activityType = 'activity';
      if (activityGrade.activity?.learningType) {
        activityType = activityGrade.activity.learningType.toString().toLowerCase();
      } else if (activityGrade.activity?.content) {
        const content = activityGrade.activity.content as any;
        if (content.activityType) {
          activityType = content.activityType.toLowerCase();
        }
      }

      // Create a title based on activity type and title
      const title = activityGrade.activity?.title
        ? `Completed ${activityGrade.activity.title}`
        : `Completed ${activityType.replace(/_/g, ' ')} activity`;

      // Create a description based on score if available
      let description = 'Completed an activity successfully';
      if (activityGrade.score !== null) {
        const scoreText = activityGrade.score === 100
          ? 'Perfect score!'
          : `Score: ${activityGrade.score}%`;
        description = `${description} - ${scoreText}`;
      }

      // Create the journey event
      const journeyEvent = await this.journeyEventService.createJourneyEvent({
        studentId: activityGrade.studentId,
        title,
        description,
        date: activityGrade.submittedAt || activityGrade.updatedAt,
        type: 'activity',
        classId: activityGrade.activity?.classId,
        subjectId: activityGrade.activity?.subjectId,
        metadata: {
          activityId: activityGrade.activityId,
          activityGradeId: activityGrade.id,
          score: activityGrade.score,
          activityType
        }
      });

      logger.info('Created journey event for activity', {
        activityGradeId,
        journeyEventId: journeyEvent.id
      });

      return journeyEvent;
    } catch (error) {
      logger.error('Error creating journey event for activity', { error, activityGradeId });
      return null;
    }
  }

  /**
   * Generate journey events for all completed activities for a student
   * This can be used to backfill journey events for existing activities
   */
  async generateJourneyEventsForStudent(studentId: string, classId?: string, limit = 50) {
    try {
      // Find completed activities without journey events
      const completedActivities = await this.prisma.activityGrade.findMany({
        where: {
          studentId,
          status: {
            in: [SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED]
          },
          activity: classId ? {
            classId: classId
          } : undefined
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: limit
      });

      logger.info('Found completed activities for journey events', {
        studentId,
        classId,
        count: completedActivities.length
      });

      // Create journey events for each activity
      const results: any[] = [];
      for (const activity of completedActivities) {
        const journeyEvent = await this.createActivityJourneyEvent(activity.id);
        if (journeyEvent) {
          results.push(journeyEvent);
        }
      }

      return results;
    } catch (error) {
      logger.error('Error generating journey events for student', { error, studentId, classId });
      return [];
    }
  }
}
