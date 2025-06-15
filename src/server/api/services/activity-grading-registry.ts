/**
 * Activity Grading Registry
 *
 * This file centralizes all activity grading functions to make them available
 * for server-side grading. It imports grading functions from both the legacy
 * and new activity implementations.
 *
 * Updated to include Bloom's Taxonomy integration.
 */

import { logger } from '@/server/api/utils/logger';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

// Import existing grading functions
import {
  gradeTrueFalseActivity,
  gradeMultipleChoiceActivity
} from './activity-grading.service';

// Import server-side implementations of grading functions
import { gradeMultipleResponseActivity } from './activity-grading/multiple-response';

// Import grading functions from the new activities implementation
// These imports might need to be adjusted based on your actual file structure
import { gradeFillInTheBlanksActivity } from '@/features/activties/grading/fill-in-the-blanks';
import { gradeMatchingActivity } from '@/features/activties/grading/matching';
import { gradeSequenceActivity } from '@/features/activties/grading/sequence';
// Using server-side implementation instead of client-side: import { gradeMultipleResponseActivity } from '@/features/activties/grading/multiple-response';
import { gradeDragAndDropActivity } from '@/features/activties/grading/drag-and-drop';
import { gradeDragTheWordsActivity } from '@/features/activties/grading/drag-the-words';
import { gradeManualGradingActivity } from '@/features/activties/grading/manual-grading';
import { gradeFlashCardsActivity } from '@/features/activties/grading/flash-cards';
import { gradeNumericActivity } from '@/features/activties/grading/numeric';
import { gradeQuizActivity } from '@/features/activties/grading/quiz';

// Fallback to legacy implementations if new ones aren't available
try {
  // This is just to check if the imports exist
  if (typeof gradeFillInTheBlanksActivity !== 'function') {
    logger.warn('Using legacy implementation for gradeFillInTheBlanksActivity');
    // @ts-ignore - Import from legacy location
    import('@/features/activties/grading/fill-in-the-blanks')
      .then(module => {
        // @ts-ignore
        exports.gradeFillInTheBlanksActivity = module.gradeFillInTheBlanksActivity;
      });
  }
} catch (error) {
  logger.error('Error importing grading functions', { error });
}

// Create a registry of all grading functions
export const gradingFunctions: Record<string, any> = {
  // Core grading functions
  'multiple-choice': gradeMultipleChoiceActivity,
  'true-false': gradeTrueFalseActivity,

  // Additional activity types
  'fill-in-the-blanks': gradeFillInTheBlanksActivity,
  'matching': gradeMatchingActivity,
  'sequence': gradeSequenceActivity,
  'multiple-response': gradeMultipleResponseActivity,
  'drag-and-drop': gradeDragAndDropActivity,
  'drag-the-words': gradeDragTheWordsActivity,
  'flash-cards': gradeFlashCardsActivity,
  'numeric': gradeNumericActivity,
  'quiz': gradeQuizActivity,
  'manual-grading': gradeManualGradingActivity
};

/**
 * Get the appropriate grading function for an activity type
 *
 * @param activityType The type of activity to grade
 * @returns The grading function or undefined if not found
 */
export function getGradingFunction(activityType: string): ((activity: any, answers: any) => any) | undefined {
  const gradingFunction = gradingFunctions[activityType];

  if (!gradingFunction) {
    logger.warn(`No grading function found for activity type: ${activityType}`);
  }

  return gradingFunction;
}

/**
 * Grade an activity using the appropriate grading function
 *
 * @param activityType The type of activity to grade
 * @param activity The activity content
 * @param answers The student's answers
 * @returns The grading result or null if no grading function is available
 */
export function gradeActivity(activityType: string, activity: any, answers: any): any | null {
  const gradingFunction = getGradingFunction(activityType);

  if (!gradingFunction) {
    return null;
  }

  try {
    // Use existing grading function
    const result = gradingFunction(activity, answers);

    // Ensure bloomsLevelScores is included
    if (activity.bloomsLevel && result && !result.bloomsLevelScores) {
      result.bloomsLevelScores = {
        [activity.bloomsLevel]: result.score || 0
      };
    }

    return result;
  } catch (error) {
    logger.error('Error grading activity', { activityType, error });
    return null;
  }
}

/**
 * Calculate Bloom's level scores for an activity
 *
 * @param activity The activity with Bloom's level
 * @param score The score achieved
 * @returns Record of Bloom's level scores
 */
export function calculateBloomsLevelScores(
  activity: any,
  score: number
): Record<BloomsTaxonomyLevel, number> {
  const bloomsLevelScores: Partial<Record<BloomsTaxonomyLevel, number>> = {};

  if (activity.bloomsLevel) {
    bloomsLevelScores[activity.bloomsLevel] = score;
  }

  return bloomsLevelScores as Record<BloomsTaxonomyLevel, number>;
}
