/**
 * Bloom's Taxonomy Helper Functions
 *
 * This file contains utility functions for working with Bloom's Taxonomy.
 */

import {
  BloomsTaxonomyLevel,
  BloomsDistribution,
  BloomsCurriculumAnalysis,
  BloomsAssessmentAnalysis,
  BloomsAlignedQuestion
} from '../types';
import {
  BLOOMS_LEVEL_METADATA,
  ORDERED_BLOOMS_LEVELS,
  DEFAULT_BLOOMS_DISTRIBUTION
} from '../constants/bloom-levels';
import { ACTION_VERBS_BY_LEVEL } from '../constants/action-verbs';

/**
 * Get metadata for a specific Bloom's Taxonomy level
 */
export function getBloomsLevelMetadata(level: BloomsTaxonomyLevel) {
  return BLOOMS_LEVEL_METADATA[level];
}

/**
 * Get action verbs for a specific Bloom's Taxonomy level
 */
export function getActionVerbsForLevel(level: BloomsTaxonomyLevel) {
  return ACTION_VERBS_BY_LEVEL[level];
}

/**
 * Get random action verbs for a specific Bloom's Taxonomy level
 */
export function getRandomActionVerbsForLevel(level: BloomsTaxonomyLevel, count: number = 5) {
  const verbs = ACTION_VERBS_BY_LEVEL[level];
  const shuffled = [...verbs].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, verbs.length));
}

/**
 * Check if a distribution is balanced according to recommended percentages
 */
