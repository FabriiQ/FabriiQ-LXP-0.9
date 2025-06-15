/**
 * Learning Outcome Helper Functions
 * 
 * This file contains utility functions for working with learning outcomes.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  BloomsTaxonomyLevel, 
  LearningOutcome,
  LearningOutcomeCriterion,
  LearningOutcomePerformanceLevel,
  DEFAULT_PERFORMANCE_LEVELS,
  DEFAULT_CRITERIA_TEMPLATES
} from '../types';

/**
 * Parse JSON criteria from database to typed objects
 */
export function parseLearningOutcomeCriteria(learningOutcome: any): LearningOutcome {
  const outcome = { ...learningOutcome };
  
  // Parse criteria JSON if it exists
  if (outcome.criteria && typeof outcome.criteria === 'string') {
    try {
      outcome.criteria = JSON.parse(outcome.criteria);
    } catch (error) {
      console.error('Error parsing learning outcome criteria:', error);
      outcome.criteria = [];
    }
  } else {
    outcome.criteria = [];
  }
  
  // Parse performance levels JSON if it exists
  if (outcome.performanceLevels && typeof outcome.performanceLevels === 'string') {
    try {
      outcome.performanceLevels = JSON.parse(outcome.performanceLevels);
    } catch (error) {
      console.error('Error parsing learning outcome performance levels:', error);
      outcome.performanceLevels = [];
    }
  } else {
    outcome.performanceLevels = [];
  }
  
  return outcome as LearningOutcome;
}

/**
 * Generate default criteria for a learning outcome based on its Bloom's level
 */
export function generateDefaultCriteria(
  bloomsLevel: BloomsTaxonomyLevel,
  statement: string
): LearningOutcomeCriterion[] {
  const templates = DEFAULT_CRITERIA_TEMPLATES[bloomsLevel] || [];
  
  return templates.map(template => ({
    ...template,
    id: uuidv4(),
    performanceLevels: generateDefaultPerformanceLevels(),
  }));
}

/**
 * Generate default performance levels for criteria
 */
export function generateDefaultPerformanceLevels(): LearningOutcomePerformanceLevel[] {
  return DEFAULT_PERFORMANCE_LEVELS.map(level => ({
    ...level,
    id: uuidv4(),
  }));
}

/**
 * Convert learning outcome criteria to rubric criteria
 */
export function convertToRubricCriteria(
  learningOutcome: LearningOutcome
): any[] {
  if (!learningOutcome.hasCriteria || !learningOutcome.criteria?.length) {
    return [];
  }
  
  return learningOutcome.criteria.map(criterion => ({
    id: criterion.id,
    name: criterion.name,
    description: criterion.description,
    bloomsLevel: criterion.bloomsLevel,
    weight: criterion.weight,
    learningOutcomeIds: [learningOutcome.id],
    performanceLevels: criterion.performanceLevels.map(level => ({
      levelId: level.id,
      description: level.description,
      score: level.scorePercentage,
    })),
  }));
}
