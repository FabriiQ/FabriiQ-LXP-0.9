// Import or define SystemStatus
export enum SystemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

/**
 * Program data interface
 */
export interface ProgramData {
  id: string;
  name: string;
  description?: string;
  code?: string;
  status: SystemStatus;
  institutionId?: string;
  institutionName?: string;
  campusId?: string;
  campusName?: string;
  courseCount?: number;
  studentCount?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  image?: string;
}

/**
 * Course in program interface
 */
export interface CourseInProgram {
  id: string;
  name: string;
  code?: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  classCount?: number;
  studentCount?: number;
  status: SystemStatus;
}

/**
 * Program action enum
 */
export enum ProgramAction {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
  ARCHIVE = 'ARCHIVE',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  ASSIGN_CAMPUS = 'ASSIGN_CAMPUS',
  ASSIGN_COURSE = 'ASSIGN_COURSE',
  EXPORT = 'EXPORT',
  PRINT = 'PRINT',
  MORE = 'MORE'
}

/**
 * Program tab enum
 */
export enum ProgramTab {
  OVERVIEW = 'OVERVIEW',
  COURSES = 'COURSES',
  STUDENTS = 'STUDENTS',
  ANALYTICS = 'ANALYTICS',
  HISTORY = 'HISTORY'
}

/**
 * Program filter interface
 */
export interface ProgramFilter {
  search?: string;
  institutionIds?: string[];
  campusIds?: string[];
  status?: SystemStatus[];
  sortBy?: ProgramSortField;
  sortOrder?: 'asc' | 'desc';
  startDateFrom?: Date | string;
  startDateTo?: Date | string;
  endDateFrom?: Date | string;
  endDateTo?: Date | string;
}

/**
 * Program sort field enum
 */
export enum ProgramSortField {
  NAME = 'name',
  CODE = 'code',
  INSTITUTION = 'institutionName',
  CAMPUS = 'campusName',
  STATUS = 'status',
  START_DATE = 'startDate',
  END_DATE = 'endDate',
  COURSE_COUNT = 'courseCount',
  STUDENT_COUNT = 'studentCount',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

/**
 * Program form data interface
 */
export interface ProgramFormData {
  id?: string;
  name: string;
  description?: string;
  code?: string;
  status: SystemStatus;
  institutionId?: string;
  campusId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  image?: string;
  courses?: string[]; // Course IDs
}

/**
 * Program analytics metric interface
 */
export interface ProgramAnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
  icon?: string;
  description?: string;
}

/**
 * User role enum
 */
export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  CAMPUS_ADMIN = 'CAMPUS_ADMIN',
  COORDINATOR = 'COORDINATOR',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

/**
 * Get enabled actions for a specific user role
 */
export function getEnabledActionsForRole(role: UserRole): ProgramAction[] {
  switch (role) {
    case UserRole.SYSTEM_ADMIN:
      return [
        ProgramAction.VIEW,
        ProgramAction.EDIT,
        ProgramAction.DELETE,
        ProgramAction.ARCHIVE,
        ProgramAction.ACTIVATE,
        ProgramAction.DEACTIVATE,
        ProgramAction.ASSIGN_CAMPUS,
        ProgramAction.ASSIGN_COURSE,
        ProgramAction.EXPORT,
        ProgramAction.PRINT,
        ProgramAction.MORE
      ];
    case UserRole.CAMPUS_ADMIN:
      return [
        ProgramAction.VIEW,
        ProgramAction.EDIT,
        ProgramAction.ARCHIVE,
        ProgramAction.ACTIVATE,
        ProgramAction.DEACTIVATE,
        ProgramAction.ASSIGN_COURSE,
        ProgramAction.EXPORT,
        ProgramAction.PRINT,
        ProgramAction.MORE
      ];
    case UserRole.COORDINATOR:
      return [
        ProgramAction.VIEW,
        ProgramAction.EXPORT,
        ProgramAction.PRINT,
        ProgramAction.MORE
      ];
    default:
      return [
        ProgramAction.VIEW
      ];
  }
}

/**
 * Get enabled tabs for a specific user role
 */
export function getEnabledTabsForRole(role: UserRole): ProgramTab[] {
  switch (role) {
    case UserRole.SYSTEM_ADMIN:
      return [
        ProgramTab.OVERVIEW,
        ProgramTab.COURSES,
        ProgramTab.STUDENTS,
        ProgramTab.ANALYTICS,
        ProgramTab.HISTORY
      ];
    case UserRole.CAMPUS_ADMIN:
      return [
        ProgramTab.OVERVIEW,
        ProgramTab.COURSES,
        ProgramTab.STUDENTS,
        ProgramTab.ANALYTICS
      ];
    case UserRole.COORDINATOR:
      return [
        ProgramTab.OVERVIEW,
        ProgramTab.COURSES,
        ProgramTab.STUDENTS,
        ProgramTab.ANALYTICS
      ];
    default:
      return [
        ProgramTab.OVERVIEW
      ];
  }
}
