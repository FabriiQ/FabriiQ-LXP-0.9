/**
 * Rubric Types
 * 
 * This file contains type definitions for rubric integration with Bloom's Taxonomy.
 */

import { BloomsTaxonomyLevel } from './bloom-taxonomy';

/**
 * Rubric types
 */
export enum RubricType {
  HOLISTIC = 'HOLISTIC',
  ANALYTIC = 'ANALYTIC',
}

/**
 * Performance level for a rubric
 */
export interface PerformanceLevel {
  id: string;
  name: string;
  description: string;
  scoreRange: {
    min: number;
    max: number;
  };
  color?: string;
}

/**
 * Rubric criteria with Bloom's Taxonomy alignment
 */
export interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  bloomsLevel: BloomsTaxonomyLevel;
  weight: number;
  learningOutcomeIds: string[];
  performanceLevels: RubricCriteriaLevel[];
}

/**
 * Performance level for a specific criteria
 */
export interface RubricCriteriaLevel {
  levelId: string;
  description: string;
  score: number;
}

/**
 * Complete rubric with Bloom's Taxonomy alignment
 */
export interface Rubric {
  id: string;
  title: string;
  description?: string;
  type: RubricType;
  maxScore: number;
  criteria: RubricCriteria[];
  performanceLevels: PerformanceLevel[];
  learningOutcomeIds: string[];
  bloomsDistribution?: Record<BloomsTaxonomyLevel, number>;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rubric template for reuse
 */
export interface RubricTemplate {
  id: string;
  title: string;
  description: string;
  type: RubricType;
  category: string;
  gradeLevel?: string;
  subject?: string;
  bloomsLevels: BloomsTaxonomyLevel[];
  criteria: Omit<RubricCriteria, 'id' | 'learningOutcomeIds'>[];
  performanceLevels: Omit<PerformanceLevel, 'id'>[];
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rubric assessment result for a student
 */
export interface RubricAssessmentResult {
  id: string;
  rubricId: string;
  studentId: string;
  assessmentId: string;
  submissionId: string;
  criteriaScores: {
    criteriaId: string;
    score: number;
    feedback?: string;
  }[];
  totalScore: number;
  percentage: number;
  feedback?: string;
  gradedById: string;
  gradedAt: Date;
}

/**
 * Rubric generation request
 */
export interface RubricGenerationRequest {
  title: string;
  type: RubricType;
  bloomsLevels: BloomsTaxonomyLevel[];
  learningOutcomeIds: string[];
  maxScore: number;
  criteriaCount?: number;
  performanceLevelCount?: number;
  subject?: string;
  topic?: string;
  gradeLevel?: string;
}

/**
 * Rubric feedback for improvement
 */
export interface RubricFeedback {
  rubricId: string;
  overallQuality: 'excellent' | 'good' | 'needs-improvement';
  criteriaFeedback: {
    criteriaId: string;
    quality: 'excellent' | 'good' | 'needs-improvement';
    suggestions: string[];
  }[];
  performanceLevelFeedback: {
    levelId: string;
    quality: 'excellent' | 'good' | 'needs-improvement';
    suggestions: string[];
  }[];
  bloomsAlignmentFeedback: {
    quality: 'excellent' | 'good' | 'needs-improvement';
    suggestions: string[];
  };
  generalSuggestions: string[];
}
