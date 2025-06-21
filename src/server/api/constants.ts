/**
 * System Constants and Enums
 * Centralized location for all system constants and enums
 */

import { Prisma } from '@prisma/client';

export enum UserType {
  // Core System Roles
  SYSTEM_ADMIN = "SYSTEM_ADMIN", // Central system administrator
  SYSTEM_MANAGER = "SYSTEM_MANAGER", // Central operations manager

  // Campus Roles
  CAMPUS_ADMIN = "CAMPUS_ADMIN", // Campus administrator
  CAMPUS_COORDINATOR = "CAMPUS_COORDINATOR", // Campus academic coordinator
  CAMPUS_TEACHER = "CAMPUS_TEACHER", // Campus teaching staff
  CAMPUS_STUDENT = "CAMPUS_STUDENT", // Campus student
  CAMPUS_PARENT = "CAMPUS_PARENT", // Campus parent/guardian
}

export enum SystemStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
  DELETED = "DELETED",
  ARCHIVED_CURRENT_YEAR = "ARCHIVED_CURRENT_YEAR",
  ARCHIVED_PREVIOUS_YEAR = "ARCHIVED_PREVIOUS_YEAR",
  ARCHIVED_HISTORICAL = "ARCHIVED_HISTORICAL",
}

export enum AccessScope {
  SYSTEM = "SYSTEM", // Full system access
  MULTI_CAMPUS = "MULTI_CAMPUS", // Access to multiple campuses
  SINGLE_CAMPUS = "SINGLE_CAMPUS", // Limited to single campus
}

export enum EntityType {
  PROGRAM = "PROGRAM", // Academic programs
  COURSE = "COURSE", // Academic courses
  SUBJECT = "SUBJECT", // Course subjects
  CLASS = "CLASS", // Classes
  ASSESSMENT = "ASSESSMENT", // Assessments
  ACTIVITY = "ACTIVITY", // Learning activities
  FACILITY = "FACILITY", // Physical facilities
}

export enum AnalyticsEventType {
  LOGIN = "LOGIN",
  ASSESSMENT_SUBMISSION = "ASSESSMENT_SUBMISSION",
  ATTENDANCE_MARKED = "ATTENDANCE_MARKED",
  GRADE_UPDATED = "GRADE_UPDATED",
  FEEDBACK_ADDED = "FEEDBACK_ADDED",
  RESOURCE_ACCESS = "RESOURCE_ACCESS",
  SYSTEM_ERROR = "SYSTEM_ERROR",
  PERFORMANCE_METRIC = "PERFORMANCE_METRIC",
  CLASS_CREATED = "CLASS_CREATED",
  CLASS_UPDATED = "CLASS_UPDATED",
  ENROLLMENT_CHANGED = "ENROLLMENT_CHANGED",
  TEACHER_ASSIGNED = "TEACHER_ASSIGNED",
  SCHEDULE_UPDATED = "SCHEDULE_UPDATED",
  COURSE_CREATED = "COURSE_CREATED",
  COURSE_UPDATED = "COURSE_UPDATED",
  COURSE_ARCHIVED = "COURSE_ARCHIVED",
  COURSE_ENROLLMENT_CHANGED = "COURSE_ENROLLMENT_CHANGED",
}

export enum FeedbackType {
  ACADEMIC_PERFORMANCE = "ACADEMIC_PERFORMANCE",
  BEHAVIORAL = "BEHAVIORAL",
  ATTENDANCE = "ATTENDANCE",
  PARTICIPATION = "PARTICIPATION",
  IMPROVEMENT_AREA = "IMPROVEMENT_AREA",
  ACHIEVEMENT = "ACHIEVEMENT",
  DISCIPLINARY = "DISCIPLINARY",
}

export enum FeedbackStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  IN_REVIEW = "IN_REVIEW",
  RESOLVED = "RESOLVED",
  ARCHIVED = "ARCHIVED",
}

export enum FeedbackSeverity {
  POSITIVE = "POSITIVE",
  NEUTRAL = "NEUTRAL",
  CONCERN = "CONCERN",
  CRITICAL = "CRITICAL",
}

export enum SubmissionStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  GRADED = "GRADED",
  RETURNED = "RETURNED",
  RESUBMITTED = "RESUBMITTED",
  LATE = "LATE",
  REJECTED = "REJECTED",
  UNATTEMPTED = "UNATTEMPTED",  // New status for activities not yet attempted
  COMPLETED = "COMPLETED"       // New status for completed non-gradable activities
}

