import { AgentTool } from '../core/types';
import axios from 'axios';

/**
 * Student data interface
 */
export interface StudentData {
  id: string;
  userId: string;
  name: string;
  email: string;
  enrollmentNumber: string;
  currentGrade?: string;
  academicScore?: number;
  attendanceRate?: number;
  participationRate?: number;
  interests?: string[];
  achievements?: any[];
}

/**
 * Student performance data interface
 */
export interface StudentPerformanceData {
  academic: number;
  attendance: number;
  participation: number;
  improvement: number;
  strengths: string[];
  weaknesses: string[];
  recentGrades: {
    id: string;
    subject: string;
    score: number;
    letterGrade: string;
    date: Date;
  }[];
  trend: {
    date: Date;
    academic: number;
    attendance: number;
    participation: number;
  }[];
}

/**
 * Creates a tool for retrieving student data using the API
 */
export const createStudentDataTool = (): AgentTool => {
  return {
    name: 'getStudentData',
    description: 'Retrieves student data for a class or specific students',
    parameters: {
      classId: 'The ID of the class to retrieve students for',
      studentIds: 'Optional array of specific student IDs to retrieve',
      includePerformance: 'Whether to include performance data (default: false)',
      includeAttendance: 'Whether to include attendance data (default: false)',
      includeGrades: 'Whether to include grade data (default: false)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const {
        classId,
        studentIds,
        includePerformance = false,
        includeAttendance = false,
        includeGrades = false
      } = params;

      if (!classId && !studentIds) {
        throw new Error('Either classId or studentIds must be provided');
      }

      try {
        let endpoint = '';
        let queryParams: Record<string, any> = {
          includePerformance,
          includeAttendance,
          includeGrades
        };

        // Determine the appropriate API endpoint and parameters
        if (classId) {
          endpoint = `/api/classes/${classId}/students`;
        } else if (studentIds) {
          endpoint = '/api/students';
          queryParams.ids = studentIds.join(',');
        }

        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });

        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to retrieve student data: ${response.statusText}`);
        }

        const students = response.data.students || [];

        return {
          students,
          metadata: {
            classId,
            studentCount: students.length,
            includePerformance,
            includeAttendance,
            includeGrades,
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving student data:', error);
        throw new Error(`Student data retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  };
};

/**
 * Creates a tool for retrieving student performance data
 */
export const createStudentPerformanceTool = (): AgentTool => {
  return {
    name: 'getStudentPerformance',
    description: 'Retrieves detailed performance data for a student',
    parameters: {
      studentId: 'ID of the student to retrieve performance data for',
      classId: 'Optional class ID to filter performance data',
      startDate: 'Optional start date for performance data (ISO format)',
      endDate: 'Optional end date for performance data (ISO format)',
      includeStrengthsWeaknesses: 'Whether to include strengths and weaknesses analysis (default: true)',
      includeTrends: 'Whether to include performance trends over time (default: true)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const {
        studentId,
        classId,
        startDate,
        endDate,
        includeStrengthsWeaknesses = true,
        includeTrends = true
      } = params;

      if (!studentId) {
        throw new Error('Student ID is required');
      }

      try {
        // Build API endpoint and parameters
        const endpoint = `/api/students/${studentId}/performance`;
        const queryParams: Record<string, any> = {
          includeStrengthsWeaknesses,
          includeTrends
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
          throw new Error(`Failed to retrieve student performance data: ${response.statusText}`);
        }

        return {
          studentId,
          performance: response.data.performance,
          metadata: {
            classId: classId || null,
            dateRange: {
              start: startDate || null,
              end: endDate || null,
            },
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error retrieving student performance:', error);
        throw new Error(`Failed to retrieve student performance: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  };
};

/**
 * Creates a tool for searching students
 */
export const createStudentSearchTool = (): AgentTool => {
  return {
    name: 'searchStudents',
    description: 'Searches for students based on various criteria',
    parameters: {
      classId: 'Optional class ID to filter students',
      campusId: 'Optional campus ID to filter students',
      programId: 'Optional program ID to filter students',
      searchTerm: 'Optional search term to filter students by name or enrollment number',
      performanceThreshold: 'Optional minimum performance score to filter students',
      attendanceThreshold: 'Optional minimum attendance rate to filter students',
      status: 'Optional status to filter students (ACTIVE, INACTIVE, etc.)',
      limit: 'Maximum number of results to return (default: 10)',
      skip: 'Number of results to skip for pagination (default: 0)',
    },
    execute: async (params: Record<string, any>): Promise<any> => {
      const {
        classId,
        campusId,
        programId,
        searchTerm,
        performanceThreshold,
        attendanceThreshold,
        status,
        limit = 10,
        skip = 0
      } = params;

      try {
        // Build API endpoint and parameters
        const endpoint = '/api/students/search';
        const queryParams: Record<string, any> = {
          limit,
          skip
        };

        if (classId) {
          queryparams.id = classId;
        }

        if (campusId) {
          queryParams.campusId = campusId;
        }

        if (programId) {
          queryParams.programId = programId;
        }

        if (searchTerm) {
          queryParams.search = searchTerm;
        }

        if (performanceThreshold !== undefined) {
          queryParams.minPerformance = performanceThreshold;
        }

        if (attendanceThreshold !== undefined) {
          queryParams.minAttendance = attendanceThreshold;
        }

        if (status) {
          queryParams.status = status;
        }

        // Make the API request
        const response = await axios.get(endpoint, { params: queryParams });

        // Validate and process the response
        if (response.status !== 200 || !response.data) {
          throw new Error(`Failed to search students: ${response.statusText}`);
        }

        return {
          students: response.data.students || [],
          total: response.data.total || 0,
          returned: (response.data.students || []).length,
          metadata: {
            filters: {
              classId,
              campusId,
              programId,
              searchTerm,
              performanceThreshold,
              attendanceThreshold,
              status,
            },
            pagination: {
              limit,
              skip,
              hasMore: (response.data.total || 0) > skip + (response.data.students || []).length,
            },
            timestamp: Date.now(),
          },
        };
      } catch (error) {
        console.error('Error searching students:', error);
        throw new Error(`Failed to search students: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  };
};

