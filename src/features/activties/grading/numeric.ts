'use client';

/**
 * Numeric Activity Grading
 *
 * This file contains functions for grading numeric activities.
 */

import { NumericActivity, isNumericAnswerCorrect } from '../models/numeric';
import { GradingResult, QuestionResult } from '../models/base';

/**
 * Grade a numeric activity
 *
 * @param activity The activity to grade
 * @param answers The student's answers (question ID to numeric value mapping)
 * @returns Grading result
 */
export function gradeNumericActivity(
  activity: NumericActivity,
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
      isCorrect: false,
      points: 0,
      maxPoints: question.points || 1
    };

    // Get the student's answer
    const answer = answers[question.id];
    
    // Check if the answer is correct
    if (answer !== undefined && isNumericAnswerCorrect(question, answer)) {
      questionResult.isCorrect = true;
      questionResult.points = questionResult.maxPoints;
      earnedPoints += questionResult.points;
    }
    
    // Add to total points
    totalPoints += questionResult.maxPoints;
    
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
