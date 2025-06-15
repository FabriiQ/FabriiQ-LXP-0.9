/**
 * Automatic grading utilities for assessments
 */
import { Question, QuestionType } from '../types/question';
import { GradingResult, AssessmentGradingResult } from '../types/grading';

/**
 * Grade a multiple choice question
 * @param question The question to grade
 * @param answer The student's answer (option ID)
 * @returns Grading result with score and feedback
 */
export function gradeMultipleChoiceQuestion(
  question: Question,
  answer: string
): GradingResult {
  // Default values
  const maxScore = question.points || 1;
  let score = 0;
  let feedback = '';

  // Ensure the question is a multiple choice question
  if (question.type !== QuestionType.MULTIPLE_CHOICE) {
    return {
      score: 0,
      maxScore,
      feedback: 'Invalid question type.',
      isCorrect: false,
      percentageScore: 0,
    };
  }

  // Find the selected option
  const selectedOption = question.choices.find(option => option.id === answer);

  // Check if the selected option is correct
  if (selectedOption?.isCorrect) {
    score = maxScore;
    feedback = 'Correct answer.';
  } else {
    score = 0;
    feedback = 'Incorrect answer.';

    // Add information about the correct answer if available
    const correctOption = question.choices.find(option => option.isCorrect);
    if (correctOption) {
      feedback += ` The correct answer is: ${correctOption.text}`;
    }
  }

  return {
    score,
    maxScore,
    feedback,
    isCorrect: score === maxScore,
    percentageScore: (score / maxScore) * 100,
  };
}

/**
 * Grade a true/false question
 * @param question The question to grade
 * @param answer The student's answer (true/false as string)
 * @returns Grading result with score and feedback
 */
export function gradeTrueFalseQuestion(
  question: Question,
  answer: string
): GradingResult {
  const maxScore = question.points || 1;
  let score = 0;
  let feedback = '';

  // Ensure the question is a true/false question
  if (question.type !== QuestionType.TRUE_FALSE) {
    return {
      score: 0,
      maxScore,
      feedback: 'Invalid question type.',
      isCorrect: false,
      percentageScore: 0,
    };
  }

  // Convert answer to boolean
  const studentAnswer = answer.toLowerCase() === 'true';

  // Check if the answer is correct
  if (studentAnswer === question.correctAnswer) {
    score = maxScore;
    feedback = 'Correct answer.';
  } else {
    score = 0;
    feedback = `Incorrect answer. The correct answer is ${question.correctAnswer ? 'True' : 'False'}.`;
  }

  return {
    score,
    maxScore,
    feedback,
    isCorrect: score === maxScore,
    percentageScore: (score / maxScore) * 100,
  };
}

/**
 * Grade a numeric question
 * @param question The question to grade
 * @param answer The student's answer (number as string)
 * @returns Grading result with score and feedback
 */
export function gradeNumericQuestion(
  question: Question,
  answer: string
): GradingResult {
  const maxScore = question.points || 1;
  let score = 0;
  let feedback = '';

  // Ensure the question is a numeric question
  if (question.type !== QuestionType.NUMERIC) {
    return {
      score: 0,
      maxScore,
      feedback: 'Invalid question type.',
      isCorrect: false,
      percentageScore: 0,
    };
  }

  // Parse the student's answer
  const studentAnswer = parseFloat(answer);

  // Check if the answer is valid
  if (isNaN(studentAnswer)) {
    return {
      score: 0,
      maxScore,
      feedback: 'Invalid answer. Please enter a number.',
      isCorrect: false,
      percentageScore: 0,
    };
  }

  // Check if the answer is correct (exact match or within tolerance)
  const correctAnswer = question.correctAnswer;
  const tolerance = question.tolerance || 0;

  if (
    Math.abs(studentAnswer - correctAnswer) <= tolerance
  ) {
    score = maxScore;
    feedback = 'Correct answer.';
  } else {
    score = 0;
    feedback = `Incorrect answer. The correct answer is ${correctAnswer}.`;
  }

  return {
    score,
    maxScore,
    feedback,
    isCorrect: score === maxScore,
    percentageScore: (score / maxScore) * 100,
  };
}

