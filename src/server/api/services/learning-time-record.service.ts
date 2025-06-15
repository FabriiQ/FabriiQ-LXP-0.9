import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

/**
 * Service for managing learning time records
 */
export class LearningTimeRecordService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a learning time record and associate it with an activity grade
   */
  async createWithActivityGrade(data: {
    studentId: string;
    activityId: string;
    classId: string;
    timeSpentMinutes: number;
    startedAt: Date;
    completedAt: Date;
    activityGradeId?: string;
  }) {
    try {
      // If no activityGradeId is provided, try to find one
      if (!data.activityGradeId) {
        const activityGrade = await this.prisma.activityGrade.findFirst({
          where: {
            studentId: data.studentId,
            activityId: data.activityId,
          },
        });

        if (activityGrade) {
          data.activityGradeId = activityGrade.id;
        }
      }

      // Create the learning time record
      const learningTimeRecord = await this.prisma.learningTimeRecord.create({
        data: {
          studentId: data.studentId,
          activityId: data.activityId,
          classId: data.classId,
          activityGradeId: data.activityGradeId,
          timeSpentMinutes: data.timeSpentMinutes,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
        },
      });

      // If we have an activity grade, update its learning time fields
      if (data.activityGradeId) {
        // Get all learning time records for this activity grade
        const learningTimeRecords = await this.prisma.learningTimeRecord.findMany({
          where: {
            activityGradeId: data.activityGradeId,
          },
        });

        // Calculate total time spent
        const totalTimeSpent = learningTimeRecords.reduce(
          (sum, record) => sum + record.timeSpentMinutes,
          0
        );

        // Find earliest start and latest completion
        const startTimes = learningTimeRecords.map(record => record.startedAt);
        const completionTimes = learningTimeRecords.map(record => record.completedAt);
        const earliestStart = new Date(Math.min(...startTimes.map(date => date.getTime())));
        const latestCompletion = new Date(Math.max(...completionTimes.map(date => date.getTime())));

        // Update the activity grade
        await this.prisma.activityGrade.update({
          where: {
            id: data.activityGradeId,
          },
          data: {
            timeSpentMinutes: totalTimeSpent,
            learningStartedAt: earliestStart,
            learningCompletedAt: latestCompletion,
          },
        });
      }

      return learningTimeRecord;
    } catch (error) {
      logger.error("Error creating learning time record", { error });
      throw error;
    }
  }

  /**
   * Get learning time records for a student
   */
  async getByStudent(studentId: string, classId?: string) {
    try {
      const whereCondition: any = {
        studentId,
      };

      if (classId) {
        whereCondition.classId = classId;
      }

      return this.prisma.learningTimeRecord.findMany({
        where: whereCondition,
        include: {
          activity: {
            include: {
              subject: true,
              topic: true,
            },
          },
          activityGrade: true,
        },
        orderBy: {
          completedAt: "desc",
        },
      });
    } catch (error) {
      logger.error("Error getting learning time records by student", { error });
      throw error;
    }
  }

  /**
   * Get learning time records for an activity
   */
  async getByActivity(activityId: string) {
    try {
      return this.prisma.learningTimeRecord.findMany({
        where: {
          activityId,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          activityGrade: true,
        },
        orderBy: {
          completedAt: "desc",
        },
      });
    } catch (error) {
      logger.error("Error getting learning time records by activity", { error });
      throw error;
    }
  }

  /**
   * Get learning time records for an activity grade
   */
  async getByActivityGrade(activityGradeId: string) {
    try {
      return this.prisma.learningTimeRecord.findMany({
        where: {
          activityGradeId,
        },
        orderBy: {
          completedAt: "desc",
        },
      });
    } catch (error) {
      logger.error("Error getting learning time records by activity grade", { error });
      throw error;
    }
  }
}
