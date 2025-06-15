import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { LessonPlanStatus } from '@prisma/client';

interface LessonPlanCalendarServiceContext {
  prisma: PrismaClient;
}

/**
 * Service for handling lesson plan calendar integration
 */
export class LessonPlanCalendarService {
  private prisma: PrismaClient;

  constructor({ prisma }: LessonPlanCalendarServiceContext) {
    this.prisma = prisma;
  }

  /**
   * Get lesson plan events for a specific date range
   * @param startDate Start date of the range
   * @param endDate End date of the range
   * @param classId Optional class ID to filter by
   * @param teacherId Optional teacher ID to filter by
   * @returns Array of lesson plan events
   */
  async getLessonPlanEvents(
    startDate: Date,
    endDate: Date,
    classId?: string,
    teacherId?: string
  ) {
    try {
      // Build the where clause
      const where: any = {
        status: LessonPlanStatus.APPROVED,
        startDate: {
          lte: endDate
        },
        endDate: {
          gte: startDate
        }
      };

      // Add optional filters
      if (classId) {
        where.classId = classId;
      }

      if (teacherId) {
        where.teacherId = teacherId;
      }

      // Get lesson plans
      const lessonPlans = await this.prisma.lessonPlan.findMany({
        where,
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true
        }
      });

      // Transform lesson plans into calendar events
      return lessonPlans.map(plan => ({
        id: plan.id,
        title: plan.title,
        start: plan.startDate,
        end: plan.endDate,
        type: 'LESSON_PLAN',
        color: '#5A8A84', // Medium teal color
        description: plan.description || '',
        metadata: {
          teacherName: plan.teacher.user.name,
          className: plan.class.name,
          subjectName: plan.subject?.name,
          planType: plan.planType
        }
      }));
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get lesson plan events: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Get lesson plan events for a specific teacher
   * @param teacherId Teacher ID
   * @param startDate Start date of the range
   * @param endDate End date of the range
   * @returns Array of lesson plan events
   */
  async getTeacherLessonPlanEvents(
    teacherId: string,
    startDate: Date,
    endDate: Date
  ) {
    return this.getLessonPlanEvents(startDate, endDate, undefined, teacherId);
  }

  /**
   * Get lesson plan events for a specific class
   * @param classId Class ID
   * @param startDate Start date of the range
   * @param endDate End date of the range
   * @returns Array of lesson plan events
   */
  async getClassLessonPlanEvents(
    classId: string,
    startDate: Date,
    endDate: Date
  ) {
    return this.getLessonPlanEvents(startDate, endDate, classId);
  }

  /**
   * Export lesson plan events to iCalendar format
   * @param lessonPlanId Lesson plan ID
   * @returns iCalendar string
   */
  async exportLessonPlanToCalendar(lessonPlanId: string) {
    try {
      // Get the lesson plan
      const lessonPlan = await this.prisma.lessonPlan.findUnique({
        where: { id: lessonPlanId },
        include: {
          teacher: {
            include: {
              user: true
            }
          },
          class: true,
          subject: true
        }
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Lesson plan not found',
        });
      }

      // Generate iCalendar string
      const icalString = this.generateICalString(lessonPlan);
      
      return icalString;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to export lesson plan to calendar: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Generate iCalendar string for a lesson plan
   * @param lessonPlan Lesson plan
   * @returns iCalendar string
   */
  private generateICalString(lessonPlan: any) {
    // Format dates for iCalendar
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Create a unique identifier
    const uid = `lessonplan-${lessonPlan.id}@aivy-lxp`;
    
    // Create the iCalendar string
    const icalString = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Aivy LXP//Lesson Plan Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `SUMMARY:${lessonPlan.title}`,
      `DESCRIPTION:${lessonPlan.description || ''}`,
      `DTSTART:${formatDate(lessonPlan.startDate)}`,
      `DTEND:${formatDate(lessonPlan.endDate)}`,
      `LOCATION:${lessonPlan.class.name}`,
      `ORGANIZER;CN=${lessonPlan.teacher.user.name}:mailto:${lessonPlan.teacher.user.email || 'noreply@example.com'}`,
      'STATUS:CONFIRMED',
      `CATEGORIES:Lesson Plan,${lessonPlan.subject?.name || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icalString;
  }
}
