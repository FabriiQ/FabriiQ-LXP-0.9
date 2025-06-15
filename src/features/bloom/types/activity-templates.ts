/**
 * Activity Templates Types
 * 
 * This file contains type definitions for activity templates aligned with Bloom's Taxonomy.
 */

import { BloomsTaxonomyLevel } from './bloom-taxonomy';

/**
 * Activity types
 */
export enum ActivityType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
  DISCUSSION = 'DISCUSSION',
  PROJECT = 'PROJECT',
  PRESENTATION = 'PRESENTATION',
  GAME = 'GAME',
  SIMULATION = 'SIMULATION',
  EXPERIMENT = 'EXPERIMENT',
  REFLECTION = 'REFLECTION',
  FIELD_TRIP = 'FIELD_TRIP',
}

/**
 * Activity setting
 */
export enum ActivitySetting {
  IN_CLASS = 'IN_CLASS',
  ONLINE = 'ONLINE',
  HYBRID = 'HYBRID',
  HOMEWORK = 'HOMEWORK',
  FIELD = 'FIELD',
}

/**
 * Activity template with Bloom's Taxonomy alignment
 */
export interface ActivityTemplate {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  setting: ActivitySetting;
  bloomsLevel: BloomsTaxonomyLevel;
  estimatedDuration: number; // in minutes
  groupSize?: number;
  materials?: string[];
  instructions: string;
  assessmentStrategy?: string;
  differentiation?: {
    advanced?: string;
    struggling?: string;
  };
  tags: string[];
  subject?: string;
  gradeLevel?: string[];
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Activity instance created from a template
 */
export interface Activity {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  setting: ActivitySetting;
  bloomsLevel: BloomsTaxonomyLevel;
  learningOutcomeIds: string[];
  duration: number;
  groupSize?: number;
  materials?: string[];
  instructions: string;
  resources?: {
    id: string;
    title: string;
    type: string;
    url?: string;
  }[];
  rubricId?: string;
  lessonPlanId?: string;
  subjectId: string;
  topicId?: string;
  classId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Activity generation request
 */
export interface ActivityGenerationRequest {
  title?: string;
  bloomsLevel: BloomsTaxonomyLevel;
  learningOutcomeIds: string[];
  type?: ActivityType;
  setting?: ActivitySetting;
  duration?: number;
  groupSize?: number;
  subject?: string;
  topic?: string;
  gradeLevel?: string;
  includeRubric?: boolean;
}

/**
 * Activity sequence for a lesson plan
 */
export interface ActivitySequence {
  lessonPlanId: string;
  activities: {
    activityId: string;
    orderIndex: number;
    duration: number;
    bloomsLevel: BloomsTaxonomyLevel;
    phase: 'introduction' | 'development' | 'practice' | 'assessment' | 'conclusion';
  }[];
  totalDuration: number;
  bloomsDistribution: Record<BloomsTaxonomyLevel, number>;
}

/**
 * Activity recommendation based on mastery gaps
 */
export interface ActivityRecommendation {
  studentId?: string;
  classId?: string;
  topicId: string;
  bloomsLevel: BloomsTaxonomyLevel;
  activityType: ActivityType;
  setting: ActivitySetting;
  reason: string;
  suggestedTemplateIds: string[];
}
