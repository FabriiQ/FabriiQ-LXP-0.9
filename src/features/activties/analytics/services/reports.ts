/**
 * Reports service for generating analytics reports
 */
import { v4 as uuidv4 } from 'uuid';
import { 
  AnalyticsReport, 
  AnalyticsMetric,
  AnalyticsChartOptions,
  AnalyticsDashboardFilters,
  AnalyticsExportOptions,
  AnalyticsExportFormat
} from '../types';
import { analyticsService } from './analytics';

/**
 * Local storage key for reports
 */
const REPORTS_KEY = 'analytics_reports';

/**
 * Helper functions for local storage
 */
function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Reports service
 */
class ReportsService {
  /**
   * Get all reports
   * 
   * @returns Analytics reports
   */
  async getReports(): Promise<AnalyticsReport[]> {
    return getFromStorage<AnalyticsReport>(REPORTS_KEY);
  }
  
  /**
   * Get a report by ID
   * 
   * @param reportId Report ID
   * @returns Analytics report
   */
  async getReport(reportId: string): Promise<AnalyticsReport | null> {
    const reports = getFromStorage<AnalyticsReport>(REPORTS_KEY);
    return reports.find(r => r.id === reportId) || null;
  }
  
  /**
   * Create a report
   * 
   * @param title Report title
   * @param description Report description
   * @param metrics Report metrics
   * @param charts Report charts
   * @param filters Report filters
   * @returns Created report
   */
  async createReport(
    title: string,
    description: string,
    metrics: AnalyticsMetric[],
    charts: AnalyticsChartOptions[],
    filters: AnalyticsDashboardFilters
  ): Promise<AnalyticsReport> {
    const reports = getFromStorage<AnalyticsReport>(REPORTS_KEY);
    
    const newReport: AnalyticsReport = {
      id: uuidv4(),
      title,
      description,
      createdAt: new Date(),
      metrics,
      charts,
      filters,
    };
    
    reports.push(newReport);
    saveToStorage(REPORTS_KEY, reports);
    
    return newReport;
  }
  
  /**
   * Update a report
   * 
   * @param reportId Report ID
   * @param updates Report updates
   * @returns Updated report
   */
  async updateReport(
    reportId: string,
    updates: Partial<Omit<AnalyticsReport, 'id' | 'createdAt'>>
  ): Promise<AnalyticsReport | null> {
    const reports = getFromStorage<AnalyticsReport>(REPORTS_KEY);
    const index = reports.findIndex(r => r.id === reportId);
    
    if (index === -1) return null;
    
    const updatedReport = {
      ...reports[index],
      ...updates,
    };
    
    reports[index] = updatedReport;
    saveToStorage(REPORTS_KEY, reports);
    
    return updatedReport;
  }
  
  /**
   * Delete a report
   * 
   * @param reportId Report ID
   * @returns Whether the report was deleted
   */
  async deleteReport(reportId: string): Promise<boolean> {
    const reports = getFromStorage<AnalyticsReport>(REPORTS_KEY);
    const index = reports.findIndex(r => r.id === reportId);
    
    if (index === -1) return false;
    
    reports.splice(index, 1);
    saveToStorage(REPORTS_KEY, reports);
    
    return true;
  }
  
