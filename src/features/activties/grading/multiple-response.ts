'use client';

import { MultipleResponseActivity, MultipleResponseQuestion } from '../models/multiple-response';
import { GradingResult, QuestionResult } from '../models/base';

/**
 * Grade a multiple response activity
 * 
 * This function evaluates student answers for a multiple response activity
 * and returns detailed results including scores, feedback, and analysis.
 * 
 * @param activity The multiple response activity to grade
 * @param answers Record of question IDs to arrays of selected option IDs
 * @returns Detailed grading results
 */
export function gradeMultipleResponseActivity(
  activity: MultipleResponseActivity,
  answers: Record<string, string[]>
): GradingResult {
  // Initialize results
  let score = 0;
  let maxScore = 0;
  const questionResults: QuestionResult[] = [];
  
  // Process each question
  for (const question of activity.questions) {
    const questionId = question.id;
    const selectedOptionIds = answers[questionId] || [];
    const correctOptionIds = question.options.filter(o => o.isCorrect).map(o => o.id);
    
    // Add to max score
    const points = question.points || 1;
    maxScore += points;
    
    // Calculate score for this question
    let questionScore = 0;
    const requireAllCorrect = activity.settings?.requireAllCorrect !== false;
    const allowPartialCredit = question.partialCredit || activity.settings?.allowPartialCredit;
    
    // Check if the answer is fully correct
    const isFullyCorrect = 
      selectedOptionIds.length === correctOptionIds.length && 
      selectedOptionIds.every(id => correctOptionIds.includes(id));
    
    if (isFullyCorrect) {
      // Full credit for fully correct answer
      questionScore = points;
    } else if (allowPartialCredit) {
      // Calculate partial credit
      const totalOptions = question.options.length;
      const correctSelections = selectedOptionIds.filter(id => correctOptionIds.includes(id)).length;
      const incorrectSelections = selectedOptionIds.length - correctSelections;
      const missedCorrect = correctOptionIds.length - correctSelections;
      
      // Calculate partial score based on correct selections minus penalties for incorrect selections
      const rawPartialScore = (correctSelections / correctOptionIds.length) - (incorrectSelections / (totalOptions - correctOptionIds.length));
      // Ensure score is between 0 and 1, then multiply by points
      questionScore = Math.max(0, Math.min(1, rawPartialScore)) * points;
    }
    
    // Add to total score
    score += questionScore;
    
    // Create detailed result with feedback
    questionResults.push({
      questionId,
      isCorrect: isFullyCorrect,
      points: questionScore,
      maxPoints: points,
      selectedOptionId: selectedOptionIds.join(','), // Comma-separated list of selected option IDs
      correctOptionId: correctOptionIds.join(','),   // Comma-separated list of correct option IDs
      feedback: generateFeedbackForQuestion(question, selectedOptionIds),
      explanation: question.explanation || '',
      answerAnalysis: generateAnswerAnalysis(question, selectedOptionIds)
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
 * Generate feedback for a question based on selected options
 * 
 * @param question The question being analyzed
 * @param selectedOptionIds The IDs of the selected options
 * @returns Combined feedback for the selected options
 */
function generateFeedbackForQuestion(
  question: MultipleResponseQuestion,
  selectedOptionIds: string[]
): string {
  if (selectedOptionIds.length === 0) {
    return "You didn't select any options for this question.";
  }
  
  // Collect feedback for each selected option
  const feedbackItems: string[] = [];
  
  for (const optionId of selectedOptionIds) {
    const option = question.options.find(o => o.id === optionId);
    if (option && option.feedback) {
      feedbackItems.push(`${option.text}: ${option.feedback}`);
    }
  }
  
  // If no specific feedback is available, provide a generic message
  if (feedbackItems.length === 0) {
    const correctOptionIds = question.options.filter(o => o.isCorrect).map(o => o.id);
    const allCorrect = selectedOptionIds.every(id => correctOptionIds.includes(id)) && 
                      selectedOptionIds.length === correctOptionIds.length;
    
    return allCorrect 
      ? "All your selections are correct!" 
      : "Some of your selections are incorrect or incomplete.";
  }
  
  return feedbackItems.join('\n');
}

/**
 * Generate detailed analysis for an answer
 * 
 * This function creates a personalized analysis of the student's answer
 * based on the question and their selections.
 * 
 * @param question The question being analyzed
 * @param selectedOptionIds The IDs of the selected options
 * @returns Personalized answer analysis
 */
function generateAnswerAnalysis(
  question: MultipleResponseQuestion, 
  selectedOptionIds: string[]
): string {
  if (selectedOptionIds.length === 0) {
    return "You didn't select any options for this question.";
  }
  
  const correctOptionIds = question.options.filter(o => o.isCorrect).map(o => o.id);
  const correctOptions = question.options.filter(o => o.isCorrect);
  
  // Check if all correct options were selected and no incorrect options were selected
  const allCorrectSelected = correctOptionIds.every(id => selectedOptionIds.includes(id));
  const noIncorrectSelected = selectedOptionIds.every(id => correctOptionIds.includes(id));
  
  if (allCorrectSelected && noIncorrectSelected) {
    return `Great job! You correctly selected all ${correctOptionIds.length} correct options. ${question.explanation || ''}`;
  }
  
  // Calculate what was missed and what was incorrectly selected
  const missedCorrectIds = correctOptionIds.filter(id => !selectedOptionIds.includes(id));
  const incorrectlySelectedIds = selectedOptionIds.filter(id => !correctOptionIds.includes(id));
  
  let analysis = '';
  
  if (missedCorrectIds.length > 0) {
    const missedOptions = question.options.filter(o => missedCorrectIds.includes(o.id));
    analysis += `You missed ${missedCorrectIds.length} correct option(s): ${missedOptions.map(o => `"${o.text}"`).join(', ')}. `;
  }
  
  if (incorrectlySelectedIds.length > 0) {
    const incorrectOptions = question.options.filter(o => incorrectlySelectedIds.includes(o.id));
    analysis += `You incorrectly selected ${incorrectlySelectedIds.length} option(s): ${incorrectOptions.map(o => `"${o.text}"`).join(', ')}. `;
  }
  
  analysis += `The correct options are: ${correctOptions.map(o => `"${o.text}"`).join(', ')}. `;
  
  if (question.explanation) {
    analysis += question.explanation;
  }
  
  return analysis;
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
  const fullyCorrectCount = questionResults.filter(r => r.isCorrect).length;
  const partiallyCorrectCount = questionResults.filter(r => !r.isCorrect && r.points > 0).length;
  const incorrectCount = questionResults.filter(r => r.points === 0).length;
  const totalCount = questionResults.length;
  
  let feedback = '';
  
  if (passed) {
    if (percentage === 100) {
      feedback = `Perfect score! You answered all ${totalCount} questions completely correctly.`;
    } else if (fullyCorrectCount === totalCount) {
      feedback = `Great job! You answered all ${totalCount} questions correctly.`;
    } else {
      feedback = `Good job! You got ${fullyCorrectCount} questions completely correct and ${partiallyCorrectCount} partially correct (${Math.round(percentage)}%).`;
    }
  } else {
    feedback = `You got ${fullyCorrectCount} questions completely correct, ${partiallyCorrectCount} partially correct, and ${incorrectCount} incorrect (${Math.round(percentage)}%). Keep practicing to improve your score.`;
  }
  
  // Add suggestions for improvement if they didn't get a perfect score
  if (percentage < 100) {
    feedback += ' Review the explanations for the questions you missed to improve your understanding.';
  }
  
  return feedback;
}
