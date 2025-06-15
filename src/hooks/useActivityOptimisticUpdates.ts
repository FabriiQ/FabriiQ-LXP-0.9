'use client';

import { useState } from 'react';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { CACHE_KEYS } from '@/utils/query-config';
import { isOnline } from '@/utils/offline-storage';
import { saveActivityResult } from '@/features/activties';

/**
 * Hook for optimistic UI updates with activity API
 */
export function useActivityOptimisticUpdates() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const utils = api.useUtils();

  // Get optimistic update helper
  const { update: updateActivities } = useOptimisticUpdate([]);

  // Get activity mutations
  const submitActivityMutation = api.activity.submitActivity.useMutation();

  /**
   * Submit activity with optimistic UI update
   */
  const submitActivity = async (params: {
    activityId: string;
    answers: any;
    clientResult?: any;
    userId?: string;
  }) => {
    const { activityId, answers, clientResult, userId } = params;

    // Check if online
    const online = isOnline();

    setIsSubmitting(true);

    try {
      // Create optimistic result
      const optimisticResult = {
        score: clientResult?.score || 0,
        maxScore: clientResult?.maxScore || 100,
        feedback: online
          ? "Submitting your activity..."
          : "Your activity has been saved offline and will be submitted when you're back online.",
        rewardPoints: 10, // Default points
        levelUp: false,
        newLevel: null,
        achievements: []
      };

      if (!online) {
        // Save offline
        const resultId = `result-${activityId}-${Date.now()}`;
        const attemptId = `attempt-${Date.now()}`;

        try {
          await saveActivityResult(
            resultId,
            activityId,
            userId || 'student',
            attemptId,
            {
              answers,
              result: clientResult,
              submittedAt: new Date().toISOString()
            },
            false // Not synced yet
          );
        } catch (offlineError) {
          console.error('Failed to save activity offline:', offlineError);
          throw offlineError;
        }

        // Show toast
        toast({
          title: "Saved offline",
          description: "Your activity has been saved and will be submitted when you're back online.",
          variant: "info",
        });

        // Update activities list optimistically
        updateActivities(
          (oldData: any) => {
            // Find and update the activity in the list
            if (Array.isArray(oldData)) {
              return oldData.map(activity =>
                activity.id === activityId
                  ? { ...activity, status: 'completed' }
                  : activity
              );
            }
            return oldData;
          },
          () => Promise.resolve(optimisticResult),
          { activityId, answers, clientResult },
          {
            successMessage: "Activity completed successfully!",
            errorMessage: "Failed to complete activity. Please try again."
          }
        );

        return optimisticResult;
      } else {
        // Online submission with optimistic update
        try {
          const result = await updateActivities(
            (oldData: any) => {
              // Find and update the activity in the list
              if (Array.isArray(oldData)) {
                return oldData.map(activity =>
                  activity.id === activityId
                    ? { ...activity, status: 'completed' }
                    : activity
                );
              }
              return oldData;
            },
            async () => {
              try {
                const response = await submitActivityMutation.mutateAsync({
                  activityId,
                  answers,
                  clientResult,
                  priority: 5 // Higher priority for faster processing
                });

                return response;
              } catch (submitError) {
                console.error('Failed to submit activity:', submitError);
                throw submitError;
              }
            },
            { activityId, answers, clientResult },
            {
              successMessage: "Activity completed successfully!",
              errorMessage: "Failed to complete activity. Please try again.",
              onSuccess: () => {
                // Invalidate specific queries to ensure UI updates
                utils.activity.listByClass.invalidate();
                utils.student.getClassActivities.invalidate();
                utils.activity.getById.invalidate({ id: activityId });
                // Also invalidate all activity-related queries
                utils.activity.invalidate();
              }
            }
          );

          return result;
        } catch (updateError) {
          console.error('Error in optimistic update for activity submission:', updateError);
          throw updateError;
        }
      }
    } catch (error) {
      console.error('Error submitting activity:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Update activity status with optimistic UI update
   */
  const updateActivityStatus = async (params: {
    activityId: string;
    status: string;
  }) => {
    const { activityId, status } = params;

    // Check if online
    const online = isOnline();

    if (!online) {
      // Show toast for offline mode
      toast({
        title: "You're offline",
        description: "Status changes will be synced when you're back online.",
        variant: "warning",
      });

      // Update optimistically anyway
      updateActivities(
        (oldData: any) => {
          // Find and update the activity in the list
          if (Array.isArray(oldData)) {
            return oldData.map(activity =>
              activity.id === activityId
                ? { ...activity, status }
                : activity
            );
          }
          return oldData;
        },
        () => Promise.resolve({ success: true }),
        { activityId, status },
        {
          successMessage: "Status updated successfully!",
          errorMessage: "Failed to update status. Please try again."
        }
      );

      return { success: true, offline: true };
    } else {
      // Online update with optimistic UI
      return await updateActivities(
        (oldData: any) => {
          // Find and update the activity in the list
          if (Array.isArray(oldData)) {
            return oldData.map(activity =>
              activity.id === activityId
                ? { ...activity, status }
                : activity
            );
          }
          return oldData;
        },
        () => submitActivityMutation.mutateAsync({
          activityId,
          answers: {},
          clientResult: { status }
        }),
        { activityId, status },
        {
          successMessage: "Status updated successfully!",
          errorMessage: "Failed to update status. Please try again.",
          onSuccess: () => {
            // Invalidate specific queries to ensure UI updates
            utils.activity.listByClass.invalidate();
            utils.student.getClassActivities.invalidate();
            utils.activity.getById.invalidate({ id: activityId });
            // Also invalidate all activity-related queries
            utils.activity.invalidate();
          }
        }
      );
    }
  };

  return {
    submitActivity,
    updateActivityStatus,
    isSubmitting
  };
}
