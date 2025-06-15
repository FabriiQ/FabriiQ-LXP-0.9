/**
 * Mastery Thresholds Constants
 * 
 * This file contains constants related to topic mastery thresholds.
 */

import { MasteryLevel, MasteryThresholds, MasteryDecayConfig } from '../types';

/**
 * Default mastery thresholds
 * Values represent the minimum percentage required to achieve each level
 */
export const DEFAULT_MASTERY_THRESHOLDS: MasteryThresholds = {
  [MasteryLevel.NOVICE]: 0,
  [MasteryLevel.DEVELOPING]: 60,
  [MasteryLevel.PROFICIENT]: 75,
  [MasteryLevel.ADVANCED]: 85,
  [MasteryLevel.EXPERT]: 95,
};

/**
 * Mastery level descriptions
 */
export const MASTERY_LEVEL_DESCRIPTIONS: Record<MasteryLevel, string> = {
  [MasteryLevel.NOVICE]: 'Beginning to learn the basics',
  [MasteryLevel.DEVELOPING]: 'Building foundational knowledge',
  [MasteryLevel.PROFICIENT]: 'Demonstrating solid understanding',
  [MasteryLevel.ADVANCED]: 'Showing deep comprehension',
  [MasteryLevel.EXPERT]: 'Mastering the subject completely',
};

/**
 * Mastery level colors for visualization
 */
export const MASTERY_LEVEL_COLORS: Record<MasteryLevel, string> = {
  [MasteryLevel.NOVICE]: '#E57373', // Light Red
  [MasteryLevel.DEVELOPING]: '#FFB74D', // Light Orange
  [MasteryLevel.PROFICIENT]: '#FFF176', // Light Yellow
  [MasteryLevel.ADVANCED]: '#81C784', // Light Green
  [MasteryLevel.EXPERT]: '#64B5F6', // Light Blue
};

/**
 * Default mastery decay configuration
 */
export const DEFAULT_MASTERY_DECAY_CONFIG: MasteryDecayConfig = {
  enabled: true,
  decayRate: 0.5, // 0.5% per day
  gracePeriod: 14, // 14 days before decay starts
  minimumLevel: 50, // Won't decay below 50%
};

/**
 * Weights for calculating overall mastery from individual Bloom's levels
 * Higher cognitive levels are weighted more heavily
 */
export const BLOOMS_LEVEL_MASTERY_WEIGHTS = {
  REMEMBER: 0.1,
  UNDERSTAND: 0.15,
  APPLY: 0.2,
  ANALYZE: 0.2,
  EVALUATE: 0.15,
  CREATE: 0.2,
};

/**
 * Achievement thresholds for mastery levels
 * Values represent the number of topics mastered at each level to earn the achievement
 */
export const MASTERY_ACHIEVEMENT_THRESHOLDS = {
  BRONZE: {
    [MasteryLevel.PROFICIENT]: 5,
    [MasteryLevel.ADVANCED]: 2,
    [MasteryLevel.EXPERT]: 1,
  },
  SILVER: {
    [MasteryLevel.PROFICIENT]: 10,
    [MasteryLevel.ADVANCED]: 5,
    [MasteryLevel.EXPERT]: 2,
  },
  GOLD: {
    [MasteryLevel.PROFICIENT]: 15,
    [MasteryLevel.ADVANCED]: 10,
    [MasteryLevel.EXPERT]: 5,
  },
  PLATINUM: {
    [MasteryLevel.PROFICIENT]: 20,
    [MasteryLevel.ADVANCED]: 15,
    [MasteryLevel.EXPERT]: 10,
  },
};
