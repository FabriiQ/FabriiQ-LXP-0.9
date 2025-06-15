/**
 * Bloom's Taxonomy Levels Constants
 *
 * This file contains constants related to Bloom's Taxonomy cognitive levels.
 */

import { BloomsTaxonomyLevel, BloomsTaxonomyLevelMetadata } from '../types';

/**
 * Metadata for each Bloom's Taxonomy level
 */
export const BLOOMS_LEVEL_METADATA: Record<BloomsTaxonomyLevel, BloomsTaxonomyLevelMetadata> = {
  [BloomsTaxonomyLevel.REMEMBER]: {
    level: BloomsTaxonomyLevel.REMEMBER,
    name: 'Remember',
    description: 'Recall facts and basic concepts',
    color: '#E57373', // Light Red
    icon: 'Brain',
    order: 1,
  },
  [BloomsTaxonomyLevel.UNDERSTAND]: {
    level: BloomsTaxonomyLevel.UNDERSTAND,
    name: 'Understand',
    description: 'Explain ideas or concepts',
    color: '#FFB74D', // Light Orange
    icon: 'BookOpen',
    order: 2,
  },
  [BloomsTaxonomyLevel.APPLY]: {
    level: BloomsTaxonomyLevel.APPLY,
    name: 'Apply',
    description: 'Use information in new situations',
    color: '#43A047', // Medium Green for better distinction from orange
    icon: 'Hammer',
    order: 3,
  },
  [BloomsTaxonomyLevel.ANALYZE]: {
    level: BloomsTaxonomyLevel.ANALYZE,
    name: 'Analyze',
    description: 'Draw connections among ideas',
    color: '#00ACC1', // Cyan/Teal color for better distinction from Apply
    icon: 'Microscope',
    order: 4,
  },
  [BloomsTaxonomyLevel.EVALUATE]: {
    level: BloomsTaxonomyLevel.EVALUATE,
    name: 'Evaluate',
    description: 'Justify a stand or decision',
    color: '#64B5F6', // Light Blue
    icon: 'Scale',
    order: 5,
  },
  [BloomsTaxonomyLevel.CREATE]: {
    level: BloomsTaxonomyLevel.CREATE,
    name: 'Create',
    description: 'Produce new or original work',
    color: '#BA68C8', // Light Purple
    icon: 'Lightbulb',
    order: 6,
  },
};

/**
 * Ordered array of Bloom's Taxonomy levels
 */
export const ORDERED_BLOOMS_LEVELS: BloomsTaxonomyLevel[] = [
  BloomsTaxonomyLevel.REMEMBER,
  BloomsTaxonomyLevel.UNDERSTAND,
  BloomsTaxonomyLevel.APPLY,
  BloomsTaxonomyLevel.ANALYZE,
  BloomsTaxonomyLevel.EVALUATE,
  BloomsTaxonomyLevel.CREATE,
];

/**
 * Default Bloom's distribution for balanced curriculum
 */
export const DEFAULT_BLOOMS_DISTRIBUTION = {
  [BloomsTaxonomyLevel.REMEMBER]: 0,
  [BloomsTaxonomyLevel.UNDERSTAND]: 0,
  [BloomsTaxonomyLevel.APPLY]: 0,
  [BloomsTaxonomyLevel.ANALYZE]: 0,
  [BloomsTaxonomyLevel.EVALUATE]: 0,
  [BloomsTaxonomyLevel.CREATE]: 0,
};

/**
 * Recommended Bloom's distribution for balanced curriculum
 */
export const RECOMMENDED_BLOOMS_DISTRIBUTION = {
  [BloomsTaxonomyLevel.REMEMBER]: 15,
  [BloomsTaxonomyLevel.UNDERSTAND]: 20,
  [BloomsTaxonomyLevel.APPLY]: 25,
  [BloomsTaxonomyLevel.ANALYZE]: 20,
  [BloomsTaxonomyLevel.EVALUATE]: 10,
  [BloomsTaxonomyLevel.CREATE]: 10,
};

/**
 * Recommended Bloom's distribution by grade level
 */
