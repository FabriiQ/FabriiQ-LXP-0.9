/**
 * useLeaderboardFilters Hook
 * 
 * This hook provides filtering capabilities for leaderboards,
 * including demographic and custom group partitioning.
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  StandardLeaderboardEntry, 
  LeaderboardFilterOptions 
} from '../types/standard-leaderboard';
import { 
  DemographicFilterOptions, 
  CustomGroupFilterOptions,
  filterByDemographics,
  filterByCustomGroup,
  createCustomGroupLeaderboard,
  createDemographicLeaderboard
} from '../utils/partition-helpers';

interface UseLeaderboardFiltersOptions {
  entries: StandardLeaderboardEntry[];
  initialFilters?: LeaderboardFilterOptions;
  demographicOptions?: DemographicFilterOptions;
  customGroups?: CustomGroupFilterOptions[];
  studentProfiles?: Record<string, { 
    age?: number; 
    gradeLevel?: string;
    gender?: string;
  }>;
}

/**
 * Hook for filtering leaderboard entries
 */
export function useLeaderboardFilters({
  entries,
  initialFilters = {},
  demographicOptions,
  customGroups = [],
  studentProfiles = {}
}: UseLeaderboardFiltersOptions) {
  // State for filters
  const [filters, setFilters] = useState<LeaderboardFilterOptions>(initialFilters);
  const [selectedDemographicFilter, setSelectedDemographicFilter] = useState<DemographicFilterOptions | undefined>(demographicOptions);
  const [selectedCustomGroup, setSelectedCustomGroup] = useState<CustomGroupFilterOptions | undefined>(
    customGroups.length > 0 ? customGroups[0] : undefined
  );
  
  // Apply filters to entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];
    
    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(entry => 
        entry.studentName.toLowerCase().includes(query) ||
        (entry.enrollmentNumber && entry.enrollmentNumber.toLowerCase().includes(query))
      );
    }
    
    // Apply level filter
    if (filters.minLevel !== undefined || filters.maxLevel !== undefined) {
      result = result.filter(entry => {
        const level = entry.level || 1;
        if (filters.minLevel !== undefined && level < filters.minLevel) {
          return false;
        }
        if (filters.maxLevel !== undefined && level > filters.maxLevel) {
          return false;
        }
        return true;
      });
    }
    
    // Apply achievement filter
    if (filters.achievementFilter && filters.achievementFilter.length > 0) {
      // This would require additional data about which achievements each student has
      // For now, we'll just filter by the number of achievements
      result = result.filter(entry => 
        entry.achievements !== undefined && entry.achievements > 0
      );
    }
    
    // Apply demographic filter if selected
    if (selectedDemographicFilter && Object.keys(selectedDemographicFilter).length > 0) {
      result = filterByDemographics(result, selectedDemographicFilter, studentProfiles);
    }
    
    // Apply custom group filter if selected
    if (selectedCustomGroup) {
      result = filterByCustomGroup(result, selectedCustomGroup);
    }
    
    // Apply sorting
    if (filters.sortBy) {
      result = [...result].sort((a, b) => {
        let comparison = 0;
        
        switch (filters.sortBy) {
          case 'rank':
            comparison = a.rank - b.rank;
            break;
          case 'academicScore':
            comparison = b.academicScore - a.academicScore;
            break;
          case 'rewardPoints':
            comparison = b.rewardPoints - a.rewardPoints;
            break;
          case 'completionRate':
            comparison = b.completionRate - a.completionRate;
            break;
          default:
            comparison = a.rank - b.rank;
        }
        
        return filters.sortDirection === 'desc' ? -comparison : comparison;
      });
    }
    
    return result;
  }, [entries, filters, selectedDemographicFilter, selectedCustomGroup, studentProfiles]);
  
  // Create a custom group leaderboard with recalculated ranks
  const customGroupLeaderboard = useMemo(() => {
    if (!selectedCustomGroup || entries.length === 0) {
      return [];
    }
    
    return createCustomGroupLeaderboard(entries, selectedCustomGroup);
  }, [entries, selectedCustomGroup]);
  
  // Create a demographic leaderboard with recalculated ranks
  const demographicLeaderboard = useMemo(() => {
    if (!selectedDemographicFilter || Object.keys(selectedDemographicFilter).length === 0 || entries.length === 0) {
      return [];
    }
    
    return createDemographicLeaderboard(entries, selectedDemographicFilter, studentProfiles);
  }, [entries, selectedDemographicFilter, studentProfiles]);
  
  // Update filters
  const updateFilters = (newFilters: Partial<LeaderboardFilterOptions>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };
  
  // Select a demographic filter
  const selectDemographicFilter = (options: DemographicFilterOptions | undefined) => {
    setSelectedDemographicFilter(options);
    // Clear custom group when demographic filter is selected
    if (options) {
      setSelectedCustomGroup(undefined);
    }
  };
  
  // Select a custom group
  const selectCustomGroup = (group: CustomGroupFilterOptions | undefined) => {
    setSelectedCustomGroup(group);
    // Clear demographic filter when custom group is selected
    if (group) {
      setSelectedDemographicFilter(undefined);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters(initialFilters);
    setSelectedDemographicFilter(undefined);
    setSelectedCustomGroup(undefined);
  };
  
  return {
    filters,
    updateFilters,
    filteredEntries,
    customGroupLeaderboard,
    demographicLeaderboard,
    selectedDemographicFilter,
    selectedCustomGroup,
    selectDemographicFilter,
    selectCustomGroup,
    resetFilters,
    availableCustomGroups: customGroups
  };
}
