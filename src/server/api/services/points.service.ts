import { PrismaClient, SystemStatus } from '@prisma/client';
import { startOfWeek } from 'date-fns';
import { startOfDay } from 'date-fns/startOfDay';
import { endOfDay } from 'date-fns/endOfDay';
import { startOfMonth } from 'date-fns/startOfMonth';

// Define types for Prisma models that might not be exported
interface StudentPoints {
  id: string;
  studentId: string;
  amount: number;
  source: string;
  sourceId?: string;
  classId?: string;
  subjectId?: string;
  description?: string;
  createdAt: Date;
  status: SystemStatus;
}

interface StudentPointsAggregate {
  id: string;
  studentId: string;
  classId?: string;
  subjectId?: string;
  courseId?: string;
  campusId?: string;
  date: Date;
  dailyPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  termPoints: number;
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PointsServiceContext {
  prisma: PrismaClient;
}

export interface AwardPointsInput {
  studentId: string;
  amount: number;
  source: string;
  sourceId?: string;
  classId?: string;
  subjectId?: string;
  description?: string;
}

export class PointsService {
  private prisma: PrismaClient;

  constructor({ prisma }: PointsServiceContext) {
    this.prisma = prisma;
  }

  /**
   * Award points to a student
   */
  async awardPoints(data: AwardPointsInput): Promise<StudentPoints> {
    const { studentId, amount, source, sourceId, classId, subjectId, description } = data;

    // Create points record using type assertion for Prisma model
    const pointsRecord = await (this.prisma as any).studentPoints.create({
      data: {
        studentId,
        amount,
        source,
        sourceId,
        classId,
        subjectId,
        description,
      },
    });

    // Update student's total points
    // Use raw query to update totalPoints since it might not be in the TypeScript type
    try {
      await this.prisma.$executeRaw`
        UPDATE "student_profiles"
        SET "totalPoints" = COALESCE("totalPoints", 0) + ${amount}
        WHERE "id" = ${studentId}
      `;
    } catch (error) {
      console.error('Error updating student totalPoints:', error);
      // Continue execution even if this fails
    }

    // Update points aggregates for leaderboards
    await this.updatePointsAggregates(studentId, amount, classId, subjectId);

    return pointsRecord;
  }

  /**
   * Update points aggregates for leaderboards
   */
  private async updatePointsAggregates(
    studentId: string,
    amount: number,
    classId?: string,
    subjectId?: string
  ): Promise<void> {
    const today = new Date();
    const date = startOfDay(today);

    // Get or create aggregate record using type assertion for Prisma model
    const existingAggregate = await (this.prisma as any).studentPointsAggregate.findFirst({
      where: {
        studentId,
        classId: classId || null,
        subjectId: subjectId || null,
        date,
      },
    });

    if (existingAggregate) {
      // Update existing aggregate using type assertion for Prisma model
      await (this.prisma as any).studentPointsAggregate.update({
        where: { id: existingAggregate.id },
        data: {
          dailyPoints: { increment: amount },
          weeklyPoints: { increment: amount },
          monthlyPoints: { increment: amount },
          termPoints: { increment: amount },
          totalPoints: { increment: amount },
        },
      });
    } else {
      // Create new aggregate
      // Get current weekly, monthly, term, and total points
      const weekStart = startOfWeek(today);
      const monthStart = startOfMonth(today);

      const weeklyPoints = await this.getPointsSum(studentId, weekStart, today, classId, subjectId);
      const monthlyPoints = await this.getPointsSum(studentId, monthStart, today, classId, subjectId);
      const totalPoints = await this.getPointsSum(studentId, undefined, today, classId, subjectId);

      // Create new aggregate record using type assertion for Prisma model
      await (this.prisma as any).studentPointsAggregate.create({
        data: {
          studentId,
          classId,
          subjectId,
          date,
          dailyPoints: amount,
          weeklyPoints: weeklyPoints + amount,
          monthlyPoints: monthlyPoints + amount,
          termPoints: totalPoints + amount, // Simplified - in a real app, would calculate term points
          totalPoints: totalPoints + amount,
        },
      });
    }
  }

