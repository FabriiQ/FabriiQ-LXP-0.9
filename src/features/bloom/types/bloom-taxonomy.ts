/**
 * Bloom's Taxonomy Types
 *
 * This file contains type definitions for Bloom's Taxonomy integration.
 */

/**
 * Bloom's Taxonomy cognitive levels
 */
export enum BloomsTaxonomyLevel {
  REMEMBER = 'REMEMBER',
  UNDERSTAND = 'UNDERSTAND',
  APPLY = 'APPLY',
  ANALYZE = 'ANALYZE',
  EVALUATE = 'EVALUATE',
  CREATE = 'CREATE',
}

/**
 * Bloom's Taxonomy level metadata
 */
export interface BloomsTaxonomyLevelMetadata {
  level: BloomsTaxonomyLevel;
  name: string;
  description: string;
  color: string;
  icon?: string;
  order: number;
}

/**
 * Action verb for a specific Bloom's level
 */
export interface ActionVerb {
  verb: string;
  level: BloomsTaxonomyLevel;
  examples?: string[];
}

/**
 * Learning outcome frameworks
 */
export enum LearningOutcomeFramework {
  ABCD = 'ABCD',
  SMART = 'SMART',
  SIMPLE = 'SIMPLE',
}

/**
 * Learning outcome framework metadata
 */
export interface LearningOutcomeFrameworkMetadata {
  framework: LearningOutcomeFramework;
  name: string;
  description: string;
  structure: string;
  example?: string;
}

/**
 * Learning outcome with Bloom's Taxonomy alignment
 */
export interface LearningOutcome {
  id: string;
  statement: string;
  description?: string;
  bloomsLevel: BloomsTaxonomyLevel;
  actionVerbs: string[];
  subjectId: string;
  topicId?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  hasCriteria?: boolean;
  criteria?: import('./learning-outcome-criteria').LearningOutcomeCriterion[];
  performanceLevels?: import('./learning-outcome-criteria').LearningOutcomePerformanceLevel[];
}

/**
 * Bloom's Taxonomy distribution across cognitive levels
 */
export interface BloomsDistribution {
  [BloomsTaxonomyLevel.REMEMBER]?: number;
  [BloomsTaxonomyLevel.UNDERSTAND]?: number;
  [BloomsTaxonomyLevel.APPLY]?: number;
  [BloomsTaxonomyLevel.ANALYZE]?: number;
  [BloomsTaxonomyLevel.EVALUATE]?: number;
  [BloomsTaxonomyLevel.CREATE]?: number;
}

/**
 * Question with Bloom's Taxonomy classification
 */
export interface BloomsAlignedQuestion {
  id: string;
  text: string;
  bloomsLevel: BloomsTaxonomyLevel;
  learningOutcomeIds: string[];
  difficultyLevel: 'easy' | 'medium' | 'hard';
  type: string;
  options?: any[];
  correctAnswer?: any;
  points: number;
}

/**
 * Activity with Bloom's Taxonomy alignment
 */
export interface BloomsAlignedActivity {
  id: string;
  title: string;
  description: string;
  bloomsLevel: BloomsTaxonomyLevel;
  learningOutcomeIds: string[];
  duration: number;
  type: string;
  instructions: string;
  resources?: any[];
}

/**
 * Bloom's Taxonomy classification result
 */
export interface BloomsClassificationResult {
  content: string;
  bloomsLevel: BloomsTaxonomyLevel;
  confidence: number;
  suggestedVerbs: string[];
  suggestedImprovements?: string[];
}

/**
 * Bloom's Taxonomy analysis for curriculum
 */
export interface BloomsCurriculumAnalysis {
  subjectId: string;
  subjectName: string;
  distribution: BloomsDistribution;
  balance: 'good' | 'needs-improvement' | 'unbalanced';
  recommendations: string[];
  topicAnalysis?: {
    topicId: string;
    topicName: string;
    distribution: BloomsDistribution;
    balance: 'good' | 'needs-improvement' | 'unbalanced';
  }[];
}

/**
 * Bloom's Taxonomy analysis for assessments
 */
export interface BloomsAssessmentAnalysis {
  assessmentId: string;
  assessmentTitle: string;
  distribution: BloomsDistribution;
  balance: 'good' | 'needs-improvement' | 'unbalanced';
  recommendations: string[];
  questionAnalysis: {
    questionId: string;
    bloomsLevel: BloomsTaxonomyLevel;
    learningOutcomeAlignment: 'aligned' | 'partially-aligned' | 'not-aligned';
  }[];
}
