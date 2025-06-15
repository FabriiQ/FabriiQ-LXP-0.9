/**
 * Student component types
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
 * Student status types
 */
export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  GRADUATED = 'graduated',
  WITHDRAWN = 'withdrawn',
}

/**
 * Student action types
 */
export enum StudentAction {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  ENROLL = 'enroll',
  UNENROLL = 'unenroll',
  SUSPEND = 'suspend',
  ACTIVATE = 'activate',
  GRADUATE = 'graduate',
  WITHDRAW = 'withdraw',
  SEND_MESSAGE = 'send_message',
  PROVIDE_FEEDBACK = 'provide_feedback',
  EXPORT = 'export',
  PRINT = 'print',
  VIEW_ATTENDANCE = 'view_attendance',
  VIEW_PERFORMANCE = 'view_performance',
}

/**
 * Student tab types
 */
export enum StudentTab {
  OVERVIEW = 'overview',
  CLASSES = 'classes',
  PERFORMANCE = 'performance',
  MASTERY = 'mastery',
  ATTENDANCE = 'attendance',
  FEEDBACK = 'feedback',
  DOCUMENTS = 'documents',
  NOTES = 'notes',
}

/**
 * Student view mode types
 */
export type StudentViewMode = 'full' | 'compact' | 'mobile';

/**
 * Student list view mode types
 */
export type StudentListViewMode = 'grid' | 'table' | 'mobile';

/**
 * Student data interface
 */
export interface StudentData {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  enrollmentNumber: string;
  status: StudentStatus;
  profileImage?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  joinDate?: Date;
  campusId?: string;
  campusName?: string;
  programId?: string;
  programName?: string;
  currentGrade?: string;
  academicScore?: number;
  attendanceRate?: number;
  participationRate?: number;
  classCount?: number;
  leaderboardPosition?: number;
  leaderboardChange?: number;
  classes?: StudentClassData[];
  performance?: StudentPerformanceData;
}

/**
 * Student class data interface
 */
export interface StudentClassData {
  id: string;
  name: string;
  code: string;
  courseId: string;
  courseName: string;
  teacherId?: string;
  teacherName?: string;
  startDate: Date;
  endDate: Date;
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  grade?: string;
  score?: number;
  attendanceRate?: number;
  participationRate?: number;
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
 * Student feedback data interface
 */
export interface StudentFeedbackData {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  rating?: number;
  category?: string;
  createdAt: Date;
  isRead: boolean;
  response?: {
    id: string;
    message: string;
    createdAt: Date;
  };
}

/**
 * Student filter interface
 */
export interface StudentFilterOptions {
  searchTerm?: string;
  status?: StudentStatus[];
  programs?: string[];
  classes?: string[];
  campuses?: string[];
  joinDateRange?: {
    start: Date;
    end: Date;
  };
  performanceRange?: {
    min: number;
    max: number;
  };
  attendanceRange?: {
    min: number;
    max: number;
  };
}

/**
 * Student form data interface
 */
export interface StudentFormData {
  name: string;
  email: string;
  phone?: string;
  enrollmentNumber?: string;
  status: StudentStatus;
  profileImage?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  campusId?: string;
  programId?: string;
  classIds?: string[];
  password?: string; // Only for new students
}

/**
 * Student performance metric interface
 */
export interface StudentPerformanceMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  target?: number;
  color?: string;
  icon?: React.ReactNode;
}

/**
 * Student leaderboard data interface
 */
export interface StudentLeaderboardData {
  position: number;
  change: number;
  classRank: number;
  programRank: number;
  history: {
    date: Date;
    position: number;
  }[];
}