/**
 * Grade a short answer question
 * @param question The question to grade
 * @param answer The student's answer
 * @returns Grading result with score and feedback
 */
export function gradeShortAnswerQuestion(
  question: Question,
  answer: string
): GradingResult {
  const maxScore = question.points || 1;
  let score = 0;
  let feedback = '';

  // Ensure the question is a short answer question
  if (question.type !== QuestionType.SHORT_ANSWER) {
    return {
      score: 0,
      maxScore,
      feedback: 'Invalid question type.',
      isCorrect: false,
      percentageScore: 0,
    };
  }

  // Get the correct answers (may have multiple acceptable answers)
  const correctAnswers = question.acceptableAnswers
    ? [question.correctAnswer, ...question.acceptableAnswers]
    : [question.correctAnswer];

  // Check if the answer matches any of the correct answers
  const isCorrect = correctAnswers.some((correctAnswer: string) => {
    // Default to case-insensitive comparison
    return answer.toLowerCase() === correctAnswer.toLowerCase();
  });

  if (isCorrect) {
    score = maxScore;
    feedback = 'Correct answer.';
  } else {
    score = 0;
    feedback = 'Incorrect answer.';

    // Add information about the correct answer(s)
    if (correctAnswers.length === 1) {
      feedback += ` The correct answer is: ${correctAnswers[0]}`;
    } else {
      feedback += ` Acceptable answers include: ${correctAnswers.join(', ')}`;
    }
  }

  return {
    score,
    maxScore,
    feedback,
    isCorrect: score === maxScore,
    percentageScore: (score / maxScore) * 100,
  };
}

/**
 * Grade a question based on its type
 * @param question The question to grade
 * @param answer The student's answer
 * @returns Grading result with score and feedback
 */
export function gradeQuestion(question: Question, answer: any): GradingResult {
  switch (question.type) {
    case QuestionType.MULTIPLE_CHOICE:
      return gradeMultipleChoiceQuestion(question, answer);
    case QuestionType.TRUE_FALSE:
      return gradeTrueFalseQuestion(question, answer);
    case QuestionType.NUMERIC:
      return gradeNumericQuestion(question, answer);
    case QuestionType.SHORT_ANSWER:
      return gradeShortAnswerQuestion(question, answer);
    default:
      // For question types that require manual grading
      return {
        score: 0,
        maxScore: question.points || 1,
        feedback: 'This question requires manual grading.',
        isCorrect: false,
        percentageScore: 0,
        requiresManualGrading: true,
      };
  }
}

/**
 * Grade an entire assessment
 * @param questions The questions in the assessment
 * @param answers The student's answers
 * @returns Grading results for each question and overall assessment
 */
export function gradeAssessment(
  questions: Question[],
  answers: Record<string, any>
): AssessmentGradingResult {
  const questionResults: Record<string, GradingResult> = {};
  let totalScore = 0;
  let maxScore = 0;
  let requiresManualGrading = false;
  const bloomsLevelScores: Record<string, number> = {};

  // Grade each question
  questions.forEach(question => {
    const questionId = question.id || '';
    const answer = answers[questionId];

    // Skip questions without IDs
    if (!questionId) return;

    // Grade the question
    const result = answer !== undefined
      ? gradeQuestion(question, answer)
      : {
          score: 0,
          maxScore: question.points || 1,
          feedback: 'No answer provided.',
          isCorrect: false,
          percentageScore: 0,
        };

    // Add to results
    questionResults[questionId] = result;
    totalScore += result.score;
    maxScore += result.maxScore;

    // Check if manual grading is required
    if (result.requiresManualGrading) {
      requiresManualGrading = true;
    }

    // Track scores by Bloom's level if available
    if (question.bloomsLevel) {
      const level = question.bloomsLevel;
      bloomsLevelScores[level] = (bloomsLevelScores[level] || 0) + result.score;
    }
  });

  // Calculate overall percentage score
  const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    questionResults,
    totalScore,
    maxScore,
    percentageScore,
    requiresManualGrading,
    bloomsLevelScores: Object.keys(bloomsLevelScores).length > 0 ? bloomsLevelScores : undefined,
  };
}
