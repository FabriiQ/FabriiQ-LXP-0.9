import { BloomsTaxonomyLevel, BloomsTaxonomyLevelMetadata } from '../types/bloom-taxonomy';

/**
 * Metadata for each Bloom's Taxonomy level
 */
export const BLOOMS_LEVEL_METADATA: Record<BloomsTaxonomyLevel, BloomsTaxonomyLevelMetadata> = {
  [BloomsTaxonomyLevel.REMEMBER]: {
    level: BloomsTaxonomyLevel.REMEMBER,
    name: 'Remember',
    description: 'Recall facts and basic concepts',
    color: '#4299E1', // Blue
    order: 1,
  },
  [BloomsTaxonomyLevel.UNDERSTAND]: {
    level: BloomsTaxonomyLevel.UNDERSTAND,
    name: 'Understand',
    description: 'Explain ideas or concepts',
    color: '#48BB78', // Green
    order: 2,
  },
  [BloomsTaxonomyLevel.APPLY]: {
    level: BloomsTaxonomyLevel.APPLY,
    name: 'Apply',
    description: 'Use information in new situations',
    color: '#ECC94B', // Yellow
    order: 3,
  },
  [BloomsTaxonomyLevel.ANALYZE]: {
    level: BloomsTaxonomyLevel.ANALYZE,
    name: 'Analyze',
    description: 'Draw connections among ideas',
    color: '#ED8936', // Orange
    order: 4,
  },
  [BloomsTaxonomyLevel.EVALUATE]: {
    level: BloomsTaxonomyLevel.EVALUATE,
    name: 'Evaluate',
    description: 'Justify a stand or decision',
    color: '#E53E3E', // Red
    order: 5,
  },
  [BloomsTaxonomyLevel.CREATE]: {
    level: BloomsTaxonomyLevel.CREATE,
    name: 'Create',
    description: 'Produce new or original work',
    color: '#805AD5', // Purple
    order: 6,
  },
};

/**
 * Action verbs for each Bloom's Taxonomy level
 */
export const BLOOMS_ACTION_VERBS: Record<BloomsTaxonomyLevel, string[]> = {
  [BloomsTaxonomyLevel.REMEMBER]: [
    'Define', 'Describe', 'Identify', 'Label', 'List', 'Match', 'Name', 'Recall',
    'Recognize', 'Select', 'State', 'Memorize', 'Repeat', 'Reproduce', 'Retrieve'
  ],
  [BloomsTaxonomyLevel.UNDERSTAND]: [
    'Classify', 'Compare', 'Contrast', 'Demonstrate', 'Explain', 'Illustrate',
    'Interpret', 'Paraphrase', 'Predict', 'Summarize', 'Translate', 'Discuss',
    'Extend', 'Generalize', 'Infer', 'Relate'
  ],
  [BloomsTaxonomyLevel.APPLY]: [
    'Apply', 'Calculate', 'Compute', 'Construct', 'Demonstrate', 'Develop',
    'Implement', 'Modify', 'Operate', 'Organize', 'Practice', 'Predict',
    'Prepare', 'Produce', 'Show', 'Solve', 'Use'
  ],
  [BloomsTaxonomyLevel.ANALYZE]: [
    'Analyze', 'Break down', 'Categorize', 'Compare', 'Contrast', 'Deconstruct',
    'Differentiate', 'Discriminate', 'Distinguish', 'Examine', 'Experiment',
    'Identify', 'Inspect', 'Question', 'Relate', 'Separate', 'Test'
  ],
  [BloomsTaxonomyLevel.EVALUATE]: [
    'Appraise', 'Argue', 'Assess', 'Choose', 'Conclude', 'Critique', 'Decide',
    'Defend', 'Determine', 'Evaluate', 'Judge', 'Justify', 'Measure', 'Prioritize',
    'Rate', 'Recommend', 'Select', 'Support', 'Value'
  ],
  [BloomsTaxonomyLevel.CREATE]: [
    'Assemble', 'Compose', 'Construct', 'Create', 'Design', 'Develop', 'Devise',
    'Formulate', 'Generate', 'Hypothesize', 'Invent', 'Plan', 'Produce',
    'Propose', 'Synthesize', 'Write'
  ],
};

/**
 * Default Bloom's Taxonomy distribution
 */
export const DEFAULT_BLOOMS_DISTRIBUTION: Record<BloomsTaxonomyLevel, number> = {
  [BloomsTaxonomyLevel.REMEMBER]: 20,
  [BloomsTaxonomyLevel.UNDERSTAND]: 20,
  [BloomsTaxonomyLevel.APPLY]: 20,
  [BloomsTaxonomyLevel.ANALYZE]: 20,
  [BloomsTaxonomyLevel.EVALUATE]: 10,
  [BloomsTaxonomyLevel.CREATE]: 10,
};
