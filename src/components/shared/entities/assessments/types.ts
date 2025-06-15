import { z } from 'zod';

/**
 * Assessment Status Enum
 * Represents the current status of an assessment
 */
export enum AssessmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  SCHEDULED = 'SCHEDULED',
}

/**
 * Assessment Type Enum
 * Represents the type of assessment
 */
export enum AssessmentType {
  QUIZ = 'QUIZ',
  EXAM = 'EXAM',
  SURVEY = 'SURVEY',
  ASSIGNMENT = 'ASSIGNMENT',
  PRACTICE = 'PRACTICE',
}

/**
 * Assessment Grading Type Enum
 * Represents how the assessment is graded
 */
export enum AssessmentGradingType {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
  MIXED = 'MIXED',
  NONE = 'NONE',
}

/**
 * Assessment Visibility Enum
 * Represents who can see the assessment
 */
export enum AssessmentVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  RESTRICTED = 'RESTRICTED',
}

/**
 * Assessment Schema
 * Defines the structure of an assessment
 */
export const assessmentSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.nativeEnum(AssessmentType),
  status: z.nativeEnum(AssessmentStatus).default(AssessmentStatus.DRAFT),
  gradingType: z.nativeEnum(AssessmentGradingType).default(AssessmentGradingType.AUTOMATIC),
  visibility: z.nativeEnum(AssessmentVisibility).default(AssessmentVisibility.PRIVATE),
  timeLimit: z.number().min(0).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  totalPoints: z.number().min(0),
  dueDate: z.date().optional(),
  availableFrom: z.date().optional(),
  availableTo: z.date().optional(),
  allowLateSubmissions: z.boolean().default(false),
  showCorrectAnswers: z.boolean().default(false),
  showCorrectAnswersAfterSubmission: z.boolean().default(false),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  maxAttempts: z.number().min(1).default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  courseId: z.string().optional(),
  classId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
});

export type Assessment = z.infer<typeof assessmentSchema>;

/**
 * Assessment Result Schema
 * Defines the structure of an assessment result
 */
export const assessmentResultSchema = z.object({
  id: z.string(),
  assessmentId: z.string(),
  userId: z.string(),
  score: z.number(),
  maxScore: z.number(),
  percentageScore: z.number(),
  passed: z.boolean(),
  startedAt: z.date(),
  submittedAt: z.date().optional(),
  timeSpent: z.number(), // in seconds
  attemptNumber: z.number().min(1),
  answers: z.record(z.any()),
  feedback: z.string().optional(),
  gradedBy: z.string().optional(),
  gradedAt: z.date().optional(),
});

export type AssessmentResult = z.infer<typeof assessmentResultSchema>;

/**
 * Assessment Filter Options
 * Used for filtering assessments in lists
 */
export interface AssessmentFilterOptions {
  status?: AssessmentStatus[];
  type?: AssessmentType[];
  gradingType?: AssessmentGradingType[];
  visibility?: AssessmentVisibility[];
  tags?: string[];
  createdBy?: string;
  courseId?: string;
  classId?: string;
  searchTerm?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * Assessment Sort Options
 * Used for sorting assessments in lists
 */
export enum AssessmentSortField {
  TITLE = 'title',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DUE_DATE = 'dueDate',
  TYPE = 'type',
  STATUS = 'status',
}

export interface AssessmentSortOptions {
  field: AssessmentSortField;
  direction: 'asc' | 'desc';
}
