/**
 * Attendance component types
 */

/**
 * User roles for role-based rendering
 */
export enum UserRole {
  TEACHER = 'teacher',
  COORDINATOR = 'coordinator',
  CAMPUS_ADMIN = 'campus_admin',
  SYSTEM_ADMIN = 'system_admin',
  STUDENT = 'student',
}

/**
 * Attendance status types
 */
export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

/**
 * Class data interface
 */
export interface ClassData {
  id: string;
  name: string;
  code: string;
  courseId: string;
  courseName?: string;
  programId?: string;
  programName?: string;
  startDate: Date;
  endDate: Date;
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
}

/**
 * Student data interface for attendance
 */
export interface AttendanceStudentData {
  id: string;
  userId: string;
  name: string;
  email: string;
  profileImage?: string;
  status?: AttendanceStatus;
  comment?: string;
}

/**
 * Attendance record interface
 */
export interface AttendanceRecord {
  id?: string;
  studentId: string;
  date: Date;
  status: AttendanceStatus;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

/**
 * Attendance statistics data interface
 */
export interface AttendanceStatsData {
  overall: {
    rate: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
  };
  trend: {
    date: string;
    rate: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  }[];
  byStudent: {
    studentId: string;
    studentName: string;
    rate: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  }[];
  byWeekday: {
    day: string;
    rate: number;
  }[];
}

/**
 * Entity types for attendance selector
 */
export type EntityType = 'campus' | 'program' | 'class' | 'student';

/**
 * Analytics level for attendance analytics
 */
export type AnalyticsLevel = 'campus' | 'program' | 'class' | 'student';

/**
 * View mode for attendance grid
 */
export type ViewMode = 'day' | 'week' | 'month';

/**
 * Filter options for attendance
 */
export interface AttendanceFilterOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: AttendanceStatus[];
  students?: string[];
  classes?: string[];
  programs?: string[];
  searchTerm?: string;
}
