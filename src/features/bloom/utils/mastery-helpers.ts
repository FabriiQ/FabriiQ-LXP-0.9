/**
 * Mastery Helper Functions
 * 
 * This file contains utility functions for working with topic mastery.
 */

import { 
  TopicMasteryData, 
  AssessmentResultData,
  MasteryLevel,
  StudentMasteryAnalytics,
  ClassMasteryAnalytics,
  MasteryDecayConfig
} from '../types';
import { BloomsTaxonomyLevel } from '../types';
import { 
  DEFAULT_MASTERY_THRESHOLDS,
  DEFAULT_MASTERY_DECAY_CONFIG,
  BLOOMS_LEVEL_MASTERY_WEIGHTS
} from '../constants/mastery-thresholds';

/**
 * Initialize mastery data from an assessment result
 */
export function initializeMasteryFromResult(
  result: AssessmentResultData
): TopicMasteryData {
  // Create a new mastery object with initial values
  const mastery: Partial<TopicMasteryData> = {
    id: '', // Will be assigned by the database
    studentId: result.studentId,
    topicId: result.topicId,
    subjectId: result.subjectId,
    lastAssessmentDate: result.completedAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Initialize all Bloom's levels to 0
  for (const level of Object.values(BloomsTaxonomyLevel)) {
    mastery[level] = 0;
  }
  
  // Update mastery levels based on the assessment result
  for (const [level, data] of Object.entries(result.bloomsLevelScores)) {
    if (data && data.maxScore > 0) {
      const percentage = (data.score / data.maxScore) * 100;
      mastery[level as BloomsTaxonomyLevel] = percentage;
    }
  }
  
  // Calculate overall mastery
  mastery.overallMastery = calculateOverallMastery(mastery as TopicMasteryData);
  
  return mastery as TopicMasteryData;
}

/**
 * Apply decay to mastery levels based on time elapsed
 */
export function applyMasteryDecay(
  mastery: TopicMasteryData,
  config: MasteryDecayConfig = DEFAULT_MASTERY_DECAY_CONFIG
): TopicMasteryData {
  // If decay is disabled, return the original mastery
  if (!config.enabled) {
    return mastery;
  }
  
  // Calculate days since last assessment
  const now = new Date();
  const lastAssessment = new Date(mastery.lastAssessmentDate);
  const daysSinceLastAssessment = Math.floor(
    (now.getTime() - lastAssessment.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // If within grace period, no decay
  if (daysSinceLastAssessment <= config.gracePeriod) {
    return mastery;
  }
  
  // Calculate decay days (days beyond grace period)
  const decayDays = daysSinceLastAssessment - config.gracePeriod;
  
  // Apply decay to each Bloom's level
  const decayedMastery = { ...mastery };
  
  for (const level of Object.values(BloomsTaxonomyLevel)) {
    const currentLevel = mastery[level];
    const decayAmount = decayDays * config.decayRate;
    const newLevel = Math.max(
      currentLevel - decayAmount,
      config.minimumLevel,
      0
    );
    
    decayedMastery[level] = newLevel;
  }
  
  // Recalculate overall mastery
  decayedMastery.overallMastery = calculateOverallMastery(decayedMastery);
  
  return decayedMastery;
}

/**
 * Update mastery levels based on a new assessment result
 */
export function updateMasteryLevels(
  currentMastery: TopicMasteryData,
  newResult: AssessmentResultData
): TopicMasteryData {
  const updatedMastery = { ...currentMastery };
  
  // Update each Bloom's level based on the new result
  for (const [level, data] of Object.entries(newResult.bloomsLevelScores)) {
    if (data && data.maxScore > 0) {
      const bloomsLevel = level as BloomsTaxonomyLevel;
      const currentLevel = currentMastery[bloomsLevel];
      const newPercentage = (data.score / data.maxScore) * 100;
      
      // Weighted average: 70% new result, 30% previous mastery
      updatedMastery[bloomsLevel] = (newPercentage * 0.7) + (currentLevel * 0.3);
    }
  }
  
  // Update timestamps
  updatedMastery.lastAssessmentDate = newResult.completedAt;
  updatedMastery.updatedAt = new Date();
  
  // Recalculate overall mastery
  updatedMastery.overallMastery = calculateOverallMastery(updatedMastery);
  
  return updatedMastery;
}

/**
 * Calculate overall mastery from individual Bloom's levels
 */
export function calculateOverallMastery(mastery: TopicMasteryData): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  // Calculate weighted sum of all Bloom's levels
  for (const [level, weight] of Object.entries(BLOOMS_LEVEL_MASTERY_WEIGHTS)) {
    const bloomsLevel = level as BloomsTaxonomyLevel;
    weightedSum += mastery[bloomsLevel] * weight;
    totalWeight += weight;
  }
  
  // Calculate weighted average
  const overallMastery = totalWeight > 0 
    ? weightedSum / totalWeight 
    : 0;
  
  return Math.round(overallMastery * 10) / 10; // Round to 1 decimal place
}

/**
 * Get mastery level based on percentage
 */
export function getMasteryLevel(
  percentage: number,
  thresholds = DEFAULT_MASTERY_THRESHOLDS
): MasteryLevel {
  if (percentage >= thresholds[MasteryLevel.EXPERT]) {
    return MasteryLevel.EXPERT;
  } else if (percentage >= thresholds[MasteryLevel.ADVANCED]) {
    return MasteryLevel.ADVANCED;
  } else if (percentage >= thresholds[MasteryLevel.PROFICIENT]) {
    return MasteryLevel.PROFICIENT;
  } else if (percentage >= thresholds[MasteryLevel.DEVELOPING]) {
    return MasteryLevel.DEVELOPING;
  } else {
    return MasteryLevel.NOVICE;
  }
}

/**
 * Calculate student mastery analytics
 */
export function calculateStudentMasteryAnalytics(
  studentId: string,
  studentName: string,
  topicMasteries: TopicMasteryData[]
): StudentMasteryAnalytics {
  // Calculate overall mastery (average of all topics)
  const overallMastery = topicMasteries.length > 0
    ? topicMasteries.reduce((sum, tm) => sum + tm.overallMastery, 0) / topicMasteries.length
    : 0;
  
  // Group by subject
  const subjectMap = new Map<string, { sum: number; count: number; name: string }>();
  
  for (const tm of topicMasteries) {
    const current = subjectMap.get(tm.subjectId) || { sum: 0, count: 0, name: '' };
    subjectMap.set(tm.subjectId, {
      sum: current.sum + tm.overallMastery,
      count: current.count + 1,
      name: current.name || `Subject ${tm.subjectId}`, // This should be replaced with actual subject name
    });
  }
  
  // Calculate mastery by subject
  const masteryBySubject = Array.from(subjectMap.entries()).map(([subjectId, data]) => ({
    subjectId,
    subjectName: data.name,
    mastery: data.count > 0 ? Math.round((data.sum / data.count) * 10) / 10 : 0,
  }));
  
  // Calculate Bloom's level breakdown
  const bloomsLevels = Object.values(BloomsTaxonomyLevel).reduce((acc, level) => {
    const sum = topicMasteries.reduce((s, tm) => s + tm[level], 0);
    acc[level] = topicMasteries.length > 0 
      ? Math.round((sum / topicMasteries.length) * 10) / 10 
      : 0;
    return acc;
  }, {} as Record<BloomsTaxonomyLevel, number>);
  
  // Calculate growth (placeholder - would need historical data)
  const growth = {
    overall: 0,
    byBloomsLevel: Object.values(BloomsTaxonomyLevel).reduce((acc, level) => {
      acc[level] = 0;
      return acc;
    }, {} as Record<BloomsTaxonomyLevel, number>),
    period: 'month' as const,
  };
  
  // Identify mastery gaps
  const masteryGaps = topicMasteries
    .filter(tm => tm.overallMastery < 75) // Topics below proficient
    .map(tm => {
      // Find Bloom's levels that are below threshold
      const gapLevels = Object.values(BloomsTaxonomyLevel)
        .filter(level => tm[level] < 70);
      
      return {
        topicId: tm.topicId,
        topicName: `Topic ${tm.topicId}`, // This should be replaced with actual topic name
        currentMastery: tm.overallMastery,
        bloomsLevelGaps: gapLevels,
      };
    });
  
  // Generate recommendations (simplified)
  const recommendations = masteryGaps.flatMap(gap => 
    gap.bloomsLevelGaps.map(level => ({
      type: 'practice' as const,
      description: `Practice ${level.toLowerCase()} skills for ${gap.topicName}`,
      bloomsLevel: level,
      topicId: gap.topicId,
    }))
  );
  
  return {
    studentId,
    studentName,
    overallMastery: Math.round(overallMastery * 10) / 10,
    masteryBySubject,
    bloomsLevels,
    growth,
    masteryGaps,
    recommendations,
  };
}

/**
 * Calculate class mastery analytics
 */
export function calculateClassMasteryAnalytics(
  classId: string,
  className: string,
  studentMasteries: Array<{
    studentId: string;
    topicMasteries: TopicMasteryData[];
  }>
): ClassMasteryAnalytics {
  // Flatten all topic masteries
  const allTopicMasteries = studentMasteries.flatMap(sm => sm.topicMasteries);
  
  // Calculate average mastery
  const averageMastery = allTopicMasteries.length > 0
    ? allTopicMasteries.reduce((sum, tm) => sum + tm.overallMastery, 0) / allTopicMasteries.length
    : 0;
  
  // Calculate mastery distribution
  const masteryDistribution = {
    [MasteryLevel.NOVICE]: 0,
    [MasteryLevel.DEVELOPING]: 0,
    [MasteryLevel.PROFICIENT]: 0,
    [MasteryLevel.ADVANCED]: 0,
    [MasteryLevel.EXPERT]: 0,
  };
  
  for (const tm of allTopicMasteries) {
    const level = getMasteryLevel(tm.overallMastery);
    masteryDistribution[level]++;
  }
  
  // Convert counts to percentages
  const total = allTopicMasteries.length;
  if (total > 0) {
    for (const level of Object.values(MasteryLevel)) {
      masteryDistribution[level] = Math.round((masteryDistribution[level] / total) * 100);
    }
  }
  
  // Calculate Bloom's level breakdown
  const bloomsLevels = Object.values(BloomsTaxonomyLevel).reduce((acc, level) => {
    const sum = allTopicMasteries.reduce((s, tm) => s + tm[level], 0);
    acc[level] = allTopicMasteries.length > 0 
      ? Math.round((sum / allTopicMasteries.length) * 10) / 10 
      : 0;
    return acc;
  }, {} as Record<BloomsTaxonomyLevel, number>);
  
  // Group by topic
  const topicMap = new Map<string, TopicMasteryData[]>();
  
  for (const tm of allTopicMasteries) {
    const current = topicMap.get(tm.topicId) || [];
    topicMap.set(tm.topicId, [...current, tm]);
  }
  
  // Calculate topic mastery breakdown
  const topicMastery = Array.from(topicMap.entries()).map(([topicId, masteries]) => {
    // Calculate average mastery for this topic
    const avgMastery = masteries.length > 0
      ? masteries.reduce((sum, tm) => sum + tm.overallMastery, 0) / masteries.length
      : 0;
    
    // Calculate mastery distribution for this topic
    const distribution = {
      [MasteryLevel.NOVICE]: 0,
      [MasteryLevel.DEVELOPING]: 0,
      [MasteryLevel.PROFICIENT]: 0,
      [MasteryLevel.ADVANCED]: 0,
      [MasteryLevel.EXPERT]: 0,
    };
    
    for (const tm of masteries) {
      const level = getMasteryLevel(tm.overallMastery);
      distribution[level]++;
    }
    
    // Convert counts to percentages
    if (masteries.length > 0) {
      for (const level of Object.values(MasteryLevel)) {
        distribution[level] = Math.round((distribution[level] / masteries.length) * 100);
      }
    }
    
    return {
      topicId,
      topicName: `Topic ${topicId}`, // This should be replaced with actual topic name
      averageMastery: Math.round(avgMastery * 10) / 10,
      masteryDistribution: distribution,
    };
  });
  
  // Identify class mastery gaps
  const masteryGaps = topicMastery
    .filter(tm => tm.averageMastery < 70) // Topics below class average
    .map(tm => {
      // Find Bloom's levels that are below threshold
      const topicMasteries = topicMap.get(tm.topicId) || [];
      const bloomsAverages = Object.values(BloomsTaxonomyLevel).reduce((acc, level) => {
        const sum = topicMasteries.reduce((s, m) => s + m[level], 0);
        acc[level] = topicMasteries.length > 0 ? sum / topicMasteries.length : 0;
        return acc;
      }, {} as Record<BloomsTaxonomyLevel, number>);
      
      const gapLevels = Object.entries(bloomsAverages)
        .filter(([_, value]) => value < 65)
        .map(([level, _]) => level as BloomsTaxonomyLevel);
      
      return {
        topicId: tm.topicId,
        topicName: tm.topicName,
        averageMastery: tm.averageMastery,
        bloomsLevelGaps: gapLevels,
      };
    });
  
  // Generate recommendations (simplified)
  const recommendations = masteryGaps.flatMap(gap => 
    gap.bloomsLevelGaps.map(level => ({
      type: 'activity' as const,
      description: `Plan activities focusing on ${level.toLowerCase()} skills for ${gap.topicName}`,
      bloomsLevel: level,
      topicId: gap.topicId,
    }))
  );
  
  return {
    classId,
    className,
    averageMastery: Math.round(averageMastery * 10) / 10,
    masteryDistribution,
    bloomsLevels,
    topicMastery,
    masteryGaps,
    recommendations,
  };
}
