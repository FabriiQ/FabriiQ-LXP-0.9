// Re-export SystemStatus enum for components that need it
export enum SystemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
  ARCHIVED_CURRENT_YEAR = 'ARCHIVED_CURRENT_YEAR',
  ARCHIVED_PREVIOUS_YEAR = 'ARCHIVED_PREVIOUS_YEAR',
  ARCHIVED_HISTORICAL = 'ARCHIVED_HISTORICAL',
  UPCOMING = 'UPCOMING',
  COMPLETED = 'COMPLETED'
}

/**
 * Enum for user roles in the system
 */
export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  CAMPUS_ADMIN = 'CAMPUS_ADMIN',
  COORDINATOR = 'COORDINATOR',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

/**
 * Interface for class data used in shared components
 */
export interface ClassData {
  id: string;
  code: string;
  name: string;
  minCapacity: number;
  maxCapacity: number;
  currentCount: number;
  status: SystemStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // Related data
  courseCampusId: string;
  termId: string;
  classTeacherId?: string | null;
  facilityId?: string | null;
  programCampusId?: string | null;
  campusId: string;

  // Nested objects (optional for flexibility)
  courseCampus?: {
    id: string;
    course?: {
      id: string;
      name: string;
      code: string;
      description?: string | null;
    };
  };
  term?: {
    id: string;
    name: string;
    code: string;
    startDate: Date;
    endDate: Date;
  };
  classTeacher?: {
    id: string;
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
    };
  };
  facility?: {
    id: string;
    name: string;
    code: string;
  };
  programCampus?: {
    id: string;
    program?: {
      id: string;
      name: string;
      code: string;
    };
  };
  campus?: {
    id: string;
    name: string;
    code: string;
  };

  // Counts
  _count?: {
    students?: number;
    activities?: number;
    assessments?: number;
    attendance?: number;
  };
}

/**
 * Interface for class card view modes
 */
export type ClassCardViewMode = 'full' | 'compact' | 'mobile';

/**
 * Interface for class list view modes
 */
export type ClassListViewMode = 'grid' | 'table' | 'mobile';

/**
 * Interface for class actions
 */
export enum ClassAction {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  ARCHIVE = 'archive',
  DUPLICATE = 'duplicate',
  EXPORT = 'export',
  PRINT = 'print',
  TAKE_ATTENDANCE = 'take-attendance',
  GRADE_ASSESSMENTS = 'grade-assessments',
  MESSAGE_STUDENTS = 'message-students',
  ASSIGN_TEACHER = 'assign-teacher',
  ENROLL_STUDENTS = 'enroll-students',
}

/**
 * Interface for class action placement
 */
export type ClassActionPlacement = 'header' | 'card' | 'detail' | 'list';

/**
 * Interface for student data in class
 */
export interface ClassStudentData {
  id: string;
  userId: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  enrollmentDate: Date;
  status: SystemStatus;
  attendance?: {
    present: number;
    absent: number;
    excused: number;
    total: number;
    percentage: number;
  };
  grades?: {
    average: number;
    assessmentsCompleted: number;
    assessmentsTotal: number;
  };
}
