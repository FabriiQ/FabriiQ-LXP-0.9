/**
 * Types for activity analytics
 */

/**
 * Activity analytics data
 */
export interface ActivityAnalytics {
  activityId: string;
  title: string;
  type: string;
  totalAttempts: number;
  uniqueUsers: number;
  averageScore?: number;
  medianScore?: number;
  highestScore?: number;
  lowestScore?: number;
  standardDeviation?: number;
  completionRate: number;
  averageTimeSpent: number;
  itemAnalytics?: Record<string, ItemAnalytics>;
}

/**
 * Item analytics data
 */
export interface ItemAnalytics {
  itemId: string;
  correctRate?: number;
  partiallyCorrectRate?: number;
  incorrectRate?: number;
  averageScore?: number;
  discriminationIndex?: number;
  mostCommonAnswers?: Array<{
    answer: any;
    count: number;
    percentage: number;
  }>;
}

/**
 * User analytics data
 */
export interface UserAnalytics {
  userId: string;
  totalActivities: number;
  completedActivities: number;
  averageScore?: number;
  totalTimeSpent: number;
  averageTimePerActivity: number;
  activityBreakdown: {
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  scoreDistribution?: {
    excellent: number; // 90-100%
    good: number;      // 80-89%
    average: number;   // 70-79%
    belowAverage: number; // 60-69%
    poor: number;      // <60%
  };
}

/**
 * Class analytics data
 */
export interface ClassAnalytics {
  classId: string;
  className: string;
  totalStudents: number;
  totalActivities: number;
  averageCompletion: number;
  averageScore?: number;
  studentPerformance: Array<{
    userId: string;
    completionRate: number;
    averageScore?: number;
  }>;
  activityPerformance: Array<{
    activityId: string;
    title: string;
    completionRate: number;
    averageScore?: number;
  }>;
}

/**
 * Time period for analytics
 */
export type AnalyticsTimePeriod = 
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'all';

/**
 * Analytics time range
 */
export interface AnalyticsTimeRange {
  startDate?: Date;
  endDate?: Date;
  period?: AnalyticsTimePeriod;
}

/**
 * Activity usage data
 */
export interface ActivityUsage {
  activityId: string;
  title: string;
  type: string;
  views: number;
  attempts: number;
  completions: number;
  uniqueUsers: number;
  averageTimeSpent: number;
}

/**
 * Activity usage over time
 */
export interface ActivityUsageOverTime {
  period: AnalyticsTimePeriod;
  data: Array<{
    date: string;
    views: number;
    attempts: number;
    completions: number;
    uniqueUsers: number;
  }>;
}

/**
 * User engagement data
 */
export interface UserEngagement {
  userId: string;
  activitiesStarted: number;
  activitiesCompleted: number;
  totalTimeSpent: number;
  lastActive?: Date;
  engagementScore: number; // 0-100
}

/**
 * Activity comparison data
 */
export interface ActivityComparison {
  activityIds: string[];
  metrics: {
    completionRate: Record<string, number>;
    averageScore?: Record<string, number>;
    averageTimeSpent: Record<string, number>;
    uniqueUsers: Record<string, number>;
  };
}

/**
 * Analytics dashboard filters
 */
export interface AnalyticsDashboardFilters {
  activityTypes?: string[];
  timeRange?: AnalyticsTimeRange;
  userIds?: string[];
  classIds?: string[];
  categoryIds?: string[];
}

/**
 * Analytics chart type
 */
export type AnalyticsChartType = 
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'radar'
  | 'scatter'
  | 'bubble'
  | 'area'
  | 'heatmap';

/**
 * Analytics chart data
 */
export interface AnalyticsChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

/**
 * Analytics chart options
 */
export interface AnalyticsChartOptions {
  title?: string;
  type: AnalyticsChartType;
  data: AnalyticsChartData;
  height?: number;
  width?: number;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
}

/**
 * Analytics metric
 */
export interface AnalyticsMetric {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  changeDirection?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'percentage' | 'time' | 'currency';
  icon?: string;
  color?: string;
}

/**
 * Analytics report
 */
export interface AnalyticsReport {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  metrics: AnalyticsMetric[];
  charts: AnalyticsChartOptions[];
  filters: AnalyticsDashboardFilters;
}

/**
 * Analytics export format
 */
export type AnalyticsExportFormat = 
  | 'csv'
  | 'excel'
  | 'pdf'
  | 'json';

/**
 * Analytics export options
 */
export interface AnalyticsExportOptions {
  format: AnalyticsExportFormat;
  includeCharts: boolean;
  includeRawData: boolean;
  filters: AnalyticsDashboardFilters;
}