  /**
   * Get sum of points for a student within a date range
   */
  private async getPointsSum(
    studentId: string,
    startDate?: Date,
    endDate?: Date,
    classId?: string,
    subjectId?: string
  ): Promise<number> {
    try {
      // Use type assertion for Prisma model
      const points = await (this.prisma as any).studentPoints.aggregate({
        where: {
          studentId,
          ...(classId && { classId }),
          ...(subjectId && { subjectId }),
          ...(startDate && { createdAt: { gte: startDate } }),
          ...(endDate && { createdAt: { lte: endOfDay(endDate) } }),
          status: SystemStatus.ACTIVE,
        },
        _sum: {
          amount: true,
        },
      });

      // If aggregate returns null, try to get all points and sum them manually
      if (!points._sum.amount) {
        const allPoints = await (this.prisma as any).studentPoints.findMany({
          where: {
            studentId,
            ...(classId && { classId }),
            ...(subjectId && { subjectId }),
            ...(startDate && { createdAt: { gte: startDate } }),
            ...(endDate && { createdAt: { lte: endOfDay(endDate) } }),
            status: SystemStatus.ACTIVE,
          },
          select: {
            amount: true,
          },
        });

        if (allPoints.length > 0) {
          return allPoints.reduce((sum, point) => sum + (point.amount || 0), 0);
        }
      }

      return points._sum.amount || 0;
    } catch (error) {
      console.error('Error calculating points sum:', error);
      return 0;
    }
  }

