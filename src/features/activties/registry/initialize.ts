'use client';

/**
 * Activity Registry Initialization
 *
 * This file initializes all activity types in the registry.
 * It's separated from the registry definition to avoid circular dependencies.
 */

import { z } from 'zod';
import { ActivityPurpose, AssessmentType } from '@/server/api/constants';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { activityRegistry } from './index';
import { ManualGradingCreator } from '../components/activity-creators/ManualGradingCreator';
import { ManualGradingViewer } from '../components/activity-viewers/ManualGradingViewer';

// Initialize all activity types
export function initializeActivityRegistry() {
  // Register manual grading activity
  registerManualGradingActivity();
  
  // Add other activity type registrations here
  // registerMultipleChoiceActivity();
  // registerTrueFalseActivity();
  // etc.
}

// Manual Grading Activity Registration
function registerManualGradingActivity() {
  // Schema for manual grading activity configuration
  const ManualGradingSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
    bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel),
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
