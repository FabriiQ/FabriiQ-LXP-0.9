import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';

interface LearningTimeServiceConfig {
  prisma: PrismaClient;
}

export class LearningTimeService {
  private prisma: PrismaClient;

  constructor({ prisma }: LearningTimeServiceConfig) {
    this.prisma = prisma;
  }

  /**
   * Record time spent on an activity
   */
  async recordTimeSpent(data: {
    studentId: string;
    activityId: string;
    timeSpentMinutes: number;
    startedAt?: Date;
    completedAt?: Date;
  }): Promise<void> {
    const { studentId, activityId, timeSpentMinutes, startedAt, completedAt } = data;

    try {
      // Get the activity to determine the classId
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: { classId: true }
      });

      if (!activity) {
        throw new Error(`Activity not found: ${activityId}`);
      }

      const now = new Date();
      const actualStartedAt = startedAt || new Date(now.getTime() - timeSpentMinutes * 60 * 1000);
      const actualCompletedAt = completedAt || now;

      // Create partition key (class_YYYY_MM)
      const year = actualCompletedAt.getFullYear();
      const month = String(actualCompletedAt.getMonth() + 1).padStart(2, '0');
      const partitionKey = `class_${activity.classId}_${year}_${month}`;

      // Create the time tracking record
      await this.prisma.learningTimeRecord.create({
        data: {
          studentId,
          activityId,
          classId: activity.classId,
          timeSpentMinutes,
          startedAt: actualStartedAt,
          completedAt: actualCompletedAt,
          partitionKey,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Also update the activity grade for backward compatibility
      const activityGrade = await this.prisma.activityGrade.findUnique({
        where: {
          activityId_studentId: {
            activityId,
            studentId,
          },
        },
      });

      if (activityGrade) {
        // Update the existing activity grade with time spent
        await this.prisma.activityGrade.update({
          where: {
            id: activityGrade.id,
          },
          data: {
            // Store time spent in both the content JSON field and the dedicated fields
            content: {
              ...(activityGrade.content as any || {}),
              timeSpent: timeSpentMinutes,
            },
            // Use Prisma.DbNull for type safety with new fields
            // These fields will be added to the database schema but might not be in the TypeScript types yet
            ...({
              timeSpentMinutes: timeSpentMinutes,
              learningStartedAt: actualStartedAt,
              learningCompletedAt: actualCompletedAt,
            } as any),
          },
        });
      } else {
        // Create a new activity grade with time spent
        await this.prisma.activityGrade.create({
          data: {
            activityId,
            studentId,
            status: 'SUBMITTED',
            content: {
              timeSpent: timeSpentMinutes,
            },
            // Use type assertion for new fields
            ...({
              timeSpentMinutes: timeSpentMinutes,
              learningStartedAt: actualStartedAt,
              learningCompletedAt: actualCompletedAt,
            } as any),
          },
        });
      }
    } catch (error) {
      console.error('Error recording time spent', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to record time spent',
      });
    }
  }