export function isDistributionBalanced(
  distribution: BloomsDistribution,
  tolerance: number = 5
): boolean {
  // Get the default distribution for comparison
  const defaultDistribution = DEFAULT_BLOOMS_DISTRIBUTION;

  // Check if each level is within tolerance of the recommended percentage
  for (const level of ORDERED_BLOOMS_LEVELS) {
    const actual = distribution[level] || 0;
    const recommended = defaultDistribution[level];

    if (Math.abs(actual - recommended) > tolerance) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate the distribution of Bloom's levels in an array of questions
 */
export function calculateBloomsDistribution(
  questions: BloomsAlignedQuestion[]
): BloomsDistribution {
  // Initialize distribution with zeros
  const distribution: BloomsDistribution = {
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 0,
    [BloomsTaxonomyLevel.EVALUATE]: 0,
    [BloomsTaxonomyLevel.CREATE]: 0,
  };

  // Count questions for each level
  for (const question of questions) {
    distribution[question.bloomsLevel] = (distribution[question.bloomsLevel] || 0) + 1;
  }

  // Convert counts to percentages
  const total = questions.length;
  if (total > 0) {
    for (const level of ORDERED_BLOOMS_LEVELS) {
      distribution[level] = Math.round(((distribution[level] || 0) / total) * 100);
    }
  }

  return distribution;
}

/**
 * Calculate the distribution of Bloom's levels in an array of learning outcomes
 */
export function calculateLearningOutcomeDistribution(
  learningOutcomes: Array<{ bloomsLevel: BloomsTaxonomyLevel }>
): BloomsDistribution {
  // Initialize distribution with zeros
  const distribution: BloomsDistribution = {
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 0,
    [BloomsTaxonomyLevel.EVALUATE]: 0,
    [BloomsTaxonomyLevel.CREATE]: 0,
  };

  // Count learning outcomes for each level
  for (const outcome of learningOutcomes) {
    distribution[outcome.bloomsLevel] = (distribution[outcome.bloomsLevel] || 0) + 1;
  }

  // Convert counts to percentages
  const total = learningOutcomes.length;
  if (total > 0) {
    for (const level of ORDERED_BLOOMS_LEVELS) {
      distribution[level] = Math.round(((distribution[level] || 0) / total) * 100);
    }
  }

  return distribution;
}

/**
 * Analyze the balance of Bloom's levels in a curriculum
 */
export function analyzeCurriculumBalance(
  subjectId: string,
  subjectName: string,
  distribution: BloomsDistribution,
  topicAnalysis?: Array<{
    topicId: string;
    topicName: string;
    distribution: BloomsDistribution;
  }>
): BloomsCurriculumAnalysis {
  // Determine if the distribution is balanced
  const isBalanced = isDistributionBalanced(distribution);

  // Generate recommendations based on the distribution
  const recommendations: string[] = [];

  if (!isBalanced) {
    const defaultDistribution = DEFAULT_BLOOMS_DISTRIBUTION;

    for (const level of ORDERED_BLOOMS_LEVELS) {
      const actual = distribution[level] || 0;
      const recommended = defaultDistribution[level];
      const diff = actual - recommended;

      if (diff < -5) {
        recommendations.push(
          `Increase ${BLOOMS_LEVEL_METADATA[level].name} level activities by approximately ${Math.abs(diff)}%.`
        );
      } else if (diff > 5) {
        recommendations.push(
          `Reduce ${BLOOMS_LEVEL_METADATA[level].name} level activities by approximately ${diff}%.`
        );
      }
    }
  }

  // If no specific recommendations, add a general one
  if (recommendations.length === 0) {
    recommendations.push('The current distribution is well-balanced across cognitive levels.');
  }

  // Process topic analysis if provided
  const processedTopicAnalysis = topicAnalysis?.map(topic => {
    const isTopicBalanced = isDistributionBalanced(topic.distribution);
    return {
      topicId: topic.topicId,
      topicName: topic.topicName,
      distribution: topic.distribution,
      balance: isTopicBalanced ? 'good' as const : 'needs-improvement' as const,
    };
  });

  return {
    subjectId,
    subjectName,
    distribution,
    balance: isBalanced ? 'good' as const : 'needs-improvement' as const,
    recommendations,
    topicAnalysis: processedTopicAnalysis,
  };
}

/**
 * Analyze the balance of Bloom's levels in an assessment
 */
export function analyzeAssessmentBalance(
  assessmentId: string,
  assessmentTitle: string,
  questions: BloomsAlignedQuestion[],
  learningOutcomes: Array<{ id: string; bloomsLevel: BloomsTaxonomyLevel }>
): BloomsAssessmentAnalysis {
  // Calculate the distribution
  const distribution = calculateBloomsDistribution(questions);

  // Determine if the distribution is balanced
  const isBalanced = isDistributionBalanced(distribution);

  // Generate recommendations
  const recommendations: string[] = [];

  if (!isBalanced) {
    const defaultDistribution = DEFAULT_BLOOMS_DISTRIBUTION;

    for (const level of ORDERED_BLOOMS_LEVELS) {
      const actual = distribution[level] || 0;
      const recommended = defaultDistribution[level];
      const diff = actual - recommended;

      if (diff < -5) {
        recommendations.push(
          `Add more questions at the ${BLOOMS_LEVEL_METADATA[level].name} level.`
        );
      } else if (diff > 5) {
        recommendations.push(
          `Consider reducing the number of questions at the ${BLOOMS_LEVEL_METADATA[level].name} level.`
        );
      }
    }
  }

  // If no specific recommendations, add a general one
  if (recommendations.length === 0) {
    recommendations.push('The assessment has a good balance of questions across cognitive levels.');
  }

  // Analyze question alignment with learning outcomes
  const questionAnalysis = questions.map(question => {
    // Check if the question's Bloom's level aligns with any of its learning outcomes
    const alignedOutcomes = learningOutcomes.filter(outcome =>
      question.learningOutcomeIds.includes(outcome.id)
    );

    if (alignedOutcomes.length === 0) {
      return {
        questionId: question.id,
        bloomsLevel: question.bloomsLevel,
        learningOutcomeAlignment: 'not-aligned' as const,
      };
    }

    // Check if any of the learning outcomes match the question's Bloom's level
    const exactMatch = alignedOutcomes.some(outcome =>
      outcome.bloomsLevel === question.bloomsLevel
    );

    return {
      questionId: question.id,
      bloomsLevel: question.bloomsLevel,
      learningOutcomeAlignment: exactMatch ? 'aligned' as const : 'partially-aligned' as const,
    };
  });

  return {
    assessmentId,
    assessmentTitle,
    distribution,
    balance: isBalanced ? 'good' as const : 'needs-improvement' as const,
    recommendations,
    questionAnalysis,
  };
}
