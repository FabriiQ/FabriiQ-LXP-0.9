 'use client';

import { MatchingActivity, MatchingQuestion, MatchingPair } from '../models/matching';
import { GradingResult, QuestionResult } from '../models/base';

/**
 * Grade a matching activity
 * 
 * This function evaluates student answers for a matching activity
 * and returns detailed results including scores, feedback, and analysis.
 * 
 * @param activity The matching activity to grade
 * @param answers Record of left item IDs to right item IDs
 * @returns Detailed grading results
 */
export function gradeMatchingActivity(
  activity: MatchingActivity,
  answers: Record<string, string>
): GradingResult {
  // Initialize results
  let score = 0;
  let maxScore = 0;
  const questionResults: QuestionResult[] = [];
  
  // Process each question
  for (const question of activity.questions) {
    const questionId = question.id;
    const pairs = question.pairs;
    
    // Calculate points per pair if partial credit is allowed
    const pointsPerPair = question.partialCredit ? 
      (question.points || pairs.length) / pairs.length : 
      question.points || pairs.length;
    
    // Add to max score
    const maxPoints = question.points || pairs.length;
    maxScore += maxPoints;
    
    // Track correct pairs
    let correctPairCount = 0;
    const pairResults: { 
      leftItemId: string, 
      rightItemId: string, 
      studentRightItemId: string, 
      isCorrect: boolean 
    }[] = [];
    
    // Check each pair
    for (const pair of pairs) {
      const leftItemId = pair.leftItem.id;
      const correctRightItemId = pair.rightItem.id;
      const studentRightItemId = answers[leftItemId] || '';
      const isCorrect = studentRightItemId === correctRightItemId;
      
      if (isCorrect) {
        correctPairCount++;
      }
      
      pairResults.push({
        leftItemId,
        rightItemId: correctRightItemId,
        studentRightItemId,
        isCorrect
      });
    }
    
    // Calculate question score
    let questionScore = 0;
    if (question.partialCredit || activity.settings?.allowPartialCredit) {
      // Partial credit: points per correct pair
      questionScore = correctPairCount * pointsPerPair;
    } else {
      // All or nothing: full points only if all pairs are correct
      questionScore = correctPairCount === pairs.length ? maxPoints : 0;
    }
    
    // Add to total score
    score += questionScore;
    
    // Create detailed result with feedback
    questionResults.push({
      questionId,
      isCorrect: correctPairCount === pairs.length,
      points: questionScore,
      maxPoints,
      selectedOptionId: JSON.stringify(answers),
      correctOptionId: JSON.stringify(Object.fromEntries(
        pairs.map(pair => [pair.leftItem.id, pair.rightItem.id])
      )),
      feedback: generateFeedbackForQuestion(question, pairResults),
      explanation: question.explanation || '',
      answerAnalysis: generateAnswerAnalysis(question, pairResults)
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
 * Generate feedback for a question based on pair results
 * 
 * @param question The question being analyzed
 * @param pairResults Results for each pair
 * @returns Combined feedback for the question
 */
function generateFeedbackForQuestion(
  question: MatchingQuestion,
  pairResults: { leftItemId: string, rightItemId: string, studentRightItemId: string, isCorrect: boolean }[]
): string {
  if (pairResults.length === 0) {
    return "You didn't provide any answers for this question.";
  }
  
  // Collect feedback for each pair
  const feedbackItems: string[] = [];
  
  for (const result of pairResults) {
    const pair = question.pairs.find(p => p.leftItem.id === result.leftItemId);
    if (!pair) continue;
    
    if (result.isCorrect) {
      if (pair.feedback) {
        feedbackItems.push(pair.feedback);
      }
    } else {
      const studentPair = question.pairs.find(p => p.rightItem.id === result.studentRightItemId);
      feedbackItems.push(
        `You matched "${pair.leftItem.text}" with "${studentPair?.rightItem.text || 'nothing'}", ` +
        `but it should be matched with "${pair.rightItem.text}".`
      );
    }
  }
  
  // If no specific feedback is available, provide a generic message
  if (feedbackItems.length === 0) {
    const allCorrect = pairResults.every(result => result.isCorrect);
    return allCorrect 
      ? "All your matches are correct!" 
      : "Some of your matches are incorrect.";
  }
  
  return feedbackItems.join('\n');
}

/**
 * Generate detailed analysis for an answer
 * 
 * This function creates a personalized analysis of the student's answer
 * based on the question and their matches.
 * 
 * @param question The question being analyzed
 * @param pairResults Results for each pair
 * @returns Personalized answer analysis
 */
function generateAnswerAnalysis(
  question: MatchingQuestion, 
  pairResults: { leftItemId: string, rightItemId: string, studentRightItemId: string, isCorrect: boolean }[]
): string {
  if (pairResults.length === 0) {
    return "You didn't provide any answers for this question.";
  }
  
  const correctCount = pairResults.filter(result => result.isCorrect).length;
  const totalCount = pairResults.length;
  
  let analysis = '';
  
  if (correctCount === totalCount) {
    analysis = `Great job! You correctly matched all ${totalCount} pairs. `;
  } else {
    analysis = `You correctly matched ${correctCount} out of ${totalCount} pairs. `;
    
    // Add details about incorrect matches
    const incorrectResults = pairResults.filter(result => !result.isCorrect);
    if (incorrectResults.length > 0) {
      analysis += 'Here are the correct matches for the items you missed: ';
      
      incorrectResults.forEach((result, index) => {
        const pair = question.pairs.find(p => p.leftItem.id === result.leftItemId);
        if (!pair) return;
        
        const studentPair = question.pairs.find(p => p.rightItem.id === result.studentRightItemId);
        
        analysis += `"${pair.leftItem.text}" should be matched with "${pair.rightItem.text}" ` +
                   `(you matched it with "${studentPair?.rightItem.text || 'nothing'}")`;
        
        if (index < incorrectResults.length - 1) {
          analysis += ', ';
        }
      });
      
      analysis += '. ';
    }
  }
  
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
  // Count total pairs across all questions
  const totalPairs = questionResults.reduce((total, result) => {
    try {
      const correctMatches = JSON.parse(result.correctOptionId || '{}');
      return total + Object.keys(correctMatches).length;
    } catch (e) {
      return total;
    }
  }, 0);
  
  // Count correct pairs
  const correctPairs = questionResults.reduce((total, result) => {
    if (result.isCorrect) {
      try {
        const correctMatches = JSON.parse(result.correctOptionId || '{}');
        return total + Object.keys(correctMatches).length;
      } catch (e) {
        return total;
      }
    }
    
    // For partially correct questions, calculate based on the points ratio
    return total + (result.points / result.maxPoints) * Object.keys(JSON.parse(result.correctOptionId || '{}')).length;
  }, 0);
  
  let feedback = '';
  
  if (passed) {
    if (percentage === 100) {
      feedback = `Perfect score! You correctly matched all ${totalPairs} pairs.`;
    } else {
      feedback = `Good job! You correctly matched about ${Math.round(correctPairs)} out of ${totalPairs} pairs (${Math.round(percentage)}%).`;
    }
  } else {
    feedback = `You correctly matched about ${Math.round(correctPairs)} out of ${totalPairs} pairs (${Math.round(percentage)}%). Keep practicing to improve your score.`;
  }
  
  // Add suggestions for improvement if they didn't get a perfect score
  if (percentage < 100) {
    feedback += ' Review the explanations for the questions you missed to improve your understanding.';
  }
  
  return feedback;
}
