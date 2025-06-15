/**
 * Analytics service for activity data
 */
import { 
  ActivityAnalytics,
  UserAnalytics,
  ClassAnalytics,
  ActivityUsage,
  ActivityUsageOverTime,
  UserEngagement,
  ActivityComparison,
  AnalyticsTimeRange,
  AnalyticsDashboardFilters
} from '../types';
import { GradedActivityResult, ProgressActivityResult } from '../../shared/types';
import { resultStorageService } from '../../shared/results/storage';
import { analyticsService as sharedAnalyticsService } from '../../shared/results/analytics';

/**
 * Analytics service
 */
class AnalyticsService {
  /**
   * Get activity analytics
   * 
   * @param activityId Activity ID
   * @returns Activity analytics
   */
  async getActivityAnalytics(activityId: string): Promise<ActivityAnalytics | null> {
    try {
      // Use the shared analytics service
      const analytics = await sharedAnalyticsService.getActivityAnalytics(activityId);
      
      if (!analytics) return null;
      
      // Transform to our format
      return {
        activityId,
        title: `Activity ${activityId}`, // This would be fetched from activity data
        type: 'unknown', // This would be fetched from activity data
        totalAttempts: analytics.totalAttempts,
        uniqueUsers: analytics.uniqueUsers,
        averageScore: analytics.averageScore,
        medianScore: analytics.medianScore,
        highestScore: analytics.highestScore,
        lowestScore: analytics.lowestScore,
        standardDeviation: analytics.highestScore && analytics.lowestScore 
          ? (analytics.highestScore - analytics.lowestScore) / 4 
          : undefined,
        completionRate: analytics.completionRate,
        averageTimeSpent: analytics.averageTimeSpent,
        itemAnalytics: analytics.itemAnalytics,
      };
    } catch (error) {
      console.error('Error getting activity analytics:', error);
      return null;
    }
  }
  
  /**
   * Get user analytics
   * 
   * @param userId User ID
   * @returns User analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics | null> {
    try {
      // Get all results for the user
      const results = await resultStorageService.getResults('', userId);
      
      if (results.length === 0) return null;
      
      // Count activities by status
      const completed = results.filter(r => r.status === 'completed' || r.status === 'graded').length;
      const inProgress = results.filter(r => r.status === 'in_progress').length;
      const notStarted = results.filter(r => r.status === 'not_started').length;
      
      // Calculate average score for graded activities
      const gradedResults = results.filter(r => 'score' in r) as GradedActivityResult[];
      const averageScore = gradedResults.length > 0
        ? gradedResults.reduce((sum, r) => sum + r.percentage, 0) / gradedResults.length
        : undefined;
      
      // Calculate total time spent
      const totalTimeSpent = results.reduce((sum, r) => sum + r.timeSpent, 0);
      
      // Calculate score distribution
      const scoreDistribution = gradedResults.length > 0
        ? {
            excellent: gradedResults.filter(r => r.percentage >= 90).length,
            good: gradedResults.filter(r => r.percentage >= 80 && r.percentage < 90).length,
            average: gradedResults.filter(r => r.percentage >= 70 && r.percentage < 80).length,
            belowAverage: gradedResults.filter(r => r.percentage >= 60 && r.percentage < 70).length,
            poor: gradedResults.filter(r => r.percentage < 60).length,
          }
        : undefined;
      
      return {
        userId,
        totalActivities: results.length,
        completedActivities: completed,
        averageScore,
        totalTimeSpent,
        averageTimePerActivity: results.length > 0 ? totalTimeSpent / results.length : 0,
        activityBreakdown: {
          completed,
          inProgress,
          notStarted,
        },
        scoreDistribution,
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return null;
    }
  }
  
  /**
   * Get class analytics
   * 
   * @param classId Class ID
   * @returns Class analytics
   */
  async getClassAnalytics(classId: string): Promise<ClassAnalytics | null> {
    try {
      // In a real implementation, this would fetch data from a database
      // For this example, we'll return mock data
      return {
        classId,
        className: `Class ${classId}`,
        totalStudents: 25,
        totalActivities: 10,
        averageCompletion: 75,
        averageScore: 82,
        studentPerformance: Array.from({ length: 5 }, (_, i) => ({
          userId: `user_${i + 1}`,
          completionRate: Math.round(Math.random() * 50 + 50),
          averageScore: Math.round(Math.random() * 40 + 60),
        })),
        activityPerformance: Array.from({ length: 5 }, (_, i) => ({
          activityId: `activity_${i + 1}`,
          title: `Activity ${i + 1}`,
          completionRate: Math.round(Math.random() * 50 + 50),
          averageScore: Math.round(Math.random() * 40 + 60),
        })),
      };
    } catch (error) {
      console.error('Error getting class analytics:', error);
      return null;
    }
  }
  
