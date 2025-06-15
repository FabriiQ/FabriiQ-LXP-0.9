/**
 * Analytics Types
 * 
 * Type definitions for analytics data structures
 */

// Timeframe types for analytics
export type TimeframeType = "day" | "week" | "month" | "term" | "year";

// Teacher metric types
export type TeacherMetricType = 
  | "studentPerformance" 
  | "attendanceRate" 
  | "feedbackTime" 
  | "classEngagement" 
  | "contentQuality" 
  | "overallRating";

// Teacher metrics data structure
export interface TeacherMetrics {
  id?: string;
  teacherId: string;
  courseId?: string;
  programId?: string;
  timeframe: TimeframeType;
  studentPerformance: number;
  attendanceRate: number;
  feedbackTime: number; // in hours
  classEngagement: number;
  contentQuality: number;
  overallRating: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Teacher metrics history data point
export interface TeacherMetricsHistoryPoint {
  date: Date;
  value: number;
}

// Teacher metrics history by teacher
export interface TeacherTrends {
  teacherId: string;
  teacherName: string;
  trends: TeacherMetricsHistoryPoint[];
}

// Teacher data with metrics
export interface TeacherWithMetrics {
  id: string;
  name: string;
  avatar?: string | null;
  metrics: {
    studentPerformance: number;
    attendanceRate: number;
    feedbackTime: number;
    classEngagement: number;
    contentQuality: number;
    overallRating: number;
  };
  classes: {
    id: string;
    name: string;
    studentCount: number;
    courseName: string;
  }[];
}

// Student metric types
export type StudentMetricType = 
  | "academicPerformance" 
  | "attendanceRate" 
  | "participationRate" 
  | "assignmentCompletion" 
  | "improvementRate" 
  | "overallRating";

// Student metrics data structure
export interface StudentMetrics {
  id?: string;
  studentId: string;
  courseId?: string;
  classId?: string;
  timeframe: TimeframeType;
  academicPerformance: number;
  attendanceRate: number;
  participationRate: number;
  assignmentCompletion: number;
  improvementRate: number;
  overallRating: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Student metrics history data point
export interface StudentMetricsHistoryPoint {
  date: Date;
  value: number;
}

// Student metrics history by student
export interface StudentTrends {
  studentId: string;
  studentName: string;
  trends: StudentMetricsHistoryPoint[];
}

// Student data with metrics
export interface StudentWithMetrics {
  id: string;
  name: string;
  avatar?: string | null;
  metrics: {
    academicPerformance: number;
    attendanceRate: number;
    participationRate: number;
    assignmentCompletion: number;
    improvementRate: number;
    overallRating: number;
  };
  classes: {
    id: string;
    name: string;
    courseName: string;
  }[];
}

// Course metric types
export type CourseMetricType = 
  | "enrollmentRate" 
  | "completionRate" 
  | "averageGrade" 
  | "teacherPerformance" 
  | "studentSatisfaction" 
  | "overallRating";

// Course metrics data structure
export interface CourseMetrics {
  id?: string;
  courseId: string;
  programId?: string;
  timeframe: TimeframeType;
  enrollmentRate: number;
  completionRate: number;
  averageGrade: number;
  teacherPerformance: number;
  studentSatisfaction: number;
  overallRating: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Course metrics history data point
export interface CourseMetricsHistoryPoint {
  date: Date;
  value: number;
}

// Course metrics history by course
export interface CourseTrends {
  courseId: string;
  courseName: string;
  trends: CourseMetricsHistoryPoint[];
}

// Course data with metrics
export interface CourseWithMetrics {
  id: string;
  name: string;
  code: string;
  metrics: {
    enrollmentRate: number;
    completionRate: number;
    averageGrade: number;
    teacherPerformance: number;
    studentSatisfaction: number;
    overallRating: number;
  };
  classes: {
    id: string;
    name: string;
    teacherCount: number;
    studentCount: number;
  }[];
}
