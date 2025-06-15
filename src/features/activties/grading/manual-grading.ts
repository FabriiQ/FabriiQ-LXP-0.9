'use client';

/**
 * Manual Grading Activity Grading Function
 *
 * This file contains the grading function for manual grading activities.
 * Since manual grading activities are graded by teachers, this function
 * simply returns a placeholder result.
 */

import { GradingResult } from '../models/base';
import { ManualGradingActivity, ManualGradingSubmission } from '../models/manual-grading';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

/**
 * Grade a manual grading activity
 * 
 * Since manual grading activities are graded by teachers, this function
 * simply returns a placeholder result indicating that manual grading is required.
 * 
 * @param activity The manual grading activity
 * @param submission The student's submission
 * @returns A grading result indicating that manual grading is required
 */
export function gradeManualGradingActivity(
  activity: ManualGradingActivity,
  submission: Partial<ManualGradingSubmission>
): GradingResult {
  // If the submission has already been graded, return the existing grade
  if (submission.score !== undefined && submission.gradingDetails) {
    return {
      score: submission.score,
      maxScore: activity.maxScore || 100,
      percentage: submission.score / (activity.maxScore || 100) * 100,
      passed: submission.score >= (activity.settings?.passingScore || 60),
      feedback: submission.feedback || 'This submission has been graded.',
      bloomsLevelScores: submission.gradingDetails.bloomsLevelScores,
      requiresManualGrading: false,
      isGraded: true,
    };
  }
  
  // Otherwise, return a placeholder result indicating that manual grading is required
  return {
    score: 0,
    maxScore: activity.maxScore || 100,
    percentage: 0,
    passed: false,
    feedback: 'This submission requires manual grading by a teacher.',
    bloomsLevelScores: {
      [activity.bloomsLevel]: 0,
    },
    requiresManualGrading: true,
    isGraded: false,
  };
}
