'use client';

/**
 * Manual Grading Activity Model
 *
 * This file defines the model for manual grading activities that integrate
 * with Bloom's Taxonomy and rubrics.
 */

import { BaseActivity, ActivitySettings, ActivityMetadata } from './base';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

/**
 * Manual Grading Activity Interface
 * Represents a complete manual grading activity
 */
export interface ManualGradingActivity extends BaseActivity {
  activityType: 'manual-grading';
  instructions: string;
  description: string;
  bloomsLevel: BloomsTaxonomyLevel;
  rubricId?: string;
  attachments?: ManualGradingAttachment[];
  submissionInstructions?: string;
  isGradable: true; // Always gradable
  maxScore: number; // Maximum score for the activity
  settings?: ActivitySettings & {
    allowFileUpload?: boolean;
    allowTextSubmission?: boolean;
    allowLinkSubmission?: boolean;
    maxFileSize?: number; // in MB
    allowedFileTypes?: string[]; // e.g., ['pdf', 'docx', 'jpg']
    maxFiles?: number;
    dueDate?: Date;
    lateSubmissionPolicy?: 'no_late' | 'with_penalty' | 'no_penalty';
    latePenaltyPercentage?: number;
    showRubricToStudents?: boolean;
    gradingMethod?: 'auto' | 'manual'; // Whether to use automatic or manual grading
    gradingType?: 'score' | 'rubric'; // Whether to use score-based or rubric-based grading
  };
}

/**
 * Manual Grading Attachment
 */
export interface ManualGradingAttachment {
  id: string;
  name: string;
  type: 'file' | 'link' | 'text';
  content: string; // File URL, link URL, or text content
  size?: number; // For files
  createdAt?: Date;
}

/**
 * Manual Grading Submission
 */
export interface ManualGradingSubmission {
  id: string;
  studentId: string;
  activityId: string;
  attachments: ManualGradingAttachment[];
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  score?: number;
  feedback?: string;
  bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  gradingDetails?: {
    criteriaResults?: Array<{
      criterionId: string;
      levelId: string;
      score: number;
      feedback?: string;
    }>;
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  };
}

/**
 * Create a default manual grading activity
 */
export function createDefaultManualGradingActivity(
  id: string = `manual-grading-${Date.now()}`,
  title: string = 'New Manual Grading Activity'
): ManualGradingActivity {
  return {
    id,
    title,
    activityType: 'manual-grading',
    instructions: 'Instructions for completing this activity...',
    description: 'Description of the activity...',
    bloomsLevel: BloomsTaxonomyLevel.APPLY,
    isGradable: true,
    maxScore: 100, // Default max score
    settings: {
      allowFileUpload: true,
      allowTextSubmission: true,
      allowLinkSubmission: false,
      maxFileSize: 10, // 10 MB
      allowedFileTypes: ['pdf', 'docx', 'jpg', 'png'],
      maxFiles: 3,
      showRubricToStudents: true,
      gradingMethod: 'manual', // Default to manual grading
      gradingType: 'score', // Default to score-based grading
    },
    metadata: {
      difficulty: 'medium',
      estimatedTime: 30,
      version: '1.0.0',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
