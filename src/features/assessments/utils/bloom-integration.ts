import { Question } from '../types/question';
import { QUESTION_TYPES_BY_BLOOMS_LEVEL } from '../constants/question-types';
import { BloomsTaxonomyLevel, BloomsDistribution } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';
import { ACTION_VERBS_BY_LEVEL } from '@/features/bloom/constants/action-verbs';

/**
 * Helper functions for integrating with Bloom's Taxonomy
 *
 * This file uses the centralized Bloom's Taxonomy components from the bloom feature
 * while maintaining backward compatibility with existing code.
 */

// Map old BLOOMS_LEVELS to new BLOOMS_LEVEL_METADATA for backward compatibility
export const BLOOMS_LEVELS = {
  REMEMBER: {
    id: BloomsTaxonomyLevel.REMEMBER,
    name: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.REMEMBER].name,
    description: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.REMEMBER].description,
    color: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.REMEMBER].color,
    verbs: ACTION_VERBS_BY_LEVEL[BloomsTaxonomyLevel.REMEMBER].map(v => v.verb.toLowerCase()),
  },
  UNDERSTAND: {
    id: BloomsTaxonomyLevel.UNDERSTAND,
    name: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.UNDERSTAND].name,
    description: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.UNDERSTAND].description,
    color: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.UNDERSTAND].color,
    verbs: ACTION_VERBS_BY_LEVEL[BloomsTaxonomyLevel.UNDERSTAND].map(v => v.verb.toLowerCase()),
  },
  APPLY: {
    id: BloomsTaxonomyLevel.APPLY,
    name: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.APPLY].name,
    description: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.APPLY].description,
    color: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.APPLY].color,
    verbs: ACTION_VERBS_BY_LEVEL[BloomsTaxonomyLevel.APPLY].map(v => v.verb.toLowerCase()),
  },
  ANALYZE: {
    id: BloomsTaxonomyLevel.ANALYZE,
    name: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.ANALYZE].name,
    description: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.ANALYZE].description,
    color: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.ANALYZE].color,
    verbs: ACTION_VERBS_BY_LEVEL[BloomsTaxonomyLevel.ANALYZE].map(v => v.verb.toLowerCase()),
  },
  EVALUATE: {
    id: BloomsTaxonomyLevel.EVALUATE,
    name: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.EVALUATE].name,
    description: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.EVALUATE].description,
    color: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.EVALUATE].color,
    verbs: ACTION_VERBS_BY_LEVEL[BloomsTaxonomyLevel.EVALUATE].map(v => v.verb.toLowerCase()),
  },
  CREATE: {
    id: BloomsTaxonomyLevel.CREATE,
    name: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.CREATE].name,
    description: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.CREATE].description,
    color: BLOOMS_LEVEL_METADATA[BloomsTaxonomyLevel.CREATE].color,
    verbs: ACTION_VERBS_BY_LEVEL[BloomsTaxonomyLevel.CREATE].map(v => v.verb.toLowerCase()),
  },
};

// Bloom's level options for dropdowns (for backward compatibility)
export const BLOOMS_LEVEL_OPTIONS = Object.values(BLOOMS_LEVELS).map(level => ({
  value: level.id,
  label: level.name,
  description: level.description,
  color: level.color,
}));

/**
 * Get recommended question types for a Bloom's level
 * @param bloomsLevel The Bloom's level
 * @returns Array of recommended question types
 */
export function getRecommendedQuestionTypes(bloomsLevel: BloomsTaxonomyLevel | string) {
  return QUESTION_TYPES_BY_BLOOMS_LEVEL[bloomsLevel] || [];
}

/**
 * Get suggested action verbs for a Bloom's level
 * @param bloomsLevel The Bloom's level
 * @returns Array of suggested verbs
 */
export function getSuggestedVerbs(bloomsLevel: BloomsTaxonomyLevel | string) {
  // If it's a BloomsTaxonomyLevel enum value, get verbs directly from ACTION_VERBS_BY_LEVEL
  if (Object.values(BloomsTaxonomyLevel).includes(bloomsLevel as BloomsTaxonomyLevel)) {
    return ACTION_VERBS_BY_LEVEL[bloomsLevel as BloomsTaxonomyLevel].map(v => v.verb.toLowerCase());
  }

  // Otherwise, try to find the level in BLOOMS_LEVELS (for backward compatibility)
  const level = Object.values(BLOOMS_LEVELS).find(l => l.id === bloomsLevel);
  return level?.verbs || [];
}

/**
 * Calculate the Bloom's Taxonomy distribution for an assessment based on its questions
 * @param questions The assessment questions
 * @returns Distribution of Bloom's levels as percentages
 */
export function calculateBloomsDistribution(questions: Question[]): BloomsDistribution {
  // Initialize distribution with zeros
  const distribution: BloomsDistribution = {
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 0,
    [BloomsTaxonomyLevel.EVALUATE]: 0,
    [BloomsTaxonomyLevel.CREATE]: 0,
  };

  // If no questions, return empty distribution
  if (questions.length === 0) {
    return distribution;
  }

  // Count questions by Bloom's level
  const levelCounts: Record<BloomsTaxonomyLevel, number> = {
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 0,
    [BloomsTaxonomyLevel.EVALUATE]: 0,
    [BloomsTaxonomyLevel.CREATE]: 0,
  };

  // Count questions by level
  questions.forEach(question => {
    if (question.bloomsLevel) {
      levelCounts[question.bloomsLevel as BloomsTaxonomyLevel]++;
    }
  });

  // Calculate percentages
  Object.entries(levelCounts).forEach(([level, count]) => {
    distribution[level as BloomsTaxonomyLevel] = Math.round((count / questions.length) * 100);
  });

  return distribution;
}

