import { AgentTool } from '../core/types';
import axios from 'axios';

/**
 * Activity data interface
 */
export interface ActivityData {
  id: string;
  title: string;
  description?: string;
  activityType: string;
  purpose: string;
  subjectId: string;
  topicId?: string;
  classId: string;
  content: any;
  isGradable: boolean;
  maxScore?: number;
  passingScore?: number;
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
}

/**
 * Activity submission interface
 */
export interface ActivitySubmission {
  id: string;
  activityId: string;
  studentId: string;
  content: any;
  score?: number;
  feedback?: string;
  status: string;
  submittedAt: Date;
  gradedAt?: Date;
  gradedById?: string;
}

/**
 * Activity analytics interface
 */
export interface ActivityAnalytics {
  activityId: string;
  totalAttempts: number;
  uniqueUsers: number;
  averageScore?: number;
  completionRate: number;
  averageTimeSpent: number;
  itemAnalytics?: Record<string, any>;
}

/**
 * Creates a tool for retrieving activity data
 */
export const createActivityDataTool = (): AgentTool => {
  return {
    name: 'getActivityData',
    description: 'Retrieves activity data for specific activities or by subject/topic',
    parameters: {
      activityIds: 'Optional array of specific activity IDs to retrieve',
      classId: 'Optional class ID to filter activities by',
      subjectId: 'Optional subject ID to filter activities by',
      topicIds: 'Optional array of topic IDs to filter activities by',
      activityType: 'Optional activity type to filter by',
      purpose: 'Optional purpose to filter by (PRACTICE, ASSESSMENT, etc.)',
      isGradable: 'Optional boolean to filter by gradable status',
      status: 'Optional status to filter by (ACTIVE, DRAFT, etc.)',
      startDateFrom: 'Optional start date filter (ISO format)',
      startDateTo: 'Optional end date filter (ISO format)',
      includeContent: 'Whether to include full activity content (default: false)',
      limit: 'Maximum number of activities to return (default: 10)',
      skip: 'Number of results to skip for pagination (default: 0)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const {
        activityIds,
        classId,
        subjectId,
        topicIds,
        activityType,
        purpose,
        isGradable,
        status,
        startDateFrom,
        startDateTo,
        includeContent = false,
        limit = 10,
        skip = 0
      } = params;

      try {
        let endpoint = '/api/activities';
        let queryParams: Record<string, any> = {
          limit,
          skip,
          includeContent
        };

        // Build query parameters based on provided filters
        if (activityIds) {
          queryParams.ids = activityIds.join(',');
        }

        if (classId) {
          queryparams.id = classId;
        }

        if (subjectId) {
          queryParams.subjectId = subjectId;
        }

        if (topicIds) {
          queryParams.topicIds = topicIds.join(',');
        }

        if (activityType) {
          queryParams.activityType = activityType;
        }

        if (purpose) {
          queryParams.purpose = purpose;
        }

        if (isGradable !== undefined) {
          queryParams.isGradable = isGradable;
        }

        if (status) {
          queryParams.status = status;
        }

        if (startDateFrom) {
          queryParams.startDateFrom = startDateFrom;
        }

        if (startDateTo) {
          queryParams.startDateTo = startDateTo;
        }

        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });

        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve activity data: ${response.statusText}`);
        }

        const activities = response.data.activities || [];

        return {
          activities,
          metadata: {
            total: response.data.total || activities.length,
            returned: activities.length,
            filters: {
              activityIds,
              classId,
              subjectId,
              topicIds,
              activityType,
              purpose,
              isGradable,
              status,
              startDateFrom,
              startDateTo,
            },
            pagination: {
              limit,
              skip,
              hasMore: (response.data.total || activities.length) > skip + activities.length,
            },
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving activity data:', error);
        throw new Error(`Activity data retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for retrieving activity submissions
 */
export const createActivitySubmissionsTool = (): AgentTool => {
  return {
    name: 'getActivitySubmissions',
    description: 'Retrieves submissions for a specific activity',
    parameters: {
      activityId: 'ID of the activity to retrieve submissions for',
      studentId: 'Optional student ID to filter submissions by',
      status: 'Optional status to filter by (SUBMITTED, GRADED, etc.)',
      includeContent: 'Whether to include submission content (default: false)',
      limit: 'Maximum number of submissions to return (default: 10)',
      skip: 'Number of results to skip for pagination (default: 0)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const {
        activityId,
        studentId,
        status,
        includeContent = false,
        limit = 10,
        skip = 0
      } = params;

      if (!activityId) {
        throw new Error('Activity ID is required');
      }

      try {
        // Build API endpoint and parameters
        const endpoint = `/api/activities/${activityId}/submissions`;
        const queryParams: Record<string, any> = {
          includeContent,
          limit,
          skip
        };

        if (studentId) {
          queryParams.studentId = studentId;
        }

        if (status) {
          queryParams.status = status;
        }

        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });

        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve activity submissions: ${response.statusText}`);
        }

        const submissions = response.data.submissions || [];

        return {
          activityId,
          submissions,
          metadata: {
            total: response.data.total || submissions.length,
            returned: submissions.length,
            filters: {
              studentId,
              status,
            },
            pagination: {
              limit,
              skip,
              hasMore: (response.data.total || submissions.length) > skip + submissions.length,
            },
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving activity submissions:', error);
        throw new Error(`Activity submissions retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for retrieving activity analytics
 */
export const createActivityAnalyticsTool = (): AgentTool => {
  return {
    name: 'getActivityAnalytics',
    description: 'Retrieves analytics data for a specific activity',
    parameters: {
      activityId: 'ID of the activity to retrieve analytics for',
      classId: 'Optional class ID to filter analytics by',
      startDate: 'Optional start date for analytics data (ISO format)',
      endDate: 'Optional end date for analytics data (ISO format)',
      includeItemAnalytics: 'Whether to include item-level analytics (default: false)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const {
        activityId,
        classId,
        startDate,
        endDate,
        includeItemAnalytics = false
      } = params;

      if (!activityId) {
        throw new Error('Activity ID is required');
      }

      try {
        // Build API endpoint and parameters
        const endpoint = `/api/activities/${activityId}/analytics`;
        const queryParams: Record<string, any> = {
          includeItemAnalytics
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

        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });

        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve activity analytics: ${response.statusText}`);
        }

        return {
          activityId,
          analytics: response.data.analytics,
          metadata: {
            classId: classId || null,
            dateRange: {
              start: startDate || null,
              end: endDate || null,
            },
            includeItemAnalytics,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving activity analytics:', error);
        throw new Error(`Activity analytics retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

