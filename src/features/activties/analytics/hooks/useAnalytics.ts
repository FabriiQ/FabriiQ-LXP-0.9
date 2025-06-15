'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ActivityAnalytics,
  UserAnalytics,
  ClassAnalytics,
  ActivityUsage,
  ActivityUsageOverTime,
  UserEngagement,
  ActivityComparison,
  AnalyticsTimeRange,
  AnalyticsDashboardFilters
} from '../types';
import { analyticsService } from '../services/analytics';

/**
 * Hook for using analytics
 * 
 * @returns Analytics hook
 */
export function useAnalytics() {
  const [activityAnalytics, setActivityAnalytics] = useState<ActivityAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics | null>(null);
  const [activityUsage, setActivityUsage] = useState<ActivityUsage[]>([]);
  const [activityUsageOverTime, setActivityUsageOverTime] = useState<ActivityUsageOverTime | null>(null);
  const [userEngagement, setUserEngagement] = useState<UserEngagement[]>([]);
  const [activityComparison, setActivityComparison] = useState<ActivityComparison | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Load activity analytics
   * 
   * @param activityId Activity ID
   */
  const loadActivityAnalytics = useCallback(async (activityId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const analytics = await analyticsService.getActivityAnalytics(activityId);
      setActivityAnalytics(analytics);
    } catch (error) {
      console.error('Error loading activity analytics:', error);
      setError('Failed to load activity analytics');
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Load user analytics
   * 
   * @param userId User ID
   */
  const loadUserAnalytics = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const analytics = await analyticsService.getUserAnalytics(userId);
      setUserAnalytics(analytics);
    } catch (error) {
      console.error('Error loading user analytics:', error);
      setError('Failed to load user analytics');
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Load class analytics
   * 
   * @param classId Class ID
   */
  const loadClassAnalytics = useCallback(async (classId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const analytics = await analyticsService.getClassAnalytics(classId);
      setClassAnalytics(analytics);
    } catch (error) {
      console.error('Error loading class analytics:', error);
      setError('Failed to load class analytics');
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Load activity usage
   * 
   * @param filters Analytics dashboard filters
   */
  const loadActivityUsage = useCallback(async (filters?: AnalyticsDashboardFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const usage = await analyticsService.getActivityUsage(filters);
      setActivityUsage(usage);
    } catch (error) {
      console.error('Error loading activity usage:', error);
      setError('Failed to load activity usage');
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Load activity usage over time
   * 
   * @param activityId Activity ID
   * @param timeRange Time range
   */
  const loadActivityUsageOverTime = useCallback(async (
    activityId: string,
    timeRange: AnalyticsTimeRange
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const usage = await analyticsService.getActivityUsageOverTime(activityId, timeRange);
      setActivityUsageOverTime(usage);
    } catch (error) {
      console.error('Error loading activity usage over time:', error);
      setError('Failed to load activity usage over time');
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Load user engagement
   * 
   * @param filters Analytics dashboard filters
   */
  const loadUserEngagement = useCallback(async (filters?: AnalyticsDashboardFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const engagement = await analyticsService.getUserEngagement(filters);
      setUserEngagement(engagement);
    } catch (error) {
      console.error('Error loading user engagement:', error);
      setError('Failed to load user engagement');
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Compare activities
   * 
   * @param activityIds Activity IDs
   */
  const compareActivities = useCallback(async (activityIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const comparison = await analyticsService.compareActivities(activityIds);
      setActivityComparison(comparison);
    } catch (error) {
      console.error('Error comparing activities:', error);
      setError('Failed to compare activities');
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    activityAnalytics,
    userAnalytics,
    classAnalytics,
    activityUsage,
    activityUsageOverTime,
    userEngagement,
    activityComparison,
    loading,
    error,
    loadActivityAnalytics,
    loadUserAnalytics,
    loadClassAnalytics,
    loadActivityUsage,
    loadActivityUsageOverTime,
    loadUserEngagement,
    compareActivities,
  };
}
