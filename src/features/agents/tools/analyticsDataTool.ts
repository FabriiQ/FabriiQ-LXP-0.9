import { AgentTool } from '../core/types';
import axios from 'axios';

/**
 * Analytics time period type
 */
export type AnalyticsTimePeriod = 
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'all';

/**
 * Analytics time range interface
 */
export interface AnalyticsTimeRange {
  startDate?: Date;
  endDate?: Date;
  period?: AnalyticsTimePeriod;
}

/**
 * Class analytics interface
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
 * Creates a tool for retrieving class analytics
 */
export const createClassAnalyticsTool = (): AgentTool => {
  return {
    name: 'getClassAnalytics',
    description: 'Retrieves analytics data for a specific class',
    parameters: {
      classId: 'ID of the class to retrieve analytics for',
      startDate: 'Optional start date for analytics data (ISO format)',
      endDate: 'Optional end date for analytics data (ISO format)',
      period: 'Optional time period for analytics (day, week, month, quarter, year, all)',
      includeStudentPerformance: 'Whether to include student performance data (default: true)',
      includeActivityPerformance: 'Whether to include activity performance data (default: true)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { 
        classId, 
        startDate, 
        endDate, 
        period,
        includeStudentPerformance = true,
        includeActivityPerformance = true
      } = params;
      
      if (!classId) {
        throw new Error('Class ID is required');
      }
      
      try {
        // Build API endpoint and parameters
        const endpoint = `/api/classes/${classId}/analytics`;
        const queryParams: Record<string, any> = {
          includeStudentPerformance,
          includeActivityPerformance
        };
        
        if (startDate) {
          queryParams.startDate = startDate;
        }
        
        if (endDate) {
          queryParams.endDate = endDate;
        }
        
        if (period) {
          queryParams.period = period;
        }
        
        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });
        
        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve class analytics: ${response.statusText}`);
        }
        
        return {
          classId,
          analytics: response.data.analytics,
          metadata: {
            dateRange: {
              start: startDate || null,
              end: endDate || null,
              period: period || null,
            },
            includeStudentPerformance,
            includeActivityPerformance,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving class analytics:', error);
        throw new Error(`Class analytics retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for retrieving student performance analytics
 */
export const createStudentPerformanceAnalyticsTool = (): AgentTool => {
  return {
    name: 'getStudentPerformanceAnalytics',
    description: 'Retrieves performance analytics for a specific student',
    parameters: {
      studentId: 'ID of the student to retrieve performance analytics for',
      classId: 'Optional class ID to filter performance analytics by',
      subjectId: 'Optional subject ID to filter performance analytics by',
      startDate: 'Optional start date for analytics data (ISO format)',
      endDate: 'Optional end date for analytics data (ISO format)',
      period: 'Optional time period for analytics (day, week, month, quarter, year, all)',
      includeActivityBreakdown: 'Whether to include activity-level breakdown (default: true)',
      includeTopicBreakdown: 'Whether to include topic-level breakdown (default: true)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { 
        studentId, 
        classId, 
        subjectId,
        startDate, 
        endDate, 
        period,
        includeActivityBreakdown = true,
        includeTopicBreakdown = true
      } = params;
      
      if (!studentId) {
        throw new Error('Student ID is required');
      }
      
      try {
        // Build API endpoint and parameters
        const endpoint = `/api/students/${studentId}/performance-analytics`;
        const queryParams: Record<string, any> = {
          includeActivityBreakdown,
          includeTopicBreakdown
        };
        
        if (classId) {
          queryparams.id = classId;
        }
        
        if (subjectId) {
          queryParams.subjectId = subjectId;
        }
        
        if (startDate) {
          queryParams.startDate = startDate;
        }
        
        if (endDate) {
          queryParams.endDate = endDate;
        }
        
        if (period) {
          queryParams.period = period;
        }
        
        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });
        
        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve student performance analytics: ${response.statusText}`);
        }
        
        return {
          studentId,
          analytics: response.data.analytics,
          metadata: {
            classId: classId || null,
            subjectId: subjectId || null,
            dateRange: {
              start: startDate || null,
              end: endDate || null,
              period: period || null,
            },
            includeActivityBreakdown,
            includeTopicBreakdown,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving student performance analytics:', error);
        throw new Error(`Student performance analytics retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for retrieving subject analytics
 */
export const createSubjectAnalyticsTool = (): AgentTool => {
  return {
    name: 'getSubjectAnalytics',
    description: 'Retrieves analytics data for a specific subject',
    parameters: {
      subjectId: 'ID of the subject to retrieve analytics for',
      classId: 'Optional class ID to filter analytics by',
      startDate: 'Optional start date for analytics data (ISO format)',
      endDate: 'Optional end date for analytics data (ISO format)',
      period: 'Optional time period for analytics (day, week, month, quarter, year, all)',
      includeTopicBreakdown: 'Whether to include topic-level breakdown (default: true)',
      includeStudentPerformance: 'Whether to include student performance data (default: false)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { 
        subjectId, 
        classId,
        startDate, 
        endDate, 
        period,
        includeTopicBreakdown = true,
        includeStudentPerformance = false
      } = params;
      
      if (!subjectId) {
        throw new Error('Subject ID is required');
      }
      
      try {
        // Build API endpoint and parameters
        const endpoint = `/api/subjects/${subjectId}/analytics`;
        const queryParams: Record<string, any> = {
          includeTopicBreakdown,
          includeStudentPerformance
        };
        
        if (classId) {
          queryparams.id = classId;
        }
        
        if (startDate) {
          queryParams.startDate = startDate;
        }
        
        if (endDate) {
          queryParams.endDate = endDate;
        }
        
        if (period) {
          queryParams.period = period;
        }
        
        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });
        
        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve subject analytics: ${response.statusText}`);
        }
        
        return {
          subjectId,
          analytics: response.data.analytics,
          metadata: {
            classId: classId || null,
            dateRange: {
              start: startDate || null,
              end: endDate || null,
              period: period || null,
            },
            includeTopicBreakdown,
            includeStudentPerformance,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving subject analytics:', error);
        throw new Error(`Subject analytics retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for retrieving activity type analytics
 */
export const createActivityTypeAnalyticsTool = (): AgentTool => {
  return {
    name: 'getActivityTypeAnalytics',
    description: 'Retrieves analytics data for specific activity types',
    parameters: {
      activityTypes: 'Array of activity types to retrieve analytics for',
      classId: 'Optional class ID to filter analytics by',
      subjectId: 'Optional subject ID to filter analytics by',
      startDate: 'Optional start date for analytics data (ISO format)',
      endDate: 'Optional end date for analytics data (ISO format)',
      period: 'Optional time period for analytics (day, week, month, quarter, year, all)',
      compareWithPrevious: 'Whether to compare with previous period (default: false)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const { 
        activityTypes, 
        classId,
        subjectId,
        startDate, 
        endDate, 
        period,
        compareWithPrevious = false
      } = params;
      
      if (!activityTypes || !Array.isArray(activityTypes) || activityTypes.length === 0) {
        throw new Error('At least one activity type is required');
      }
      
      try {
        // Build API endpoint and parameters
        const endpoint = '/api/analytics/activity-types';
        const queryParams: Record<string, any> = {
          activityTypes: activityTypes.join(','),
          compareWithPrevious
        };
        
        if (classId) {
          queryparams.id = classId;
        }
        
        if (subjectId) {
          queryParams.subjectId = subjectId;
        }
        
        if (startDate) {
          queryParams.startDate = startDate;
        }
        
        if (endDate) {
          queryParams.endDate = endDate;
        }
        
        if (period) {
          queryParams.period = period;
        }
        
        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });
        
        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve activity type analytics: ${response.statusText}`);
        }
        
        return {
          activityTypes,
          analytics: response.data.analytics,
          comparison: response.data.comparison,
          metadata: {
            classId: classId || null,
            subjectId: subjectId || null,
            dateRange: {
              start: startDate || null,
              end: endDate || null,
              period: period || null,
            },
            compareWithPrevious,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving activity type analytics:', error);
        throw new Error(`Activity type analytics retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

