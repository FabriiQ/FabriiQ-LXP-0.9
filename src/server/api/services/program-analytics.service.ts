/**
 * Program Analytics Service
 * Handles analytics operations related to academic programs
 */

import { SystemStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ServiceBase } from "./service-base";

// Program analytics query schema
export const programAnalyticsQuerySchema = z.object({
  programId: z.string(),
  campusId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month'),
});

export class ProgramAnalyticsService extends ServiceBase {
  /**
   * Gets enrollment analytics for a program
   * @param data Query parameters
   * @returns Enrollment analytics
   */
  async getEnrollmentAnalytics(data: z.infer<typeof programAnalyticsQuerySchema>) {
    try {
      // Check if program exists
      const program = await this.prisma.program.findUnique({
        where: { id: data.programId },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Build where clause for program campus
      const programCampusWhere: any = {
        programId: data.programId,
        status: SystemStatus.ACTIVE,
      };

      if (data.campusId) {
        programCampusWhere.campusId = data.campusId;
      }

      // Get program campus IDs
      const programCampuses = await this.prisma.programCampus.findMany({
        where: programCampusWhere,
        select: { id: true },
      });

      const programCampusIds = programCampuses.map(pc => pc.id);

      if (programCampusIds.length === 0) {
        return {
          success: true,
          enrollmentTrend: [],
          currentEnrollment: 0,
          enrollmentByGender: { male: 0, female: 0, other: 0, unspecified: 0 },
          enrollmentByCampus: [],
        };
      }

      // Build where clause for student enrollments
      const enrollmentWhere: any = {
        programCampusId: { in: programCampusIds },
        status: SystemStatus.ACTIVE,
      };

      if (data.startDate) {
        enrollmentWhere.createdAt = {
          ...(enrollmentWhere.createdAt || {}),
          gte: data.startDate,
        };
      }

      if (data.endDate) {
        enrollmentWhere.createdAt = {
          ...(enrollmentWhere.createdAt || {}),
          lte: data.endDate,
        };
      }

      // Get current enrollment count
      const currentEnrollment = await this.prisma.studentEnrollment.count({
        where: enrollmentWhere,
      });

      // Get enrollment by gender
      const enrollmentByGender = await this.prisma.studentEnrollment.groupBy({
        by: ['student'],
        where: enrollmentWhere,
        _count: { id: true },
      });

      // Process gender data
      const genderCounts = { male: 0, female: 0, other: 0, unspecified: 0 };
      
      // Note: This is a simplified approach. In a real implementation,
      // you would need to join with user profiles to get gender information.
      // For now, we'll return placeholder data
      genderCounts.male = Math.floor(currentEnrollment * 0.48);
      genderCounts.female = Math.floor(currentEnrollment * 0.47);
      genderCounts.other = Math.floor(currentEnrollment * 0.02);
      genderCounts.unspecified = currentEnrollment - genderCounts.male - genderCounts.female - genderCounts.other;

      // Get enrollment by campus
      const enrollmentByCampus = await this.prisma.studentEnrollment.groupBy({
        by: ['programCampusId'],
        where: enrollmentWhere,
        _count: { id: true },
      });

      // Get campus details for each program campus
      const campusDetails = await this.prisma.programCampus.findMany({
        where: { id: { in: programCampusIds } },
        include: { campus: true },
      });

      // Map campus IDs to names
      const campusMap = new Map(
        campusDetails.map(pc => [pc.id, { name: pc.campus.name, code: pc.campus.code }])
      );

      // Format enrollment by campus
      const formattedEnrollmentByCampus = enrollmentByCampus.map(item => ({
        campusId: item.programCampusId,
        campusName: campusMap.get(item.programCampusId)?.name || 'Unknown',
        campusCode: campusMap.get(item.programCampusId)?.code || 'Unknown',
        count: item._count.id,
      }));

      // Get enrollment trend
      // This would typically involve complex date grouping queries
      // For simplicity, we'll generate sample data based on the groupBy parameter
      const enrollmentTrend = this.generateEnrollmentTrendData(
        data.groupBy,
        data.startDate || new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        data.endDate || new Date(),
        currentEnrollment
      );

      return {
        success: true,
        enrollmentTrend,
        currentEnrollment,
        enrollmentByGender: genderCounts,
        enrollmentByCampus: formattedEnrollmentByCampus,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get enrollment analytics",
        cause: error,
      });
    }
  }

  /**
   * Gets performance analytics for a program
   * @param data Query parameters
   * @returns Performance analytics
   */
  async getPerformanceAnalytics(data: z.infer<typeof programAnalyticsQuerySchema>) {
    try {
      // Check if program exists
      const program = await this.prisma.program.findUnique({
        where: { id: data.programId },
      });

      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Build where clause for program campus
      const programCampusWhere: any = {
        programId: data.programId,
        status: SystemStatus.ACTIVE,
      };

      if (data.campusId) {
        programCampusWhere.campusId = data.campusId;
      }

      // Get program campus IDs
      const programCampuses = await this.prisma.programCampus.findMany({
        where: programCampusWhere,
        select: { id: true },
      });

      const programCampusIds = programCampuses.map(pc => pc.id);

      if (programCampusIds.length === 0) {
        return {
          success: true,
          averageGrade: 0,
          gradeDistribution: [],
          coursePerformance: [],
          attendanceRate: 0,
          completionRate: 0,
        };
      }

      // For a real implementation, you would query assessment submissions, attendance records, etc.
      // For now, we'll return placeholder data

      // Generate grade distribution
      const gradeDistribution = [
        { grade: 'A', count: Math.floor(Math.random() * 50) + 20 },
        { grade: 'B', count: Math.floor(Math.random() * 40) + 30 },
        { grade: 'C', count: Math.floor(Math.random() * 30) + 20 },
        { grade: 'D', count: Math.floor(Math.random() * 20) + 10 },
        { grade: 'F', count: Math.floor(Math.random() * 10) + 5 },
      ];

      // Calculate average grade (simplified)
      const gradePoints = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
      const totalStudents = gradeDistribution.reduce((sum, item) => sum + item.count, 0);
      const totalPoints = gradeDistribution.reduce(
        (sum, item) => sum + (item.count * gradePoints[item.grade as keyof typeof gradePoints]), 0
      );
      const averageGrade = totalStudents > 0 ? totalPoints / totalStudents : 0;

      // Get courses for this program
      const courses = await this.prisma.course.findMany({
        where: {
          programId: data.programId,
          status: SystemStatus.ACTIVE,
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
      });

      // Generate course performance data
      const coursePerformance = courses.map(course => ({
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        averageGrade: (Math.random() * 2) + 2, // Random grade between 2.0 and 4.0
        passRate: (Math.random() * 30) + 70, // Random pass rate between 70% and 100%
        attendanceRate: (Math.random() * 20) + 80, // Random attendance rate between 80% and 100%
      }));

      // Calculate overall metrics
      const attendanceRate = coursePerformance.reduce((sum, course) => sum + course.attendanceRate, 0) / 
        (coursePerformance.length || 1);
      
      const completionRate = (Math.random() * 30) + 70; // Random completion rate between 70% and 100%

      return {
        success: true,
        averageGrade,
        gradeDistribution,
        coursePerformance,
        attendanceRate,
        completionRate,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get performance analytics",
        cause: error,
      });
    }
  }

  /**
   * Helper method to generate enrollment trend data
   * @param groupBy Time grouping
   * @param startDate Start date
   * @param endDate End date
   * @param currentCount Current enrollment count
   * @returns Enrollment trend data
   */
  private generateEnrollmentTrendData(
    groupBy: 'day' | 'week' | 'month' | 'quarter' | 'year',
    startDate: Date,
    endDate: Date,
    currentCount: number
  ) {
    const result = [];
    const currentDate = new Date(endDate);
    const start = new Date(startDate);
    
    // Determine interval based on groupBy
    let interval: number;
    let dateFormat: Intl.DateTimeFormatOptions;
    
    switch (groupBy) {
      case 'day':
        interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        dateFormat = { month: 'short', day: 'numeric' };
        break;
      case 'week':
        interval = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
        dateFormat = { month: 'short', day: 'numeric' };
        break;
      case 'month':
        interval = 30 * 24 * 60 * 60 * 1000; // ~1 month in milliseconds
        dateFormat = { month: 'short', year: 'numeric' };
        break;
      case 'quarter':
        interval = 3 * 30 * 24 * 60 * 60 * 1000; // ~3 months in milliseconds
        dateFormat = { month: 'short', year: 'numeric' };
        break;
      case 'year':
        interval = 365 * 24 * 60 * 60 * 1000; // ~1 year in milliseconds
        dateFormat = { year: 'numeric' };
        break;
    }
    
    // Generate data points
    let count = currentCount;
    let date = new Date(currentDate);
    
    while (date >= start) {
      result.unshift({
        date: date.toLocaleDateString('en-US', dateFormat),
        count,
      });
      
      // Move to previous interval
      date = new Date(date.getTime() - interval);
      
      // Decrease count for historical data (with some randomness)
      const decrease = Math.floor(Math.random() * 5) + 1;
      count = Math.max(0, count - decrease);
    }
    
    return result;
  }
}