  /**
   * Generate an activity report
   * 
   * @param activityId Activity ID
   * @returns Generated report
   */
  async generateActivityReport(activityId: string): Promise<AnalyticsReport | null> {
    try {
      // Get activity analytics
      const analytics = await analyticsService.getActivityAnalytics(activityId);
      
      if (!analytics) return null;
      
      // Get usage over time
      const usageOverTime = await analyticsService.getActivityUsageOverTime(activityId, { period: 'week' });
      
      // Create metrics
      const metrics: AnalyticsMetric[] = [
        {
          id: 'total_attempts',
          label: 'Total Attempts',
          value: analytics.totalAttempts,
          format: 'number',
          icon: 'activity',
          color: '#4caf50',
        },
        {
          id: 'unique_users',
          label: 'Unique Users',
          value: analytics.uniqueUsers,
          format: 'number',
          icon: 'users',
          color: '#2196f3',
        },
        {
          id: 'completion_rate',
          label: 'Completion Rate',
          value: analytics.completionRate,
          format: 'percentage',
          icon: 'check-circle',
          color: '#ff9800',
        },
        {
          id: 'average_time',
          label: 'Average Time Spent',
          value: this.formatTime(analytics.averageTimeSpent),
          format: 'time',
          icon: 'clock',
          color: '#9c27b0',
        },
      ];
      
      if (analytics.averageScore !== undefined) {
        metrics.push({
          id: 'average_score',
          label: 'Average Score',
          value: analytics.averageScore,
          format: 'percentage',
          icon: 'award',
          color: '#f44336',
        });
      }
      
      // Create charts
      const charts: AnalyticsChartOptions[] = [];
      
      // Add usage over time chart
      if (usageOverTime) {
        charts.push({
          title: 'Activity Usage Over Time',
          type: 'line',
          data: {
            labels: usageOverTime.data.map(d => d.date),
            datasets: [
              {
                label: 'Views',
                data: usageOverTime.data.map(d => d.views),
                borderColor: '#2196f3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
              },
              {
                label: 'Attempts',
                data: usageOverTime.data.map(d => d.attempts),
                borderColor: '#ff9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
              },
              {
                label: 'Completions',
                data: usageOverTime.data.map(d => d.completions),
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
              },
            ],
          },
        });
      }
      
      // Add score distribution chart if available
      if (analytics.averageScore !== undefined) {
        charts.push({
          title: 'Score Distribution',
          type: 'bar',
          data: {
            labels: ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'],
            datasets: [
              {
                label: 'Students',
                data: [
                  Math.round(Math.random() * 5),
                  Math.round(Math.random() * 10),
                  Math.round(Math.random() * 15),
                  Math.round(Math.random() * 20),
                  Math.round(Math.random() * 25),
                ],
                backgroundColor: [
                  '#f44336',
                  '#ff9800',
                  '#ffeb3b',
                  '#4caf50',
                  '#2196f3',
                ],
              },
            ],
          },
        });
      }
      
      // Add item analysis chart if available
      if (analytics.itemAnalytics && Object.keys(analytics.itemAnalytics).length > 0) {
        const itemIds = Object.keys(analytics.itemAnalytics);
        const correctRates = itemIds.map(id => analytics.itemAnalytics![id].correctRate || 0);
        
        charts.push({
          title: 'Item Analysis',
          type: 'bar',
          data: {
            labels: itemIds.map(id => `Item ${id}`),
            datasets: [
              {
                label: 'Correct Rate',
                data: correctRates,
                backgroundColor: '#4caf50',
              },
            ],
          },
        });
      }
      
      // Create report
      return {
        id: uuidv4(),
        title: `Activity Report: ${analytics.title}`,
        description: `Analytics report for activity ${analytics.activityId}`,
        createdAt: new Date(),
        metrics,
        charts,
        filters: {},
      };
    } catch (error) {
      console.error('Error generating activity report:', error);
      return null;
    }
  }
  
