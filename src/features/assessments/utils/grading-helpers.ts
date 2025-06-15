import { Question, QuestionType } from '../types/question';
import { GradingResult, QuestionGradingResult, Rubric, RubricCriterion } from '../types/grading';
import { getGradeFromPercentage } from '../constants/grading-scales';

/**
 * Helper functions for grading assessments
 */

/**
 * Grade a multiple choice question
 * @param question The question to grade
 * @param answer The student's answer (choice ID)
 * @returns Grading result for the question
 */
export function gradeMultipleChoiceQuestion(
  question: Question,
  answer: string
): QuestionGradingResult {
  const { id, points = 1, bloomsLevel } = question;

  // Type guard to ensure we're working with a multiple choice question
  if (question.type !== QuestionType.MULTIPLE_CHOICE || !('choices' in question)) {
    return {
      questionId: id || '',
      score: 0,
      maxScore: points,
      percentage: 0,
      feedback: 'Invalid question type',
      bloomsLevel,
    };
  }

  // Find the selected choice
  const selectedChoice = question.choices.find(choice => choice.id === answer);

  // Find the correct choice
  const correctChoice = question.choices.find(choice => choice.isCorrect);

  // Calculate score
  const isCorrect = selectedChoice?.isCorrect || false;
  const score = isCorrect ? points : 0;

  // Generate feedback
  let feedback = '';
  if (!isCorrect) {
    feedback = `Incorrect. The correct answer is: ${correctChoice?.text || 'Not available'}`;
  }

  return {
    questionId: id || '',
    score,
    maxScore: points,
    percentage: isCorrect ? 100 : 0,
    feedback,
    bloomsLevel,
  };
}

/**
 * Grade a true/false question
 * @param question The question to grade
 * @param answer The student's answer (boolean)
 * @returns Grading result for the question
 */
export function gradeTrueFalseQuestion(
  question: Question,
  answer: boolean
): QuestionGradingResult {
  const { id, points = 1, bloomsLevel } = question;

  // Type guard to ensure we're working with a true/false question
  if (question.type !== QuestionType.TRUE_FALSE || !('correctAnswer' in question)) {
    return {
      questionId: id || '',
      score: 0,
      maxScore: points,
      percentage: 0,
      feedback: 'Invalid question type',
      bloomsLevel,
    };
  }

  // Get the correct answer
  const correctAnswer = question.correctAnswer;

  // Calculate score
  const isCorrect = answer === correctAnswer;
  const score = isCorrect ? points : 0;

  // Generate feedback
  let feedback = '';
  if (!isCorrect) {
    feedback = `Incorrect. The correct answer is: ${correctAnswer ? 'True' : 'False'}`;
  }

  return {
    questionId: id || '',
    score,
    maxScore: points,
    percentage: isCorrect ? 100 : 0,
    feedback,
    bloomsLevel,
  };
}

/**
 * Grade an essay question using a rubric
 * @param question The question to grade
 * @param answer The student's answer (text)
 * @param rubricGrading The rubric grading data
 * @returns Grading result for the question
 */
export function gradeEssayQuestion(
  question: Question,
  _answer: string, // Unused parameter, but kept for API consistency
  rubricGrading: { criterionId: string; levelId: string; points: number; feedback?: string }[]
): QuestionGradingResult {
  const { id, points = 1, bloomsLevel } = question;

  // Type guard to ensure we're working with an essay question
  if (question.type !== QuestionType.ESSAY) {
    return {
      questionId: id || '',
      score: 0,
      maxScore: points,
      percentage: 0,
      feedback: 'Invalid question type',
      bloomsLevel,
    };
  }

  // If no rubric grading provided, return zero score
  if (!rubricGrading || rubricGrading.length === 0) {
    return {
      questionId: id || '',
      score: 0,
      maxScore: points,
      percentage: 0,
      feedback: 'No grading provided',
      bloomsLevel,
    };
  }

  // Calculate total score from rubric
  const totalScore = rubricGrading.reduce((sum, item) => sum + item.points, 0);

  // Calculate percentage
  const percentage = Math.round((totalScore / points) * 100);

  // Combine feedback from all criteria
  const feedback = rubricGrading
    .filter(item => item.feedback)
    .map(item => item.feedback)
    .join('\n');

  return {
    questionId: id || '',
    score: totalScore,
    maxScore: points,
    percentage,
    feedback,
    bloomsLevel,
  };
}

