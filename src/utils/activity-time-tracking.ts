'use client';

import { api } from '@/trpc/react';

/**
 * Record time spent on an activity
 * 
 * @param activityId The ID of the activity
 * @param timeSpentMinutes Time spent in minutes
 */
export async function recordActivityTime(activityId: string, timeSpentMinutes: number) {
  try {
    // Get the mutation function
    const { mutateAsync } = api.learningTime.recordTimeSpent.useMutation();
    
    // Only record if time spent is at least 1 minute
    if (timeSpentMinutes >= 1) {
      await mutateAsync({
        activityId,
        timeSpentMinutes,
      });
      console.log(`Recorded ${timeSpentMinutes} minutes for activity ${activityId}`);
    }
  } catch (error) {
    console.error('Failed to record activity time:', error);
  }
}

/**
 * Calculate time spent in minutes from start and end timestamps
 * 
 * @param startTime Start timestamp in milliseconds
 * @param endTime End timestamp in milliseconds
 * @returns Time spent in minutes (rounded up)
 */
export function calculateTimeSpent(startTime: number, endTime: number): number {
  const timeSpentMs = endTime - startTime;
  return Math.ceil(timeSpentMs / (1000 * 60)); // Convert to minutes and round up
}

/**
 * Format time in minutes to a human-readable string
 * 
 * @param minutes Time in minutes
 * @returns Formatted time string (e.g., "2h 30m")
 */
export function formatTimeSpent(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${remainingMinutes}m`;
}
