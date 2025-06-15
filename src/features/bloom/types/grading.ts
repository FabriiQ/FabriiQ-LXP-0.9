/**
 * Bloom's Taxonomy Grading Types
 * 
 * This file contains type definitions for the centralized grading system
 * that integrates with Bloom's Taxonomy.
 */

import { z } from 'zod';
import { BloomsTaxonomyLevel } from './bloom-taxonomy';
import { RubricCriteria, PerformanceLevel, RubricType } from './rubric';

/**
 * Content types that can be graded
 */
export enum GradableContentType {
  ASSESSMENT = 'assessment',
  ACTIVITY = 'activity',
  QUESTION = 'question',
  ESSAY = 'essay',
  PROJECT = 'project',
  PRESENTATION = 'presentation',
}

/**
 * Grading methods
 */
export enum GradingMethod {
  MANUAL = 'manual',
  RUBRIC = 'rubric',
  AUTOMATIC = 'automatic',
  PEER = 'peer',
  SELF = 'self',
  HYBRID = 'hybrid',
}

/**
 * Submission status
 */
export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  RETURNED = 'returned',
  RESUBMITTED = 'resubmitted',
  LATE = 'late',
}

/**
 * Base grading result interface
 */
export interface GradingResult {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  feedback?: string;
  gradedAt: Date;
  gradedById?: string;
  bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  questionResults?: QuestionGradingResult[];
  criteriaResults?: CriteriaGradingResult[];
}

/**
 * Question grading result
 */
export interface QuestionGradingResult {
  questionId: string;
  bloomsLevel?: BloomsTaxonomyLevel;
  score: number;
  maxScore: number;
  percentage: number;
  isCorrect: boolean;
  feedback?: string;
}

/**
 * Criteria grading result for rubric-based grading
 */
export interface CriteriaGradingResult {
  criterionId: string;
  criterionName: string;
  bloomsLevel: BloomsTaxonomyLevel;
  selectedLevelId: string;
  selectedLevelName: string;
  score: number;
  maxScore: number;
  feedback?: string;
}

/**
 * Submission interface
 */
export interface Submission {
  id: string;
  studentId: string;
  contentId: string;
  contentType: GradableContentType;
  status: SubmissionStatus;
  content: any;
  submittedAt: Date;
  gradingResult?: GradingResult;
}

/**
 * Grading context with all necessary information for grading
 */
export interface GradingContext {
  submission: Submission;
  rubric?: {
    id: string;
    type: RubricType;
    criteria: RubricCriteria[];
    performanceLevels: PerformanceLevel[];
    maxScore: number;
  };
  bloomsLevels?: BloomsTaxonomyLevel[];
  previousSubmissions?: Submission[];
  learningOutcomes?: {
    id: string;
    statement: string;
    bloomsLevel: BloomsTaxonomyLevel;
  }[];
}

/**
 * Grading form values
 */
export interface GradingFormValues {
  score?: number;
  feedback?: string;
  bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  criteriaGrades?: {
    criterionId: string;
    levelId: string;
    score: number;
    feedback?: string;
  }[];
  questionGrades?: {
    questionId: string;
    score: number;
    feedback?: string;
  }[];
}

/**
 * Grading form schema for validation
 */
export const gradingFormSchema = z.object({
  score: z.number().min(0).optional(),
  feedback: z.string().optional(),
  bloomsLevelScores: z.record(z.string(), z.number()).optional(),
  criteriaGrades: z.array(
    z.object({
      criterionId: z.string(),
      levelId: z.string(),
      score: z.number().min(0),
      feedback: z.string().optional(),
    })
  ).optional(),
  questionGrades: z.array(
    z.object({
      questionId: z.string(),
      score: z.number().min(0),
      feedback: z.string().optional(),
    })
  ).optional(),
});

/**
 * Feedback suggestion for a specific Bloom's level
 */
export interface BloomsFeedbackSuggestion {
  bloomsLevel: BloomsTaxonomyLevel;
  suggestion: string;
  improvementTips: string[];
  resources?: string[];
}

/**
 * Batch grading entry
 */
export interface BatchGradingEntry {
  submissionId: string;
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  feedback?: string;
  status: SubmissionStatus;
  bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
}

/**
 * Cognitive grading analysis
 */
export interface CognitiveGradingAnalysis {
  bloomsDistribution: Record<BloomsTaxonomyLevel, number>;
  strengths: BloomsTaxonomyLevel[];
  weaknesses: BloomsTaxonomyLevel[];
  recommendations: string[];
  nextLevelSuggestions: string[];
}
