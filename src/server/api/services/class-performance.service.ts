import { PrismaClient, SystemStatus } from '@prisma/client';
import { logger } from '../utils/logger';

// Define ClassPerformance type based on the Prisma schema
type ClassPerformance = {
  id: string;
  classId: string;

  // Academic metrics
  averageGrade: number;
  passingRate: number;
  highestGrade: number;
  lowestGrade: number;

  // Attendance metrics
  attendanceRate: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;

  // Participation metrics
  participationRate: number;
  activeStudents: number;

  // Activity metrics
  completionRate: number;
  submissionRate: number;
  activitiesCreated: number;
  activitiesGraded: number;

  // Points metrics
  totalPoints: number;
  averagePoints: number;

  // Improvement metrics
  gradeImprovement: number;

  // Teacher metrics
  teacherFeedbackRate: number;
  gradingTimeliness: number;

  // Timestamps
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;

  // Metadata
  metadata?: any;
};

interface ClassPerformanceServiceOptions {
  prisma: PrismaClient;
}

/**
 * Service for managing class performance metrics
 */
export class ClassPerformanceService {
  private prisma: PrismaClient;

  constructor(options: ClassPerformanceServiceOptions) {
    this.prisma = options.prisma;
  }

  /**
   * Get class performance by class ID
   * @param classId - The ID of the class
   * @returns The class performance data
   */
  async getClassPerformance(classId: string): Promise<ClassPerformance | null> {
    try {
      // Try to get existing performance data
      const existingPerformance = await this.prisma.$queryRaw<ClassPerformance[]>`
        SELECT * FROM class_performance WHERE classId = ${classId} LIMIT 1
      `;

      // If performance data exists, return it
      if (existingPerformance && existingPerformance.length > 0) {
        return existingPerformance[0];
      }

      // If no performance data exists, calculate and create it
      return this.calculateAndUpdateMetrics(classId);
    } catch (error) {
      logger.error('Error getting class performance', { classId, error });
      throw error;
    }
  }

  /**
   * Get class performance for multiple classes
   * @param classIds - Array of class IDs
   * @returns Array of class performance data
   */
  async getClassPerformanceByIds(classIds: string[]): Promise<ClassPerformance[]> {
    try {
      // Get existing performance data
      const existingPerformances = await this.prisma.$queryRaw<ClassPerformance[]>`
        SELECT * FROM class_performance WHERE classId IN (${classIds.join(',')})
      `;

      // Find which classes don't have performance data
      const existingClassIds = existingPerformances.map((p: ClassPerformance) => p.classId);
      const missingClassIds = classIds.filter(id => !existingClassIds.includes(id));

      // Calculate and create performance data for missing classes
      const newPerformances = await Promise.all(
        missingClassIds.map(classId => this.calculateAndUpdateMetrics(classId))
      );

      // Combine existing and new performance data
      return [...existingPerformances, ...newPerformances.filter(Boolean) as ClassPerformance[]];
    } catch (error) {
      logger.error('Error getting class performances', { classIds, error });
      throw error;
    }
  }

