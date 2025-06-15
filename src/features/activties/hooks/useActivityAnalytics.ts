'use client';

import { useEffect, useRef } from 'react';
import analyticsManager, { AnalyticsProvider } from '../analytics/activity-analytics';

/**
 * Hook for using activity analytics in components
 * 
 * @param activityId The ID of the activity
 * @param activityType The type of activity
 * @param provider Optional analytics provider
 * @returns The analytics manager instance
 */
export function useActivityAnalytics(
  activityId: string,
  activityType: string,
  provider?: AnalyticsProvider
) {
  const startTimeRef = useRef<number>(Date.now());
  
  // Set the provider if provided
  useEffect(() => {
    if (provider) {
      analyticsManager.setProvider(provider);
    }
  }, [provider]);
  
  // Track activity start
  useEffect(() => {
    analyticsManager.trackActivityStart(activityId, activityType);
    startTimeRef.current = Date.now();
    
    // Track activity complete on unmount
    return () => {
      const timeSpent = Date.now() - startTimeRef.current;
      analyticsManager.trackEvent('activity_complete', {
        activityId,
        activityType,
        timeSpent
      });
    };
  }, [activityId, activityType]);
  
  return analyticsManager;
}

export default useActivityAnalytics;
