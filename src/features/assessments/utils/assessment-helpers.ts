import { Assessment, AssessmentPrintFormat, AssessmentSection } from '../types/assessment';
import { Question, QuestionType } from '../types/question';
import { QUESTION_TYPE_METADATA } from '../constants/question-types';

/**
 * Helper functions for working with assessments
 */

/**
 * Convert an assessment to a print format
 * @param assessment The assessment to convert
 * @returns The assessment in print format
 */
export function convertToPrintFormat(assessment: Assessment): AssessmentPrintFormat {
  // Group questions by Bloom's level or create a single section if no Bloom's levels
  const questionsByBloomsLevel: Record<string, Question[]> = {};
  
  // If no questions, return a basic structure
  if (!assessment.questions || assessment.questions.length === 0) {
    return {
      title: assessment.title,
      instructions: assessment.instructions,
      sections: [],
      metadata: {
        subject: assessment.subjectId,
        class: assessment.classId,
        topic: assessment.topicId,
        maxScore: assessment.maxScore,
      },
    };
  }

  // Group questions by Bloom's level
  assessment.questions.forEach((question: Question) => {
    const bloomsLevel = question.bloomsLevel || 'Uncategorized';
    if (!questionsByBloomsLevel[bloomsLevel]) {
      questionsByBloomsLevel[bloomsLevel] = [];
    }
    questionsByBloomsLevel[bloomsLevel].push(question);
  });

  // Create sections from grouped questions
  const sections: AssessmentSection[] = Object.entries(questionsByBloomsLevel).map(
    ([bloomsLevel, questions], index) => ({
      id: `section-${index}`,
      title: bloomsLevel === 'Uncategorized' ? 'Questions' : `${bloomsLevel} Level Questions`,
      questions,
      bloomsLevel: bloomsLevel === 'Uncategorized' ? undefined : bloomsLevel,
      maxScore: questions.reduce((total, q) => total + (q.points || 0), 0),
    })
  );

  return {
    title: assessment.title,
    instructions: assessment.instructions,
    sections,
    metadata: {
      subject: assessment.subjectId,
      class: assessment.classId,
      topic: assessment.topicId,
      maxScore: assessment.maxScore,
    },
  };
}

/**
 * Calculate the Bloom's Taxonomy distribution for an assessment
 * @param questions The questions to analyze
 * @returns Object with Bloom's level keys and percentage values
 */
export function calculateBloomsDistribution(questions: Question[]): Record<string, number> {
  if (!questions || questions.length === 0) {
    return {};
  }

  // Count questions by Bloom's level
  const countByLevel: Record<string, number> = {};
  const totalPoints: Record<string, number> = {};
  let totalPointsAll = 0;

  questions.forEach((question) => {
    const bloomsLevel = question.bloomsLevel || 'Uncategorized';
    const points = question.points || 1;
    
    countByLevel[bloomsLevel] = (countByLevel[bloomsLevel] || 0) + 1;
    totalPoints[bloomsLevel] = (totalPoints[bloomsLevel] || 0) + points;
    totalPointsAll += points;
  });

  // Calculate percentage distribution based on points
  const distribution: Record<string, number> = {};
  Object.entries(totalPoints).forEach(([level, points]) => {
    distribution[level] = Math.round((points / totalPointsAll) * 100);
  });

  return distribution;
}

/**
 * Check if an assessment is auto-gradable
 * @param questions The questions in the assessment
 * @returns True if all questions are auto-gradable
 */
export function isAutoGradable(questions: Question[]): boolean {
  if (!questions || questions.length === 0) {
    return false;
  }

  return questions.every((question) => {
    const metadata = QUESTION_TYPE_METADATA[question.type as QuestionType];
    return metadata?.autoGradable || false;
  });
}

/**
 * Generate a unique ID for a new assessment
 * @returns A unique ID string
 */
export function generateAssessmentId(): string {
  return `assessment-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Calculate the total points for an assessment
 * @param questions The questions in the assessment
 * @returns The total points
 */
export function calculateTotalPoints(questions: Question[]): number {
  if (!questions || questions.length === 0) {
    return 0;
  }

  return questions.reduce((total, question) => total + (question.points || 0), 0);
}
