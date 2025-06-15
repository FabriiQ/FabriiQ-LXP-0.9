/**
 * Rubric Helper Functions
 *
 * This file contains utility functions for working with rubrics.
 */

import {
  Rubric,
  RubricType,
  RubricCriteria,
  PerformanceLevel,
  RubricAssessmentResult,
  RubricFeedback
} from '../types';
import { BloomsTaxonomyLevel } from '../types';
import { BLOOMS_LEVEL_METADATA } from '../constants/bloom-levels';

/**
 * Calculate the total possible score for a rubric
 */
export function calculateRubricMaxScore(rubric: Rubric): number {
  let maxScore = 0;

  for (const criteria of rubric.criteria) {
    // Find the highest score for this criteria
    const highestScore = Math.max(
      ...criteria.performanceLevels.map(level => level.score)
    );

    // Add the weighted score to the total
    maxScore += highestScore * criteria.weight;
  }

  return maxScore;
}

/**
 * Calculate the score for a rubric assessment
 */
export function calculateRubricScore(
  rubric: Rubric,
  criteriaScores: Array<{ criteriaId: string; score: number }>
): { totalScore: number; percentage: number } {
  let totalScore = 0;
  let maxPossibleScore = 0;

  for (const criteria of rubric.criteria) {
    // Find the score for this criteria
    const criteriaScore = criteriaScores.find(cs => cs.criteriaId === criteria.id);

    if (criteriaScore) {
      // Add the weighted score to the total
      totalScore += criteriaScore.score * criteria.weight;
    }

    // Find the highest possible score for this criteria
    const highestScore = Math.max(
      ...criteria.performanceLevels.map(level => level.score)
    );

    // Add the weighted maximum score to the total possible
    maxPossibleScore += highestScore * criteria.weight;
  }

  // Calculate percentage
  const percentage = maxPossibleScore > 0
    ? (totalScore / maxPossibleScore) * 100
    : 0;

  return {
    totalScore,
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
  };
}

/**
 * Get the performance level for a score
 */
export function getPerformanceLevelForScore(
  score: number,
  performanceLevels: PerformanceLevel[]
): PerformanceLevel | null {
  // Sort performance levels by min score (ascending)
  const sortedLevels = [...performanceLevels].sort(
    (a, b) => a.scoreRange.min - b.scoreRange.min
  );

  // Find the highest level where the score is within range
  for (let i = sortedLevels.length - 1; i >= 0; i--) {
    const level = sortedLevels[i];
    if (score >= level.scoreRange.min && score <= level.scoreRange.max) {
      return level;
    }
  }

  return null;
}

/**
 * Create default performance levels for a rubric
 */
export function createDefaultPerformanceLevels(
  maxScore: number = 100,
  levelCount: number = 4
): PerformanceLevel[] {
  const levels: PerformanceLevel[] = [];
  const step = maxScore / levelCount;

  const levelNames = ['Needs Improvement', 'Satisfactory', 'Good', 'Excellent'];
  const levelColors = ['#E57373', '#FFF176', '#81C784', '#64B5F6'];

  for (let i = 0; i < levelCount; i++) {
    const min = i === 0 ? 0 : Math.round(i * step * 10) / 10;
    const max = i === levelCount - 1
      ? maxScore
      : Math.round((i + 1) * step * 10) / 10 - 0.1;

    levels.push({
      id: `level-${i + 1}`,
      name: levelNames[i] || `Level ${i + 1}`,
      description: '',
      scoreRange: { min, max },
      color: levelColors[i] || '#CCCCCC',
    });
  }

  return levels;
}

/**
 * Create a default criteria for a specific Bloom's level
 */
export function createDefaultCriteriaForBloomsLevel(
  bloomsLevel: BloomsTaxonomyLevel,
  weight: number = 1
): Omit<RubricCriteria, 'id'> {
  const metadata = BLOOMS_LEVEL_METADATA[bloomsLevel];

  return {
    name: `${metadata.name} Level Thinking`,
    description: `Demonstrates ability to ${metadata.description.toLowerCase()}`,
    bloomsLevel,
    weight,
    learningOutcomeIds: [],
    performanceLevels: [
      {
        levelId: 'level-1',
        description: `Shows minimal ability to ${metadata.description.toLowerCase()}`,
        score: 1,
      },
      {
        levelId: 'level-2',
        description: `Shows basic ability to ${metadata.description.toLowerCase()}`,
        score: 2,
      },
      {
        levelId: 'level-3',
        description: `Shows proficient ability to ${metadata.description.toLowerCase()}`,
        score: 3,
      },
      {
        levelId: 'level-4',
        description: `Shows exceptional ability to ${metadata.description.toLowerCase()}`,
        score: 4,
      },
    ],
  };
}

/**
 * Calculate the Bloom's Taxonomy distribution in a rubric
 */