export enum GradingType {
  AUTOMATIC = "AUTOMATIC", // System-graded
  MANUAL = "MANUAL", // Teacher-graded
  HYBRID = "HYBRID", // Combination of both
}

export enum GradingScale {
  PERCENTAGE = "PERCENTAGE", // 0-100%
  LETTER_GRADE = "LETTER_GRADE", // A, B, C, etc.
  GPA = "GPA", // 0.0-4.0
  CUSTOM = "CUSTOM", // Custom scoring
}

export enum LearningActivityType {
  // Learning content types
  READING = "READING",
  VIDEO = "VIDEO",
  H5P = "H5P",
  FLASH_CARDS = "FLASH_CARDS",
  BOOK = "BOOK",

  // Assessment types
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  MULTIPLE_RESPONSE = "MULTIPLE_RESPONSE",
  TRUE_FALSE = "TRUE_FALSE",
  FILL_IN_THE_BLANKS = "FILL_IN_THE_BLANKS",
  MATCHING = "MATCHING",
  SEQUENCE = "SEQUENCE",
  DRAG_AND_DROP = "DRAG_AND_DROP",
  DRAG_THE_WORDS = "DRAG_THE_WORDS",
  NUMERIC = "NUMERIC",
  QUIZ = "QUIZ",

  // Legacy types (for backward compatibility)
  OTHER = "OTHER"
}

export enum AssessmentType {
  EXAM = "EXAM",
  QUIZ = "QUIZ",
  ASSIGNMENT = "ASSIGNMENT",
  PROJECT = "PROJECT",
  PRACTICAL_TEST = "PRACTICAL_TEST",
  PRESENTATION = "PRESENTATION",
  PORTFOLIO = "PORTFOLIO",
  PARTICIPATION = "PARTICIPATION",
  HOMEWORK = "HOMEWORK",
  PRACTICE = "PRACTICE",
  ESSAY = "ESSAY"
}

export enum ActivityPurpose {
  // Core purposes
  LEARNING = "LEARNING",     // Regular learning activities
  ASSESSMENT = "ASSESSMENT", // Graded assessments
  PRACTICE = "PRACTICE",     // Non-graded practice/preparation

  // Delivery formats (moved from LearningActivityType)
  LECTURE = "LECTURE",
  TUTORIAL = "TUTORIAL",
  WORKSHOP = "WORKSHOP",
  DISCUSSION = "DISCUSSION",
  DEMONSTRATION = "DEMONSTRATION",
  GROUP_WORK = "GROUP_WORK",
  SELF_STUDY = "SELF_STUDY",
  OTHER = "OTHER"
}

/**
 * @deprecated Use ActivityPurpose for delivery formats (LECTURE, TUTORIAL, etc.)
 * and LearningActivityType for specific activity types (MULTIPLE_CHOICE, READING, etc.)
 */
export enum ActivityType {
  LECTURE = "LECTURE",
  TUTORIAL = "TUTORIAL",
  PRACTICAL = "PRACTICAL",
  WORKSHOP = "WORKSHOP",
  ASSIGNMENT = "ASSIGNMENT",
  PROJECT = "PROJECT",
  QUIZ = "QUIZ",
  DISCUSSION = "DISCUSSION",
  PRESENTATION = "PRESENTATION",
  OTHER = "OTHER",
}

export enum AssessmentCategory {
  EXAM = "EXAM",
  QUIZ = "QUIZ",
  ASSIGNMENT = "ASSIGNMENT",
  PROJECT = "PROJECT",
  PRACTICAL = "PRACTICAL",
  CLASS_ACTIVITY = "CLASS_ACTIVITY",
  ESSAY = "ESSAY"
}

export enum TermType {
  SEMESTER = "SEMESTER",
  TRIMESTER = "TRIMESTER",
  QUARTER = "QUARTER",
  THEME_BASED = "THEME_BASED",
  CUSTOM = "CUSTOM"
}

export enum TermPeriod {
  FALL = "FALL",
  SPRING = "SPRING",
  SUMMER = "SUMMER",
  WINTER = "WINTER",
  FIRST_QUARTER = "FIRST_QUARTER",
  SECOND_QUARTER = "SECOND_QUARTER",
  THIRD_QUARTER = "THIRD_QUARTER",
  FOURTH_QUARTER = "FOURTH_QUARTER",
  FIRST_TRIMESTER = "FIRST_TRIMESTER",
  SECOND_TRIMESTER = "SECOND_TRIMESTER",
  THIRD_TRIMESTER = "THIRD_TRIMESTER",
  THEME_UNIT = "THEME_UNIT"
}

