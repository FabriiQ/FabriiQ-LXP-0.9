'use client';

/**
 * Drag and Drop Activity Grading
 *
 * This file contains functions for grading drag and drop activities.
 */

import { DragAndDropActivity } from '../models/drag-and-drop';
import { GradingResult, QuestionResult } from '../models/base';

/**
 * Grade a drag and drop activity
 *
 * @param activity The activity to grade
 * @param answers The student's answers (item ID to zone ID mapping)
 * @returns Grading result
 */
export function gradeDragAndDropActivity(
  activity: DragAndDropActivity,
  answers: Record<string, string>
): GradingResult {
  // Initialize result
  const questionResults: QuestionResult[] = [];
  let totalPoints = 0;
  let earnedPoints = 0;

  // Grade each question
  activity.questions.forEach(question => {
    const questionResult: QuestionResult = {
      questionId: question.id,
      isCorrect: true,
      points: 0,
      maxPoints: question.points || question.items.length
    };

    // Track correct items for this question
    let correctItems = 0;
    
    // Check each item
    question.items.forEach(item => {
      const selectedZoneId = answers[item.id];
      const isItemCorrect = selectedZoneId === item.correctZoneId;
      
      if (isItemCorrect) {
        correctItems++;
      } else {
        questionResult.isCorrect = false;
      }
    });
    
    // Calculate points for this question
    const itemPoints = question.points ? question.points / question.items.length : 1;
    questionResult.points = correctItems * itemPoints;
    
    // Add to totals
    totalPoints += questionResult.maxPoints;
    earnedPoints += questionResult.points;
    
    // Add question result
    questionResults.push(questionResult);
  });

  // Calculate overall percentage
  const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  
  // Determine if passed
  const passingPercentage = activity.settings?.passingPercentage || 60;
  const passed = percentage >= passingPercentage;

  // Return grading result
  return {
    score: earnedPoints,
    maxScore: totalPoints,
    percentage,
    passed,
    questionResults,
    completedAt: new Date()
  };
}
