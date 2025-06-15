'use client';

import { SequenceActivity, SequenceQuestion, SequenceItem, kendallTauDistance } from '../models/sequence';
import { GradingResult, QuestionResult } from '../models/base';

/**
 * Grade a sequence activity
 * 
 * This function evaluates student answers for a sequence activity
 * and returns detailed results including scores, feedback, and analysis.
 * 
 * @param activity The sequence activity to grade
 * @param answers Record of question IDs to arrays of item IDs in the student's order
 * @returns Detailed grading results
 */
export function gradeSequenceActivity(
  activity: SequenceActivity,
  answers: Record<string, string[]>
): GradingResult {
  // Initialize results
  let score = 0;
  let maxScore = 0;
  const questionResults: QuestionResult[] = [];
  
  // Process each question
  for (const question of activity.questions) {
    const questionId = question.id;
    const items = question.items;
    
    // Get the student's answer for this question
    const studentItemIds = answers[questionId] || [];
    
    // Calculate points per item if partial credit is allowed
    const maxPoints = question.points || items.length;
    maxScore += maxPoints;
    
    // Map student's sequence to correct positions
    const studentSequence = studentItemIds.map(itemId => {
      const item = items.find(i => i.id === itemId);
      return item ? item.correctPosition : -1;
    }).filter(pos => pos !== -1);
    
    // Calculate correctness
    const correctSequence = items.map(item => item.correctPosition).sort((a, b) => a - b);
    const isFullyCorrect = arraysEqual(studentSequence, correctSequence);
    
    // Calculate question score
    let questionScore = 0;
    if (isFullyCorrect) {
      // Full credit for fully correct sequence
      questionScore = maxPoints;
    } else if ((question.partialCredit || activity.settings?.allowPartialCredit) && studentSequence.length > 0) {
      // Calculate partial credit based on Kendall tau distance
      const distance = kendallTauDistance(studentSequence, correctSequence);
      questionScore = Math.round((1 - distance) * maxPoints);
    }
    
    // Add to total score
    score += questionScore;
    
    // Create detailed result with feedback
    questionResults.push({
      questionId,
      isCorrect: isFullyCorrect,
      points: questionScore,
      maxPoints,
      selectedOptionId: JSON.stringify(studentItemIds),
      correctOptionId: JSON.stringify(items.sort((a, b) => a.correctPosition - b.correctPosition).map(item => item.id)),
      feedback: generateFeedbackForQuestion(question, studentItemIds),
      explanation: question.explanation || '',
      answerAnalysis: generateAnswerAnalysis(question, studentItemIds)
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
 * Generate feedback for a question based on the student's sequence
 * 
 * @param question The question being analyzed
 * @param studentItemIds The student's sequence of item IDs
 * @returns Combined feedback for the question
 */
function generateFeedbackForQuestion(
  question: SequenceQuestion,
  studentItemIds: string[]
): string {
  if (studentItemIds.length === 0) {
    return "You didn't provide an answer for this question.";
  }
  
  // Map student's sequence to items
  const studentItems = studentItemIds.map(itemId => 
    question.items.find(item => item.id === itemId)
  ).filter((item): item is SequenceItem => item !== undefined);
  
  // Check if the sequence is fully correct
  const correctItems = [...question.items].sort((a, b) => a.correctPosition - b.correctPosition);
  const isFullyCorrect = studentItems.length === correctItems.length && 
                         studentItems.every((item, index) => item.correctPosition === correctItems[index].correctPosition);
  
  if (isFullyCorrect) {
    return "Your sequence is correct!";
  }
  
  // Generate feedback for incorrect sequence
  let feedback = "Your sequence has some issues:\n";
  
  studentItems.forEach((item, index) => {
    const correctPosition = item.correctPosition;
    if (correctPosition !== index) {
      feedback += `- "${item.text}" should be in position ${correctPosition + 1} (you placed it at position ${index + 1}).\n`;
    }
    
    // Add item-specific feedback if available
    if (item.feedback) {
      feedback += `  ${item.feedback}\n`;
    }
  });
  
  return feedback;
}

/**
 * Generate detailed analysis for an answer
 * 
 * This function creates a personalized analysis of the student's answer
 * based on the question and their sequence.
 * 
 * @param question The question being analyzed
 * @param studentItemIds The student's sequence of item IDs
 * @returns Personalized answer analysis
 */
function generateAnswerAnalysis(
  question: SequenceQuestion, 
  studentItemIds: string[]
): string {
  if (studentItemIds.length === 0) {
    return "You didn't provide an answer for this question.";
  }
  
  // Map student's sequence to items
  const studentItems = studentItemIds.map(itemId => 
    question.items.find(item => item.id === itemId)
  ).filter((item): item is SequenceItem => item !== undefined);
  
  // Check if the sequence is fully correct
  const correctItems = [...question.items].sort((a, b) => a.correctPosition - b.correctPosition);
  const isFullyCorrect = studentItems.length === correctItems.length && 
                         studentItems.every((item, index) => item.correctPosition === correctItems[index].correctPosition);
  
  let analysis = '';
  
  if (isFullyCorrect) {
    analysis = `Great job! You correctly arranged all ${correctItems.length} items in the proper sequence. `;
  } else {
    // Count correctly positioned items
    const correctlyPositioned = studentItems.filter((item, index) => item.correctPosition === index);
    
    analysis = `You correctly positioned ${correctlyPositioned.length} out of ${correctItems.length} items. `;
    
    // Show the correct sequence
    analysis += "The correct sequence is:\n";
    correctItems.forEach((item, index) => {
      analysis += `${index + 1}. ${item.text}\n`;
    });
  }
  
  if (question.explanation) {
    analysis += `\n${question.explanation}`;
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
      feedback = `Perfect score! You arranged all sequences correctly.`;
    } else {
      feedback = `Good job! You got ${fullyCorrectCount} sequences completely correct and ${partiallyCorrectCount} partially correct (${Math.round(percentage)}%).`;
    }
  } else {
    feedback = `You got ${fullyCorrectCount} sequences completely correct, ${partiallyCorrectCount} partially correct, and ${incorrectCount} incorrect (${Math.round(percentage)}%). Keep practicing to improve your score.`;
  }
  
  // Add suggestions for improvement if they didn't get a perfect score
  if (percentage < 100) {
    feedback += ' Review the explanations for the sequences you missed to improve your understanding.';
  }
  
  return feedback;
}

/**
 * Check if two arrays are equal
 * 
 * @param arr1 First array
 * @param arr2 Second array
 * @returns Whether the arrays are equal
 */
function arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  
  return true;
}