  /**
   * Get points history for a student
   */
  async getPointsHistory(
    studentId: string,
    options?: {
      source?: string;
      classId?: string;
      subjectId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<StudentPoints[]> {
    const { source, classId, subjectId, startDate, endDate, limit = 50, offset = 0 } = options || {};

    // Use type assertion for Prisma model
    return (this.prisma as any).studentPoints.findMany({
      where: {
        studentId,
        ...(source && { source }),
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endOfDay(endDate) } }),
        status: SystemStatus.ACTIVE,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get points summary for a student
   */
  async getPointsSummary(
    studentId: string,
    options?: {
      classId?: string;
      subjectId?: string;
    }
  ): Promise<any> {
    // Special case for 'all' studentId - get summary for all students in the class
    if (studentId === 'all' && options?.classId) {
      try {
        return await this.getAllStudentsPointsSummary(options.classId, options.subjectId);
      } catch (error) {
        console.error('Error getting all students points summary:', error);
        return [];
      }
    }

    const { classId, subjectId } = options || {};
    const today = new Date();
    const date = startOfDay(today);

    // Calculate from raw points data directly
    const weekStart = startOfWeek(today);
    const monthStart = startOfMonth(today);

    const dailyPoints = await this.getPointsSum(studentId, date, today, classId, subjectId);
    const weeklyPoints = await this.getPointsSum(studentId, weekStart, today, classId, subjectId);
    const monthlyPoints = await this.getPointsSum(studentId, monthStart, today, classId, subjectId);
    const totalPoints = await this.getPointsSum(studentId, undefined, today, classId, subjectId);

    // Get the latest aggregate record as a fallback
    if (totalPoints === 0) {
      const aggregate = await (this.prisma as any).studentPointsAggregate.findFirst({
        where: {
          studentId,
          classId: classId || null,
          subjectId: subjectId || null,
        },
        orderBy: {
          date: 'desc',
        },
      });

      if (aggregate) {
        return {
          totalPoints: aggregate.totalPoints || 0,
          dailyPoints: aggregate.dailyPoints || 0,
          weeklyPoints: aggregate.weeklyPoints || 0,
          monthlyPoints: aggregate.monthlyPoints || 0,
        };
      }
    }

    return {
      totalPoints,
      dailyPoints,
      weeklyPoints,
      monthlyPoints,
    };
  }

  /**
   * Get points summary for all students in a class
   */
  async getAllStudentsPointsSummary(
    classId: string,
    subjectId?: string
  ): Promise<any[]> {
    try {
      // Get all students in the class using student enrollments
      // This is more reliable than using the student_points table
      const studentsWithEnrollments = await this.prisma.studentEnrollment.findMany({
        where: {
          classId,
          status: "ACTIVE",
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // Transform to the format we need
      const students = studentsWithEnrollments.map(enrollment => ({
        studentId: enrollment.student.id,
        studentName: enrollment.student.user.name || 'Unknown Student',
        level: enrollment.student.currentLevel || 1
      }));

      if (!students || !Array.isArray(students) || students.length === 0) {
        console.log('No students found for class:', classId);
        return [];
      }

      // Get points summary for each student
      const summaries = await Promise.all(
        students.map(async (student: any) => {
          if (!student || !student.studentId) {
            console.error('Invalid student data:', student);
            return null;
          }

          const studentId = student.studentId;

          try {
            // Get points directly from studentPoints table
            const points = await (this.prisma as any).studentPoints.findMany({
              where: {
                studentId,
                classId: classId || undefined,
                status: SystemStatus.ACTIVE,
              },
              select: {
                amount: true,
                source: true,
                description: true,
                createdAt: true,
              },
            });

            // Calculate totals
            const totalPoints = points.reduce((sum, point) => sum + (point.amount || 0), 0);

            // Get the most recent points award
            const lastAward = points.length > 0
              ? points.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
              : null;

            return {
              studentId,
              totalPoints,
              dailyPoints: 0, // We'll simplify for now
              weeklyPoints: 0, // We'll simplify for now
              monthlyPoints: 0, // We'll simplify for now
              level: student.level || 1,
              lastAward: lastAward ? {
                amount: lastAward.amount,
                source: lastAward.source,
                description: lastAward.description || '',
                timestamp: lastAward.createdAt,
              } : null,
            };
          } catch (error) {
            console.error(`Error getting points for student ${studentId}:`, error);
            return {
              studentId,
              totalPoints: 0,
              dailyPoints: 0,
              weeklyPoints: 0,
              monthlyPoints: 0,
              level: student.level || 1,
              lastAward: null,
            };
          }
        })
      );

      return summaries.filter(Boolean); // Filter out any null entries
    } catch (error) {
      console.error('Error in getAllStudentsPointsSummary:', error);
      return [];
    }
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(options: {
    type: 'class' | 'subject' | 'overall';
    referenceId?: string;
    timeframe: 'daily' | 'weekly' | 'monthly' | 'term' | 'all-time';
    limit?: number;
    offset?: number;
  }): Promise<{
    studentId: string;
    points: number;
    rank: number;
    studentName?: string;
    level?: number;
  }[]> {
    const { type, referenceId, timeframe, limit = 10, offset = 0 } = options;
    const today = new Date();
    const date = startOfDay(today);

    // Determine which points field to use based on timeframe
    let pointsField: string;
    switch (timeframe) {
      case 'daily':
        pointsField = 'dailyPoints';
        break;
      case 'weekly':
        pointsField = 'weeklyPoints';
        break;
      case 'monthly':
        pointsField = 'monthlyPoints';
        break;
      case 'term':
        pointsField = 'termPoints';
        break;
      case 'all-time':
      default:
        pointsField = 'totalPoints';
        break;
    }

    // Build the where clause based on type and referenceId
    let whereClause: any = { date };
    if (type === 'class' && referenceId) {
      whereClause.classId = referenceId;
    } else if (type === 'subject' && referenceId) {
      whereClause.subjectId = referenceId;
    }

    // Get aggregates for the leaderboard using type assertion for Prisma model
    const aggregates = await (this.prisma as any).studentPointsAggregate.findMany({
      where: whereClause,
      select: {
        studentId: true,
        [pointsField]: true,
        student: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
            currentLevel: true,
          },
        },
      },
      orderBy: {
        [pointsField]: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Transform and add rank
    return aggregates.map((agg: any, index: number) => ({
      studentId: agg.studentId,
      points: agg[pointsField] as number,
      rank: offset + index + 1,
      studentName: agg.student?.user?.name || undefined,
      level: agg.student?.currentLevel,
    }));
  }

  /**
   * Create a snapshot of the current leaderboard
   */
  async createLeaderboardSnapshot(options: {
    type: string;
    referenceId: string;
    limit?: number;
  }): Promise<void> {
    const { type, referenceId, limit = 100 } = options;
    const today = new Date();

    // Get leaderboard data
    const leaderboardData = await this.getLeaderboard({
      type: type as any,
      referenceId,
      timeframe: 'all-time',
      limit,
    });

    // Create snapshot using type assertion for Prisma model
    await (this.prisma as any).leaderboardSnapshot.create({
      data: {
        type,
        referenceId,
        snapshotDate: today,
        entries: leaderboardData,
      },
    });
  }

  /**
   * Get historical leaderboard data
   */
  async getHistoricalLeaderboard(options: {
    type: string;
    referenceId: string;
    date?: Date;
    limit?: number;
  }): Promise<any> {
    const { type, referenceId, date, limit = 10 } = options;

    // If no date is provided, get the latest snapshot
    if (!date) {
      // Use type assertion for Prisma model
      const snapshot = await (this.prisma as any).leaderboardSnapshot.findFirst({
        where: {
          type,
          referenceId,
          status: SystemStatus.ACTIVE,
        },
        orderBy: {
          snapshotDate: 'desc',
        },
      });

      if (snapshot) {
        const entries = snapshot.entries as any[];
        return entries.slice(0, limit);
      }

      return [];
    }

    // Get snapshot closest to the provided date
    // Use type assertion for Prisma model
    const snapshot = await (this.prisma as any).leaderboardSnapshot.findFirst({
      where: {
        type,
        referenceId,
        snapshotDate: {
          lte: date,
        },
        status: SystemStatus.ACTIVE,
      },
      orderBy: {
        snapshotDate: 'desc',
      },
    });

    if (snapshot) {
      const entries = snapshot.entries as any[];
      return entries.slice(0, limit);
    }

    return [];
  }
}
