'use client';

import {
  FillInTheBlanksActivity,
  FillInTheBlanksQuestion,
  FillInTheBlanksBlank
} from '../models/fill-in-the-blanks';
import { GradingResult, QuestionResult } from '../models/base';

/**
 * Grade a fill in the blanks activity
 *
 * This function evaluates student answers for a fill in the blanks activity
 * and returns detailed results including scores, feedback, and analysis.
 *
 * @param activity The fill in the blanks activity to grade
 * @param answers Record of blank IDs to student answers
 * @returns Detailed grading results
 */
export function gradeFillInTheBlanksActivity(
  activity: FillInTheBlanksActivity,
  answers: Record<string, string>
): GradingResult {
  // Initialize results
  let score = 0;
  let maxScore = 0;
  const questionResults: QuestionResult[] = [];

  // Process each question
  for (const question of activity.questions) {
    const questionId = question.id;
    const blanks = question.blanks;

    // Calculate points per blank if partial credit is allowed
    const pointsPerBlank = question.partialCredit ?
      (question.points || blanks.length) / blanks.length :
      question.points || blanks.length;

    // Add to max score
    const maxPoints = question.points || blanks.length;
    maxScore += maxPoints;

    // Track correct blanks
    let correctBlankCount = 0;
    const blankResults: { blankId: string, isCorrect: boolean, studentAnswer: string, correctAnswers: string[] }[] = [];

    // Check each blank
    for (const blank of blanks) {
      const blankId = blank.id;
      const studentAnswer = answers[blankId] || '';
      const isCorrect = isBlankCorrect(blank, studentAnswer, activity.settings?.caseSensitiveByDefault);

      if (isCorrect) {
        correctBlankCount++;
      }

      blankResults.push({
        blankId,
        isCorrect,
        studentAnswer,
        correctAnswers: blank.correctAnswers
      });
    }

    // Calculate question score
    let questionScore = 0;
    if (question.partialCredit || activity.settings?.allowPartialCredit) {
      // Partial credit: points per correct blank
      questionScore = correctBlankCount * pointsPerBlank;
    } else {
      // All or nothing: full points only if all blanks are correct
      questionScore = correctBlankCount === blanks.length ? maxPoints : 0;
    }

    // Add to total score
    score += questionScore;

    // Create detailed result with feedback
    questionResults.push({
      questionId,
      isCorrect: correctBlankCount === blanks.length,
      points: questionScore,
      maxPoints,
      selectedOptionId: JSON.stringify(Object.fromEntries(
        blankResults.map(result => [result.blankId, result.studentAnswer])
      )),
      correctOptionId: JSON.stringify(Object.fromEntries(
        blankResults.map(result => [result.blankId, result.correctAnswers[0]])
      )),
      feedback: generateFeedbackForQuestion(question, blankResults),
      explanation: question.explanation || '',
      answerAnalysis: generateAnswerAnalysis(question, blankResults),
      blankResults: blankResults // Include the blank results for the component
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
 * Check if a student's answer for a blank is correct
 *
 * @param blank The blank to check
 * @param studentAnswer The student's answer
 * @param defaultCaseSensitive Default case sensitivity setting
 * @returns Whether the answer is correct
 */
function isBlankCorrect(
  blank: FillInTheBlanksBlank,
  studentAnswer: string,
  defaultCaseSensitive?: boolean
): boolean {
  // If the student didn't provide an answer, it's incorrect
  if (!studentAnswer) return false;

  // Determine case sensitivity
  const caseSensitive = blank.caseSensitive !== undefined ?
    blank.caseSensitive :
    defaultCaseSensitive || false;

  // Check against all correct answers
  return blank.correctAnswers.some(correctAnswer => {
    if (caseSensitive) {
      return studentAnswer === correctAnswer;
    } else {
      return studentAnswer.toLowerCase() === correctAnswer.toLowerCase();
    }
  });
}

/**
 * Generate feedback for a question based on blank results
 *
 * @param question The question being analyzed
 * @param blankResults Results for each blank
 * @returns Combined feedback for the question
 */
function generateFeedbackForQuestion(
  question: FillInTheBlanksQuestion,
  blankResults: { blankId: string, isCorrect: boolean, studentAnswer: string, correctAnswers: string[] }[]
): string {
  if (blankResults.length === 0) {
    return "You didn't provide any answers for this question.";
  }

  // Collect feedback for each blank
  const feedbackItems: string[] = [];

  for (const result of blankResults) {
    const blank = question.blanks.find(b => b.id === result.blankId);
    if (!blank) continue;

    if (result.isCorrect) {
      if (blank.feedback) {
        feedbackItems.push(blank.feedback);
      }
    } else {
      feedbackItems.push(`The correct answer for this blank is "${blank.correctAnswers[0]}". You entered "${result.studentAnswer}".`);
    }
  }

  // If no specific feedback is available, provide a generic message
  if (feedbackItems.length === 0) {
    const allCorrect = blankResults.every(result => result.isCorrect);
    return allCorrect
      ? "All your answers are correct!"
      : "Some of your answers are incorrect.";
  }

  return feedbackItems.join('\n');
}

/**
 * Generate detailed analysis for an answer
 *
 * This function creates a personalized analysis of the student's answer
 * based on the question and their responses.
 *
 * @param question The question being analyzed
 * @param blankResults Results for each blank
 * @returns Personalized answer analysis
 */
function generateAnswerAnalysis(
  question: FillInTheBlanksQuestion,
  blankResults: { blankId: string, isCorrect: boolean, studentAnswer: string, correctAnswers: string[] }[]
): string {
  if (blankResults.length === 0) {
    return "You didn't provide any answers for this question.";
  }

  const correctCount = blankResults.filter(result => result.isCorrect).length;
  const totalCount = blankResults.length;

  let analysis = '';

  if (correctCount === totalCount) {
    analysis = `Great job! You correctly filled in all ${totalCount} blanks. `;
  } else {
    analysis = `You correctly filled in ${correctCount} out of ${totalCount} blanks. `;

    // Add details about incorrect answers
    const incorrectResults = blankResults.filter(result => !result.isCorrect);
    if (incorrectResults.length > 0) {
      analysis += 'Here are the correct answers for the blanks you missed: ';

      incorrectResults.forEach((result, index) => {
        const blank = question.blanks.find(b => b.id === result.blankId);
        if (!blank) return;

        const blankIndex = question.blanks.findIndex(b => b.id === result.blankId);

        analysis += `Blank ${blankIndex + 1}: "${blank.correctAnswers[0]}" (you entered "${result.studentAnswer}")`;

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
  const totalBlanks = questionResults.reduce((total, result) => {
    // Count the number of blanks in the selectedOptionId (which is a JSON string)
    try {
      const selectedAnswers = JSON.parse(result.selectedOptionId || '{}');
      return total + Object.keys(selectedAnswers).length;
    } catch (e) {
      return total;
    }
  }, 0);

  const correctBlanks = questionResults.reduce((total, result) => {
    // If the question is fully correct, add all its blanks
    if (result.isCorrect) {
      try {
        const selectedAnswers = JSON.parse(result.selectedOptionId || '{}');
        return total + Object.keys(selectedAnswers).length;
      } catch (e) {
        return total;
      }
    }

    // Otherwise, calculate based on the points ratio
    return total + (result.points / result.maxPoints) * Object.keys(JSON.parse(result.selectedOptionId || '{}')).length;
  }, 0);

  let feedback = '';

  if (passed) {
    if (percentage === 100) {
      feedback = `Perfect score! You correctly filled in all ${totalBlanks} blanks.`;
    } else {
      feedback = `Good job! You correctly filled in about ${Math.round(correctBlanks)} out of ${totalBlanks} blanks (${Math.round(percentage)}%).`;
    }
  } else {
    feedback = `You correctly filled in about ${Math.round(correctBlanks)} out of ${totalBlanks} blanks (${Math.round(percentage)}%). Keep practicing to improve your score.`;
  }

  // Add suggestions for improvement if they didn't get a perfect score
  if (percentage < 100) {
    feedback += ' Review the explanations for the questions you missed to improve your understanding.';
  }

  return feedback;
}
