/**
 * Leaderboard Calculation Utilities
 * 
 * This file provides utility functions for leaderboard calculations.
 */

import { StandardLeaderboardEntry } from '../types/standard-leaderboard';

/**
 * Calculate rank changes between two leaderboard snapshots
 * 
 * @param currentEntries Current leaderboard entries
 * @param previousEntries Previous leaderboard entries
 * @returns Updated entries with rank changes
 */
export function calculateRankChanges(
  currentEntries: StandardLeaderboardEntry[],
  previousEntries: StandardLeaderboardEntry[]
): StandardLeaderboardEntry[] {
  // Create a map of previous entries by student ID for quick lookup
  const previousEntriesMap = new Map<string, StandardLeaderboardEntry>();
  previousEntries.forEach(entry => {
    previousEntriesMap.set(entry.studentId, entry);
  });
  
  // Update current entries with rank changes
  return currentEntries.map(entry => {
    const previousEntry = previousEntriesMap.get(entry.studentId);
    
    if (previousEntry) {
      const previousRank = previousEntry.rank;
      const rankChange = previousRank - entry.rank; // Positive means improvement
      
      return {
        ...entry,
        previousRank,
        rankChange
      };
    }
    
    // No previous entry found, this is a new student
    return {
      ...entry,
      previousRank: undefined,
      rankChange: undefined
    };
  });
}

/**
 * Calculate distances to next and previous ranks
 * 
 * @param entries Leaderboard entries
 * @param metric Metric to use for distance calculation (rewardPoints or academicScore)
 * @returns Updated entries with distances
 */
export function calculateRankDistances(
  entries: StandardLeaderboardEntry[],
  metric: 'rewardPoints' | 'academicScore' = 'rewardPoints'
): StandardLeaderboardEntry[] {
  // Sort entries by rank to ensure correct order
  const sortedEntries = [...entries].sort((a, b) => a.rank - b.rank);
  
  return sortedEntries.map((entry, index) => {
    let distanceToNextRank: number | undefined;
    let distanceToPreviousRank: number | undefined;
    
    // Calculate distance to next rank (if not the top rank)
    if (index > 0) {
      const nextRankEntry = sortedEntries[index - 1]; // Lower index = higher rank
      distanceToNextRank = nextRankEntry[metric] - entry[metric];
    }
    
    // Calculate distance to previous rank (if not the bottom rank)
    if (index < sortedEntries.length - 1) {
      const previousRankEntry = sortedEntries[index + 1]; // Higher index = lower rank
      distanceToPreviousRank = entry[metric] - previousRankEntry[metric];
    }
    
    return {
      ...entry,
      distanceToNextRank,
      distanceToPreviousRank
    };
  });
}

/**
 * Calculate consistency score based on activity completion pattern
 * 
 * @param activityDates Array of dates when activities were completed
 * @param startDate Start date for calculation
 * @param endDate End date for calculation
 * @returns Consistency score (0-100)
 */
export function calculateConsistencyScore(
  activityDates: Date[],
  startDate: Date,
  endDate: Date
): number {
  if (activityDates.length === 0) {
    return 0;
  }
  
  // Sort dates
  const sortedDates = [...activityDates].sort((a, b) => a.getTime() - b.getTime());
  
  // Calculate total days in the period
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate the number of unique days with activity
  const uniqueDays = new Set(
    sortedDates.map(date => date.toISOString().split('T')[0])
  ).size;
  
  // Calculate average gap between activities
  let totalGap = 0;
  let gapCount = 0;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const gap = (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    totalGap += gap;
    gapCount++;
  }
  
  const averageGap = gapCount > 0 ? totalGap / gapCount : totalDays;
  
  // Calculate consistency score
  // Higher score for more unique days and lower average gap
  const daysCoverage = (uniqueDays / totalDays) * 100;
  const gapScore = Math.max(0, 100 - (averageGap * 10)); // Lower gap = higher score
  
  // Weighted average of the two scores
  const consistencyScore = (daysCoverage * 0.6) + (gapScore * 0.4);
  
  return Math.min(100, Math.max(0, Math.round(consistencyScore)));
}

/**
 * Normalize scores to ensure fair comparison across different contexts
 * 
 * @param entries Leaderboard entries
 * @param metric Metric to normalize
 * @returns Updated entries with normalized scores
 */
export function normalizeScores(
  entries: StandardLeaderboardEntry[],
  metric: 'rewardPoints' | 'academicScore' = 'rewardPoints'
): StandardLeaderboardEntry[] {
  if (entries.length === 0) {
    return [];
  }
  
  // Find min and max values
  const values = entries.map(entry => entry[metric]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // If all values are the same, return the original entries
  if (minValue === maxValue) {
    return entries;
  }
  
  // Normalize values to 0-100 range
  return entries.map(entry => {
    const normalizedValue = ((entry[metric] - minValue) / (maxValue - minValue)) * 100;
    
    return {
      ...entry,
      [`normalized${metric.charAt(0).toUpperCase() + metric.slice(1)}`]: Math.round(normalizedValue)
    };
  });
}