/**
 * Analyze the Bloom's level distribution of questions
 * @param questions The questions to analyze
 * @returns Object with level distribution and recommendations
 */
export function analyzeBloomsDistribution(questions: Question[]) {
  if (!questions || questions.length === 0) {
    return {
      distribution: {},
      isBalanced: false,
      recommendations: ['Add questions to analyze Bloom\'s distribution'],
    };
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

  // Check if distribution is balanced
  const hasLowerLevels =
    (distribution[BloomsTaxonomyLevel.REMEMBER] > 0 ||
     distribution[BloomsTaxonomyLevel.UNDERSTAND] > 0);

  const hasMiddleLevels =
    (distribution[BloomsTaxonomyLevel.APPLY] > 0 ||
     distribution[BloomsTaxonomyLevel.ANALYZE] > 0);

  const hasHigherLevels =
    (distribution[BloomsTaxonomyLevel.EVALUATE] > 0 ||
     distribution[BloomsTaxonomyLevel.CREATE] > 0);

  const isBalanced = hasLowerLevels && hasMiddleLevels && hasHigherLevels;

  // Generate recommendations
  const recommendations: string[] = [];

  if (!hasLowerLevels) {
    recommendations.push('Add questions that test recall and understanding (Remember, Understand levels)');
  }

  if (!hasMiddleLevels) {
    recommendations.push('Add questions that test application and analysis (Apply, Analyze levels)');
  }

  if (!hasHigherLevels) {
    recommendations.push('Add questions that test evaluation and creation (Evaluate, Create levels)');
  }

  // Check for over-emphasis
  const THRESHOLD = 50; // 50% threshold for over-emphasis
  Object.entries(distribution).forEach(([level, percentage]) => {
    if (percentage > THRESHOLD) {
      // Get the level name from metadata if available
      const levelName = level in BLOOMS_LEVEL_METADATA
        ? BLOOMS_LEVEL_METADATA[level as BloomsTaxonomyLevel].name
        : level;

      recommendations.push(`Reduce emphasis on ${levelName} level (currently ${percentage}%)`);
    }
  });

  return {
    distribution,
    isBalanced,
    recommendations: recommendations.length > 0 ? recommendations : ['Distribution is well-balanced'],
  };
}

/**
 * Suggest a Bloom's level for a question based on its text
 * This is a placeholder for integration with an LLM-based classifier
 * @param questionText The question text
 * @returns Suggested Bloom's level
 */
export function suggestBloomsLevel(questionText: string): BloomsTaxonomyLevel {
  // This is a placeholder for LLM integration
  // In a real implementation, this would call an LLM to classify the question

  const text = questionText.toLowerCase();

  // Simple keyword-based classification
  if (text.includes('create') || text.includes('design') || text.includes('develop')) {
    return BloomsTaxonomyLevel.CREATE;
  } else if (text.includes('evaluate') || text.includes('judge') || text.includes('assess')) {
    return BloomsTaxonomyLevel.EVALUATE;
  } else if (text.includes('analyze') || text.includes('compare') || text.includes('examine')) {
    return BloomsTaxonomyLevel.ANALYZE;
  } else if (text.includes('apply') || text.includes('use') || text.includes('solve')) {
    return BloomsTaxonomyLevel.APPLY;
  } else if (text.includes('explain') || text.includes('describe') || text.includes('summarize')) {
    return BloomsTaxonomyLevel.UNDERSTAND;
  } else {
    return BloomsTaxonomyLevel.REMEMBER;
  }
}

/**
 * Validate the alignment between assessment questions and learning outcomes
 * @param questions The assessment questions
 * @param learningOutcomes The learning outcomes
 * @returns Validation result with alignment status and details
 */
export function validateLearningOutcomeAlignment(
  questions: Question[],
  learningOutcomes: { id: string; bloomsLevel: BloomsTaxonomyLevel }[]
) {
  // Group questions by Bloom's level
  const questionsByLevel: Record<BloomsTaxonomyLevel, number> = {
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 0,
    [BloomsTaxonomyLevel.EVALUATE]: 0,
    [BloomsTaxonomyLevel.CREATE]: 0,
  };

  // Count questions by level
  questions.forEach(question => {
    if (question.bloomsLevel) {
      questionsByLevel[question.bloomsLevel as BloomsTaxonomyLevel]++;
    }
  });

  // Group learning outcomes by Bloom's level
  const outcomesByLevel: Record<BloomsTaxonomyLevel, number> = {
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 0,
    [BloomsTaxonomyLevel.EVALUATE]: 0,
    [BloomsTaxonomyLevel.CREATE]: 0,
  };

  // Count learning outcomes by level
  learningOutcomes.forEach(outcome => {
    outcomesByLevel[outcome.bloomsLevel]++;
  });

  // Check alignment
  const misalignedLevels: BloomsTaxonomyLevel[] = [];

  // Find levels where there are learning outcomes but no questions
  Object.values(BloomsTaxonomyLevel).forEach(level => {
    if (outcomesByLevel[level] > 0 && questionsByLevel[level] === 0) {
      misalignedLevels.push(level);
    }
  });

  return {
    isAligned: misalignedLevels.length === 0,
    misalignedLevels,
    questionsByLevel,
    outcomesByLevel,
  };
}
