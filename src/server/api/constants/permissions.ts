import { UserType } from '@prisma/client';

// Teacher role permissions
export const TEACHER_ROLE_PERMISSIONS = {
  // Class Teacher specific permissions
  CLASS_TEACHER_ACCESS: 'teacher.class.all_access',
  CLASS_TEACHER_GRADE_OVERRIDE: 'teacher.grade.override',

  // Subject Teacher specific permissions
  SUBJECT_TEACHER_ACCESS: 'teacher.subject.access',
  SUBJECT_TEACHER_GRADE: 'teacher.grade.subject',
} as const;

export const ACADEMIC_CYCLE_PERMISSIONS = {
  // Institution Level
  MANAGE_ACADEMIC_CYCLES: 'academic_cycle.manage',
  VIEW_ALL_ACADEMIC_CYCLES: 'academic_cycle.view.all',

  // Campus Level
  MANAGE_CAMPUS_ACADEMIC_CYCLES: 'academic_cycle.campus.manage',
  VIEW_CAMPUS_ACADEMIC_CYCLES: 'academic_cycle.campus.view',

  // Class Level
  VIEW_CLASS_ACADEMIC_CYCLES: 'academic_cycle.class.view',
} as const;

// Role-based permission mappings
export const ROLE_PERMISSIONS = {
  // System Level
  SYSTEM_ADMIN: [
    ACADEMIC_CYCLE_PERMISSIONS.MANAGE_ACADEMIC_CYCLES,
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_ALL_ACADEMIC_CYCLES,
  ] as const,

  SYSTEM_MANAGER: [
    ACADEMIC_CYCLE_PERMISSIONS.MANAGE_ACADEMIC_CYCLES,
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_ALL_ACADEMIC_CYCLES,
  ] as const,

  // Institution Level
  ADMINISTRATOR: [
    ACADEMIC_CYCLE_PERMISSIONS.MANAGE_ACADEMIC_CYCLES,
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_ALL_ACADEMIC_CYCLES,
  ] as const,

  // Campus Level
  CAMPUS_ADMIN: [
    ACADEMIC_CYCLE_PERMISSIONS.MANAGE_CAMPUS_ACADEMIC_CYCLES,
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_CAMPUS_ACADEMIC_CYCLES,
  ] as const,

  CAMPUS_COORDINATOR: [
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_CAMPUS_ACADEMIC_CYCLES,
  ] as const,

  CAMPUS_PRINCIPAL: [
    ACADEMIC_CYCLE_PERMISSIONS.MANAGE_CAMPUS_ACADEMIC_CYCLES,
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_CAMPUS_ACADEMIC_CYCLES,
  ] as const,

  COORDINATOR: [
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_CAMPUS_ACADEMIC_CYCLES,
  ] as const,

  // Academic Roles
  TEACHER: [
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_CLASS_ACADEMIC_CYCLES,
  ] as const,

  CAMPUS_TEACHER: [
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_CLASS_ACADEMIC_CYCLES,
    TEACHER_ROLE_PERMISSIONS.CLASS_TEACHER_ACCESS,
    TEACHER_ROLE_PERMISSIONS.CLASS_TEACHER_GRADE_OVERRIDE,
    TEACHER_ROLE_PERMISSIONS.SUBJECT_TEACHER_ACCESS,
    TEACHER_ROLE_PERMISSIONS.SUBJECT_TEACHER_GRADE,
  ] as const,

  // Student Roles
  STUDENT: [
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_CLASS_ACADEMIC_CYCLES,
  ] as const,

  CAMPUS_STUDENT: [
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_CLASS_ACADEMIC_CYCLES,
  ] as const,

  // Other Roles
  CAMPUS_PARENT: [
    ACADEMIC_CYCLE_PERMISSIONS.VIEW_CLASS_ACADEMIC_CYCLES,
  ] as const,
} as const;