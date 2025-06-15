'use client';

/**
 * Activity Data Normalization Utilities
 * 
 * This file contains utilities for normalizing activity data between
 * different parts of the system.
 */

import { ActivityPurpose } from '@/server/api/constants';
import { 
  ActivityData,
  ActivityDataSchema,
  MultipleChoiceActivityData,
  TrueFalseActivityData,
  FillInTheBlanksActivityData
} from '../types/activity-data';
import { z } from 'zod';

/**
 * Generate a unique ID for an activity
 * @returns A unique ID string
 */
export function generateId(): string {
  return `activity-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Normalize activity data to the standardized format
 * 
 * This function takes any activity data and normalizes it to the standardized format.
 * It handles data that might be in different locations and ensures a consistent structure.
 * 
 * @param data The activity data to normalize
 * @returns Normalized activity data
 */
export function normalizeActivityData<T = Record<string, any>>(data: any): ActivityData<T> {
  if (!data) {
    throw new Error('Cannot normalize null or undefined data');
  }

  // Start with a base structure
  const normalized: ActivityData<T> = {
    id: data.id || generateId(),
    title: data.title || '',
    description: data.description || '',
    instructions: data.instructions || '',
    activityType: findActivityType(data),
    purpose: findPurpose(data),
  };

  // Copy common properties if they exist
  if (data.isGradable !== undefined) normalized.isGradable = data.isGradable;
  if (data.maxScore !== undefined) normalized.maxScore = data.maxScore;
  if (data.passingScore !== undefined) normalized.passingScore = data.passingScore;
  if (data.gradingConfig) normalized.gradingConfig = { ...data.gradingConfig };
  if (data.startDate) normalized.startDate = new Date(data.startDate);
  if (data.endDate) normalized.endDate = new Date(data.endDate);
  if (data.duration !== undefined) normalized.duration = data.duration;
  if (data.status) normalized.status = data.status;
  if (data.subjectId) normalized.subjectId = data.subjectId;
  if (data.topicId) normalized.topicId = data.topicId;
  if (data.classId) normalized.classId = data.classId;
  if (data.createdAt) normalized.createdAt = new Date(data.createdAt);
  if (data.updatedAt) normalized.updatedAt = new Date(data.updatedAt);
  if (data.createdById) normalized.createdById = data.createdById;
  if (data.analyticsConfig) normalized.analyticsConfig = { ...data.analyticsConfig };

  // Extract content and config
  const content = data.content || {};
  const config = data.config || content.config || {};

  // For backward compatibility, maintain content and config
  normalized.content = { ...content };
  normalized.config = { ...config };

  // Merge activity-specific data from all possible locations
  const specificData = extractActivitySpecificData(data);
  Object.assign(normalized, specificData);

  return normalized as ActivityData<T>;
}

/**
 * Extract activity-specific data from an activity
 * 
 * This function extracts activity-specific data from all possible locations
 * in the activity object.
 * 
 * @param data The activity data
 * @returns Activity-specific data
 */
export function extractActivitySpecificData(data: any): Record<string, any> {
  if (!data) return {};

  // Start with an empty object
  const specificData: Record<string, any> = {};

  // Get content and config
  const content = data.content || {};
  const config = data.config || content.config || {};

  // Merge all possible sources of activity-specific data
  // Order matters here - later sources override earlier ones
  Object.assign(specificData, config);
  Object.assign(specificData, content);
  
  // Remove properties that are part of the base ActivityData interface
  const baseProps = [
    'id', 'title', 'description', 'instructions', 'activityType', 'purpose',
    'isGradable', 'maxScore', 'passingScore', 'gradingConfig',
    'startDate', 'endDate', 'duration', 'status',
    'subjectId', 'topicId', 'classId',
    'createdAt', 'updatedAt', 'createdById',
    'analyticsConfig', 'content', 'config'
  ];
  
  baseProps.forEach(prop => {
    delete specificData[prop];
  });

  // Special handling for questions, which might be in multiple places
  if (!specificData.questions) {
    specificData.questions = findQuestions(data);
  }

  return specificData;
}

/**
 * Find the activity type from any activity data
 * 
 * @param data The activity data
 * @returns The activity type
 */
export function findActivityType(data: any): string {
  if (!data) return '';
  
  // Check all possible locations
  return data.activityType || 
         data.content?.activityType || 
         data.type || 
         data.content?.type || 
         '';
}

/**
 * Find the purpose from any activity data
 * 
 * @param data The activity data
 * @returns The purpose
 */
export function findPurpose(data: any): ActivityPurpose {
  if (!data) return ActivityPurpose.LEARNING;
  
  // Check all possible locations
  const purpose = data.purpose || 
                 data.content?.purpose || 
                 data.config?.purpose || 
                 data.content?.config?.purpose;
  
  // Validate that it's a valid ActivityPurpose
  if (purpose && Object.values(ActivityPurpose).includes(purpose)) {
    return purpose as ActivityPurpose;
  }
  
  // Default based on activity type
  const activityType = findActivityType(data);
  if (activityType.includes('quiz') || 
      activityType.includes('multiple-choice') || 
      activityType.includes('true-false') || 
      activityType.includes('fill-in')) {
    return ActivityPurpose.ASSESSMENT;
  }
  
  return ActivityPurpose.LEARNING;
}

/**
 * Find questions from any activity data
 * 
 * @param data The activity data
 * @returns Array of questions
 */
export function findQuestions(data: any): any[] {
  if (!data) return [];
  
  // Check all possible locations
  return data.questions || 
         data.content?.questions || 
         data.config?.questions || 
         data.content?.config?.questions || 
         [];
}

/**
 * Validate activity data against its schema
 * 
 * @param activity The activity data to validate
 * @param schema The schema to validate against
 * @returns Validation result with success flag and optional error
 */
export function validateActivityData<T>(
  activity: ActivityData<T>, 
  schema: z.ZodSchema
): { success: boolean; error?: z.ZodError } {
  try {
    schema.parse(activity);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Ensure backward compatibility by copying data to legacy locations
 * 
 * @param activity The normalized activity
 * @returns The activity with data copied to legacy locations
 */
export function ensureBackwardCompatibility<T>(activity: ActivityData<T>): ActivityData<T> {
  if (!activity) return activity;
  
  // Create a shallow copy
  const result = { ...activity };
  
  // Extract activity-specific data
  const { 
    id, title, description, instructions, activityType, purpose,
    isGradable, maxScore, passingScore, gradingConfig,
    startDate, endDate, duration, status,
    subjectId, topicId, classId,
    createdAt, updatedAt, createdById,
    analyticsConfig, content, config,
    ...specificData
  } = result;
  
  // Ensure content exists
  result.content = result.content || {};
  
  // Copy activity type and purpose to content
  result.content.activityType = activityType;
  result.content.purpose = purpose;
  
  // Copy activity-specific data to content
  Object.assign(result.content, specificData);
  
  // Ensure config exists
  result.config = result.config || {};
  
  // Copy activity-specific data to config
  Object.assign(result.config, specificData);
  
  // Ensure content.config exists
  result.content.config = result.content.config || {};
  
  // Copy activity-specific data to content.config
  Object.assign(result.content.config, specificData);
  
  return result;
}

/**
 * Create a default activity data object
 * 
 * @param activityType The activity type
 * @param purpose The purpose
 * @returns Default activity data
 */
export function createDefaultActivityData(
  activityType: string, 
  purpose: ActivityPurpose = ActivityPurpose.LEARNING
): ActivityData {
  return {
    id: generateId(),
    title: '',
    description: '',
    instructions: '',
    activityType,
    purpose,
    isGradable: purpose === ActivityPurpose.ASSESSMENT,
    content: {
      activityType,
      purpose
    },
    config: {}
  };
}

/**
 * Create a deep clone of activity data
 * 
 * @param activity The activity to clone
 * @returns A deep clone of the activity
 */
export function cloneActivityData<T>(activity: ActivityData<T>): ActivityData<T> {
  return JSON.parse(JSON.stringify(activity));
}

/**
 * Log activity data transformation for debugging
 * 
 * @param before The activity data before transformation
 * @param after The activity data after transformation
 * @param transformationName The name of the transformation
 */
export function logTransformation(before: any, after: any, transformationName: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.group(`Activity Data Transformation: ${transformationName}`);
    console.log('Before:', before);
    console.log('After:', after);
    console.groupEnd();
  }
}
