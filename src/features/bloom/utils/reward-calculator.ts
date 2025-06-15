/**
 * Bloom's Taxonomy Reward Calculator
 * 
 * This utility calculates rewards based on Bloom's Taxonomy levels.
 * Higher cognitive levels earn more points to incentivize deeper learning.
 */

import { BloomsTaxonomyLevel } from '../types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '../constants/bloom-levels';

// Multipliers for each Bloom's level
const LEVEL_MULTIPLIERS: Record<BloomsTaxonomyLevel, number> = {
  [BloomsTaxonomyLevel.REMEMBER]: 1.0,
  [BloomsTaxonomyLevel.UNDERSTAND]: 1.2,
  [BloomsTaxonomyLevel.APPLY]: 1.5,
  [BloomsTaxonomyLevel.ANALYZE]: 1.8,
  [BloomsTaxonomyLevel.EVALUATE]: 2.0,
  [BloomsTaxonomyLevel.CREATE]: 2.5,
};

// Mastery thresholds for each level
const MASTERY_THRESHOLDS: Record<string, number> = {
  'beginner': 60,
  'intermediate': 75,
  'advanced': 90,
};

/**
 * Calculate reward points based on activity grade and Bloom's level
 */
export function calculateRewardPoints(
  score: number,
  maxScore: number,
  bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>,
  bloomsLevel?: BloomsTaxonomyLevel
): number {
  // Base points calculation
  const basePoints = Math.round((score / maxScore) * 100);
  
  // If we have detailed Bloom's level scores, use them for weighted calculation
  if (bloomsLevelScores) {
    let totalPoints = 0;
    let totalWeight = 0;
    
    Object.entries(bloomsLevelScores).forEach(([level, value]) => {
      const bloomsLevel = level as BloomsTaxonomyLevel;
      const multiplier = LEVEL_MULTIPLIERS[bloomsLevel];
      const weight = BLOOMS_LEVEL_METADATA[bloomsLevel].order;
      
      totalPoints += value * multiplier * weight;
      totalWeight += weight;
    });
    
    // Calculate weighted average
    return Math.round(totalWeight > 0 ? totalPoints / totalWeight : basePoints);
  }
  
  // If we only have a single Bloom's level, apply its multiplier
  if (bloomsLevel) {
    return Math.round(basePoints * LEVEL_MULTIPLIERS[bloomsLevel]);
  }
  
  // Default to base points if no Bloom's data is available
  return basePoints;
}

/**
 * Determine mastery level based on score and Bloom's level
 */
export function determineMasteryLevel(
  score: number,
  maxScore: number,
  bloomsLevel?: BloomsTaxonomyLevel
): 'none' | 'beginner' | 'intermediate' | 'advanced' {
  const percentage = (score / maxScore) * 100;
  
  // Apply level-specific adjustments
  let adjustedPercentage = percentage;
  if (bloomsLevel) {
    // Make higher levels slightly easier to achieve mastery (to account for difficulty)
    const levelOrder = BLOOMS_LEVEL_METADATA[bloomsLevel].order;
    const adjustment = (levelOrder - 1) * 2; // 0% for REMEMBER, 10% for CREATE
    adjustedPercentage += adjustment;
  }
  
  // Determine mastery level
  if (adjustedPercentage >= MASTERY_THRESHOLDS.advanced) {
    return 'advanced';
  } else if (adjustedPercentage >= MASTERY_THRESHOLDS.intermediate) {
    return 'intermediate';
  } else if (adjustedPercentage >= MASTERY_THRESHOLDS.beginner) {
    return 'beginner';
  } else {
    return 'none';
  }
}

/**
 * Calculate achievement progress for a specific Bloom's level
 */
export function calculateAchievementProgress(
  bloomsLevelScores: Record<BloomsTaxonomyLevel, number>,
  level: BloomsTaxonomyLevel
): number {
  const score = bloomsLevelScores[level] || 0;
  
  // Map score to achievement progress (0-100)
  if (score >= MASTERY_THRESHOLDS.advanced) {
    return 100;
  } else if (score >= MASTERY_THRESHOLDS.intermediate) {
    // Map 75-90 to 50-100
    return 50 + ((score - MASTERY_THRESHOLDS.intermediate) / 
      (MASTERY_THRESHOLDS.advanced - MASTERY_THRESHOLDS.intermediate)) * 50;
  } else if (score >= MASTERY_THRESHOLDS.beginner) {
    // Map 60-75 to 0-50
    return ((score - MASTERY_THRESHOLDS.beginner) / 
      (MASTERY_THRESHOLDS.intermediate - MASTERY_THRESHOLDS.beginner)) * 50;
  } else {
    return 0;
  }
}

/**
 * Get achievement name for a specific Bloom's level and mastery
 */
export function getAchievementName(
  level: BloomsTaxonomyLevel,
  masteryLevel: 'none' | 'beginner' | 'intermediate' | 'advanced'
): string {
  const levelName = BLOOMS_LEVEL_METADATA[level].name;
  
  switch (masteryLevel) {
    case 'advanced':
      return `${levelName} Master`;
    case 'intermediate':
      return `${levelName} Expert`;
    case 'beginner':
      return `${levelName} Apprentice`;
    default:
      return `${levelName} Novice`;
  }
}