export function calculateRubricBloomsDistribution(
  rubric: Rubric
): Record<BloomsTaxonomyLevel, number> {
  const distribution: Record<BloomsTaxonomyLevel, number> = {
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 0,
    [BloomsTaxonomyLevel.EVALUATE]: 0,
    [BloomsTaxonomyLevel.CREATE]: 0,
  };

  // Calculate the total weight
  const totalWeight = rubric.criteria.reduce(
    (sum, criteria) => sum + criteria.weight,
    0
  );

  // Calculate the percentage for each Bloom's level
  for (const criteria of rubric.criteria) {
    const percentage = totalWeight > 0
      ? (criteria.weight / totalWeight) * 100
      : 0;

    distribution[criteria.bloomsLevel] =
      (distribution[criteria.bloomsLevel] || 0) + percentage;
  }

  // Round percentages
  for (const level in distribution) {
    distribution[level as BloomsTaxonomyLevel] =
      Math.round(distribution[level as BloomsTaxonomyLevel]);
  }

  return distribution;
}

/**
 * Generate feedback for a rubric
 */
export function generateRubricFeedback(rubric: Rubric): RubricFeedback {
  const criteriaFeedback = rubric.criteria.map(criteria => {
    const suggestions: string[] = [];

    // Check if criteria has a description
    if (!criteria.description || criteria.description.length < 10) {
      suggestions.push('Add a more detailed description for this criteria.');
    }

    // Check if performance levels have meaningful descriptions
    const hasDetailedLevels = criteria.performanceLevels.every(
      level => level.description && level.description.length >= 10
    );

    if (!hasDetailedLevels) {
      suggestions.push('Provide more detailed descriptions for each performance level.');
    }

    // Determine quality based on suggestions
    const quality = suggestions.length === 0
      ? 'excellent'
      : suggestions.length === 1
        ? 'good'
        : 'needs-improvement';

    return {
      criteriaId: criteria.id,
      quality,
      suggestions,
    };
  });

  // Check Bloom's alignment
  const distribution = calculateRubricBloomsDistribution(rubric);
  const bloomsAlignmentSuggestions: string[] = [];

  // Check if all levels are represented
  const missingLevels = Object.entries(distribution)
    .filter(([_, percentage]) => percentage === 0)
    .map(([level, _]) => BLOOMS_LEVEL_METADATA[level as BloomsTaxonomyLevel].name);

  if (missingLevels.length > 0) {
    bloomsAlignmentSuggestions.push(
      `Consider adding criteria for these Bloom's levels: ${missingLevels.join(', ')}.`
    );
  }

  // Check if distribution is too heavily weighted to lower levels
  const lowerLevelPercentage = (distribution[BloomsTaxonomyLevel.REMEMBER] || 0) +
    (distribution[BloomsTaxonomyLevel.UNDERSTAND] || 0);

  if (lowerLevelPercentage > 60) {
    bloomsAlignmentSuggestions.push(
      'The rubric is heavily weighted toward lower cognitive levels. Consider adding more criteria for higher-level thinking.'
    );
  }

  // Generate general suggestions
  const generalSuggestions: string[] = [];

  if (rubric.criteria.length < 3) {
    generalSuggestions.push('Consider adding more criteria to make the rubric more comprehensive.');
  }

  if (!rubric.description || rubric.description.length < 20) {
    generalSuggestions.push('Add a more detailed description for the overall rubric.');
  }

  // Determine overall quality
  const criteriaQualityCount = {
    excellent: criteriaFeedback.filter(cf => cf.quality === 'excellent').length,
    good: criteriaFeedback.filter(cf => cf.quality === 'good').length,
    'needs-improvement': criteriaFeedback.filter(cf => cf.quality === 'needs-improvement').length,
  };

  let overallQuality: 'excellent' | 'good' | 'needs-improvement';

  if (criteriaQualityCount['needs-improvement'] > 0 || generalSuggestions.length > 1) {
    overallQuality = 'needs-improvement';
  } else if (criteriaQualityCount.good > criteriaQualityCount.excellent || generalSuggestions.length === 1) {
    overallQuality = 'good';
  } else {
    overallQuality = 'excellent';
  }

  return {
    rubricId: rubric.id,
    overallQuality,
    criteriaFeedback: criteriaFeedback as {
      criteriaId: string;
      quality: 'good' | 'needs-improvement' | 'excellent';
      suggestions: string[];
    }[],
    performanceLevelFeedback: [], // This would require more complex analysis
    bloomsAlignmentFeedback: {
      quality: bloomsAlignmentSuggestions.length === 0
        ? 'excellent'
        : bloomsAlignmentSuggestions.length === 1
          ? 'good'
          : 'needs-improvement',
      suggestions: bloomsAlignmentSuggestions,
    },
    generalSuggestions,
  };
}
