/**
 * Activity Grading Service
 * 
 * This service provides server-side grading functions for different activity types.
 * These functions are similar to the client-side grading functions but can be used
 * in server-side API routes.
 */

import { logger } from '@/server/api/utils/logger';

/**
 * Base interface for grading results
 */
interface GradingResult {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  questionResults: QuestionResult[];
  overallFeedback: string;
  completedAt: Date;
}

/**
 * Interface for individual question results
 */
interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  points: number;
  maxPoints: number;
  selectedOptionId?: string;
  correctOptionId?: string;
  explanation?: string;
  answerAnalysis?: string;
}

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
  activity: any,
  answers: any
): GradingResult {
  // Log inputs for debugging
  logger.debug('Server-side grading true/false activity:', {
    activityId: activity.id,
    title: activity.title,
    questionCount: activity.questions?.length || 0,
    answersReceived: typeof answers === 'object' ? Object.keys(answers).length : 0
  });
  
  // Handle different answer formats
  // The client might send { answers: { questionId: boolean } } or { questionId: boolean }
  const answerData = answers.answers || answers;
  
  // Initialize results
  let score = 0;
  let maxScore = 0;
  const questionResults: QuestionResult[] = [];
  
  // Process each question
  for (const question of activity.questions || []) {
    const questionId = question.id;
    const selectedAnswer = answerData[questionId];
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
 * Grade a multiple choice activity
 * 
 * This function evaluates student answers for a multiple choice activity
 * and returns detailed results including scores, feedback, and analysis.
 * 
 * @param activity The multiple choice activity to grade
 * @param answers Record of question IDs to selected option IDs
 * @returns Detailed grading results
 */
export function gradeMultipleChoiceActivity(
  activity: any,
  answers: any
): GradingResult {
  // Handle different answer formats
  const answerData = answers.answers || answers;
  
  // Initialize results
  let score = 0;
  let maxScore = 0;
  const questionResults: QuestionResult[] = [];
  
  // Process each question
  for (const question of activity.questions || []) {
    const questionId = question.id;
    const selectedOptionId = answerData[questionId];
    
    // Find the selected option
    const selectedOption = question.options?.find((opt: any) => opt.id === selectedOptionId);
    
    // Find the correct option
    const correctOption = question.options?.find((opt: any) => opt.isCorrect);
    
    const isCorrect = selectedOption?.isCorrect || false;
    
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
      selectedOptionId,
      correctOptionId: correctOption?.id,
      explanation: question.explanation || '',
      answerAnalysis: isCorrect 
        ? `Correct! ${question.explanation || ''}`
        : `Incorrect. The correct answer is: ${correctOption?.text || 'Not available'}. ${question.explanation || ''}`
    });
  }
  
  // Calculate percentage and passing status
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const passed = percentage >= (activity.settings?.passingPercentage || 60);
  
  // Generate overall feedback
  const overallFeedback = generateOverallFeedback(percentage, passed, questionResults);
  
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
  question: any, 
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
      feedback = `Perfect score! You answered all ${totalCount} questions correctly.`;
    } else {
      feedback = `Good job! You answered ${correctCount} out of ${totalCount} questions correctly (${Math.round(percentage)}%).`;
    }
  } else {
    feedback = `You answered ${correctCount} out of ${totalCount} questions correctly (${Math.round(percentage)}%). Keep practicing to improve your score.`;
  }
  
  // Add suggestions for improvement if they didn't get a perfect score
  if (percentage < 100) {
    const incorrectQuestions = questionResults.filter(r => !r.isCorrect);
    if (incorrectQuestions.length > 0) {
      feedback += ' Review the explanations for the questions you missed to improve your understanding.';
    }
  }
  
  return feedback;
}
