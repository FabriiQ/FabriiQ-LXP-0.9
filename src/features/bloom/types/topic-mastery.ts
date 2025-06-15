/**
 * Topic Mastery Types
 * 
 * This file contains type definitions for topic mastery tracking with Bloom's Taxonomy.
 */

import { BloomsTaxonomyLevel } from './bloom-taxonomy';

/**
 * Mastery level enum
 */
export enum MasteryLevel {
  NOVICE = 'NOVICE',
  DEVELOPING = 'DEVELOPING',
  PROFICIENT = 'PROFICIENT',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

/**
 * Topic mastery data for a student
 */
export interface TopicMasteryData {
  id: string;
  studentId: string;
  topicId: string;
  subjectId: string;
  
  // Mastery levels for each Bloom's Taxonomy level
  [BloomsTaxonomyLevel.REMEMBER]: number;
  [BloomsTaxonomyLevel.UNDERSTAND]: number;
  [BloomsTaxonomyLevel.APPLY]: number;
  [BloomsTaxonomyLevel.ANALYZE]: number;
  [BloomsTaxonomyLevel.EVALUATE]: number;
  [BloomsTaxonomyLevel.CREATE]: number;
  
  // Overall mastery (weighted average)
  overallMastery: number;
  
  // Timestamps
  lastAssessmentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Assessment result data for mastery calculation
 */
export interface AssessmentResultData {
  id: string;
  assessmentId: string;
  studentId: string;
  topicId: string;
  subjectId: string;
  
  // Scores by Bloom's level
  bloomsLevelScores: {
    [key in BloomsTaxonomyLevel]?: {
      score: number;
      maxScore: number;
      questionCount: number;
    }
  };
  
  // Overall scores
  totalScore: number;
  maxScore: number;
  percentage: number;
  
  // Timestamps
  completedAt: Date;
}

/**
 * Mastery threshold configuration
 */
export interface MasteryThresholds {
  [MasteryLevel.NOVICE]: number;
  [MasteryLevel.DEVELOPING]: number;
  [MasteryLevel.PROFICIENT]: number;
  [MasteryLevel.ADVANCED]: number;
  [MasteryLevel.EXPERT]: number;
}

/**
 * Mastery decay configuration
 */
export interface MasteryDecayConfig {
  enabled: boolean;
  decayRate: number; // Percentage decay per day
  gracePeriod: number; // Days before decay starts
  minimumLevel: number; // Minimum level after decay
}

/**
 * Student mastery analytics
 */
export interface StudentMasteryAnalytics {
  studentId: string;
  studentName: string;
  overallMastery: number;
  masteryBySubject: {
    subjectId: string;
    subjectName: string;
    mastery: number;
  }[];
  bloomsLevels: {
    [key in BloomsTaxonomyLevel]: number;
  };
  growth: {
    overall: number;
    byBloomsLevel: {
      [key in BloomsTaxonomyLevel]: number;
    };
    period: 'week' | 'month' | 'term';
  };
  masteryGaps: {
    topicId: string;
    topicName: string;
    currentMastery: number;
    bloomsLevelGaps: BloomsTaxonomyLevel[];
  }[];
  recommendations: {
    type: 'practice' | 'assessment' | 'resource';
    description: string;
    bloomsLevel: BloomsTaxonomyLevel;
    topicId?: string;
    resourceId?: string;
  }[];
}

/**
 * Class mastery analytics
 */
export interface ClassMasteryAnalytics {
  classId: string;
  className: string;
  averageMastery: number;
  masteryDistribution: {
    [MasteryLevel.NOVICE]: number;
    [MasteryLevel.DEVELOPING]: number;
    [MasteryLevel.PROFICIENT]: number;
    [MasteryLevel.ADVANCED]: number;
    [MasteryLevel.EXPERT]: number;
  };
  bloomsLevels: {
    [key in BloomsTaxonomyLevel]: number;
  };
  topicMastery: {
    topicId: string;
    topicName: string;
    averageMastery: number;
    masteryDistribution: {
      [MasteryLevel.NOVICE]: number;
      [MasteryLevel.DEVELOPING]: number;
      [MasteryLevel.PROFICIENT]: number;
      [MasteryLevel.ADVANCED]: number;
      [MasteryLevel.EXPERT]: number;
    };
  }[];
  masteryGaps: {
    topicId: string;
    topicName: string;
    averageMastery: number;
    bloomsLevelGaps: BloomsTaxonomyLevel[];
  }[];
  recommendations: {
    type: 'activity' | 'assessment' | 'resource';
    description: string;
    bloomsLevel: BloomsTaxonomyLevel;
    topicId?: string;
  }[];
}