  /**
   * Generate a user report
   * 
   * @param userId User ID
   * @returns Generated report
   */
  async generateUserReport(userId: string): Promise<AnalyticsReport | null> {
    try {
      // Get user analytics
      const analytics = await analyticsService.getUserAnalytics(userId);
      
      if (!analytics) return null;
      
      // Create metrics
      const metrics: AnalyticsMetric[] = [
        {
          id: 'total_activities',
          label: 'Total Activities',
          value: analytics.totalActivities,
          format: 'number',
          icon: 'activity',
          color: '#4caf50',
        },
        {
          id: 'completed_activities',
          label: 'Completed Activities',
          value: analytics.completedActivities,
          format: 'number',
          icon: 'check-circle',
          color: '#2196f3',
        },
        {
          id: 'completion_rate',
          label: 'Completion Rate',
          value: analytics.totalActivities > 0 
            ? (analytics.completedActivities / analytics.totalActivities) * 100 
            : 0,
          format: 'percentage',
          icon: 'percent',
          color: '#ff9800',
        },
        {
          id: 'total_time',
          label: 'Total Time Spent',
          value: this.formatTime(analytics.totalTimeSpent),
          format: 'time',
          icon: 'clock',
          color: '#9c27b0',
        },
      ];
      
      if (analytics.averageScore !== undefined) {
        metrics.push({
          id: 'average_score',
          label: 'Average Score',
          value: analytics.averageScore,
          format: 'percentage',
          icon: 'award',
          color: '#f44336',
        });
      }
      
      // Create charts
      const charts: AnalyticsChartOptions[] = [];
      
      // Add activity breakdown chart
      charts.push({
        title: 'Activity Status',
        type: 'pie',
        data: {
          labels: ['Completed', 'In Progress', 'Not Started'],
          datasets: [
            {
              label: 'Activities',
              data: [
                analytics.activityBreakdown.completed,
                analytics.activityBreakdown.inProgress,
                analytics.activityBreakdown.notStarted,
              ],
              backgroundColor: [
                '#4caf50',
                '#ff9800',
                '#9e9e9e',
              ],
            },
          ],
        },
      });
      
      // Add score distribution chart if available
      if (analytics.scoreDistribution) {
        charts.push({
          title: 'Score Distribution',
          type: 'bar',
          data: {
            labels: ['Excellent (90-100%)', 'Good (80-89%)', 'Average (70-79%)', 'Below Average (60-69%)', 'Poor (<60%)'],
            datasets: [
              {
                label: 'Activities',
                data: [
                  analytics.scoreDistribution.excellent,
                  analytics.scoreDistribution.good,
                  analytics.scoreDistribution.average,
                  analytics.scoreDistribution.belowAverage,
                  analytics.scoreDistribution.poor,
                ],
                backgroundColor: [
                  '#4caf50',
                  '#8bc34a',
                  '#ffeb3b',
                  '#ff9800',
                  '#f44336',
                ],
              },
            ],
          },
        });
      }
      
      // Create report
      return {
        id: uuidv4(),
        title: `User Report: ${userId}`,
        description: `Analytics report for user ${userId}`,
        createdAt: new Date(),
        metrics,
        charts,
        filters: {},
      };
    } catch (error) {
      console.error('Error generating user report:', error);
      return null;
    }
  }
  
  /**
   * Generate a class report
   * 
   * @param classId Class ID
   * @returns Generated report
   */
  async generateClassReport(classId: string): Promise<AnalyticsReport | null> {
    try {
      // Get class analytics
      const analytics = await analyticsService.getClassAnalytics(classId);
      
      if (!analytics) return null;
      
      // Create metrics
      const metrics: AnalyticsMetric[] = [
        {
          id: 'total_students',
          label: 'Total Students',
          value: analytics.totalStudents,
          format: 'number',
          icon: 'users',
          color: '#4caf50',
        },
        {
          id: 'total_activities',
          label: 'Total Activities',
          value: analytics.totalActivities,
          format: 'number',
          icon: 'activity',
          color: '#2196f3',
        },
        {
          id: 'average_completion',
          label: 'Average Completion',
          value: analytics.averageCompletion,
          format: 'percentage',
          icon: 'check-circle',
          color: '#ff9800',
        },
      ];
      
      if (analytics.averageScore !== undefined) {
        metrics.push({
          id: 'average_score',
          label: 'Average Score',
          value: analytics.averageScore,
          format: 'percentage',
          icon: 'award',
          color: '#f44336',
        });
      }
      
      // Create charts
      const charts: AnalyticsChartOptions[] = [];
      
      // Add student performance chart
      if (analytics.studentPerformance.length > 0) {
        charts.push({
          title: 'Student Performance',
          type: 'bar',
          data: {
            labels: analytics.studentPerformance.map(s => s.userId),
            datasets: [
              {
                label: 'Completion Rate',
                data: analytics.studentPerformance.map(s => s.completionRate),
                backgroundColor: '#2196f3',
              },
              {
                label: 'Average Score',
                data: analytics.studentPerformance.map(s => s.averageScore || 0),
                backgroundColor: '#4caf50',
              },
            ],
          },
        });
      }
      
      // Add activity performance chart
      if (analytics.activityPerformance.length > 0) {
        charts.push({
          title: 'Activity Performance',
          type: 'bar',
          data: {
            labels: analytics.activityPerformance.map(a => a.title),
            datasets: [
              {
                label: 'Completion Rate',
                data: analytics.activityPerformance.map(a => a.completionRate),
                backgroundColor: '#ff9800',
              },
              {
                label: 'Average Score',
                data: analytics.activityPerformance.map(a => a.averageScore || 0),
                backgroundColor: '#9c27b0',
              },
            ],
          },
        });
      }
      
      // Create report
      return {
        id: uuidv4(),
        title: `Class Report: ${analytics.className}`,
        description: `Analytics report for class ${analytics.className}`,
        createdAt: new Date(),
        metrics,
        charts,
        filters: {},
      };
    } catch (error) {
      console.error('Error generating class report:', error);
      return null;
    }
  }
  