  /**
   * Update class performance metrics
   * @param classId - The ID of the class
   * @param data - The data to update
   * @returns The updated class performance data
   */
  async updateClassPerformance(classId: string, data: Partial<ClassPerformance>): Promise<ClassPerformance> {
    try {
      // Check if performance data exists
      const existingPerformance = await this.prisma.$queryRaw<ClassPerformance[]>`
        SELECT * FROM class_performance WHERE classId = ${classId} LIMIT 1
      `;

      if (existingPerformance && existingPerformance.length > 0) {
        // Update existing performance data
        const updateData = {
          ...data,
          lastUpdated: new Date()
        };

        // Build the SET clause for the UPDATE query
        const setClauses = Object.entries(updateData)
          .filter(([key]) => key !== 'id' && key !== 'classId') // Exclude id and classId
          .map(([key, value]) => {
            if (value instanceof Date) {
              return `${key} = '${value.toISOString()}'`;
            } else if (typeof value === 'string') {
              return `${key} = '${value}'`;
            } else if (value === null) {
              return `${key} = NULL`;
            } else {
              return `${key} = ${value}`;
            }
          })
          .join(', ');

        // Execute the UPDATE query
        await this.prisma.$executeRawUnsafe(`
          UPDATE class_performance
          SET ${setClauses}
          WHERE classId = '${classId}'
        `);

        // Fetch and return the updated record
        const updatedPerformance = await this.prisma.$queryRaw<ClassPerformance[]>`
          SELECT * FROM class_performance WHERE classId = ${classId} LIMIT 1
        `;

        return updatedPerformance[0];
      } else {
        // Create new performance data with default values
        const newPerformance: ClassPerformance = {
          id: `cp_${Date.now()}`, // Generate a simple ID
          classId,
          averageGrade: 0,
          passingRate: 0,
          highestGrade: 0,
          lowestGrade: 0,
          attendanceRate: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
          participationRate: 0,
          activeStudents: 0,
          completionRate: 0,
          submissionRate: 0,
          activitiesCreated: 0,
          activitiesGraded: 0,
          totalPoints: 0,
          averagePoints: 0,
          gradeImprovement: 0,
          teacherFeedbackRate: 0,
          gradingTimeliness: 0,
          lastUpdated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data
        };

        // Build the columns and values for the INSERT query
        const columns = Object.keys(newPerformance).join(', ');
        const values = Object.values(newPerformance).map(value => {
          if (value instanceof Date) {
            return `'${value.toISOString()}'`;
          } else if (typeof value === 'string') {
            return `'${value}'`;
          } else if (value === null) {
            return 'NULL';
          } else {
            return value;
          }
        }).join(', ');

        // Execute the INSERT query
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO class_performance (${columns})
          VALUES (${values})
        `);

        return newPerformance;
      }
    } catch (error) {
      logger.error('Error updating class performance', { classId, data, error });
      throw error;
    }
  }

  /**
   * Calculate and update all metrics for a class
   * @param classId - The ID of the class
   * @returns The updated class performance data
   */
  async calculateAndUpdateMetrics(classId: string): Promise<ClassPerformance> {
    try {
      // Get class data
      const classData = await this.prisma.class.findUnique({
        where: { id: classId },
        include: {
          students: {
            where: { status: SystemStatus.ACTIVE },
            include: {
              student: true
            }
          }
        }
      });

      if (!classData) {
        throw new Error(`Class not found: ${classId}`);
      }

      // Calculate academic metrics
      const academicMetrics = await this.calculateAcademicMetrics(classId);

      // Calculate attendance metrics
      const attendanceMetrics = await this.calculateAttendanceMetrics(classId);

      // Calculate participation metrics
      const participationMetrics = await this.calculateParticipationMetrics(classId);

      // Calculate activity metrics
      const activityMetrics = await this.calculateActivityMetrics(classId);

      // Calculate points metrics
      const pointsMetrics = await this.calculatePointsMetrics(classId);

      // Calculate improvement metrics
      const improvementMetrics = await this.calculateImprovementMetrics(classId);

      // Calculate teacher metrics
      const teacherMetrics = await this.calculateTeacherMetrics(classId);

      // Combine all metrics
      const performanceData = {
        ...academicMetrics,
        ...attendanceMetrics,
        ...participationMetrics,
        ...activityMetrics,
        ...pointsMetrics,
        ...improvementMetrics,
        ...teacherMetrics,
        lastUpdated: new Date()
      };

      // Update or create performance data
      return this.updateClassPerformance(classId, performanceData);
    } catch (error) {
      logger.error('Error calculating class performance metrics', { classId, error });
      throw error;
    }
  }

  /**
   * Batch update class performance for multiple classes
   * @param classIds - Array of class IDs
   * @returns Array of updated class performance data
   */
  async batchUpdateClassPerformance(classIds: string[]): Promise<ClassPerformance[]> {
    try {
      // Update performance data for each class
      const updatedPerformances = await Promise.all(
        classIds.map(classId => this.calculateAndUpdateMetrics(classId).catch(error => {
          logger.error('Error updating class performance in batch', { classId, error });
          return null;
        }))
      );

      // Filter out null values (failed updates)
      return updatedPerformances.filter(Boolean) as ClassPerformance[];
    } catch (error) {
      logger.error('Error batch updating class performances', { classIds, error });
      throw error;
    }
  }

  /**
   * Calculate academic metrics for a class
   * @param classId - The ID of the class
   * @returns Academic metrics
   */
  private async calculateAcademicMetrics(classId: string): Promise<Partial<ClassPerformance>> {
    try {
      // Get grades for the class
      const grades = await this.prisma.$queryRaw<any[]>`
        SELECT grade FROM activity_grades
        WHERE activity_id IN (
          SELECT id FROM activities WHERE class_id = ${classId}
        )
      `;

      if (grades && grades.length > 0) {
        const gradeValues = grades.map(g => g.grade || 0).filter(g => g > 0);

        if (gradeValues.length > 0) {
          const sum = gradeValues.reduce((a, b) => a + b, 0);
          const avg = sum / gradeValues.length;
          const passing = gradeValues.filter(g => g >= 60).length; // Assuming 60% is passing
          const passingRate = (passing / gradeValues.length) * 100;

          return {
            averageGrade: Math.round(avg * 10) / 10, // Round to 1 decimal place
            passingRate: Math.round(passingRate * 10) / 10,
            highestGrade: Math.max(...gradeValues),
            lowestGrade: Math.min(...gradeValues)
          };
        }
      }

      // Default values if no data
      return {
        averageGrade: 0,
        passingRate: 0,
        highestGrade: 0,
        lowestGrade: 0
      };
    } catch (error) {
      logger.error('Error calculating academic metrics', { classId, error });
      return {
        averageGrade: 0,
        passingRate: 0,
        highestGrade: 0,
        lowestGrade: 0
      };
    }
  }

  /**
   * Calculate attendance metrics for a class
   * @param classId - The ID of the class
   * @returns Attendance metrics
   */
  private async calculateAttendanceMetrics(classId: string): Promise<Partial<ClassPerformance>> {
    try {
      // Get attendance records for the class
      const attendanceRecords = await this.prisma.$queryRaw<any[]>`
        SELECT status FROM attendance WHERE class_id = ${classId}
      `;

      if (attendanceRecords && attendanceRecords.length > 0) {
        const present = attendanceRecords.filter(a => a.status === 'PRESENT').length;
        const absent = attendanceRecords.filter(a => a.status === 'ABSENT').length;
        const late = attendanceRecords.filter(a => a.status === 'LATE').length;
        const excused = attendanceRecords.filter(a => a.status === 'EXCUSED').length;
        const total = attendanceRecords.length;

        return {
          attendanceRate: Math.round((present / total) * 100),
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          excusedCount: excused
        };
      }

      // Default values if no data
      return {
        attendanceRate: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0
      };
    } catch (error) {
      logger.error('Error calculating attendance metrics', { classId, error });
      return {
        attendanceRate: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0
      };
    }
  }

  /**
   * Calculate participation metrics for a class
   * @param classId - The ID of the class
   * @returns Participation metrics
   */
  private async calculateParticipationMetrics(classId: string): Promise<Partial<ClassPerformance>> {
    try {
      // Get student count for the class
      const studentCount = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM student_enrollments WHERE class_id = ${classId} AND status = 'ACTIVE'
      `;

      // Get active students (those who have submitted activities)
      const activeStudents = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(DISTINCT student_id) as count
        FROM activity_grades
        WHERE activity_id IN (
          SELECT id FROM activities WHERE class_id = ${classId}
        )
      `;

      const totalStudents = studentCount[0]?.count || 0;
      const activeCount = activeStudents[0]?.count || 0;

      return {
        participationRate: totalStudents > 0 ? Math.round((activeCount / totalStudents) * 100) : 0,
        activeStudents: activeCount
      };
    } catch (error) {
      logger.error('Error calculating participation metrics', { classId, error });
      return {
        participationRate: 0,
        activeStudents: 0
      };
    }
  }

  /**
   * Calculate activity metrics for a class
   * @param classId - The ID of the class
   * @returns Activity metrics
   */
  private async calculateActivityMetrics(classId: string): Promise<Partial<ClassPerformance>> {
    try {
      // Get activities for the class
      const activities = await this.prisma.$queryRaw<any[]>`
        SELECT id, status FROM activities WHERE class_id = ${classId}
      `;

      if (activities && activities.length > 0) {
        const activityIds = activities.map(a => a.id);

        // Get activity grades
        const grades = await this.prisma.$queryRaw<any[]>`
          SELECT activity_id FROM activity_grades
          WHERE activity_id IN (${activityIds.join(',')})
        `;

        const totalActivities = activities.length;
        const gradedActivities = new Set(grades.map(g => g.activity_id)).size;

        // Calculate completion and submission rates
        const completionRate = totalActivities > 0 ? (gradedActivities / totalActivities) * 100 : 0;

        return {
          completionRate: Math.round(completionRate),
          submissionRate: Math.round(completionRate), // Using same value for now
          activitiesCreated: totalActivities,
          activitiesGraded: gradedActivities
        };
      }

      // Default values if no data
      return {
        completionRate: 0,
        submissionRate: 0,
        activitiesCreated: 0,
        activitiesGraded: 0
      };
    } catch (error) {
      logger.error('Error calculating activity metrics', { classId, error });
      return {
        completionRate: 0,
        submissionRate: 0,
        activitiesCreated: 0,
        activitiesGraded: 0
      };
    }
  }

  /**
   * Calculate points metrics for a class
   * @param classId - The ID of the class
   * @returns Points metrics
   */
  private async calculatePointsMetrics(classId: string): Promise<Partial<ClassPerformance>> {
    try {
      // Get points for the class
      const points = await this.prisma.$queryRaw<any[]>`
        SELECT SUM(amount) as total FROM student_points WHERE class_id = ${classId}
      `;

      // Get student count
      const studentCount = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM student_enrollments WHERE class_id = ${classId} AND status = 'ACTIVE'
      `;

      const totalPoints = points[0]?.total || 0;
      const totalStudents = studentCount[0]?.count || 0;

      return {
        totalPoints: totalPoints,
        averagePoints: totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0
      };
    } catch (error) {
      logger.error('Error calculating points metrics', { classId, error });
      return {
        totalPoints: 0,
        averagePoints: 0
      };
    }
  }

  /**
   * Calculate improvement metrics for a class
   * @param classId - The ID of the class
   * @returns Improvement metrics
   */
  private async calculateImprovementMetrics(classId: string): Promise<Partial<ClassPerformance>> {
    try {
      // This would require historical data to calculate improvement
      // For now, we'll return a default value
      return {
        gradeImprovement: 0
      };
    } catch (error) {
      logger.error('Error calculating improvement metrics', { classId, error });
      return {
        gradeImprovement: 0
      };
    }
  }

  /**
   * Calculate teacher metrics for a class
   * @param classId - The ID of the class
   * @returns Teacher metrics
   */
  private async calculateTeacherMetrics(classId: string): Promise<Partial<ClassPerformance>> {
    try {
      // Get teacher feedback count
      const feedbackCount = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM feedback_base WHERE class_id = ${classId}
      `;

      // Get activity count for grading timeliness calculation
      const activities = await this.prisma.$queryRaw<any[]>`
        SELECT id, created_at FROM activities WHERE class_id = ${classId}
      `;

      if (activities && activities.length > 0) {
        const activityIds = activities.map(a => a.id);

        // Get activity grades with timestamps
        const grades = await this.prisma.$queryRaw<any[]>`
          SELECT activity_id, created_at FROM activity_grades
          WHERE activity_id IN (${activityIds.join(',')})
        `;

        // Calculate average grading time in days
        let totalDays = 0;
        let gradedCount = 0;

        for (const grade of grades) {
          const activity = activities.find(a => a.id === grade.activity_id);
          if (activity) {
            const activityDate = new Date(activity.created_at);
            const gradeDate = new Date(grade.created_at);
            const days = (gradeDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24);
            totalDays += days;
            gradedCount++;
          }
        }

        const avgDays = gradedCount > 0 ? totalDays / gradedCount : 0;
        // Convert days to a timeliness score (lower days = higher score)
        const timelinessScore = Math.max(0, 100 - (avgDays * 10)); // 10 points per day

        return {
          teacherFeedbackRate: feedbackCount[0]?.count || 0,
          gradingTimeliness: Math.round(timelinessScore)
        };
      }

      // Default values if no data
      return {
        teacherFeedbackRate: 0,
        gradingTimeliness: 0
      };
    } catch (error) {
      logger.error('Error calculating teacher metrics', { classId, error });
      return {
        teacherFeedbackRate: 0,
        gradingTimeliness: 0
      };
    }
  }
}
