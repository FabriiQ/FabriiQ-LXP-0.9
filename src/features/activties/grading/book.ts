'use client';

/**
 * Book Activity Grading
 *
 * This module provides functions for grading book activities.
 * Book activities are graded based on:
 * 1. Completion of all required sections
 * 2. Completion of all required checkpoints
 * 3. Correctness of checkpoint answers
 */

import { BookActivity, BookCheckpoint } from '../models/book';
import { GradingResult } from '../models/base';
import { gradeMultipleChoiceActivity } from './multiple-choice';
import { gradeTrueFalseActivity } from './true-false';
import { gradeMultipleResponseActivity } from './multiple-response';
import { gradeFillInTheBlanksActivity } from './fill-in-the-blanks';
import { gradeMatchingActivity } from './matching';
import { gradeSequenceActivity } from './sequence';
import { gradeDragAndDropActivity } from './drag-and-drop';
import { gradeDragTheWordsActivity } from './drag-the-words';
import { gradeNumericActivity } from './numeric';
import { gradeQuizActivity } from './quiz';

// Define the grading result interface
export interface BookGradingResult {
  score: number;
  maxScore: number;
  percentageScore: number;
  sectionsCompleted: number;
  totalSections: number;
  checkpointsCompleted: number;
  totalCheckpoints: number;
  requiredCheckpointsCompleted: number;
  totalRequiredCheckpoints: number;
  checkpointResults: {
    checkpointId: string;
    activityType: string;
    score: number;
    maxScore: number;
    percentageScore: number;
    isCorrect: boolean;
    isRequired: boolean;
  }[];
  feedback: string;
  isCorrect: boolean;
  isComplete: boolean;
}

// Define the submission data interface
export interface BookSubmissionData {
  sectionsRead: Record<string, boolean>;
  completedCheckpoints: Record<string, boolean>;
  checkpointAnswers: Record<string, any>;
}

/**
 * Grade a book activity
 * @param activity The book activity to grade
 * @param submissionData The student's submission data
 * @returns The grading result
 */
export function gradeBookActivity(
  activity: BookActivity,
  submissionData: BookSubmissionData
): BookGradingResult {
  // Initialize result
  const result: BookGradingResult = {
    score: 0,
    maxScore: 0,
    percentageScore: 0,
    sectionsCompleted: 0,
    totalSections: activity.sections.length,
    checkpointsCompleted: 0,
    totalCheckpoints: 0,
    requiredCheckpointsCompleted: 0,
    totalRequiredCheckpoints: 0,
    checkpointResults: [],
    feedback: '',
    isCorrect: false,
    isComplete: false
  };

  // Count sections completed
  result.sectionsCompleted = Object.values(submissionData.sectionsRead).filter(Boolean).length;

  // Process all checkpoints
  let totalScore = 0;
  let totalMaxScore = 0;

  // Count total checkpoints and required checkpoints
  activity.sections.forEach(section => {
    if (section.checkpoints) {
      result.totalCheckpoints += section.checkpoints.length;
      result.totalRequiredCheckpoints += section.checkpoints.filter(cp => cp.isRequired).length;

      // Grade each checkpoint
      section.checkpoints.forEach(checkpoint => {
        const checkpointId = checkpoint.id;
        const isCompleted = submissionData.completedCheckpoints[checkpointId] || false;
        const checkpointAnswer = submissionData.checkpointAnswers[checkpointId];

        if (isCompleted) {
          result.checkpointsCompleted++;
          if (checkpoint.isRequired) {
            result.requiredCheckpointsCompleted++;
          }
        }

        // Grade the checkpoint based on its activity type
        const checkpointResult = gradeCheckpoint(checkpoint, checkpointAnswer);

        // Add to total score
        totalScore += checkpointResult.score;
        totalMaxScore += checkpointResult.maxScore;

        // Add to checkpoint results
        result.checkpointResults.push({
          checkpointId,
          activityType: checkpoint.activityType,
          score: checkpointResult.score,
          maxScore: checkpointResult.maxScore,
          percentageScore: checkpointResult.percentageScore,
          isCorrect: checkpointResult.isCorrect,
          isRequired: checkpoint.isRequired
        });
      });
    }
  });

  // Set scores
  result.score = totalScore;
  result.maxScore = totalMaxScore;
  result.percentageScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

  // Determine if the book is complete
  result.isComplete = result.sectionsCompleted === result.totalSections &&
                      result.requiredCheckpointsCompleted === result.totalRequiredCheckpoints;

  // Determine if the book is correct (all completed checkpoints are correct)
  const allCheckpointsCorrect = result.checkpointResults.every(cr => !cr.isRequired || cr.isCorrect);
  result.isCorrect = result.isComplete && allCheckpointsCorrect;

  // Generate feedback
  if (!result.isComplete) {
    const missingSections = result.totalSections - result.sectionsCompleted;
    const missingCheckpoints = result.totalRequiredCheckpoints - result.requiredCheckpointsCompleted;

    let feedback = 'To complete this book activity, you need to:';

    if (missingSections > 0) {
      feedback += `\n- Read ${missingSections} more section${missingSections > 1 ? 's' : ''}`;
    }

    if (missingCheckpoints > 0) {
      feedback += `\n- Complete ${missingCheckpoints} more required checkpoint${missingCheckpoints > 1 ? 's' : ''}`;
    }

    result.feedback = feedback;
  } else if (!result.isCorrect) {
    const incorrectCheckpoints = result.checkpointResults.filter(cr => cr.isRequired && !cr.isCorrect);

    let feedback = 'You have completed all sections, but some answers need correction:';

    incorrectCheckpoints.forEach(cp => {
      const checkpoint = findCheckpointById(activity, cp.checkpointId);
      if (checkpoint) {
        feedback += `\n- "${checkpoint.title}" needs to be corrected`;
      }
    });

    result.feedback = feedback;
  } else {
    result.feedback = 'Great job! You have successfully completed this book activity.';
  }

  return result;
}

