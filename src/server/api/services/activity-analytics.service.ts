/**
 * Activity Analytics Service
 *
 * This service provides comprehensive analytics for activities, including:
 * - Student performance metrics
 * - Activity effectiveness analysis
 * - Comparative analytics across classes, subjects, and topics
 * - Trend analysis over time
 *
 * It leverages the ActivityCacheService for efficient data retrieval and caching.
 */

import { PrismaClient, SubmissionStatus, SystemStatus } from '@prisma/client';
import { logger } from '@/server/api/utils/logger';
import { ActivityCacheService } from './activity-cache.service';

/**
 * Activity Analytics Service
 *
 * This service provides methods for analyzing activity performance and student outcomes.
 */
export class ActivityAnalyticsService {
  private prisma: PrismaClient;

  /**
   * Create a new ActivityAnalyticsService instance
   *
   * @param prisma Prisma client instance
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get comprehensive analytics for a student
   *
   * @param studentId Student ID
   * @param filters Optional filters (classId, subjectId, topicId, timeRange)
   * @returns Comprehensive student analytics
   */
  async getStudentAnalytics(
    studentId: string,
    filters: {
      classId?: string;
      subjectId?: string;
      topicId?: string;
      timeRange?: {
        startDate?: Date;
        endDate?: Date;
      };
    } = {}
  ): Promise<any> {
    return ActivityCacheService.getStudentStats(
      studentId,
      filters,
      async () => {
        // Build the query filters
        const whereClause: any = {
          studentId,
          isArchived: false,
        };

        // Add optional filters
        if (filters.timeRange?.startDate) {
          whereClause.submittedAt = {
            ...whereClause.submittedAt,
            gte: filters.timeRange.startDate,
          };
        }

        if (filters.timeRange?.endDate) {
          whereClause.submittedAt = {
            ...whereClause.submittedAt,
            lte: filters.timeRange.endDate,
          };
        }

        // Get activity grades with activity details
        const activityGrades = await this.prisma.activityGrade.findMany({
          where: whereClause,
          include: {
            activity: {
              select: {
                id: true,
                title: true,
                learningType: true,
                content: true,
                purpose: true,
                classId: true,
                subjectId: true,
                topicId: true,
                maxScore: true,
                isGradable: true,
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        });

        // Filter by class, subject, or topic if provided
        const filteredGrades = activityGrades.filter(grade => {
          if (filters.classId && grade.activity.classId !== filters.classId) return false;
          if (filters.subjectId && grade.activity.subjectId !== filters.subjectId) return false;
          if (filters.topicId && grade.activity.topicId !== filters.topicId) return false;
          return true;
        });

        // Basic statistics
        const totalActivities = filteredGrades.length;
        const completedActivities = filteredGrades.filter(g => g.status === SubmissionStatus.GRADED).length;
        const gradedActivities = filteredGrades.filter(g => g.score !== null).length;

        // Calculate average score
        let totalScore = 0;
        let totalMaxScore = 0;

        filteredGrades.forEach(grade => {
          if (grade.score !== null) {
            totalScore += grade.score;
            totalMaxScore += grade.activity.maxScore || 100;
          }
        });

        const averageScore = gradedActivities > 0 ? totalScore / gradedActivities : null;
        const averagePercentage = gradedActivities > 0 && totalMaxScore > 0
          ? (totalScore / totalMaxScore) * 100
          : null;

        // Group by activity type
        const activityTypeStats = this.calculateActivityTypeStats(filteredGrades);

        // Time-based analysis
        const timeAnalysis = this.calculateTimeAnalysis(filteredGrades);

        // Topic performance analysis
        const topicPerformance = this.calculateTopicPerformance(filteredGrades);

        // Strength and weakness analysis
        const strengthsAndWeaknesses = this.analyzeStrengthsAndWeaknesses(filteredGrades);

        // Recent activities
        const recentActivities = filteredGrades
          .slice(0, 5)
          .map(grade => ({
            id: grade.id,
            activityId: grade.activityId,
            title: grade.activity.title,
            activityType: grade.activity.learningType ?
              grade.activity.learningType.toString().toLowerCase().replace(/_/g, '-') :
              ((grade.activity.content as any)?.activityType || 'unknown'),
            submittedAt: grade.submittedAt,
            score: grade.score,
            maxScore: grade.activity.maxScore,
            status: grade.status
          }));

        return {
          studentId,
          totalActivities,
          completedActivities,
          completionRate: totalActivities > 0 ? (completedActivities / totalActivities) * 100 : null,
          averageScore,
          averagePercentage,
          activityTypeStats,
          timeAnalysis,
          topicPerformance,
          strengthsAndWeaknesses,
          recentActivities,
        };
      }
    );
  }

  /**
   * Get comprehensive analytics for an activity
   *
   * @param activityId Activity ID
   * @returns Comprehensive activity analytics
   */
  async getActivityAnalytics(activityId: string): Promise<any> {
    return ActivityCacheService.getActivityStats(
      activityId,
      {},
      async () => {
        // Get the activity details
        const activity = await this.prisma.activity.findUnique({
          where: { id: activityId },
          select: {
            id: true,
            title: true,
            learningType: true,
            content: true,
            purpose: true,
            classId: true,
            subjectId: true,
            topicId: true,
            maxScore: true,
            isGradable: true,
          }
        });

        if (!activity) {
          throw new Error(`Activity not found: ${activityId}`);
        }

        // Get all grades for this activity
        const grades = await this.prisma.activityGrade.findMany({
          where: {
            activityId,
            // Use attachments field to check if archived
            attachments: {
              path: ['isArchived'],
              equals: false
            }
          },
          include: {
            student: true
          },
          orderBy: {
            submittedAt: 'desc'
          }
        });

        // Basic statistics
        const totalSubmissions = grades.length;
        const gradedSubmissions = grades.filter(g => g.status === SubmissionStatus.GRADED).length;

        // Score distribution
        const scoreDistribution = this.calculateScoreDistribution(grades, activity.maxScore || 100);

        // Time-based analysis
        const submissionTimeAnalysis = this.calculateSubmissionTimeAnalysis(grades);

        // Question analysis (if detailed results are available)
        const questionAnalysis = this.analyzeQuestionPerformance(grades);

        // Student performance comparison
        const studentPerformance = grades.map(grade => {
          // Get user info from student profile
          const user = grade.student ?
            {
              id: grade.student.id,
              // Use enrollment number as fallback if name not available
              name: grade.student.enrollmentNumber || 'Student'
            } :
            { id: grade.studentId, name: 'Student' };

          return {
            studentId: grade.studentId,
            studentName: user.name,
            score: grade.score,
            maxScore: activity.maxScore,
            percentage: grade.score !== null && activity.maxScore
              ? (grade.score / activity.maxScore) * 100
              : null,
            submittedAt: grade.submittedAt,
            status: grade.status,
          };
        });

        return {
          activity,
          totalSubmissions,
          gradedSubmissions,
          completionRate: totalSubmissions > 0 ? (gradedSubmissions / totalSubmissions) * 100 : null,
          averageScore: this.calculateAverageScore(grades),
          scoreDistribution,
          submissionTimeAnalysis,
          questionAnalysis,
          studentPerformance,
        };
      }
    );
  }

  /**
   * Get comparative analytics for activities across classes
   *
   * @param filters Optional filters (subjectId, topicId, activityType, timeRange)
   * @returns Comparative activity analytics
   */
  async getComparativeAnalytics(
    filters: {
      subjectId?: string;
      topicId?: string;
      activityType?: string;
      timeRange?: {
        startDate?: Date;
        endDate?: Date;
      };
    } = {}
  ): Promise<any> {
    // Build the activity query filters
    const activityWhereClause: any = {
      status: SystemStatus.ACTIVE,
    };

    if (filters.subjectId) {
      activityWhereClause.subjectId = filters.subjectId;
    }

    if (filters.topicId) {
      activityWhereClause.topicId = filters.topicId;
    }

    if (filters.activityType) {
      // Convert kebab-case activityType to UPPER_SNAKE_CASE for learningType
      const learningTypeEnum = filters.activityType.toUpperCase().replace(/-/g, '_');
      activityWhereClause.learningType = learningTypeEnum;
    }

    // Get all relevant activities
    const activities = await this.prisma.activity.findMany({
      where: activityWhereClause,
      select: {
        id: true,
        title: true,
        learningType: true,
        content: true,
        classId: true,
        subjectId: true,
        topicId: true,
        maxScore: true,
        isGradable: true,
        class: {
          select: {
            id: true,
            name: true,
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
          }
        },
        topic: true,
      }
    });

    // Build the grades query filters
    const gradesWhereClause: any = {
      activityId: {
        in: activities.map(a => a.id)
      },
      isArchived: false,
    };

    if (filters.timeRange?.startDate) {
      gradesWhereClause.submittedAt = {
        ...gradesWhereClause.submittedAt,
        gte: filters.timeRange.startDate,
      };
    }

    if (filters.timeRange?.endDate) {
      gradesWhereClause.submittedAt = {
        ...gradesWhereClause.submittedAt,
        lte: filters.timeRange.endDate,
      };
    }

    // Get all grades for these activities
    const grades = await this.prisma.activityGrade.findMany({
      where: gradesWhereClause,
      select: {
        id: true,
        activityId: true,
        score: true,
        status: true,
        submittedAt: true,
      }
    });

    // Group grades by activity
    const gradesByActivity = new Map<string, any[]>();

    grades.forEach(grade => {
      if (!gradesByActivity.has(grade.activityId)) {
        gradesByActivity.set(grade.activityId, []);
      }
      gradesByActivity.get(grade.activityId)?.push(grade);
    });

    // Calculate statistics for each activity
    const activityStats = activities.map(activity => {
      const activityGrades = gradesByActivity.get(activity.id) || [];
      const gradedSubmissions = activityGrades.filter(g => g.status === SubmissionStatus.GRADED).length;

      // Get class, subject, and topic names from the related objects
      // Since we're using any type for activity, we can safely access these properties
      const className = (activity.class as any)?.name || 'Unknown Class';
      const subjectName = (activity.subject as any)?.name || 'Unknown Subject';
      const topicName = (activity.topic as any)?.name || null;

      return {
        activityId: activity.id,
        title: activity.title,
        activityType: activity.learningType ?
          activity.learningType.toString().toLowerCase().replace(/_/g, '-') :
          ((activity.content as any)?.activityType || 'unknown'),
        className,
        subjectName,
        topicName,
        totalSubmissions: activityGrades.length,
        gradedSubmissions,
        completionRate: activityGrades.length > 0 ? (gradedSubmissions / activityGrades.length) * 100 : null,
        averageScore: this.calculateAverageScore(activityGrades),
        maxScore: activity.maxScore,
      };
    });

    // Group by class
    const statsByClass = this.groupByProperty(activityStats, 'className');

    // Group by subject
    const statsBySubject = this.groupByProperty(activityStats, 'subjectName');

    // Group by topic
    const statsByTopic = this.groupByProperty(activityStats, 'topicName');

    // Group by activity type
    const statsByType = this.groupByProperty(activityStats, 'activityType');

    return {
      activityStats,
      statsByClass,
      statsBySubject,
      statsByTopic,
      statsByType,
    };
  }

  /**
   * Calculate activity type statistics
   *
   * @param grades Activity grades
   * @returns Statistics grouped by activity type
   * @private
   */
  private calculateActivityTypeStats(grades: any[]): Record<string, any> {
    const stats: Record<string, { count: number, completed: number, averageScore: number | null, totalScore: number, totalItems: number }> = {};

    grades.forEach(grade => {
      // Get activity type from learningType or content.activityType
      let activityType: string;
      if (grade.activity.learningType) {
        // Convert enum value to string and make it lowercase for consistency
        activityType = grade.activity.learningType.toString().toLowerCase().replace(/_/g, '-');
      } else {
        // Fall back to content.activityType if available
        const activityContent = grade.activity.content as any;
        activityType = activityContent?.activityType || 'unknown';
      }

      if (!stats[activityType]) {
        stats[activityType] = {
          count: 0,
          completed: 0,
          averageScore: null,
          totalScore: 0,
          totalItems: 0
        };
      }

      stats[activityType].count++;

      if (grade.status === SubmissionStatus.GRADED) {
        stats[activityType].completed++;
      }

      if (grade.score !== null) {
        stats[activityType].totalScore += grade.score;
        stats[activityType].totalItems++;
        stats[activityType].averageScore = stats[activityType].totalScore / stats[activityType].totalItems;
      }
    });

    return stats;
  }

  /**
   * Calculate time-based analysis of activity performance
   *
   * @param grades Activity grades
   * @returns Time-based analysis
   * @private
   */
  private calculateTimeAnalysis(grades: any[]): any {
    // Group grades by month
    const monthlyData: Record<string, { count: number, completed: number, averageScore: number | null, totalScore: number, totalItems: number }> = {};

    grades.forEach(grade => {
      const date = new Date(grade.submittedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          count: 0,
          completed: 0,
          averageScore: null,
          totalScore: 0,
          totalItems: 0
        };
      }

      monthlyData[monthKey].count++;

      if (grade.status === SubmissionStatus.GRADED) {
        monthlyData[monthKey].completed++;
      }

      if (grade.score !== null) {
        monthlyData[monthKey].totalScore += grade.score;
        monthlyData[monthKey].totalItems++;
        monthlyData[monthKey].averageScore = monthlyData[monthKey].totalScore / monthlyData[monthKey].totalItems;
      }
    });

    // Convert to array and sort by month
    const monthlyArray = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    })).sort((a, b) => a.month.localeCompare(b.month));