export const GRADE_LEVEL_DISTRIBUTIONS: Record<string, Record<BloomsTaxonomyLevel, number>> = {
  'elementary': {
    [BloomsTaxonomyLevel.REMEMBER]: 25,
    [BloomsTaxonomyLevel.UNDERSTAND]: 30,
    [BloomsTaxonomyLevel.APPLY]: 25,
    [BloomsTaxonomyLevel.ANALYZE]: 10,
    [BloomsTaxonomyLevel.EVALUATE]: 5,
    [BloomsTaxonomyLevel.CREATE]: 5,
  },
  'middle': {
    [BloomsTaxonomyLevel.REMEMBER]: 20,
    [BloomsTaxonomyLevel.UNDERSTAND]: 25,
    [BloomsTaxonomyLevel.APPLY]: 25,
    [BloomsTaxonomyLevel.ANALYZE]: 15,
    [BloomsTaxonomyLevel.EVALUATE]: 10,
    [BloomsTaxonomyLevel.CREATE]: 5,
  },
  'high': {
    [BloomsTaxonomyLevel.REMEMBER]: 15,
    [BloomsTaxonomyLevel.UNDERSTAND]: 20,
    [BloomsTaxonomyLevel.APPLY]: 25,
    [BloomsTaxonomyLevel.ANALYZE]: 20,
    [BloomsTaxonomyLevel.EVALUATE]: 10,
    [BloomsTaxonomyLevel.CREATE]: 10,
  },
  'college': {
    [BloomsTaxonomyLevel.REMEMBER]: 10,
    [BloomsTaxonomyLevel.UNDERSTAND]: 15,
    [BloomsTaxonomyLevel.APPLY]: 20,
    [BloomsTaxonomyLevel.ANALYZE]: 25,
    [BloomsTaxonomyLevel.EVALUATE]: 15,
    [BloomsTaxonomyLevel.CREATE]: 15,
  },
};

/**
 * Action verbs for each Bloom's Taxonomy level
 * These verbs can be used in learning outcomes, assessments, and feedback
 */
export const BLOOMS_LEVEL_ACTION_VERBS: Record<BloomsTaxonomyLevel, string[]> = {
  [BloomsTaxonomyLevel.REMEMBER]: [
    'Define', 'Describe', 'Identify', 'Label', 'List', 'Match', 'Name',
    'Recall', 'Recognize', 'Select', 'State', 'Memorize', 'Repeat', 'Reproduce'
  ],
  [BloomsTaxonomyLevel.UNDERSTAND]: [
    'Classify', 'Compare', 'Contrast', 'Demonstrate', 'Explain', 'Illustrate',
    'Interpret', 'Paraphrase', 'Predict', 'Summarize', 'Translate', 'Discuss',
    'Outline', 'Relate', 'Restate'
  ],
  [BloomsTaxonomyLevel.APPLY]: [
    'Apply', 'Calculate', 'Compute', 'Construct', 'Demonstrate', 'Develop',
    'Implement', 'Modify', 'Operate', 'Organize', 'Practice', 'Solve',
    'Use', 'Utilize', 'Show'
  ],
  [BloomsTaxonomyLevel.ANALYZE]: [
    'Analyze', 'Break down', 'Categorize', 'Compare', 'Contrast', 'Differentiate',
    'Discriminate', 'Distinguish', 'Examine', 'Infer', 'Outline', 'Relate',
    'Separate', 'Structure', 'Investigate'
  ],
  [BloomsTaxonomyLevel.EVALUATE]: [
    'Appraise', 'Argue', 'Assess', 'Critique', 'Defend', 'Evaluate', 'Judge',
    'Justify', 'Prioritize', 'Rate', 'Select', 'Support', 'Value', 'Recommend',
    'Validate'
  ],
  [BloomsTaxonomyLevel.CREATE]: [
    'Assemble', 'Compose', 'Construct', 'Create', 'Design', 'Develop', 'Formulate',
    'Generate', 'Invent', 'Plan', 'Produce', 'Propose', 'Synthesize', 'Devise',
    'Originate'
  ],
};