/**
 * Grade an assessment using a rubric
 * @param questions The questions in the assessment
 * @param answers The student's answers
 * @param rubric Optional rubric for essay questions
 * @returns Grading result for the assessment
 */
export function gradeAssessment(
  questions: Question[],
  answers: Record<string, any>,
  _rubric?: Rubric // Unused parameter, but kept for API consistency
): GradingResult {
  // Initialize results
  const questionResults: QuestionGradingResult[] = [];
  let totalScore = 0;
  let totalMaxScore = 0;
  const bloomsLevelScores: Record<string, number> = {};

  // Grade each question
  questions.forEach(question => {
    const answer = answers[question.id || ''];
    let result: QuestionGradingResult;

    // Skip if no answer provided
    if (answer === undefined) {
      result = {
        questionId: question.id || '',
        score: 0,
        maxScore: question.points || 1,
        percentage: 0,
        feedback: 'No answer provided',
        bloomsLevel: question.bloomsLevel,
      };
    } else {
      // Grade based on question type
      switch (question.type) {
        case QuestionType.MULTIPLE_CHOICE:
          result = gradeMultipleChoiceQuestion(question, answer);
          break;
        case QuestionType.TRUE_FALSE:
          result = gradeTrueFalseQuestion(question, answer);
          break;
        // Add other question types as needed
        default:
          result = {
            questionId: question.id || '',
            score: 0,
            maxScore: question.points || 1,
            percentage: 0,
            feedback: 'Grading not implemented for this question type',
            bloomsLevel: question.bloomsLevel,
          };
      }
    }

    // Add to results
    questionResults.push(result);
    totalScore += result.score;
    totalMaxScore += result.maxScore;

    // Track scores by Bloom's level
    if (result.bloomsLevel) {
      bloomsLevelScores[result.bloomsLevel] = (bloomsLevelScores[result.bloomsLevel] || 0) + result.score;
    }
  });

  // Calculate overall percentage
  const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  // Determine if passed (default passing score is 60%)
  const passed = percentage >= 60;

  return {
    score: totalScore,
    maxScore: totalMaxScore,
    percentage,
    passed,
    questionResults,
    bloomsLevelScores: Object.keys(bloomsLevelScores).length > 0 ? bloomsLevelScores : undefined,
  };
}

/**
 * Generate feedback based on performance level
 * @param percentage The percentage score
 * @param bloomsLevelScores Scores by Bloom's level
 * @returns Feedback string
 */
export function generateFeedback(
  percentage: number,
  bloomsLevelScores?: Record<string, number>
): string {
  // Get grade level
  const gradeLevel = getGradeFromPercentage(percentage);

  // Base feedback on grade level
  let feedback = '';

  if (gradeLevel) {
    if (percentage >= 90) {
      feedback = 'Excellent work! You have demonstrated a thorough understanding of the material.';
    } else if (percentage >= 80) {
      feedback = 'Good job! You have a solid grasp of most concepts.';
    } else if (percentage >= 70) {
      feedback = 'Satisfactory work. You understand the basic concepts but could improve in some areas.';
    } else if (percentage >= 60) {
      feedback = 'You have passed, but there are significant areas that need improvement.';
    } else {
      feedback = 'You need to review the material and try again. Focus on understanding the core concepts.';
    }
  }

  // Add Bloom's level feedback if available
  if (bloomsLevelScores && Object.keys(bloomsLevelScores).length > 0) {
    feedback += '\n\nBreakdown by cognitive level:';

    // Find strongest and weakest areas
    const levels = Object.entries(bloomsLevelScores);
    const strongest = levels.reduce((prev, curr) => prev[1] > curr[1] ? prev : curr);
    const weakest = levels.reduce((prev, curr) => prev[1] < curr[1] ? prev : curr);

    feedback += `\n- Strongest in ${strongest[0]} level tasks`;
    feedback += `\n- Needs improvement in ${weakest[0]} level tasks`;
  }

  return feedback;
}
