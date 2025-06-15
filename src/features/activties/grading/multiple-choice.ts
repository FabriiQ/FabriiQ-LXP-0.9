'use client';

import { MultipleChoiceActivity, MultipleChoiceQuestion } from '../models/multiple-choice';
import { GradingResult, QuestionResult } from '../models/base';

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
  activity: MultipleChoiceActivity,
  answers: Record<string, string>
): GradingResult {
  // Initialize results
  let score = 0;
  let maxScore = 0;
  const questionResults: QuestionResult[] = [];
  
  // Process each question
  for (const question of activity.questions) {
    const questionId = question.id;
    const selectedOptionId = answers[questionId];
    const selectedOption = question.options.find(o => o.id === selectedOptionId);
    const correctOption = question.options.find(o => o.isCorrect);
    
    // Add to max score
    const points = question.points || 1;
    maxScore += points;
    
    // Check if answer is correct
    const isCorrect = selectedOption?.isCorrect || false;
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
      feedback: selectedOption?.feedback || '',
      explanation: question.explanation || '',
      answerAnalysis: generateAnswerAnalysis(question, selectedOptionId)
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
 * @param selectedOptionId The ID of the selected option
 * @returns Personalized answer analysis
 */
function generateAnswerAnalysis(
  question: MultipleChoiceQuestion, 
  selectedOptionId?: string
): string {
  if (!selectedOptionId) {
    return "You didn't answer this question.";
  }
  
  const selectedOption = question.options.find(o => o.id === selectedOptionId);
  if (!selectedOption) {
    return "Your selected answer could not be found.";
  }
  
  const correctOption = question.options.find(o => o.isCorrect);
  
  if (selectedOption.isCorrect) {
    return `Great job! You correctly selected "${selectedOption.text}". ${question.explanation || ''}`;
  } else {
    return `You selected "${selectedOption.text}", which is incorrect. The correct answer is "${correctOption?.text}". ${question.explanation || ''}`;
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
