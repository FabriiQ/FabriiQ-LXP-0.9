import { SystemStatus } from '@/components/shared/entities/classes/types';

/**
 * Teacher data interface
 */
export interface TeacherData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: SystemStatus;
  campusId?: string;
  campusName?: string;
  subjectQualifications?: SubjectQualification[];
  classCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Subject qualification interface
 */
export interface SubjectQualification {
  id: string;
  subjectId: string;
  subjectName: string;
  level?: QualificationLevel;
  experience?: number; // in years
}

/**
 * Qualification level enum
 */
export enum QualificationLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

/**
 * Teacher action enum
 */
export enum TeacherAction {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
  ARCHIVE = 'ARCHIVE',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  ASSIGN_CAMPUS = 'ASSIGN_CAMPUS',
  ASSIGN_SUBJECT = 'ASSIGN_SUBJECT',
  ASSIGN_CLASS = 'ASSIGN_CLASS',
  PROVIDE_FEEDBACK = 'PROVIDE_FEEDBACK',
  EXPORT = 'EXPORT',
  PRINT = 'PRINT',
  MORE = 'MORE'
}

/**
 * Teacher tab enum
 */
export enum TeacherTab {
  OVERVIEW = 'OVERVIEW',
  CLASSES = 'CLASSES',
  SUBJECTS = 'SUBJECTS',
  PERFORMANCE = 'PERFORMANCE',
  FEEDBACK = 'FEEDBACK',
  HISTORY = 'HISTORY'
}

/**
 * Teacher filter interface
 */
export interface TeacherFilter {
  search?: string;
  campusIds?: string[];
  subjectIds?: string[];
  status?: SystemStatus[];
  sortBy?: TeacherSortField;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Teacher sort field enum
 */
export enum TeacherSortField {
  NAME = 'name',
  EMAIL = 'email',
  CAMPUS = 'campusName',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

/**
 * Teacher form data interface
 */
export interface TeacherFormData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: SystemStatus;
  campusId?: string;
  subjectQualifications?: SubjectQualification[];
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
export function getEnabledActionsForRole(role: UserRole): TeacherAction[] {
  switch (role) {
    case UserRole.SYSTEM_ADMIN:
      return [
        TeacherAction.VIEW,
        TeacherAction.EDIT,
        TeacherAction.DELETE,
        TeacherAction.ARCHIVE,
        TeacherAction.ACTIVATE,
        TeacherAction.DEACTIVATE,
        TeacherAction.ASSIGN_CAMPUS,
        TeacherAction.ASSIGN_SUBJECT,
        TeacherAction.EXPORT,
        TeacherAction.PRINT,
        TeacherAction.MORE
      ];
    case UserRole.CAMPUS_ADMIN:
      return [
        TeacherAction.VIEW,
        TeacherAction.EDIT,
        TeacherAction.ARCHIVE,
        TeacherAction.ACTIVATE,
        TeacherAction.DEACTIVATE,
        TeacherAction.ASSIGN_SUBJECT,
        TeacherAction.ASSIGN_CLASS,
        TeacherAction.EXPORT,
        TeacherAction.PRINT,
        TeacherAction.MORE
      ];
    case UserRole.COORDINATOR:
      return [
        TeacherAction.VIEW,
        TeacherAction.ASSIGN_CLASS,
        TeacherAction.PROVIDE_FEEDBACK,
        TeacherAction.EXPORT,
        TeacherAction.PRINT,
        TeacherAction.MORE
      ];
    case UserRole.TEACHER:
      return [
        TeacherAction.VIEW
      ];
    default:
      return [
        TeacherAction.VIEW
      ];
  }
}

/**
 * Get enabled tabs for a specific user role
 */
export function getEnabledTabsForRole(role: UserRole): TeacherTab[] {
  switch (role) {
    case UserRole.SYSTEM_ADMIN:
      return [
        TeacherTab.OVERVIEW,
        TeacherTab.CLASSES,
        TeacherTab.SUBJECTS,
        TeacherTab.HISTORY
      ];
    case UserRole.CAMPUS_ADMIN:
      return [
        TeacherTab.OVERVIEW,
        TeacherTab.CLASSES,
        TeacherTab.SUBJECTS,
        TeacherTab.PERFORMANCE,
        TeacherTab.FEEDBACK
      ];
    case UserRole.COORDINATOR:
      return [
        TeacherTab.OVERVIEW,
        TeacherTab.CLASSES,
        TeacherTab.SUBJECTS,
        TeacherTab.PERFORMANCE,
        TeacherTab.FEEDBACK
      ];
    case UserRole.TEACHER:
      return [
        TeacherTab.OVERVIEW,
        TeacherTab.CLASSES,
        TeacherTab.SUBJECTS
      ];
    default:
      return [
        TeacherTab.OVERVIEW
      ];
  }
}