    // Calculate trend (improving, declining, stable)
    let trend = 'stable';
    if (monthlyArray.length >= 2) {
      const firstMonth = monthlyArray[0];
      const lastMonth = monthlyArray[monthlyArray.length - 1];

      if (firstMonth.averageScore !== null && lastMonth.averageScore !== null) {
        const scoreDifference = lastMonth.averageScore - firstMonth.averageScore;
        if (scoreDifference > 5) {
          trend = 'improving';
        } else if (scoreDifference < -5) {
          trend = 'declining';
        }
      }
    }

    return {
      monthlyData: monthlyArray,
      trend
    };
  }

  /**
   * Calculate topic performance analysis
   *
   * @param grades Activity grades
   * @returns Topic performance analysis
   * @private
   */
  private calculateTopicPerformance(grades: any[]): any {
    // Group grades by topic
    const topicData: Record<string, {
      topicId: string,
      topicName: string | null,
      count: number,
      completed: number,
      averageScore: number | null,
      totalScore: number,
      totalItems: number
    }> = {};

    grades.forEach(grade => {
      const topicId = grade.activity.topicId || 'unknown';
      const topicName = grade.activity.topic?.name || null;

      if (!topicData[topicId]) {
        topicData[topicId] = {
          topicId,
          topicName,
          count: 0,
          completed: 0,
          averageScore: null,
          totalScore: 0,
          totalItems: 0
        };
      }

      topicData[topicId].count++;

      if (grade.status === SubmissionStatus.GRADED) {
        topicData[topicId].completed++;
      }

      if (grade.score !== null) {
        topicData[topicId].totalScore += grade.score;
        topicData[topicId].totalItems++;
        topicData[topicId].averageScore = topicData[topicId].totalScore / topicData[topicId].totalItems;
      }
    });

    // Convert to array
    return Object.values(topicData);
  }

  /**
   * Analyze strengths and weaknesses based on activity performance
   *
   * @param grades Activity grades
   * @returns Strengths and weaknesses analysis
   * @private
   */
  private analyzeStrengthsAndWeaknesses(grades: any[]): any {
    // Group grades by activity type and calculate performance
    const typePerformance: Record<string, {
      averageScore: number | null,
      totalScore: number,
      totalItems: number,
      percentile: number | null
    }> = {};

    grades.forEach(grade => {
      const activityType = grade.activity.activityType || 'unknown';

      if (!typePerformance[activityType]) {
        typePerformance[activityType] = {
          averageScore: null,
          totalScore: 0,
          totalItems: 0,
          percentile: null
        };
      }

      if (grade.score !== null) {
        typePerformance[activityType].totalScore += grade.score;
        typePerformance[activityType].totalItems++;
        typePerformance[activityType].averageScore =
          typePerformance[activityType].totalScore / typePerformance[activityType].totalItems;
      }
    });

    // Calculate percentiles (simplified approach)
    const types = Object.keys(typePerformance);
    const scores = types.map(type => typePerformance[type].averageScore).filter(score => score !== null) as number[];
    scores.sort((a, b) => a - b);

    types.forEach(type => {
      const score = typePerformance[type].averageScore;
      if (score !== null && scores.length > 0) {
        const position = scores.findIndex(s => s >= score);
        typePerformance[type].percentile = position >= 0
          ? (position / scores.length) * 100
          : 100;
      }
    });

    // Identify strengths (top 25% percentile)
    const strengths = types
      .filter(type => {
        const perf = typePerformance[type];
        return perf.percentile !== null && perf.percentile >= 75;
      })
      .map(type => ({
        activityType: type,
        averageScore: typePerformance[type].averageScore,
        percentile: typePerformance[type].percentile
      }));

    // Identify weaknesses (bottom 25% percentile)
    const weaknesses = types
      .filter(type => {
        const perf = typePerformance[type];
        return perf.percentile !== null && perf.percentile <= 25;
      })
      .map(type => ({
        activityType: type,
        averageScore: typePerformance[type].averageScore,
        percentile: typePerformance[type].percentile
      }));

    return {
      strengths,
      weaknesses,
      typePerformance
    };
  }

  /**
   * Calculate score distribution for an activity
   *
   * @param grades Activity grades
   * @param maxScore Maximum possible score
   * @returns Score distribution
   * @private
   */
  private calculateScoreDistribution(grades: any[], maxScore: number): any {
    // Define score ranges
    const ranges = [
      { min: 0, max: 20, label: '0-20%' },
      { min: 20, max: 40, label: '20-40%' },
      { min: 40, max: 60, label: '40-60%' },
      { min: 60, max: 80, label: '60-80%' },
      { min: 80, max: 100, label: '80-100%' }
    ];

    // Initialize counts
    const distribution = ranges.map(range => ({
      ...range,
      count: 0
    }));

    // Count grades in each range
    grades.forEach(grade => {
      if (grade.score !== null) {
        const percentage = (grade.score / maxScore) * 100;

        for (const range of distribution) {
          if (percentage >= range.min && percentage <= range.max) {
            range.count++;
            break;
          }
        }
      }
    });

    return distribution;
  }

  /**
   * Calculate submission time analysis
   *
   * @param grades Activity grades
   * @returns Submission time analysis
   * @private
   */
  private calculateSubmissionTimeAnalysis(grades: any[]): any {
    // Group by day of week
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, ..., Sat

    // Group by hour of day
    const hourOfDayCounts = Array(24).fill(0);

    grades.forEach(grade => {
      const date = new Date(grade.submittedAt);
      dayOfWeekCounts[date.getDay()]++;
      hourOfDayCounts[date.getHours()]++;
    });

    // Format day of week data
    const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekData = dayLabels.map((day, index) => ({
      day,
      count: dayOfWeekCounts[index]
    }));

    // Format hour of day data
    const hourOfDayData = hourOfDayCounts.map((count, hour) => ({
      hour,
      count
    }));

    return {
      dayOfWeek: dayOfWeekData,
      hourOfDay: hourOfDayData
    };
  }

  /**
   * Analyze question performance for an activity
   *
   * @param grades Activity grades
   * @returns Question performance analysis
   * @private
   */
  private analyzeQuestionPerformance(grades: any[]): any {
    // This requires detailed results to be stored in the attachments field
    const questionStats: Record<string, {
      questionId: string,
      correctCount: number,
      totalAttempts: number,
      correctPercentage: number
    }> = {};

    // Process each grade's detailed results
    grades.forEach(grade => {
      const detailedResults = (grade.attachments as any)?.detailedResults;

      if (detailedResults?.questionResults) {
        detailedResults.questionResults.forEach((result: any) => {
          const questionId = result.questionId;

          if (!questionStats[questionId]) {
            questionStats[questionId] = {
              questionId,
              correctCount: 0,
              totalAttempts: 0,
              correctPercentage: 0
            };
          }

          questionStats[questionId].totalAttempts++;

          if (result.isCorrect) {
            questionStats[questionId].correctCount++;
          }
        });
      }
    });

    // Calculate percentages
    Object.values(questionStats).forEach(stat => {
      stat.correctPercentage = stat.totalAttempts > 0
        ? (stat.correctCount / stat.totalAttempts) * 100
        : 0;
    });

    // Convert to array and sort by correctPercentage (ascending)
    const questionArray = Object.values(questionStats)
      .sort((a, b) => a.correctPercentage - b.correctPercentage);

    // Identify difficult questions (bottom 25% correct)
    const difficultQuestions = questionArray
      .filter(q => q.correctPercentage < 50)
      .slice(0, Math.max(1, Math.floor(questionArray.length * 0.25)));

    return {
      questions: questionArray,
      difficultQuestions,
      averageCorrectPercentage: this.calculateAverage(questionArray.map(q => q.correctPercentage))
    };
  }

  /**
   * Calculate average score from grades
   *
   * @param grades Activity grades
   * @returns Average score or null if no grades
   * @private
   */
  private calculateAverageScore(grades: any[]): number | null {
    const validGrades = grades.filter(g => g.score !== null);

    if (validGrades.length === 0) {
      return null;
    }

    const totalScore = validGrades.reduce((sum, grade) => sum + grade.score, 0);
    return totalScore / validGrades.length;
  }

  /**
   * Calculate average of an array of numbers
   *
   * @param values Array of numbers
   * @returns Average value or null if empty array
   * @private
   */
  private calculateAverage(values: number[]): number | null {
    if (values.length === 0) {
      return null;
    }

    const sum = values.reduce((total, value) => total + value, 0);
    return sum / values.length;
  }

  /**
   * Group an array of objects by a property
   *
   * @param array Array of objects
   * @param property Property to group by
   * @returns Grouped objects
   * @private
   */
  private groupByProperty<T>(array: T[], property: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = String(item[property] || 'Unknown');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}
