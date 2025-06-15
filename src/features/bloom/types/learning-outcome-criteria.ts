/**
 * Learning Outcome Criteria Types
 * 
 * This file contains type definitions for learning outcome criteria integration with Bloom's Taxonomy.
 */

import { BloomsTaxonomyLevel } from './bloom-taxonomy';

/**
 * Performance level for a learning outcome criterion
 */
export interface LearningOutcomePerformanceLevel {
  id: string;
  name: string;
  description: string;
  scorePercentage: number;
  color?: string;
}

/**
 * Learning outcome criterion with Bloom's Taxonomy alignment
 */
export interface LearningOutcomeCriterion {
  id: string;
  name: string;
  description: string;
  bloomsLevel: BloomsTaxonomyLevel;
  weight: number;
  performanceLevels: LearningOutcomePerformanceLevel[];
}

/**
 * Default performance levels for learning outcomes
 */
export const DEFAULT_PERFORMANCE_LEVELS: Omit<LearningOutcomePerformanceLevel, 'id'>[] = [
  {
    name: 'Exceeds Expectations',
    description: 'Demonstrates exceptional understanding and mastery of the concept.',
    scorePercentage: 100,
    color: '#22c55e', // Green
  },
  {
    name: 'Meets Expectations',
    description: 'Demonstrates solid understanding of the concept.',
    scorePercentage: 80,
    color: '#3b82f6', // Blue
  },
  {
    name: 'Approaching Expectations',
    description: 'Demonstrates partial understanding of the concept.',
    scorePercentage: 60,
    color: '#eab308', // Yellow
  },
  {
    name: 'Below Expectations',
    description: 'Demonstrates limited understanding of the concept.',
    scorePercentage: 40,
    color: '#ef4444', // Red
  },
];

/**
 * Default criteria templates by Bloom's level
 */
export const DEFAULT_CRITERIA_TEMPLATES: Record<BloomsTaxonomyLevel, Omit<LearningOutcomeCriterion, 'id' | 'performanceLevels'>[]> = {
  [BloomsTaxonomyLevel.REMEMBER]: [
    {
      name: 'Recall of Facts',
      description: 'Ability to recall specific facts, terms, concepts, or answers without necessarily understanding their meaning.',
      bloomsLevel: BloomsTaxonomyLevel.REMEMBER,
      weight: 1,
    },
    {
      name: 'Recognition of Information',
      description: 'Ability to recognize or identify information when presented in a different format or context.',
      bloomsLevel: BloomsTaxonomyLevel.REMEMBER,
      weight: 1,
    },
  ],
  [BloomsTaxonomyLevel.UNDERSTAND]: [
    {
      name: 'Explanation of Concepts',
      description: 'Ability to explain ideas or concepts in their own words.',
      bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND,
      weight: 1,
    },
    {
      name: 'Interpretation of Information',
      description: 'Ability to interpret information and provide meaning.',
      bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND,
      weight: 1,
    },
  ],
  [BloomsTaxonomyLevel.APPLY]: [
    {
      name: 'Application of Knowledge',
      description: 'Ability to use learned material in new situations or contexts.',
      bloomsLevel: BloomsTaxonomyLevel.APPLY,
      weight: 1,
    },
    {
      name: 'Implementation of Procedures',
      description: 'Ability to implement procedures or methods correctly.',
      bloomsLevel: BloomsTaxonomyLevel.APPLY,
      weight: 1,
    },
  ],
  [BloomsTaxonomyLevel.ANALYZE]: [
    {
      name: 'Analysis of Components',
      description: 'Ability to break down information into component parts and understand their relationships.',
      bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
      weight: 1,
    },
    {
      name: 'Identification of Patterns',
      description: 'Ability to identify patterns, organization, and structure within information.',
      bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
      weight: 1,
    },
  ],
  [BloomsTaxonomyLevel.EVALUATE]: [
    {
      name: 'Critical Evaluation',
      description: 'Ability to make judgments based on criteria and standards.',
      bloomsLevel: BloomsTaxonomyLevel.EVALUATE,
      weight: 1,
    },
    {
      name: 'Justification of Decisions',
      description: 'Ability to justify a decision or course of action.',
      bloomsLevel: BloomsTaxonomyLevel.EVALUATE,
      weight: 1,
    },
  ],
  [BloomsTaxonomyLevel.CREATE]: [
    {
      name: 'Creation of Original Work',
      description: 'Ability to produce new or original work.',
      bloomsLevel: BloomsTaxonomyLevel.CREATE,
      weight: 1,
    },
    {
      name: 'Synthesis of Ideas',
      description: 'Ability to put elements together to form a coherent or functional whole.',
      bloomsLevel: BloomsTaxonomyLevel.CREATE,
      weight: 1,
    },
  ],
};