/**
 * Grade a single checkpoint
 * @param checkpoint The checkpoint to grade
 * @param answer The student's answer
 * @returns The grading result for the checkpoint
 */
function gradeCheckpoint(
  checkpoint: BookCheckpoint,
  answer: any
): { score: number; maxScore: number; percentageScore: number; isCorrect: boolean } {
  // Default result
  const defaultResult = {
    score: 0,
    maxScore: 1,
    percentageScore: 0,
    isCorrect: false
  };

  // If no answer provided, return default result
  if (!answer) {
    return defaultResult;
  }

  // Grade based on activity type
  try {
    const activityType = checkpoint.activityType.toLowerCase().replace(/_/g, '-');

    // Extract the score, maxScore, and correctness from the grading result
    let gradingResult: GradingResult;

    switch (activityType) {
      case 'multiple-choice':
        gradingResult = gradeMultipleChoiceActivity(answer.activity, answer.submission);
        break;
      case 'true-false':
        gradingResult = gradeTrueFalseActivity(answer.activity, answer.submission);
        break;
      case 'multiple-response':
        gradingResult = gradeMultipleResponseActivity(answer.activity, answer.submission);
        break;
      case 'fill-in-the-blanks':
        gradingResult = gradeFillInTheBlanksActivity(answer.activity, answer.submission);
        break;
      case 'matching':
        gradingResult = gradeMatchingActivity(answer.activity, answer.submission);
        break;
      case 'sequence':
        gradingResult = gradeSequenceActivity(answer.activity, answer.submission);
        break;
      case 'drag-and-drop':
        gradingResult = gradeDragAndDropActivity(answer.activity, answer.submission);
        break;
      case 'drag-the-words':
        gradingResult = gradeDragTheWordsActivity(answer.activity, answer.submission);
        break;
      case 'numeric':
        gradingResult = gradeNumericActivity(answer.activity, answer.submission);
        break;
      case 'quiz':
        gradingResult = gradeQuizActivity(answer.activity, answer.submission);
        break;
      default:
        // For unsupported activity types, consider it correct if completed
        return {
          score: 1,
          maxScore: 1,
          percentageScore: 100,
          isCorrect: true
        };
    }

    // Convert the GradingResult to the expected return format
    return {
      score: gradingResult.score,
      maxScore: gradingResult.maxScore,
      percentageScore: gradingResult.percentage,
      isCorrect: gradingResult.passed
    };
  } catch (error) {
    console.error(`Error grading checkpoint ${checkpoint.id}:`, error);
    return defaultResult;
  }
}

/**
 * Find a checkpoint by ID in the book activity
 * @param activity The book activity
 * @param checkpointId The checkpoint ID to find
 * @returns The checkpoint or undefined if not found
 */
function findCheckpointById(activity: BookActivity, checkpointId: string): BookCheckpoint | undefined {
  for (const section of activity.sections) {
    if (section.checkpoints) {
      const checkpoint = section.checkpoints.find(cp => cp.id === checkpointId);
      if (checkpoint) {
        return checkpoint;
      }
    }
  }
  return undefined;
}

/**
 * Check if a book activity is gradable
 * @param activity The book activity to check
 * @returns True if the activity is gradable, false otherwise
 */
export function isBookActivityGradable(activity: BookActivity): boolean {
  // A book activity is gradable if it has at least one checkpoint
  return activity.sections.some(section =>
    section.checkpoints && section.checkpoints.length > 0
  );
}

/**
 * Get the maximum possible score for a book activity
 * @param activity The book activity
 * @returns The maximum possible score
 */
export function getBookActivityMaxScore(activity: BookActivity): number {
  let maxScore = 0;

  // Each checkpoint is worth 1 point
  activity.sections.forEach(section => {
    if (section.checkpoints) {
      maxScore += section.checkpoints.length;
    }
  });

  return maxScore;
}
