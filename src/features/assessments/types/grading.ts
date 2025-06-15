import { z } from 'zod';

/**
 * Grading Types
 * These types define the structure of assessment grading
 */

// Rubric criterion level schema
export const rubricCriterionLevelSchema = z.object({
  id: z.string().optional(),
  level: z.number(),
  description: z.string().min(1, 'Description is required'),
  points: z.number().min(0, 'Points must be at least 0'),
});

// Rubric criterion schema
export const rubricCriterionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  bloomsLevel: z.string().optional(),
  weight: z.number().min(0, 'Weight must be at least 0').max(100, 'Weight cannot exceed 100').default(1),
  levels: z.array(rubricCriterionLevelSchema).min(2, 'At least 2 levels are required'),
});

// Rubric schema
export const rubricSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  criteria: z.array(rubricCriterionSchema).min(1, 'At least 1 criterion is required'),
  maxScore: z.number().min(0, 'Max score must be at least 0'),
  passingScore: z.number().min(0, 'Passing score must be at least 0'),
  bloomsDistribution: z.record(z.string(), z.number()).optional(),
});

// Rubric creation schema
export const createRubricSchema = rubricSchema.omit({
  id: true,
});

// Rubric update schema
export const updateRubricSchema = rubricSchema.partial().extend({
  id: z.string(),
});

// Grading result for a criterion
export const criterionGradingSchema = z.object({
  criterionId: z.string(),
  levelId: z.string(),
  points: z.number().min(0),
  feedback: z.string().optional(),
});

// Rubric grading schema
export const rubricGradingSchema = z.object({
  rubricId: z.string(),
  criteria: z.array(criterionGradingSchema),
  totalScore: z.number().min(0),
  feedback: z.string().optional(),
});

// Question grading schema
export const questionGradingSchema = z.object({
  questionId: z.string(),
  points: z.number().min(0),
  maxPoints: z.number().min(0),
  feedback: z.string().optional(),
  rubricGrading: rubricGradingSchema.optional(),
});

// Assessment grading schema
export const assessmentGradingSchema = z.object({
  assessmentId: z.string(),
  studentId: z.string(),
  questions: z.array(questionGradingSchema),
  totalScore: z.number().min(0),
  maxScore: z.number().min(0),
  feedback: z.string().optional(),
  bloomsLevelScores: z.record(z.string(), z.number()).optional(),
});

// Types derived from schemas
export type RubricCriterionLevel = z.infer<typeof rubricCriterionLevelSchema>;
export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;
export type Rubric = z.infer<typeof rubricSchema>;
export type CreateRubricInput = z.infer<typeof createRubricSchema>;
export type UpdateRubricInput = z.infer<typeof updateRubricSchema>;
export type CriterionGrading = z.infer<typeof criterionGradingSchema>;
export type RubricGrading = z.infer<typeof rubricGradingSchema>;
export type QuestionGrading = z.infer<typeof questionGradingSchema>;
export type AssessmentGrading = z.infer<typeof assessmentGradingSchema>;

// Grading result interface for individual questions
export interface GradingResult {
  score: number;
  maxScore: number;
  percentageScore: number;
  isCorrect: boolean;
  feedback?: string;
  requiresManualGrading?: boolean;
  bloomsLevel?: string;
}

// Grading result interface for entire assessments
export interface AssessmentGradingResult {
  questionResults: Record<string, GradingResult>;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  requiresManualGrading: boolean;
  bloomsLevelScores?: Record<string, number>;
}

// Question grading result interface (legacy)
export interface QuestionGradingResult {
  questionId: string;
  score: number;
  maxScore: number;
  percentage: number;
  feedback?: string;
  bloomsLevel?: string;
}
