'use client';

/**
 * Drag the Words Activity Grading
 *
 * This file contains functions for grading drag the words activities.
 */

import { DragTheWordsActivity } from '../models/drag-the-words';
import { GradingResult, QuestionResult } from '../models/base';

/**
 * Grade a drag the words activity
 *
 * @param activity The activity to grade
 * @param answers The student's answers (word ID to placeholder index mapping)
 * @returns Grading result
 */
export function gradeDragTheWordsActivity(
  activity: DragTheWordsActivity,
  answers: Record<string, number>
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
      maxPoints: question.points || question.words.length
    };

    // Track correct words for this question
    let correctWords = 0;
    
    // Check each word
    question.words.forEach(word => {
      const placedIndex = answers[word.id];
      const isWordCorrect = placedIndex === word.correctIndex;
      
      if (isWordCorrect) {
        correctWords++;
      } else {
        questionResult.isCorrect = false;
      }
    });
    
    // Calculate points for this question
    const wordPoints = question.points ? question.points / question.words.length : 1;
    questionResult.points = correctWords * wordPoints;
    
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
