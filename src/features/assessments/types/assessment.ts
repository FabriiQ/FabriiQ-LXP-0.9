import { z } from 'zod';
import { AssessmentCategory, GradingType, SystemStatus } from './enums';

/**
 * Assessment Types
 * These types define the structure of assessments in the system
 */

// Base assessment schema
export const assessmentSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  subjectId: z.string().min(1, 'Subject is required'),
  classId: z.string().min(1, 'Class is required'),
  topicId: z.string().optional(),
  category: z.nativeEnum(AssessmentCategory).default(AssessmentCategory.QUIZ),
  instructions: z.string().optional(),
  maxScore: z.number().min(1, 'Maximum score must be at least 1').default(100),
  passingScore: z.number().min(0, 'Passing score must be at least 0').default(50),
  weightage: z.number().min(0, 'Weightage must be at least 0').max(100, 'Weightage cannot exceed 100').default(0),
  dueDate: z.date().optional(),
  gradingType: z.nativeEnum(GradingType).default(GradingType.MANUAL),
  status: z.nativeEnum(SystemStatus).default(SystemStatus.DRAFT),

  // Bloom's Taxonomy integration
  bloomsDistribution: z.record(z.string(), z.number()).optional(),
  rubricId: z.string().optional(),

  // Questions/content
  questions: z.array(z.any()).optional(), // Will be refined with question schema

  // Print settings
  printSettings: z.object({
    paperSize: z.enum(['A4', 'LETTER', 'LEGAL']).default('A4'),
    orientation: z.enum(['PORTRAIT', 'LANDSCAPE']).default('PORTRAIT'),
    showAnswers: z.boolean().default(false),
    includeHeader: z.boolean().default(true),
    includeFooter: z.boolean().default(true),
    fontSize: z.number().min(8).max(16).default(12),
  }).optional(),
});

// Assessment creation schema
export const createAssessmentSchema = assessmentSchema.omit({
  id: true,
  status: true,
});

// Assessment update schema
export const updateAssessmentSchema = assessmentSchema.partial().extend({
  id: z.string(),
});

// Assessment with relations
export const assessmentWithRelationsSchema = assessmentSchema.extend({
  subject: z.object({
    id: z.string(),
    name: z.string(),
  }),
  class: z.object({
    id: z.string(),
    name: z.string(),
  }),
  topic: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  createdBy: z.object({
    id: z.string(),
    name: z.string(),
  }),
  updatedBy: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Types derived from schemas
export type Assessment = z.infer<typeof assessmentSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
export type AssessmentWithRelations = z.infer<typeof assessmentWithRelationsSchema>;

// Assessment print format
export interface AssessmentPrintFormat {
  title: string;
  instructions?: string;
  sections: AssessmentSection[];
  metadata?: {
    subject?: string;
    class?: string;
    topic?: string;
    maxScore?: number;
    duration?: number;
    dueDate?: Date;
    teacher?: string;
  };
}

// Assessment section
export interface AssessmentSection {
  id: string;
  title: string;
  instructions?: string;
  questions: any[]; // Will be refined with question types
  bloomsLevel?: string;
  maxScore?: number;
}

// Assessment filters
export interface AssessmentFilters {
  search?: string;
  subjectId?: string;
  classId?: string;
  topicId?: string;
  category?: AssessmentCategory;
  status?: SystemStatus;
  createdById?: string;
  fromDate?: Date;
  toDate?: Date;
}