  /**
   * Batch record time spent on activities
   */
  async batchRecordTimeSpent(data: {
    studentId: string;
    records: Array<{
      activityId: string;
      timeSpentMinutes: number;
      startedAt: number; // timestamp
      completedAt: number; // timestamp
    }>;
  }): Promise<void> {
    const { studentId, records } = data;

    try {
      // Get all activity IDs
      const activityIds = records.map(record => record.activityId);

      // Get all activities to determine classIds
      const activities = await this.prisma.activity.findMany({
        where: { id: { in: activityIds } },
        select: { id: true, classId: true }
      });

      // Create a map of activityId to classId
      const activityClassMap = new Map(
        activities.map(activity => [activity.id, activity.classId])
      );

      // Process each record
      for (const record of records) {
        const classId = activityClassMap.get(record.activityId);
        if (!classId) {
          throw new Error(`Activity not found: ${record.activityId}`);
        }

        const startedAt = new Date(record.startedAt);
        const completedAt = new Date(record.completedAt);
        const year = completedAt.getFullYear();
        const month = String(completedAt.getMonth() + 1).padStart(2, '0');
        const partitionKey = `class_${classId}_${year}_${month}`;

        // Insert record using Prisma
        await this.prisma.learningTimeRecord.create({
          data: {
            studentId,
            activityId: record.activityId,
            classId,
            timeSpentMinutes: record.timeSpentMinutes,
            startedAt,
            completedAt,
            partitionKey,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error batch recording time spent', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to batch record time spent',
      });
    }
  }

  /**
   * Get learning time statistics for a student
   */
  async getLearningTimeStats(data: {
    studentId: string;
    classId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { studentId, classId, startDate, endDate } = data;

    try {
      // Build the query filter
      const filter: any = { studentId };

      // Add class filter if provided
      if (classId) {
        filter.classId = classId;
      }

      // Add date range filter if provided
      if (startDate || endDate) {
        filter.completedAt = {};
        if (startDate) filter.completedAt.gte = startDate;
        if (endDate) filter.completedAt.lte = endDate;
      }

      // Build the where clause for Prisma queries
      const whereClause: any = { studentId };

      if (classId) {
        whereClause.classId = classId;
      }

      if (startDate) {
        whereClause.completedAt = { ...(whereClause.completedAt || {}), gte: startDate };
      }

      if (endDate) {
        whereClause.completedAt = { ...(whereClause.completedAt || {}), lte: endDate };
      }

      // Use Prisma aggregation for better performance
      const totalTimeSpent = await this.prisma.learningTimeRecord.aggregate({
        where: whereClause,
        _sum: {
          timeSpentMinutes: true
        }
      });

      // Count distinct activities
      const distinctActivities = await this.prisma.learningTimeRecord.findMany({
        where: whereClause,
        distinct: ['activityId'],
        select: {
          activityId: true
        }
      });

      const totalStats = [{
        totalTimeSpentMinutes: totalTimeSpent._sum.timeSpentMinutes || 0,
        totalActivitiesCompleted: distinctActivities.length
      }];

      // Get time spent by subject using Prisma
      const timeBySubjectData = await this.prisma.learningTimeRecord.findMany({
        where: whereClause,
        select: {
          timeSpentMinutes: true,
          activityId: true,
          activity: {
            select: {
              subjectId: true,
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      // Process the data to group by subject
      const subjectMap = new Map<string, {
        subjectId: string;
        subjectName: string;
        timeSpentMinutes: number;
        activityCount: number;
        activityIds: Set<string>;
      }>();

      timeBySubjectData.forEach(record => {
        if (!record.activity?.subject) return;

        const subjectId = record.activity.subject.id;
        const subjectName = record.activity.subject.name;

        if (!subjectMap.has(subjectId)) {
          subjectMap.set(subjectId, {
            subjectId,
            subjectName,
            timeSpentMinutes: 0,
            activityCount: 0,
            activityIds: new Set()
          });
        }

        const subjectData = subjectMap.get(subjectId)!;
        subjectData.timeSpentMinutes += record.timeSpentMinutes || 0;
        subjectData.activityIds.add(record.activityId);
      });

      // Convert map to array and calculate activity count
      const timeBySubject = Array.from(subjectMap.values()).map(subject => ({
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        timeSpentMinutes: subject.timeSpentMinutes,
        activityCount: subject.activityIds.size
      })).sort((a, b) => b.timeSpentMinutes - a.timeSpentMinutes);

      // Get time spent by activity type using Prisma
      const timeByActivityTypeData = await this.prisma.learningTimeRecord.findMany({
        where: whereClause,
        select: {
          timeSpentMinutes: true,
          activityId: true,
          activity: {
            select: {
              learningType: true
            }
          }
        }
      });

      // Process the data to group by activity type
      const activityTypeMap = new Map<string, {
        activityType: string;
        timeSpentMinutes: number;
        activityCount: number;
        activityIds: Set<string>;
      }>();

      timeByActivityTypeData.forEach(record => {
        const activityType = record.activity?.learningType || 'UNKNOWN';

        if (!activityTypeMap.has(activityType)) {
          activityTypeMap.set(activityType, {
            activityType,
            timeSpentMinutes: 0,
            activityCount: 0,
            activityIds: new Set()
          });
        }

        const typeData = activityTypeMap.get(activityType)!;
        typeData.timeSpentMinutes += record.timeSpentMinutes || 0;
        typeData.activityIds.add(record.activityId);
      });

      // Convert map to array and calculate activity count
      const timeByActivityType = Array.from(activityTypeMap.values()).map(type => ({
        activityType: type.activityType,
        timeSpentMinutes: type.timeSpentMinutes,
        activityCount: type.activityIds.size
      })).sort((a, b) => b.timeSpentMinutes - a.timeSpentMinutes);

      // Get time data from ActivityGrade using the new fields
      const activityGradeFilter: any = {
        studentId,
        status: {
          in: ['SUBMITTED', 'GRADED', 'COMPLETED'],
        },
        timeSpentMinutes: {
          gt: 0
        }
      };

      if (classId) {
        activityGradeFilter.activity = {
          classId,
        };
      }

      if (startDate || endDate) {
        activityGradeFilter.learningCompletedAt = {};
        if (startDate) activityGradeFilter.learningCompletedAt.gte = startDate;
        if (endDate) activityGradeFilter.learningCompletedAt.lte = endDate;
      }

      // Get all activity grades for the student
      const activityGrades = await this.prisma.activityGrade.findMany({
        where: activityGradeFilter,
        include: {
          activity: {
            include: {
              subject: true,
            },
          },
        },
      });

      // Calculate total time spent from activity grade data
      let activityGradeTotalTimeSpentMinutes = 0;
      const activityGradeSubjectTimeMap: Record<string, { timeSpent: number; count: number; name: string }> = {};
      const activityGradeActivityTypeTimeMap: Record<string, { timeSpent: number; count: number }> = {};

      // Process each activity grade
      activityGrades.forEach((grade) => {
        // Skip if no activity
        if (!grade.activity) return;

        // Use the dedicated timeSpentMinutes field, fallback to content.timeSpent for backward compatibility
        const timeSpent = (grade as any).timeSpentMinutes || ((grade.content as any)?.timeSpent || 0);
        if (timeSpent <= 0) return;

        // Add to total time
        activityGradeTotalTimeSpentMinutes += timeSpent;

        // Add to subject time
        const subjectId = grade.activity.subjectId;
        const subjectName = grade.activity.subject.name;
        if (!activityGradeSubjectTimeMap[subjectId]) {
          activityGradeSubjectTimeMap[subjectId] = { timeSpent: 0, count: 0, name: subjectName };
        }
        activityGradeSubjectTimeMap[subjectId].timeSpent += timeSpent;
        activityGradeSubjectTimeMap[subjectId].count += 1;

        // Add to activity type time
        const activityType = grade.activity.learningType || 'UNKNOWN';
        if (!activityGradeActivityTypeTimeMap[activityType]) {
          activityGradeActivityTypeTimeMap[activityType] = { timeSpent: 0, count: 0 };
        }
        activityGradeActivityTypeTimeMap[activityType].timeSpent += timeSpent;
        activityGradeActivityTypeTimeMap[activityType].count += 1;
      });

      // Combine data from learning_time_records and activity_grades
      const totalTimeSpentMinutes = (totalStats[0]?.totalTimeSpentMinutes || 0) + activityGradeTotalTimeSpentMinutes;
      const totalActivitiesCompleted = (totalStats[0]?.totalActivitiesCompleted || 0) + activityGrades.length;

      // Combine subject data
      const combinedSubjectMap = new Map();

      // Add data from learning_time_records
      timeBySubject.forEach((subject: any) => {
        combinedSubjectMap.set(subject.subjectId, {
          subjectId: subject.subjectId,
          subjectName: subject.subjectName,
          timeSpentMinutes: subject.timeSpentMinutes,
          activityCount: subject.activityCount,
        });
      });

      // Add data from activity_grades
      Object.entries(activityGradeSubjectTimeMap).forEach(([subjectId, data]) => {
        if (combinedSubjectMap.has(subjectId)) {
          const existing = combinedSubjectMap.get(subjectId);
          combinedSubjectMap.set(subjectId, {
            ...existing,
            timeSpentMinutes: existing.timeSpentMinutes + data.timeSpent,
            activityCount: existing.activityCount + data.count,
          });
        } else {
          combinedSubjectMap.set(subjectId, {
            subjectId,
            subjectName: data.name,
            timeSpentMinutes: data.timeSpent,
            activityCount: data.count,
          });
        }
      });

      // Combine activity type data
      const combinedActivityTypeMap = new Map();

      // Add data from learning_time_records
      timeByActivityType.forEach((type: any) => {
        combinedActivityTypeMap.set(type.activityType, {
          activityType: type.activityType,
          timeSpentMinutes: type.timeSpentMinutes,
          activityCount: type.activityCount,
        });
      });

      // Add data from activity_grades
      Object.entries(activityGradeActivityTypeTimeMap).forEach(([activityType, data]) => {
        if (combinedActivityTypeMap.has(activityType)) {
          const existing = combinedActivityTypeMap.get(activityType);
          combinedActivityTypeMap.set(activityType, {
            ...existing,
            timeSpentMinutes: existing.timeSpentMinutes + data.timeSpent,
            activityCount: existing.activityCount + data.count,
          });
        } else {
          combinedActivityTypeMap.set(activityType, {
            activityType,
            timeSpentMinutes: data.timeSpent,
            activityCount: data.count,
          });
        }
      });

      return {
        totalTimeSpentMinutes,
        totalActivitiesCompleted,
        timeSpentBySubject: Array.from(combinedSubjectMap.values()),
        timeSpentByActivityType: Array.from(combinedActivityTypeMap.values()),
      };
    } catch (error) {
      console.error('Error getting learning time stats', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get learning time statistics',
      });
    }
  }
}
