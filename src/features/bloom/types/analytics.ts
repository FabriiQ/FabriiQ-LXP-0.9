/**
 * Bloom's Taxonomy Analytics Types
 *
 * This file contains type definitions for Bloom's Taxonomy analytics.
 */

import { BloomsTaxonomyLevel, BloomsDistribution } from './bloom-taxonomy';

/**
 * Student performance data by Bloom's level
 */
export interface StudentBloomsPerformance {
  studentId: string;
  studentName: string;
  [BloomsTaxonomyLevel.REMEMBER]: number;
  [BloomsTaxonomyLevel.UNDERSTAND]: number;
  [BloomsTaxonomyLevel.APPLY]: number;
  [BloomsTaxonomyLevel.ANALYZE]: number;
  [BloomsTaxonomyLevel.EVALUATE]: number;
  [BloomsTaxonomyLevel.CREATE]: number;
  overallMastery: number;
}

/**
 * Class performance data by Bloom's level
 */
export interface ClassBloomsPerformance {
  classId: string;
  className: string;
  studentCount: number;
  averageMastery: number;
  distribution: BloomsDistribution;
  studentPerformance: StudentBloomsPerformance[];
  topicPerformance: TopicBloomsPerformance[];
  cognitiveGaps: CognitiveGap[];
  interventionSuggestions: InterventionSuggestion[];
}

/**
 * Topic performance data by Bloom's level
 */
export interface TopicBloomsPerformance {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  averageMastery: number;
  distribution: BloomsDistribution;
  masteryByLevel: Record<BloomsTaxonomyLevel, number>;
  studentCount: number;
  masteredCount: number;
  partiallyMasteredCount: number;
  notMasteredCount: number;
}

/**
 * Assessment performance data by Bloom's level
 */
export interface AssessmentBloomsPerformance {
  assessmentId: string;
  assessmentName: string;
  averageScore: number;
  distribution: BloomsDistribution;
  performanceByLevel: Record<BloomsTaxonomyLevel, number>;
  studentCount: number;
  questionCount: number;
  questionPerformance: QuestionBloomsPerformance[];
}

/**
 * Question performance data by Bloom's level
 */
export interface QuestionBloomsPerformance {
  questionId: string;
  questionText: string;
  bloomsLevel: BloomsTaxonomyLevel;
  correctRate: number;
  averageAttempts: number;
  averageTime: number;
}

/**
 * Cognitive gap in student learning
 */
export interface CognitiveGap {
  bloomsLevel: BloomsTaxonomyLevel;
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  gapSize: number; // 0-100
  affectedStudentCount: number;
  affectedStudentIds: string[];
  description: string;
}

/**
 * Intervention suggestion for addressing cognitive gaps
 */
export interface InterventionSuggestion {
  id: string;
  bloomsLevel: BloomsTaxonomyLevel;
  topicId: string;
  topicName: string;
  targetStudentIds: string[];
  targetStudentCount: number;
  description: string;
  activitySuggestions: string[];
  resourceSuggestions: string[];
}

/**
 * Comparative analysis between assessments
 */
export interface AssessmentComparison {
  assessmentIds: string[];
  assessmentNames: string[];
  bloomsLevelComparison: Record<BloomsTaxonomyLevel, number[]>;
  overallScoreComparison: number[];
  studentProgressionMap: Record<string, number[]>; // studentId -> scores
  topicProgressionMap: Record<string, number[]>; // topicId -> average scores
  cognitiveDistributions: Record<BloomsTaxonomyLevel, number>[];
  cognitivePerformance: Record<BloomsTaxonomyLevel, number>[];
}

/**
 * Bloom's Taxonomy analytics report
 */
export interface BloomsAnalyticsReport {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  classPerformance: ClassBloomsPerformance;
  assessmentComparisons: AssessmentComparison[];
  cognitiveBalanceAnalysis: {
    isBalanced: boolean;
    recommendations: string[];
    currentDistribution: BloomsDistribution;
    idealDistribution: BloomsDistribution;
  };
  masteryHeatmapData: {
    studentIds: string[];
    studentNames: string[];
    topicIds: string[];
    topicNames: string[];
    heatmapData: number[][];
  };
}