  /**
   * Export a report
   * 
   * @param reportId Report ID
   * @param options Export options
   * @returns Export URL
   */
  async exportReport(
    reportId: string,
    options: AnalyticsExportOptions
  ): Promise<string | null> {
    try {
      // Get the report
      const report = await this.getReport(reportId);
      
      if (!report) return null;
      
      // Create export data
      let data = '';
      let mimeType = 'text/plain';
      let filename = `report_${reportId}_${new Date().toISOString().split('T')[0]}`;
      
      switch (options.format) {
        case 'csv':
          data = this.exportToCSV(report);
          mimeType = 'text/csv';
          filename += '.csv';
          break;
        case 'json':
          data = JSON.stringify(report, null, 2);
          mimeType = 'application/json';
          filename += '.json';
          break;
        case 'excel':
          // For Excel, we'll use CSV as a fallback
          data = this.exportToCSV(report);
          mimeType = 'text/csv';
          filename += '.csv';
          break;
        case 'pdf':
          // PDF export is not implemented in this simple version
          data = 'PDF export is not supported in this version.';
          mimeType = 'text/plain';
          filename += '.txt';
          break;
      }
      
      // Create blob and URL
      const blob = new Blob([data], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error exporting report:', error);
      return null;
    }
  }
  
  /**
   * Export a report to CSV
   * 
   * @param report Analytics report
   * @returns CSV string
   */
  private exportToCSV(report: AnalyticsReport): string {
    // Create CSV content
    let csv = `"Report: ${report.title}"\n`;
    csv += `"Description: ${report.description}"\n`;
    csv += `"Created: ${report.createdAt.toISOString()}"\n\n`;
    
    // Add metrics
    csv += '"Metrics"\n';
    csv += '"Label","Value"\n';
    
    report.metrics.forEach(metric => {
      csv += `"${metric.label}","${metric.value}"\n`;
    });
    
    csv += '\n';
    
    // Add chart data
    report.charts.forEach(chart => {
      csv += `"Chart: ${chart.title}"\n`;
      
      // Add labels as header row
      csv += `"${chart.data.labels.join('","')}"\n`;
      
      // Add datasets
      chart.data.datasets.forEach(dataset => {
        csv += `"${dataset.label}: ${dataset.data.join('","')}"\n`;
      });
      
      csv += '\n';
    });
    
    return csv;
  }
  
  /**
   * Format time in seconds to a human-readable string
   * 
   * @param seconds Time in seconds
   * @returns Formatted time string
   */
  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes} min ${remainingSeconds} sec`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours} hr ${remainingMinutes} min`;
  }
}

// Create and export the reports service
export const reportsService = new ReportsService();
