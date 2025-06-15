/**
 * useLeaderboard Hook
 *
 * This hook provides access to leaderboard data with caching and offline support.
 */

import { useState, useEffect } from 'react';
import {
  LeaderboardEntityType,
  TimeGranularity,
  StandardLeaderboardResponse,
  LeaderboardFilterOptions
} from '../types/standard-leaderboard';

// Assuming we have a tRPC API for leaderboards
import { api } from '@/utils/api';

// Simple storage helpers (inline implementation)
const setLocalStorageItem = (key: string, value: any) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error('Error setting localStorage item:', error);
  }
};

const getLocalStorageItem = (key: string) => {
  try {
    if (typeof window !== 'undefined') {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
    return null;
  } catch (error) {
    console.error('Error getting localStorage item:', error);
    return null;
  }
};

interface UseLeaderboardOptions {
  entityType: LeaderboardEntityType | string;
  entityId: string;
  timeGranularity?: TimeGranularity;
  filterOptions?: LeaderboardFilterOptions;
  enabled?: boolean;
}

/**
 * Hook for accessing leaderboard data
 */
export function useLeaderboard({
  entityType,
  entityId,
  timeGranularity = TimeGranularity.ALL_TIME,
  filterOptions = {},
  enabled = true
}: UseLeaderboardOptions) {
  const [cachedData, setCachedData] = useState<StandardLeaderboardResponse | null>(null);

  // Fetch leaderboard data with tRPC
  const {
    data,
    isLoading: isLoadingApi,
    error,
    refetch
  } = api.unifiedLeaderboard.getLeaderboard.useQuery(
    {
      type: entityType,
      referenceId: entityId,
      timeGranularity,
      ...filterOptions
    },
    {
      refetchOnWindowFocus: false,
      // Use stale data while revalidating to improve perceived performance
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Don't refetch on mount if we have data
      refetchOnMount: false,
      // Enable this for offline support
      enabled: enabled && (typeof navigator !== 'undefined' ? navigator.onLine : true),
      // Cache the data in localStorage when it's fetched
      onSuccess: (data) => {
        if (data) {
          const cacheKey = `leaderboard:${entityType}:${entityId}:${timeGranularity}`;
          setLocalStorageItem(cacheKey, {
            data,
            timestamp: Date.now()
          });
        }
      }
    }
  );

  // Load data from localStorage if online fetch fails or we're offline
  useEffect(() => {
    const loadFromCache = () => {
      // Only load from cache if we don't have data and either we're offline or there was an error
      const shouldLoadFromCache = !data &&
        ((typeof navigator !== 'undefined' && !navigator.onLine) || error);

      if (shouldLoadFromCache) {
        const cacheKey = `leaderboard:${entityType}:${entityId}:${timeGranularity}`;
        const cachedItem = getLocalStorageItem(cacheKey);

        if (cachedItem && cachedItem.data) {
          // Check if cache is older than 24 hours
          const isCacheStale = Date.now() - cachedItem.timestamp > 24 * 60 * 60 * 1000;

          if (!isCacheStale) {
            // Use cached data
            console.log('Using cached leaderboard data');
            setCachedData(cachedItem.data);
          } else {
            console.log('Cached data is stale');
            setCachedData(null);
          }
        } else {
          console.log('No cached data found');
          setCachedData(null);
        }
      }
    };

    loadFromCache();
    // Remove data from dependency array to prevent infinite loop
  }, [entityType, entityId, timeGranularity, error]);

  // Determine if we're using cached data (memoize this to prevent unnecessary re-renders)
  const isUsingCachedData = !data && cachedData !== null;

  // Combine loading states (only show loading if we don't have data or cached data)
  const isLoading = isLoadingApi && !isUsingCachedData && !data;

  return {
    data: data || cachedData,
    isLoading,
    isUsingCachedData,
    error,
    refetch
  };
}
