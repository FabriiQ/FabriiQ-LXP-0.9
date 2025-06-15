'use client';

import React, { useState, useEffect } from 'react';
import { 
  AnalyticsDashboardFilters, 
  AnalyticsReport,
  AnalyticsExportFormat,
  AnalyticsMetric,
  ActivityUsage
} from '../types';
import { useAnalytics } from '../hooks/useAnalytics';
import { useReports } from '../hooks/useReports';
import { DashboardFilters } from './DashboardFilters';
import { MetricCard } from './MetricCard';
import { ChartDisplay } from './ChartDisplay';
import { ReportCard } from './ReportCard';
import { ReportView } from './ReportView';
import { 
  createBarChart, 
  createLineChart, 
  createPieChart, 
  createMultiLineChart 
} from '../utils/charts';

interface AnalyticsDashboardProps {
  userId?: string;
  classId?: string;
  activityId?: string;
  initialFilters?: AnalyticsDashboardFilters;
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  classId,
  activityId,
  initialFilters = {},
  className = '',
}) => {
  // State
  const [filters, setFilters] = useState<AnalyticsDashboardFilters>(initialFilters);
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'users' | 'reports'>('overview');
  const [selectedReport, setSelectedReport] = useState<AnalyticsReport | null>(null);
  const [overviewMetrics, setOverviewMetrics] = useState<AnalyticsMetric[]>([]);
  
  // Hooks
  const { 
    activityUsage,
    userEngagement,
    loading: analyticsLoading,
    error: analyticsError,
    loadActivityUsage,
    loadUserEngagement,
    loadActivityAnalytics,
    loadUserAnalytics,
    loadClassAnalytics
  } = useAnalytics();
  
  const {
    reports,
    currentReport,
    loading: reportsLoading,
    error: reportsError,
    loadReports,
    generateActivityReport,
    generateUserReport,
    generateClassReport,
    exportReport
  } = useReports();
  
  // Load initial data
  useEffect(() => {
    // Load reports
    loadReports();
    
    // Load activity usage
    loadActivityUsage(filters);
    
    // Load user engagement
    loadUserEngagement(filters);
    
    // Load specific analytics if IDs are provided
    if (activityId) {
      loadActivityAnalytics(activityId);
    }
    
    if (userId) {
      loadUserAnalytics(userId);
    }
    
    if (classId) {
      loadClassAnalytics(classId);
    }
  }, []);
  
  // Update data when filters change
  useEffect(() => {
    loadActivityUsage(filters);
    loadUserEngagement(filters);
  }, [filters]);
  
  // Generate overview metrics
  useEffect(() => {
    const metrics: AnalyticsMetric[] = [];
    
    // Total activities
    if (activityUsage.length > 0) {
      metrics.push({
        id: 'total_activities',
        label: 'Total Activities',
        value: activityUsage.length,
        format: 'number',
        icon: 'activity',
        color: '#4caf50',
      });
      
      // Total views
      const totalViews = activityUsage.reduce((sum, activity) => sum + activity.views, 0);
      metrics.push({
        id: 'total_views',
        label: 'Total Views',
        value: totalViews,
        format: 'number',
        icon: 'eye',
        color: '#2196f3',
      });
      
      // Total completions
      const totalCompletions = activityUsage.reduce((sum, activity) => sum + activity.completions, 0);
      metrics.push({
        id: 'total_completions',
        label: 'Total Completions',
        value: totalCompletions,
        format: 'number',
        icon: 'check-circle',
        color: '#ff9800',
      });
      
      // Completion rate
      const totalAttempts = activityUsage.reduce((sum, activity) => sum + activity.attempts, 0);
      const completionRate = totalAttempts > 0 ? (totalCompletions / totalAttempts) * 100 : 0;
      metrics.push({
        id: 'completion_rate',
        label: 'Completion Rate',
        value: completionRate,
        format: 'percentage',
        icon: 'percent',
        color: '#f44336',
      });
    }
    
    // Total users
    if (userEngagement.length > 0) {
      metrics.push({
        id: 'total_users',
        label: 'Active Users',
        value: userEngagement.length,
        format: 'number',
        icon: 'users',
        color: '#9c27b0',
      });
      
      // Average engagement score
      const avgEngagement = userEngagement.reduce((sum, user) => sum + user.engagementScore, 0) / userEngagement.length;
      metrics.push({
        id: 'avg_engagement',
        label: 'Avg. Engagement',
        value: avgEngagement,
        format: 'percentage',
        icon: 'trending-up',
        color: '#00bcd4',
      });
    }
    
    setOverviewMetrics(metrics);
  }, [activityUsage, userEngagement]);
  
  // Handle filter change
  const handleFilterChange = (newFilters: AnalyticsDashboardFilters) => {
    setFilters(newFilters);
  };
  
  // Handle report view
  const handleViewReport = (report: AnalyticsReport) => {
    setSelectedReport(report);
  };
  
  // Handle report export
  const handleExportReport = (report: AnalyticsReport) => {
    // Show export options
  };
  
  // Handle report export format
  const handleExportFormat = async (format: AnalyticsExportFormat) => {
    if (!selectedReport) return;
    
    const url = await exportReport(selectedReport.id, {
      format,
      includeCharts: true,
      includeRawData: true,
      filters,
    });
    
    if (url) {
      // Open URL in new tab
      window.open(url, '_blank');
    }
  };
  
  // Handle back from report view
  const handleBackFromReport = () => {
    setSelectedReport(null);
  };
  
  // Generate activity charts
  const getActivityCharts = () => {
    if (activityUsage.length === 0) return [];
    
    // Sort activities by views
    const topActivities = [...activityUsage]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
    
    // Create charts
    return [
      createBarChart(
        'Top Activities by Views',
        topActivities.map(a => a.title),
        topActivities.map(a => a.views),
        'Views',
        '#2196f3'
      ),
      createBarChart(
        'Top Activities by Completions',
        topActivities.map(a => a.title),
        topActivities.map(a => a.completions),
        'Completions',
        '#4caf50'
      ),
      createPieChart(
        'Activity Types Distribution',
        ['Quiz', 'Reading', 'Video', 'Assignment', 'Discussion'],
        [
          activityUsage.filter(a => a.type === 'quiz').length,
          activityUsage.filter(a => a.type === 'reading').length,
          activityUsage.filter(a => a.type === 'video').length,
          activityUsage.filter(a => a.type === 'assignment').length,
          activityUsage.filter(a => a.type === 'discussion').length,
        ],
        'Activities'
      ),
      createMultiLineChart(
        'Activity Engagement Trends',
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        [
          {
            label: 'Views',
            data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 100 + 50)),
          },
          {
            label: 'Attempts',
            data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 80 + 30)),
          },
          {
            label: 'Completions',
            data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 60 + 20)),
          },
        ]
      ),
    ];
  };
  
  // Generate user charts
  const getUserCharts = () => {
    if (userEngagement.length === 0) return [];
    
    // Sort users by engagement score
    const topUsers = [...userEngagement]
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 5);
    
    // Create charts
    return [
      createBarChart(
        'Top Users by Engagement',
        topUsers.map(u => u.userId),
        topUsers.map(u => u.engagementScore),
        'Engagement Score',
        '#9c27b0'
      ),
      createBarChart(
        'Top Users by Activities Completed',
        topUsers.map(u => u.userId),
        topUsers.map(u => u.activitiesCompleted),
        'Completed Activities',
        '#4caf50'
      ),
      createPieChart(
        'User Activity Status',
        ['Completed', 'In Progress', 'Not Started'],
        [
          userEngagement.reduce((sum, u) => sum + u.activitiesCompleted, 0),
          userEngagement.reduce((sum, u) => sum + (u.activitiesStarted - u.activitiesCompleted), 0),
          userEngagement.reduce((sum, u) => sum + 10 - u.activitiesStarted, 0), // Assuming 10 activities per user
        ],
        'Activities'
      ),
      createLineChart(
        'User Engagement Over Time',
        ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        [65, 72, 68, 80],
        'Average Engagement'
      ),
    ];
  };
  
  // Render loading state
  if (analyticsLoading && activityUsage.length === 0 && userEngagement.length === 0) {
    return (
      <div className={`analytics-dashboard loading ${className}`}>
        <div className="loading-indicator">
          Loading analytics data...
        </div>
      </div>
    );
  }
  
  // Render error state
  if (analyticsError) {
    return (
      <div className={`analytics-dashboard error ${className}`}>
        <div className="error-message">
          Error loading analytics data: {analyticsError}
        </div>
      </div>
    );
  }
  
  // Render report view
  if (selectedReport) {
    return (
      <div className={`analytics-dashboard report-view-container ${className}`}>
        <ReportView
          report={selectedReport}
          onExport={handleExportFormat}
          onBack={handleBackFromReport}
        />
      </div>
    );
  }
  
  // Render dashboard
  return (
    <div className={`analytics-dashboard ${className}`}>
      <div className="dashboard-header">
        <h2>Activity Analytics Dashboard</h2>
        
        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          
          <button
            className={`tab-button ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            Activities
          </button>
          
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          
          <button
            className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          <DashboardFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
          
          {activeTab === 'reports' && (
            <div className="report-actions">
              <h3>Generate Report</h3>
              
              <div className="report-buttons">
                {activityId && (
                  <button
                    className="generate-button"
                    onClick={() => generateActivityReport(activityId)}
                    disabled={reportsLoading}
                  >
                    Activity Report
                  </button>
                )}
                
                {userId && (
                  <button
                    className="generate-button"
                    onClick={() => generateUserReport(userId)}
                    disabled={reportsLoading}
                  >
                    User Report
                  </button>
                )}
                
                {classId && (
                  <button
                    className="generate-button"
                    onClick={() => generateClassReport(classId)}
                    disabled={reportsLoading}
                  >
                    Class Report
                  </button>
                )}
                
                <button
                  className="generate-button"
                  onClick={() => {
                    // Generate a custom report based on current filters
                  }}
                  disabled={reportsLoading}
                >
                  Custom Report
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="dashboard-main">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="metrics-section">
                {overviewMetrics.map((metric) => (
                  <MetricCard
                    key={metric.id}
                    metric={metric}
                  />
                ))}
              </div>
              
              <div className="charts-section">
                {getActivityCharts().slice(0, 2).map((chart, index) => (
                  <div key={index} className="chart-container">
                    <ChartDisplay chart={chart} />
                  </div>
                ))}
                
                {getUserCharts().slice(0, 2).map((chart, index) => (
                  <div key={index} className="chart-container">
                    <ChartDisplay chart={chart} />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'activities' && (
            <div className="activities-tab">
              <h3>Activity Analytics</h3>
              
              <div className="activity-metrics">
                {overviewMetrics.filter(m => 
                  ['total_activities', 'total_views', 'total_completions', 'completion_rate'].includes(m.id)
                ).map((metric) => (
                  <MetricCard
                    key={metric.id}
                    metric={metric}
                  />
                ))}
              </div>
              
              <div className="activity-charts">
                {getActivityCharts().map((chart, index) => (
                  <div key={index} className="chart-container">
                    <ChartDisplay chart={chart} />
                  </div>
                ))}
              </div>
              
              <div className="activity-list">
                <h3>Activity Usage</h3>
                
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Activity</th>
                      <th>Type</th>
                      <th>Views</th>
                      <th>Attempts</th>
                      <th>Completions</th>
                      <th>Completion Rate</th>
                      <th>Avg. Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityUsage.map((activity) => (
                      <tr key={activity.activityId}>
                        <td>{activity.title}</td>
                        <td>{activity.type}</td>
                        <td>{activity.views}</td>
                        <td>{activity.attempts}</td>
                        <td>{activity.completions}</td>
                        <td>{activity.attempts > 0 ? `${Math.round((activity.completions / activity.attempts) * 100)}%` : '0%'}</td>
                        <td>{Math.floor(activity.averageTimeSpent / 60)}:{(activity.averageTimeSpent % 60).toString().padStart(2, '0')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'users' && (
            <div className="users-tab">
              <h3>User Analytics</h3>
              
              <div className="user-metrics">
                {overviewMetrics.filter(m => 
                  ['total_users', 'avg_engagement'].includes(m.id)
                ).map((metric) => (
                  <MetricCard
                    key={metric.id}
                    metric={metric}
                  />
                ))}
              </div>
              
              <div className="user-charts">
                {getUserCharts().map((chart, index) => (
                  <div key={index} className="chart-container">
                    <ChartDisplay chart={chart} />
                  </div>
                ))}
              </div>
              
              <div className="user-list">
                <h3>User Engagement</h3>
                
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Activities Started</th>
                      <th>Activities Completed</th>
                      <th>Completion Rate</th>
                      <th>Time Spent</th>
                      <th>Last Active</th>
                      <th>Engagement Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userEngagement.map((user) => (
                      <tr key={user.userId}>
                        <td>{user.userId}</td>
                        <td>{user.activitiesStarted}</td>
                        <td>{user.activitiesCompleted}</td>
                        <td>{user.activitiesStarted > 0 ? `${Math.round((user.activitiesCompleted / user.activitiesStarted) * 100)}%` : '0%'}</td>
                        <td>{Math.floor(user.totalTimeSpent / 3600)}h {Math.floor((user.totalTimeSpent % 3600) / 60)}m</td>
                        <td>{user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'N/A'}</td>
                        <td>{user.engagementScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'reports' && (
            <div className="reports-tab">
              <h3>Analytics Reports</h3>
              
              {reportsLoading ? (
                <div className="loading-indicator">
                  Loading reports...
                </div>
              ) : reportsError ? (
                <div className="error-message">
                  Error loading reports: {reportsError}
                </div>
              ) : reports.length === 0 ? (
                <div className="empty-state">
                  <p>No reports available. Generate a report to get started.</p>
                </div>
              ) : (
                <div className="reports-grid">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onView={handleViewReport}
                      onExport={handleExportReport}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
