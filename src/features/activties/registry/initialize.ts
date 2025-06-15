'use client';

/**
 * Activity Registry Initialization
 *
 * This file initializes all activity types in the registry.
 * It's separated from the registry definition to avoid circular dependencies.
 */

import { z } from 'zod';
import { ActivityPurpose, AssessmentType } from '@/server/api/constants';
// import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy'; // Not used by Essay schema directly
import { activityRegistry } from './index';
import { ManualGradingCreator } from '../components/activity-creators/ManualGradingCreator';
import { ManualGradingViewer } from '../components/activity-viewers/ManualGradingViewer';
import { EssayActivityCreator } from '../components/activity-creators/EssayActivityCreator';
import { EssayActivityViewer } from '../components/activity-viewers/EssayActivityViewer';
import { createDefaultEssayActivity } from '../models/essay';
import { EssayRubricCriterion as EssayRubricCriterionType, EssayRubricLevel as EssayRubricLevelType } from '@/features/question-bank/models/types'; // Renaming to avoid conflict with schema const


// Initialize all activity types
export function initializeActivityRegistry() {
  // Register manual grading activity
  registerManualGradingActivity();
  
  // Register essay activity
  registerEssayActivity();

  // Add other activity type registrations here
  // registerMultipleChoiceActivity();
  // registerTrueFalseActivity();
  // etc.
}


// Zod Schemas for Essay Activity
const EssayRubricLevelSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Level name is required'),
  description: z.string().min(1, 'Level description is required'),
  points: z.number().min(0, 'Points cannot be negative'),
});

const EssayRubricCriterionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Criterion name is required'),
  description: z.string().min(1, 'Criterion description is required'),
  points: z.number().min(0, 'Points cannot be negative'),
  levels: z.array(EssayRubricLevelSchema).min(1, 'At least one level is required per criterion'),
});

const EssayRubricSchema = z.object({
  criteria: z.array(EssayRubricCriterionSchema).min(1, 'At least one criterion is required for the rubric'),
  totalPoints: z.number().min(0, 'Total points cannot be negative'),
});

const EssayActivitySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  wordCountMin: z.number().min(0).optional(),
  wordCountMax: z.number().min(0).optional(),
  rubric: EssayRubricSchema.optional(),
  settings: z.object({
    showRubricToStudents: z.boolean().default(true),
  }).optional(),
  metadata: z.object({
       aiGenerated: z.boolean().optional(),
       difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
       estimatedTime: z.number().optional(),
       learningObjectives: z.array(z.string()).optional(),
  }).optional(),
});

// Essay Activity Registration
function registerEssayActivity() {
  const defaultEssayConfig = createDefaultEssayActivity();

  const registryDefaultConfig = {
    title: defaultEssayConfig.title,
    description: defaultEssayConfig.description,
    instructions: defaultEssayConfig.instructions,
    prompt: defaultEssayConfig.prompt,
    wordCountMin: defaultEssayConfig.wordCountMin,
    wordCountMax: defaultEssayConfig.wordCountMax,
    rubric: defaultEssayConfig.rubric,
    settings: {
       showRubricToStudents: true,
    },
    metadata: defaultEssayConfig.metadata,
  };

  activityRegistry.register({
    id: 'essay',
    name: 'Essay Activity',
    description: 'Students write essays based on prompts, with rubric-based grading.',
    category: ActivityPurpose.ASSESSMENT,
    subCategory: 'ESSAY', // Using string literal, AssessmentType.ESSAY might not exist
    configSchema: EssayActivitySchema,
    defaultConfig: registryDefaultConfig,
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
      hasRealTimeComponents: false,
      requiresTeacherReview: true,
    },
    components: {
      editor: EssayActivityCreator,
      viewer: EssayActivityViewer,
    },
  });
}

// Manual Grading Activity Registration
function registerManualGradingActivity() {
  // Schema for manual grading activity configuration
  const ManualGradingSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
    // bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel), // Not used in Essay, removed from its direct metadata schema
    rubricId: z.string().optional(),
    submissionInstructions: z.string().optional(),
    settings: z.object({
      allowFileUpload: z.boolean().default(true),
      allowTextSubmission: z.boolean().default(true),
      allowLinkSubmission: z.boolean().default(false),
      maxFileSize: z.number().min(1).max(100).default(10),
      maxFiles: z.number().min(1).max(10).default(3),
      allowedFileTypes: z.array(z.string()).default(['pdf', 'docx', 'jpg', 'png']),
      dueDate: z.date().optional(),
      showRubricToStudents: z.boolean().default(true),
      gradingMethod: z.enum(['auto', 'manual']).default('manual'),
      gradingType: z.enum(['score', 'rubric']).default('score'),
    }).optional(),
  });

  // Default configuration for manual grading activities
  const defaultManualGradingConfig = {
    title: 'New Manual Grading Activity',
    description: 'Description of the activity...',
    instructions: 'Instructions for completing this activity...',
    bloomsLevel: BloomsTaxonomyLevel.APPLY,
    submissionInstructions: 'Please submit your work according to the instructions above.',
    settings: {
      allowFileUpload: true,
      allowTextSubmission: true,
      allowLinkSubmission: false,
      maxFileSize: 10, // 10 MB
      maxFiles: 3,
      allowedFileTypes: ['pdf', 'docx', 'jpg', 'png'],
      showRubricToStudents: true,
      gradingMethod: 'manual',
      gradingType: 'score',
    },
  };

  // Register the manual grading activity type
  activityRegistry.register({
    id: 'manual-grading',
    name: 'Manual Grading Activity',
    description: 'Create activities that require manual grading by teachers',
    category: ActivityPurpose.ASSESSMENT,
    subCategory: AssessmentType.ASSIGNMENT,
    configSchema: ManualGradingSchema,
    defaultConfig: defaultManualGradingConfig,
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: false,
      hasRealTimeComponents: false,
      requiresTeacherReview: true,
    },
    components: {
      editor: ManualGradingCreator,
      viewer: ManualGradingViewer,
    },
  });
}

// Initialize the registry when this module is imported
initializeActivityRegistry();
