'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '@/trpc/react';

// Constants for batching
const MAX_BATCH_SIZE = 50;
const MAX_BATCH_AGE_MS = 5 * 60 * 1000; // 5 minutes

interface TimeRecord {
  activityId: string;
  timeSpentMinutes: number;
  startedAt: number;
  completedAt: number;
}

interface TimeTrackingContextType {
  startTracking: (activityId: string) => void;
  stopTracking: (activityId: string) => void;
  isTracking: (activityId: string) => boolean;
  getElapsedTime: (activityId: string) => number; // in seconds
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

interface TimeTrackingProviderProps {
  children: React.ReactNode;
}

export function TimeTrackingProvider({ children }: TimeTrackingProviderProps) {
  // Track activities and their start times
  const [trackedActivities, setTrackedActivities] = useState<Record<string, number>>({});

  // Batch processing state
  const [pendingRecords, setPendingRecords] = useState<TimeRecord[]>([]);
  const [lastBatchTime, setLastBatchTime] = useState<number>(Date.now());

  // API mutations
  const recordTimeSpent = api.learningTime.recordTimeSpent.useMutation();
  const batchRecordTimeSpent = api.learningTime.batchRecordTimeSpent.useMutation();

  // Use a ref to store the interval ID
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start tracking an activity
  const startTracking = (activityId: string) => {
    setTrackedActivities((prev) => ({
      ...prev,
      [activityId]: Date.now(),
    }));
  };

  // Stop tracking an activity and add to pending records
  const stopTracking = (activityId: string) => {
    const startTime = trackedActivities[activityId];
    if (startTime) {
      const endTime = Date.now();
      const timeSpentMs = endTime - startTime;
      const timeSpentMinutes = Math.ceil(timeSpentMs / (1000 * 60)); // Convert to minutes and round up

      // Only record if time spent is at least 1 minute
      if (timeSpentMinutes >= 1) {
        // Add to pending records
        setPendingRecords(prev => [
          ...prev,
          {
            activityId,
            timeSpentMinutes,
            startedAt: startTime,
            completedAt: endTime
          }
        ]);

        // Also update the activity grade content with time spent
        try {
          // Get the current activity grade
          api.activity.getActivityGrade.query({
            activityId
          }).then(grade => {
            if (grade) {
              // Update the content to include time spent
              const content = grade.content || {};
              const updatedContent = {
                ...content,
                timeSpent: timeSpentMinutes
              };

              // Update the activity grade
              api.activity.updateActivityGrade.mutate({
                activityId,
                content: updatedContent
              });
            }
          }).catch(error => {
            console.error('Failed to update activity grade with time spent:', error);
          });
        } catch (error) {
          console.error('Error updating activity grade with time spent:', error);
        }
      }

      // Remove the activity from tracked activities
      setTrackedActivities((prev) => {
        const newTrackedActivities = { ...prev };
        delete newTrackedActivities[activityId];
        return newTrackedActivities;
      });
    }
  };

  // Check if an activity is being tracked
  const isTracking = (activityId: string) => {
    return !!trackedActivities[activityId];
  };

  // Get elapsed time for an activity in seconds
  const getElapsedTime = (activityId: string) => {
    const startTime = trackedActivities[activityId];
    if (!startTime) return 0;

    const now = Date.now();
    return Math.floor((now - startTime) / 1000); // in seconds
  };

  // Process pending records
  const processPendingRecords = async () => {
    if (pendingRecords.length === 0) return;

    // Check if we should process the batch
    const batchSize = pendingRecords.length;
    const batchAge = Date.now() - lastBatchTime;

    if (batchSize >= MAX_BATCH_SIZE || batchAge >= MAX_BATCH_AGE_MS) {
      try {
        // Send batch to server
        await batchRecordTimeSpent.mutateAsync({
          records: pendingRecords
        });

        // Clear pending records after successful sync
        setPendingRecords([]);
        setLastBatchTime(Date.now());
      } catch (error) {
        console.error('Failed to sync time records:', error);
        // Keep records in storage for retry

        // Store in localStorage for offline support
        try {
          const existingRecords = JSON.parse(localStorage.getItem('timeTracking_pendingRecords') || '[]');
          localStorage.setItem('timeTracking_pendingRecords', JSON.stringify([...existingRecords, ...pendingRecords]));

          // Clear pending records after storing for retry
          setPendingRecords([]);
          setLastBatchTime(Date.now());
        } catch (storageError) {
          console.error('Failed to store time records in localStorage:', storageError);
        }
      }
    }
  };

  // Process pending records periodically
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      processPendingRecords();
    }, 60000) as unknown as NodeJS.Timeout; // Check every minute

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pendingRecords, lastBatchTime]);

  // Process pending records when online
  useEffect(() => {
    const handleOnline = () => {
      // Try to get records from localStorage
      try {
        const storedRecords = JSON.parse(localStorage.getItem('timeTracking_pendingRecords') || '[]');
        if (storedRecords.length > 0) {
          // Send stored records to server
          batchRecordTimeSpent.mutateAsync({
            records: storedRecords
          }).then(() => {
            // Clear records from localStorage
            localStorage.removeItem('timeTracking_pendingRecords');
          }).catch(error => {
            console.error('Failed to sync stored time records:', error);
          });
        }
      } catch (error) {
        console.error('Failed to process stored time records:', error);
      }

      // Process current pending records
      processPendingRecords();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [pendingRecords]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Record time for all tracked activities
      Object.entries(trackedActivities).forEach(([activityId, startTime]) => {
        const endTime = Date.now();
        const timeSpentMs = endTime - startTime;
        const timeSpentMinutes = Math.ceil(timeSpentMs / (1000 * 60));

        if (timeSpentMinutes >= 1) {
          // Add to pending records
          setPendingRecords(prev => [
            ...prev,
            {
              activityId,
              timeSpentMinutes,
              startedAt: startTime,
              completedAt: endTime
            }
          ]);
        }
      });

      // Process any pending records
      processPendingRecords();

      // Clear the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [trackedActivities]);

  const contextValue: TimeTrackingContextType = {
    startTracking,
    stopTracking,
    isTracking,
    getElapsedTime,
  };

  return (
    <TimeTrackingContext.Provider value={contextValue}>
      {children}
    </TimeTrackingContext.Provider>
  );
}

// Custom hook to use the time tracking context
export function useTimeTracking() {
  const context = useContext(TimeTrackingContext);
  if (context === undefined) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  }
  return context;
}