export enum DayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

export enum PeriodType {
  LECTURE = "LECTURE",
  LAB = "LAB",
  TUTORIAL = "TUTORIAL",
  WORKSHOP = "WORKSHOP",
  EXAM = "EXAM",
  BREAK = "BREAK",
}

export enum FacilityType {
  CLASSROOM = "CLASSROOM",
  LABORATORY = "LABORATORY",
  WORKSHOP = "WORKSHOP",
  LIBRARY = "LIBRARY",
  AUDITORIUM = "AUDITORIUM",
  OTHER = "OTHER",
}

export enum AttendanceStatusType {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  EXCUSED = "EXCUSED",
  LEAVE = "LEAVE"
}

export enum CourseCompletionStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum SubjectNodeType {
  CHAPTER = "CHAPTER",
  TOPIC = "TOPIC",
  SUBTOPIC = "SUBTOPIC"
}

export enum CompetencyLevel {
  BASIC = "BASIC",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT"
}

/**
 * System Configuration Constants
 */
export const SYSTEM_CONFIG = {
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Cache TTL (in seconds)
  CACHE_TTL: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },

  // Upload limits
  UPLOAD_LIMITS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },

  // Security settings
  SECURITY: {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_HASH_ROUNDS: 12,
    SESSION_TIMEOUT: 3600, // 1 hour
    SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds (to match cookie expiration)
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 900, // 15 minutes
  },

  // Analytics settings
  ANALYTICS: {
    METRICS_INTERVAL: 300, // 5 minutes
    RETENTION_PERIOD: 90, // 90 days
  },
};

/**
 * User Preferences Types and Defaults
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    digest: 'none' | 'daily' | 'weekly';
  };
  display: {
    density: 'compact' | 'comfortable' | 'spacious';
    fontSize: 'small' | 'medium' | 'large';
    colorScheme: 'default' | 'high-contrast' | 'pastel';
  };
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
  };
}

/**
 * Default user preferences based on user role
 */
export const DEFAULT_USER_PREFERENCES: Record<UserType, UserPreferences> = {
  [UserType.SYSTEM_ADMIN]: {
    theme: 'system',
    notifications: { email: true, push: true, inApp: true, digest: 'daily' },
    display: { density: 'compact', fontSize: 'medium', colorScheme: 'default' },
    accessibility: { reduceMotion: false, highContrast: false, screenReader: false, keyboardNavigation: false }
  },
  [UserType.SYSTEM_MANAGER]: {
    theme: 'system',
    notifications: { email: true, push: true, inApp: true, digest: 'daily' },
    display: { density: 'compact', fontSize: 'medium', colorScheme: 'default' },
    accessibility: { reduceMotion: false, highContrast: false, screenReader: false, keyboardNavigation: false }
  },
  [UserType.CAMPUS_ADMIN]: {
    theme: 'system',
    notifications: { email: true, push: true, inApp: true, digest: 'daily' },
    display: { density: 'comfortable', fontSize: 'medium', colorScheme: 'default' },
    accessibility: { reduceMotion: false, highContrast: false, screenReader: false, keyboardNavigation: false }
  },
  [UserType.CAMPUS_COORDINATOR]: {
    theme: 'system',
    notifications: { email: true, push: true, inApp: true, digest: 'daily' },
    display: { density: 'comfortable', fontSize: 'medium', colorScheme: 'default' },
    accessibility: { reduceMotion: false, highContrast: false, screenReader: false, keyboardNavigation: false }
  },
  [UserType.CAMPUS_TEACHER]: {
    theme: 'system',
    notifications: { email: true, push: true, inApp: true, digest: 'daily' },
    display: { density: 'comfortable', fontSize: 'medium', colorScheme: 'default' },
    accessibility: { reduceMotion: false, highContrast: false, screenReader: false, keyboardNavigation: false }
  },
  [UserType.CAMPUS_STUDENT]: {
    theme: 'system',
    notifications: { email: true, push: true, inApp: true, digest: 'daily' },
    display: { density: 'spacious', fontSize: 'medium', colorScheme: 'default' },
    accessibility: { reduceMotion: false, highContrast: false, screenReader: false, keyboardNavigation: false }
  },
  [UserType.CAMPUS_PARENT]: {
    theme: 'system',
    notifications: { email: true, push: true, inApp: true, digest: 'weekly' },
    display: { density: 'spacious', fontSize: 'large', colorScheme: 'default' },
    accessibility: { reduceMotion: false, highContrast: false, screenReader: false, keyboardNavigation: false }
  }
};