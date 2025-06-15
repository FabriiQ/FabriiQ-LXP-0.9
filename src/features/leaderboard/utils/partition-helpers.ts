/**
 * Leaderboard Partition Helpers
 * 
 * This file provides utility functions for leaderboard partitioning,
 * including demographic and custom group partitioning.
 */

import { StandardLeaderboardEntry, LeaderboardEntityType } from '../types/standard-leaderboard';

/**
 * Demographic filter options
 */
export interface DemographicFilterOptions {
  ageGroups?: {
    min: number;
    max: number;
    label: string;
  }[];
  gradeLevel?: string | string[];
  gender?: string | string[];
}

/**
 * Custom group filter options
 */
export interface CustomGroupFilterOptions {
  groupId: string;
  groupName: string;
  memberIds: string[];
}

/**
 * Filter leaderboard entries by demographic criteria
 * 
 * @param entries Leaderboard entries to filter
 * @param options Demographic filter options
 * @param studentProfiles Student profile data with demographic information
 * @returns Filtered leaderboard entries
 */
export function filterByDemographics(
  entries: StandardLeaderboardEntry[],
  options: DemographicFilterOptions,
  studentProfiles: Record<string, { 
    age?: number; 
    gradeLevel?: string;
    gender?: string;
  }>
): StandardLeaderboardEntry[] {
  if (!options || Object.keys(options).length === 0) {
    return entries;
  }
  
  return entries.filter(entry => {
    const profile = studentProfiles[entry.studentId];
    
    if (!profile) {
      return false;
    }
    
    // Filter by age groups
    if (options.ageGroups && options.ageGroups.length > 0 && profile.age) {
      const matchesAgeGroup = options.ageGroups.some(group => 
        profile.age! >= group.min && profile.age! <= group.max
      );
      
      if (!matchesAgeGroup) {
        return false;
      }
    }
    
    // Filter by grade level
    if (options.gradeLevel) {
      if (Array.isArray(options.gradeLevel)) {
        if (!options.gradeLevel.includes(profile.gradeLevel || '')) {
          return false;
        }
      } else if (profile.gradeLevel !== options.gradeLevel) {
        return false;
      }
    }
    
    // Filter by gender
    if (options.gender) {
      if (Array.isArray(options.gender)) {
        if (!options.gender.includes(profile.gender || '')) {
          return false;
        }
      } else if (profile.gender !== options.gender) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Filter leaderboard entries by custom group
 * 
 * @param entries Leaderboard entries to filter
 * @param customGroup Custom group filter options
 * @returns Filtered leaderboard entries
 */
export function filterByCustomGroup(
  entries: StandardLeaderboardEntry[],
  customGroup: CustomGroupFilterOptions
): StandardLeaderboardEntry[] {
  if (!customGroup || !customGroup.memberIds || customGroup.memberIds.length === 0) {
    return entries;
  }
  
  // Create a Set for faster lookups
  const memberIdSet = new Set(customGroup.memberIds);
  
  // Filter entries by membership in the custom group
  return entries.filter(entry => memberIdSet.has(entry.studentId));
}

/**
 * Create a custom group leaderboard
 * 
 * @param entries Source leaderboard entries
 * @param customGroup Custom group filter options
 * @returns Custom group leaderboard entries with recalculated ranks
 */
export function createCustomGroupLeaderboard(
  entries: StandardLeaderboardEntry[],
  customGroup: CustomGroupFilterOptions
): StandardLeaderboardEntry[] {
  // Filter entries by custom group
  const filteredEntries = filterByCustomGroup(entries, customGroup);
  
  // Sort by reward points (or other criteria)
  const sortedEntries = [...filteredEntries].sort((a, b) => b.rewardPoints - a.rewardPoints);
  
  // Recalculate ranks
  return sortedEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    // Store original rank for reference
    previousRank: entry.rank
  }));
}

/**
 * Create a demographic partition leaderboard
 * 
 * @param entries Source leaderboard entries
 * @param options Demographic filter options
 * @param studentProfiles Student profile data with demographic information
 * @returns Demographic partition leaderboard entries with recalculated ranks
 */
export function createDemographicLeaderboard(
  entries: StandardLeaderboardEntry[],
  options: DemographicFilterOptions,
  studentProfiles: Record<string, { 
    age?: number; 
    gradeLevel?: string;
    gender?: string;
  }>
): StandardLeaderboardEntry[] {
  // Filter entries by demographics
  const filteredEntries = filterByDemographics(entries, options, studentProfiles);
  
  // Sort by reward points (or other criteria)
  const sortedEntries = [...filteredEntries].sort((a, b) => b.rewardPoints - a.rewardPoints);
  
  // Recalculate ranks
  return sortedEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    // Store original rank for reference
    previousRank: entry.rank
  }));
}

/**
 * Generate a partition key for a leaderboard
 * 
 * @param type Entity type
 * @param referenceId Entity ID
 * @param timeGranularity Time granularity
 * @param demographicOptions Optional demographic options
 * @param customGroupId Optional custom group ID
 * @returns Partition key string
 */
export function generatePartitionKey(
  type: LeaderboardEntityType | string,
  referenceId: string,
  timeGranularity: string,
  demographicOptions?: DemographicFilterOptions,
  customGroupId?: string
): string {
  let key = `${type}:${referenceId}:${timeGranularity}`;
  
  // Add demographic information if provided
  if (demographicOptions) {
    if (demographicOptions.ageGroups && demographicOptions.ageGroups.length > 0) {
      const ageRange = demographicOptions.ageGroups.map(g => `${g.min}-${g.max}`).join(',');
      key += `:age=${ageRange}`;
    }
    
    if (demographicOptions.gradeLevel) {
      const gradeLevel = Array.isArray(demographicOptions.gradeLevel) 
        ? demographicOptions.gradeLevel.join(',')
        : demographicOptions.gradeLevel;
      key += `:grade=${gradeLevel}`;
    }
    
    if (demographicOptions.gender) {
      const gender = Array.isArray(demographicOptions.gender)
        ? demographicOptions.gender.join(',')
        : demographicOptions.gender;
      key += `:gender=${gender}`;
    }
  }
  
  // Add custom group information if provided
  if (customGroupId) {
    key += `:group=${customGroupId}`;
  }
  
  return key;
}
