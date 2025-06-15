'use client';

/**
 * Quiz Activity Grading
 *
 * This file contains functions for grading quiz activities.
 */

import { QuizActivity, QuizQuestion } from '../models/quiz';
import { GradingResult, QuestionResult } from '../models/base';
import { isNumericAnswerCorrect } from '../models/numeric';

/**
 * Grade a quiz activity
 *
 * @param activity The activity to grade
 * @param answers The student's answers (question ID to answer mapping)
 * @returns Grading result
 */
export function gradeQuizActivity(
  activity: QuizActivity,
  answers: Record<string, any>
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
    
    // Skip if no answer provided
    if (answer === undefined) {
      totalPoints += questionResult.maxPoints;
      questionResults.push(questionResult);
      return;
    }
    
    // Grade based on question type
    switch (question.type) {
      case 'multiple-choice':
        // Check if the selected option is correct
        if (question.options) {
          const selectedOption = question.options.find(opt => opt.id === answer);
          if (selectedOption && selectedOption.isCorrect) {
            questionResult.isCorrect = true;
            questionResult.points = questionResult.maxPoints;
          }
        }
        break;
        
      case 'true-false':
        // Check if the answer matches the correct value
        if (answer === question.isTrue) {
          questionResult.isCorrect = true;
          questionResult.points = questionResult.maxPoints;
        }
        break;
        
      case 'multiple-response':
        // Check if all selected options are correct and all correct options are selected
        if (Array.isArray(answer) && question.options) {
          const correctOptions = question.options.filter(opt => opt.isCorrect);
          const correctOptionIds = correctOptions.map(opt => opt.id);
          
          const allSelectedAreCorrect = answer.every(id => correctOptionIds.includes(id));
          const allCorrectAreSelected = correctOptionIds.every(id => answer.includes(id));
          
          if (allSelectedAreCorrect && allCorrectAreSelected) {
            questionResult.isCorrect = true;
            questionResult.points = questionResult.maxPoints;
          } else if (activity.settings?.allowPartialCredit && allSelectedAreCorrect) {
            // Partial credit for selecting some correct options without any wrong ones
            questionResult.points = (answer.length / correctOptionIds.length) * questionResult.maxPoints;
          }
        }
        break;
        
      case 'fill-in-the-blanks':
        // Check if all blanks are filled correctly
        if (typeof answer === 'object' && question.blanks) {
          let correctBlanks = 0;
          
          question.blanks.forEach(blank => {
            const blankAnswer = answer[blank.id];
            if (blankAnswer && blank.acceptableAnswers.some(
              acceptable => blankAnswer.toLowerCase() === acceptable.toLowerCase()
            )) {
              correctBlanks++;
            }
          });
          
          if (correctBlanks === question.blanks.length) {
            questionResult.isCorrect = true;
            questionResult.points = questionResult.maxPoints;
          } else if (activity.settings?.allowPartialCredit) {
            // Partial credit for some correct blanks
            questionResult.points = (correctBlanks / question.blanks.length) * questionResult.maxPoints;
          }
        }
        break;
        
      case 'matching':
        // Check if all pairs are matched correctly
        if (typeof answer === 'object' && question.matchingPairs) {
          let correctMatches = 0;
          
          question.matchingPairs.forEach(pair => {
            if (answer[pair.left] === pair.right) {
              correctMatches++;
            }
          });
          
          if (correctMatches === question.matchingPairs.length) {
            questionResult.isCorrect = true;
            questionResult.points = questionResult.maxPoints;
          } else if (activity.settings?.allowPartialCredit) {
            // Partial credit for some correct matches
            questionResult.points = (correctMatches / question.matchingPairs.length) * questionResult.maxPoints;
          }
        }
        break;
        
      case 'sequence':
        // Check if the sequence is correct
        if (Array.isArray(answer) && question.sequenceItems) {
          const correctOrder = [...question.sequenceItems]
            .sort((a, b) => a.correctPosition - b.correctPosition)
            .map(item => item.id);
          
          const isCorrectSequence = answer.every((id, index) => id === correctOrder[index]);
          
          if (isCorrectSequence) {
            questionResult.isCorrect = true;
            questionResult.points = questionResult.maxPoints;
          } else if (activity.settings?.allowPartialCredit) {
            // Count correct positions
            let correctPositions = 0;
            answer.forEach((id, index) => {
              if (id === correctOrder[index]) {
                correctPositions++;
              }
            });
            
            questionResult.points = (correctPositions / correctOrder.length) * questionResult.maxPoints;
          }
        }
        break;
        
      case 'numeric':
        // Check if the numeric answer is correct
        if (typeof answer === 'number' && question.correctAnswer !== undefined) {
          if (question.acceptableRange) {
            if (answer >= question.acceptableRange.min && answer <= question.acceptableRange.max) {
              questionResult.isCorrect = true;
              questionResult.points = questionResult.maxPoints;
            }
          } else if (answer === question.correctAnswer) {
            questionResult.isCorrect = true;
            questionResult.points = questionResult.maxPoints;
          }
        }
        break;
        
      default:
        // Unknown question type
        break;
    }
    
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
