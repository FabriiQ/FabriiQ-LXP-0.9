/**
 * useBloomsCache hook
 * 
 * This hook provides a way to cache data in Bloom's Taxonomy components
 * to improve UI performance and reduce API calls.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getCacheItem,
  setCacheItem,
  removeCacheItem,
  CacheOptions
} from '../utils/client-cache';

interface UseCacheOptions extends CacheOptions {
  enabled?: boolean;
}

/**
 * Hook for caching data in Bloom's Taxonomy components
 * @param key Cache key
 * @param fetcher Function to fetch data if not in cache
 * @param options Cache options
 * @returns Object with data, loading state, error, and refetch function
 */
export function useBloomsCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const {
    duration,
    useStorage = false,
    enabled = true
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (skipCache = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get from cache first if not skipping cache
      if (!skipCache && enabled) {
        const cachedData = getCacheItem<T>(key, { useStorage });
        if (cachedData !== null) {
          setData(cachedData);
          setIsLoading(false);
          return cachedData;
        }
      }

      // Fetch fresh data
      const freshData = await fetcher();
      
      // Cache the data if enabled
      if (enabled) {
        setCacheItem<T>(key, freshData, { duration, useStorage });
      }
      
      setData(freshData);
      return freshData;
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error(String(err));
      setError(fetchError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, enabled, duration, useStorage]);

  // Fetch data on mount or when dependencies change
  useEffect(() => {
    if (enabled) {
      void fetchData(false);
    }
  }, [enabled, fetchData]);

  // Function to force refresh the data
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Function to invalidate the cache
  const invalidateCache = useCallback(() => {
    removeCacheItem(key, { useStorage });
    return fetchData(true);
  }, [key, useStorage, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidateCache
  };
}

/**
 * Hook for caching class performance data
 * @param classId Class ID
 * @param fetcher Function to fetch data if not in cache
 * @param options Cache options
 * @returns Object with data, loading state, error, and refetch function
 */
export function useClassPerformanceCache<T>(
  classId: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const cacheKey = `class:${classId}:performance`;
  return useBloomsCache<T>(cacheKey, fetcher, options);
}

/**
 * Hook for caching student performance data
 * @param studentId Student ID
 * @param fetcher Function to fetch data if not in cache
 * @param options Cache options
 * @returns Object with data, loading state, error, and refetch function
 */
export function useStudentPerformanceCache<T>(
  studentId: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const cacheKey = `student:${studentId}:performance`;
  return useBloomsCache<T>(cacheKey, fetcher, options);
}

/**
 * Hook for caching assessment performance data
 * @param assessmentId Assessment ID
 * @param fetcher Function to fetch data if not in cache
 * @param options Cache options
 * @returns Object with data, loading state, error, and refetch function
 */
export function useAssessmentPerformanceCache<T>(
  assessmentId: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const cacheKey = `assessment:${assessmentId}:performance`;
  return useBloomsCache<T>(cacheKey, fetcher, options);
}

/**
 * Hook for caching topic mastery data
 * @param studentId Student ID
 * @param topicId Topic ID
 * @param fetcher Function to fetch data if not in cache
 * @param options Cache options
 * @returns Object with data, loading state, error, and refetch function
 */
export function useTopicMasteryCache<T>(
  studentId: string,
  topicId: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const cacheKey = `student:${studentId}:topic:${topicId}:mastery`;
  return useBloomsCache<T>(cacheKey, fetcher, options);
}

/**
 * Hook for caching rubric data
 * @param rubricId Rubric ID
 * @param fetcher Function to fetch data if not in cache
 * @param options Cache options
 * @returns Object with data, loading state, error, and refetch function
 */
export function useRubricCache<T>(
  rubricId: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const cacheKey = `rubric:${rubricId}`;
  return useBloomsCache<T>(cacheKey, fetcher, options);
}
