/**
 * Teacher Points Service
 * Handles operations related to teacher points
 */

import { PrismaClient, SystemStatus, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export interface TeacherPointsServiceContext {
  prisma: PrismaClient;
}

export interface AwardTeacherPointsInput {
  teacherId: string;
  amount: number;
  source: string;
  sourceId?: string;
  classId?: string;
  subjectId?: string;
  description?: string;
  awardedBy?: string; // ID of the user who awarded the points (coordinator, admin, etc.)
}

export class TeacherPointsService {
  private prisma: PrismaClient;

  constructor({ prisma }: TeacherPointsServiceContext) {
    this.prisma = prisma;
  }

  /**
   * Award points to a teacher
   */
  async awardPoints(data: AwardTeacherPointsInput): Promise<any> {
    const { teacherId, amount, source, sourceId, classId, subjectId, description } = data;

    try {
      // Create points record
      // Note: Using raw SQL or direct database access since Prisma client may not be updated
      // In a production environment, we would use the Prisma client directly

      // 1. Update teacher's total points
      await this.prisma.teacherProfile.update({
        where: { id: teacherId },
        data: {
          // Use raw increment for totalPoints
          totalPoints: {
            increment: amount,
          },
        } as any, // Using 'any' to bypass TypeScript checking
      });

      // 2. Create a mock point record for now
      const pointsRecord = {
        id: `points-${Date.now()}`,
        teacherId,
        amount,
        source,
        sourceId,
        classId,
        subjectId,
        description,
        createdAt: new Date(),
        status: "ACTIVE" as SystemStatus,
      };

      // 3. Update points aggregates for leaderboards
      await this.updatePointsAggregates(teacherId, amount, classId, subjectId);

      return pointsRecord;
    } catch (error) {
      console.error("Error awarding points to teacher:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to award points to teacher",
      });
    }
  }

  /**
   * Update points aggregates for leaderboards
   */
  private async updatePointsAggregates(
    teacherId: string,
    amount: number,
    classId?: string,
    subjectId?: string
  ): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get teacher's class assignment info if classId is provided
      let courseId: string | undefined;
      let programId: string | undefined;
      let campusId: string | undefined;

      if (classId) {
        const classInfo = await this.prisma.class.findUnique({
          where: { id: classId },
          select: {
            id: true,
            campusId: true,
            courseCampus: {
              select: {
                id: true,
                course: {
                  select: {
                    id: true,
                    programId: true,
                  },
                },
              },
            },
          },
        });

        if (classInfo) {
          campusId = classInfo.campusId;
          if (classInfo.courseCampus) {
            courseId = classInfo.courseCampus.course.id;
            programId = classInfo.courseCampus.course.programId;
          }
        }
      }

      // For now, we'll log the aggregate update information
      // In a production environment, we would update the actual database records
      console.log("Updating teacher points aggregates:", {
        teacherId,
        date: today,
        classId,
        subjectId,
        courseId,
        programId,
        campusId,
        amount,
      });
    } catch (error) {
      console.error("Error updating teacher points aggregates:", error);
      // Don't throw here to prevent the main transaction from failing
    }
  }

  /**
   * Get teacher points history
   */
  async getTeacherPointsHistory(params: {
    teacherId: string;
    classId?: string;
    subjectId?: string;
    source?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    history: any[];
    total: number;
  }> {
    const { teacherId, classId, subjectId, source, limit = 50, offset = 0 } = params;

    try {
      // For now, return mock data
      // In a production environment, we would query the actual database
      const mockHistory = [
        {
          id: "points-1",
          teacherId,
          amount: 50,
          source: "activity_creation",
          sourceId: "activity-123",
          classId: classId || "class-1",
          className: "Mathematics 101",
          subjectId: subjectId || "subject-1",
          subjectName: "Algebra",
          description: "Created a new interactive quiz",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        {
          id: "points-2",
          teacherId,
          amount: 30,
          source: source || "feedback",
          sourceId: "submission-456",
          classId: classId || "class-1",
          className: "Mathematics 101",
          subjectId: subjectId || "subject-1",
          subjectName: "Algebra",
          description: "Provided detailed feedback on student submissions",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        },
        {
          id: "points-3",
          teacherId,
          amount: 20,
          source: source || "attendance",
          classId: classId || "class-2",
          className: "Mathematics 102",
          subjectId: subjectId || "subject-2",
          subjectName: "Geometry",
          description: "Perfect attendance for the week",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      ];

      // Apply pagination
      const paginatedHistory = mockHistory.slice(offset, offset + limit);

      return {
        history: paginatedHistory,
        total: mockHistory.length,
      };
    } catch (error) {
      console.error("Error fetching teacher points history:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch teacher points history",
      });
    }
  }

  /**
   * Get teacher leaderboard
   */
  async getTeacherLeaderboard(params: {
    courseId?: string;
    classId?: string;
    programId?: string;
    campusId?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'term' | 'all';
    limit?: number;
    offset?: number;
    sortBy?: 'points' | 'activityCreation' | 'studentPerformance' | 'attendance' | 'feedback';
  }): Promise<{
    leaderboard: any[];
    total: number;
  }> {
    const {
      courseId,
      classId,
      programId,
      campusId,
      timeframe = 'all',
      limit = 10,
      offset = 0,
      sortBy = 'points'
    } = params;

    try {
      // For now, return mock data
      // In a production environment, we would query the actual database
      const mockTeachers = [
        {
          id: "teacher-1",
          name: "Dr. Sarah Johnson",
          avatar: null,
          metrics: {
            studentPerformance: 92,
            attendanceRate: 98,
            feedbackTime: 24,
            activityCreation: 45,
            activityEngagement: 90,
            classPerformance: 95,
            overallRating: 94
          },
          classes: 4,
          points: 1250
        },
        {
          id: "teacher-2",
          name: "Prof. David Chen",
          avatar: null,
          metrics: {
            studentPerformance: 88,
            attendanceRate: 95,
            feedbackTime: 36,
            activityCreation: 38,
            activityEngagement: 85,
            classPerformance: 90,
            overallRating: 88
          },
          classes: 3,
          points: 980
        },
        {
          id: "teacher-3",
          name: "Dr. Maria Rodriguez",
          avatar: null,
          metrics: {
            studentPerformance: 90,
            attendanceRate: 96,
            feedbackTime: 30,
            activityCreation: 42,
            activityEngagement: 92,
            classPerformance: 88,
            overallRating: 90
          },
          classes: 3,
          points: 1050
        },
        {
          id: "teacher-4",
          name: "Prof. James Wilson",
          avatar: null,
          metrics: {
            studentPerformance: 85,
            attendanceRate: 92,
            feedbackTime: 48,
            activityCreation: 30,
            activityEngagement: 80,
            classPerformance: 85,
            overallRating: 84
          },
          classes: 2,
          points: 780
        },
        {
          id: "teacher-5",
          name: "Dr. Olivia Smith",
          avatar: null,
          metrics: {
            studentPerformance: 87,
            attendanceRate: 94,
            feedbackTime: 36,
            activityCreation: 35,
            activityEngagement: 88,
            classPerformance: 92,
            overallRating: 89
          },
          classes: 3,
          points: 920
        }
      ];

      // Filter by course, class, or program if provided
      let filteredTeachers = mockTeachers;
      if (courseId || classId || programId || campusId) {
        // In a real implementation, we would filter based on these parameters
        // For now, just return a subset of the data to simulate filtering
        filteredTeachers = mockTeachers.slice(0, 3);
      }

      // Sort based on sortBy parameter
      const sortedTeachers = [...filteredTeachers].sort((a, b) => {
        if (sortBy === 'points') {
          return b.points - a.points;
        } else if (sortBy === 'activityCreation') {
          return b.metrics.activityCreation - a.metrics.activityCreation;
        } else if (sortBy === 'studentPerformance') {
          return b.metrics.studentPerformance - a.metrics.studentPerformance;
        } else if (sortBy === 'attendance') {
          return b.metrics.attendanceRate - a.metrics.attendanceRate;
        } else {
          // feedback - lower is better
          return a.metrics.feedbackTime - b.metrics.feedbackTime;
        }
      });

      // Apply pagination
      const paginatedTeachers = sortedTeachers.slice(offset, offset + limit);

      // Format the response
      const leaderboard = paginatedTeachers.map((teacher, index) => ({
        position: offset + index + 1,
        teacherId: teacher.id,
        name: teacher.name,
        avatar: teacher.avatar,
        points: teacher.points,
        classCount: teacher.classes,
        metrics: teacher.metrics,
        rankChange: Math.floor(Math.random() * 5) - 2, // Random rank change for demo
      }));

      return {
        leaderboard,
        total: filteredTeachers.length,
      };
    } catch (error) {
      console.error("Error fetching teacher leaderboard:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch teacher leaderboard",
      });
    }
  }
}