  /**
   * Get activity usage
   * 
   * @param filters Analytics dashboard filters
   * @returns Activity usage data
   */
  async getActivityUsage(filters?: AnalyticsDashboardFilters): Promise<ActivityUsage[]> {
    try {
      // In a real implementation, this would fetch data from a database
      // For this example, we'll return mock data
      return Array.from({ length: 10 }, (_, i) => ({
        activityId: `activity_${i + 1}`,
        title: `Activity ${i + 1}`,
        type: ['quiz', 'reading', 'video', 'assignment', 'discussion'][Math.floor(Math.random() * 5)],
        views: Math.round(Math.random() * 500 + 100),
        attempts: Math.round(Math.random() * 300 + 50),
        completions: Math.round(Math.random() * 200 + 50),
        uniqueUsers: Math.round(Math.random() * 100 + 20),
        averageTimeSpent: Math.round(Math.random() * 600 + 60),
      }));
    } catch (error) {
      console.error('Error getting activity usage:', error);
      return [];
    }
  }
  
  /**
   * Get activity usage over time
   * 
   * @param activityId Activity ID
   * @param timeRange Time range
   * @returns Activity usage over time
   */
  async getActivityUsageOverTime(
    activityId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<ActivityUsageOverTime | null> {
    try {
      // In a real implementation, this would fetch data from a database
      // For this example, we'll return mock data
      const period = timeRange.period || 'week';
      const dataPoints = period === 'day' ? 24 : period === 'week' ? 7 : period === 'month' ? 30 : 12;
      
      const data = Array.from({ length: dataPoints }, (_, i) => {
        const date = new Date();
        
        if (period === 'day') {
          date.setHours(date.getHours() - (dataPoints - i - 1));
        } else if (period === 'week') {
          date.setDate(date.getDate() - (dataPoints - i - 1));
        } else if (period === 'month') {
          date.setDate(date.getDate() - (dataPoints - i - 1));
        } else {
          date.setMonth(date.getMonth() - (dataPoints - i - 1));
        }
        
        return {
          date: date.toISOString().split('T')[0],
          views: Math.round(Math.random() * 50 + 10),
          attempts: Math.round(Math.random() * 30 + 5),
          completions: Math.round(Math.random() * 20 + 5),
          uniqueUsers: Math.round(Math.random() * 10 + 2),
        };
      });
      
      return {
        period,
        data,
      };
    } catch (error) {
      console.error('Error getting activity usage over time:', error);
      return null;
    }
  }
  
  /**
   * Get user engagement
   * 
   * @param filters Analytics dashboard filters
   * @returns User engagement data
   */
  async getUserEngagement(filters?: AnalyticsDashboardFilters): Promise<UserEngagement[]> {
    try {
      // In a real implementation, this would fetch data from a database
      // For this example, we'll return mock data
      return Array.from({ length: 10 }, (_, i) => {
        const activitiesStarted = Math.round(Math.random() * 20 + 5);
        const activitiesCompleted = Math.round(Math.random() * activitiesStarted);
        
        return {
          userId: `user_${i + 1}`,
          activitiesStarted,
          activitiesCompleted,
          totalTimeSpent: Math.round(Math.random() * 3600 + 600),
          lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          engagementScore: Math.round(Math.random() * 100),
        };
      });
    } catch (error) {
      console.error('Error getting user engagement:', error);
      return [];
    }
  }
  
  /**
   * Compare activities
   * 
   * @param activityIds Activity IDs
   * @returns Activity comparison data
   */
  async compareActivities(activityIds: string[]): Promise<ActivityComparison | null> {
    try {
      // Get analytics for each activity
      const analyticsPromises = activityIds.map(id => this.getActivityAnalytics(id));
      const analyticsResults = await Promise.all(analyticsPromises);
      
      // Filter out null results
      const analytics = analyticsResults.filter(a => a !== null) as ActivityAnalytics[];
      
      if (analytics.length === 0) return null;
      
      // Create comparison data
      const completionRate: Record<string, number> = {};
      const averageScore: Record<string, number> = {};
      const averageTimeSpent: Record<string, number> = {};
      const uniqueUsers: Record<string, number> = {};
      
      analytics.forEach(a => {
        completionRate[a.activityId] = a.completionRate;
        if (a.averageScore !== undefined) averageScore[a.activityId] = a.averageScore;
        averageTimeSpent[a.activityId] = a.averageTimeSpent;
        uniqueUsers[a.activityId] = a.uniqueUsers;
      });
      
      return {
        activityIds,
        metrics: {
          completionRate,
          averageScore: Object.keys(averageScore).length > 0 ? averageScore : undefined,
          averageTimeSpent,
          uniqueUsers,
        },
      };
    } catch (error) {
      console.error('Error comparing activities:', error);
      return null;
    }
  }
}

// Create and export the analytics service
export const analyticsService = new AnalyticsService();
