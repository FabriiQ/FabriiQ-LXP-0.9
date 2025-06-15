/**
 * Server-side implementation of multiple response activity grading
 *
 * This file provides a server-side implementation of the multiple response
 * activity grading function to avoid client-side dependencies.
 *
 * IMPORTANT: This is a server-side function and should not be imported on the client.
 */

import { logger } from '@/server/api/utils/logger';

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
  activity: any,
  answers: Record<string, string[]>
): any {
  try {
    // Initialize results
    let score = 0;
    let maxScore = 0;
    const questionResults: any[] = [];

    // Process each question
    for (const question of activity.questions) {
      const questionId = question.id;
      const selectedOptionIds = answers[questionId] || [];
      const correctOptionIds = question.options.filter((o: any) => o.isCorrect).map((o: any) => o.id);

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

        // Calculate partial score based on correct selections minus penalties for incorrect selections
        const rawPartialScore = (correctSelections / correctOptionIds.length) -
          (incorrectSelections / Math.max(1, (totalOptions - correctOptionIds.length)));

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

    return {
      score,
      maxScore,
      percentage,
      passed,
      questionResults,
      overallFeedback,
      completedAt: new Date()
    };
  } catch (error) {
    logger.error('Error in server-side multiple response grading', { error });
    return {
      score: 0,
      maxScore: 0,
      percentage: 0,
      passed: false,
      questionResults: [],
      overallFeedback: 'An error occurred while grading this activity.',
      completedAt: new Date(),
      error: true
    };
  }
}

/**
 * Generate feedback for a question based on selected options
 */
function generateFeedbackForQuestion(
  question: any,
  selectedOptionIds: string[]
): string {
  if (selectedOptionIds.length === 0) {
    return "You didn't select any options for this question.";
  }

  // Collect feedback for each selected option
  const feedbackItems: string[] = [];

  for (const optionId of selectedOptionIds) {
    const option = question.options.find((o: any) => o.id === optionId);
    if (option && option.feedback) {
      feedbackItems.push(`${option.text}: ${option.feedback}`);
    }
  }

  // If no specific feedback is available, provide a generic message
  if (feedbackItems.length === 0) {
    const correctOptionIds = question.options.filter((o: any) => o.isCorrect).map((o: any) => o.id);
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
 */
function generateAnswerAnalysis(
  question: any,
  selectedOptionIds: string[]
): string {
  if (selectedOptionIds.length === 0) {
    return "You didn't select any options for this question.";
  }

  const correctOptionIds = question.options.filter((o: any) => o.isCorrect).map((o: any) => o.id);
  const correctOptions = question.options.filter((o: any) => o.isCorrect);

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
    const missedOptions = question.options.filter((o: any) => missedCorrectIds.includes(o.id));
    analysis += `You missed ${missedCorrectIds.length} correct option(s): ${missedOptions.map((o: any) => `"${o.text}"`).join(', ')}. `;
  }

  if (incorrectlySelectedIds.length > 0) {
    const incorrectOptions = question.options.filter((o: any) => incorrectlySelectedIds.includes(o.id));
    analysis += `You incorrectly selected ${incorrectlySelectedIds.length} option(s): ${incorrectOptions.map((o: any) => `"${o.text}"`).join(', ')}. `;
  }

  analysis += `The correct options are: ${correctOptions.map((o: any) => `"${o.text}"`).join(', ')}. `;

  if (question.explanation) {
    analysis += question.explanation;
  }

  return analysis;
}

/**
 * Generate overall feedback for the activity
 */
function generateOverallFeedback(
  percentage: number,
  passed: boolean,
  questionResults: any[]
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
