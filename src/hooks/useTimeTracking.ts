'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/trpc/react';

/**
 * Hook to track time spent on an activity
 * 
 * @param activityId The ID of the activity being tracked
 * @returns An object with the current tracking status
 */
export function useTimeTracking(activityId: string) {
  const startTimeRef = useRef<number>(Date.now());
  const recordTimeSpent = api.learningTime.recordTimeSpent.useMutation();
  
  // Start tracking when the component mounts
  useEffect(() => {
    // Reset the start time
    startTimeRef.current = Date.now();
    
    // Record time spent when the component unmounts
    return () => {
      const endTime = Date.now();
      const timeSpentMs = endTime - startTimeRef.current;
      const timeSpentMinutes = Math.ceil(timeSpentMs / (1000 * 60)); // Convert to minutes and round up
      
      // Only record if time spent is at least 1 minute
      if (timeSpentMinutes >= 1) {
        recordTimeSpent.mutate({
          activityId,
          timeSpentMinutes,
        });
      }
    };
  }, [activityId, recordTimeSpent]);
  
  return {
    isRecording: true,
    startTime: startTimeRef.current,
  };
}
