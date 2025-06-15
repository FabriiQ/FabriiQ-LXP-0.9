'use client';

import { TrueFalseActivity, TrueFalseQuestion } from '../models/true-false';
import { GradingResult, QuestionResult } from '../models/base';

/**
 * Grade a true/false activity
 *
 * This function evaluates student answers for a true/false activity
 * and returns detailed results including scores, feedback, and analysis.
 *
 * @param activity The true/false activity to grade
 * @param answers Record of question IDs to boolean answers
 * @returns Detailed grading results
 */
export function gradeTrueFalseActivity(
  activity: TrueFalseActivity,
  answers: Record<string, boolean>
): GradingResult {
  // Log inputs for debugging
  console.log('Grading true/false activity:', {
    activityId: activity.id,
    title: activity.title,
    questionCount: activity.questions.length,
    answersReceived: Object.keys(answers).length,
    answers
  });

  // Initialize results
  let score = 0;
  let maxScore = 0;
  const questionResults: QuestionResult[] = [];

  // Process each question
  for (const question of activity.questions) {
    const questionId = question.id;
    const selectedAnswer = answers[questionId];
    const isCorrect = selectedAnswer === question.isTrue;

    // Add to max score
    const points = question.points || 1;
    maxScore += points;

    // Add to score if correct
    if (isCorrect) {
      score += points;
    }

    // Create detailed result with feedback
    questionResults.push({
      questionId,
      isCorrect,
      points: isCorrect ? points : 0,
      maxPoints: points,
      selectedOptionId: selectedAnswer ? 'true' : 'false',
      correctOptionId: question.isTrue ? 'true' : 'false',
      explanation: question.explanation || '',
      answerAnalysis: generateAnswerAnalysis(question, selectedAnswer)
    });
  }

  // Calculate percentage and passing status
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const passed = percentage >= (activity.settings?.passingPercentage || 60);

  // Generate overall feedback
  const overallFeedback = generateOverallFeedback(percentage, passed, questionResults);

  // Track analytics (in a real implementation, this would call an analytics service)
  // trackActivityCompletion(activity.id, score, maxScore, percentage, passed);

  return {
    score,
    maxScore,
    percentage,
    passed,
    questionResults,
    overallFeedback,
    completedAt: new Date()
  };
}

/**
 * Generate detailed analysis for an answer
 *
 * This function creates a personalized analysis of the student's answer
 * based on the question and their selection.
 *
 * @param question The question being analyzed
 * @param selectedAnswer The selected answer (true/false)
 * @returns Personalized answer analysis
 */
function generateAnswerAnalysis(
  question: TrueFalseQuestion,
  selectedAnswer?: boolean
): string {
  if (selectedAnswer === undefined) {
    return "You didn't answer this question.";
  }

  if (selectedAnswer === question.isTrue) {
    return `Great job! You correctly identified that this statement is ${selectedAnswer ? 'true' : 'false'}. ${question.explanation || ''}`;
  } else {
    return `Your answer is incorrect. The statement is actually ${question.isTrue ? 'true' : 'false'}. ${question.explanation || ''}`;
  }
}

/**
 * Generate overall feedback for the activity
 *
 * This function creates personalized overall feedback based on
 * the student's performance on the activity.
 *
 * @param percentage The percentage score
 * @param passed Whether the student passed
 * @param questionResults Detailed results for each question
 * @returns Personalized overall feedback
 */
function generateOverallFeedback(
  percentage: number,
  passed: boolean,
  questionResults: QuestionResult[]
): string {
  const correctCount = questionResults.filter(r => r.isCorrect).length;
  const totalCount = questionResults.length;

  let feedback = '';

  if (passed) {
    if (percentage === 100) {
      feedback = `Perfect score! You answered all ${totalCount} statements correctly.`;
    } else {
      feedback = `Good job! You answered ${correctCount} out of ${totalCount} statements correctly (${Math.round(percentage)}%).`;
    }
  } else {
    feedback = `You answered ${correctCount} out of ${totalCount} statements correctly (${Math.round(percentage)}%). Keep practicing to improve your score.`;
  }

  // Add suggestions for improvement if they didn't get a perfect score
  if (percentage < 100) {
    const incorrectQuestions = questionResults.filter(r => !r.isCorrect);
    if (incorrectQuestions.length > 0) {
      feedback += ' Review the explanations for the statements you missed to improve your understanding.';
    }
  }

  return feedback;
}
