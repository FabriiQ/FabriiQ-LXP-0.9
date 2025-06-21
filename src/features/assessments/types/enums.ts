/**
 * Enums for assessment system
 * These would normally be defined in Prisma schema, but we're defining them here for now
 */

// Assessment category enum
export enum AssessmentCategory {
  QUIZ = 'QUIZ',
  TEST = 'TEST',
  EXAM = 'EXAM',
  ASSIGNMENT = 'ASSIGNMENT',
  PROJECT = 'PROJECT',
  PRESENTATION = 'PRESENTATION',
  PARTICIPATION = 'PARTICIPATION',
  ESSAY = 'ESSAY',
  OTHER = 'OTHER',
}

// Grading type enum
export enum GradingType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  HYBRID = 'HYBRID',
}

// System status enum
export enum SystemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

// Submission status enum
export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  LATE = 'LATE',
  GRADED = 'GRADED',
  RETURNED = 'RETURNED',
  RESUBMITTED = 'RESUBMITTED',
  UNATTEMPTED = 'UNATTEMPTED',
  COMPLETED = 'COMPLETED',
}
