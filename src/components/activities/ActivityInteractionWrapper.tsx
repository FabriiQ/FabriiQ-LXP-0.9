'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/server/api/utils/client-logger';

interface InteractionRenderProps {
  onInteraction: (data: any) => void;
  interactionData: Record<string, any>;
  onSubmit?: (answers: any, result: any) => void;
}

interface ActivityInteractionWrapperProps {
  activity: any;
  children: ReactNode | ((props: InteractionRenderProps) => ReactNode);
  onComplete?: (data: any) => void;
  institutionId: string;
  onRewardEarned?: (rewardData: any) => void;
}

export function ActivityInteractionWrapper({
  activity,
  children,
  onComplete,
  institutionId,
  onRewardEarned
}: ActivityInteractionWrapperProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [interactionData, setInteractionData] = useState<Record<string, any>>({});

  // View tracking
  const trackView = api.activity.trackView.useMutation();
  const trackInteraction = api.activity.trackInteraction.useMutation();
  const trackCompletion = api.activity.trackCompletion.useMutation();

  // Record view when component mounts
  useEffect(() => {
    if (session?.user?.id && activity?.id && !started) {
      // Only track if we have a valid institution ID
      if (institutionId) {
        trackView.mutate({
          activityId: activity.id,
          userId: session.user.id,
          institutionId
        }, {
          // Don't show errors to the user for analytics
          onError: (error) => {
            console.error('Failed to track activity view:', error);
          }
        });
      } else {
        console.warn('No institution ID provided for activity view tracking');
      }
      setStarted(true);
    }
  }, [session, activity, started, trackView, institutionId]);

  // Record interaction
  const handleInteraction = (data: any) => {
    if (!session?.user?.id || !activity?.id) return;

    // Sanitize the incoming data to remove circular references
    const sanitizedData = sanitizeForJSON(data);

    // Update local interaction data
    const updatedData = {
      ...interactionData,
      ...sanitizedData,
      timestamp: new Date().toISOString()
    };

    setInteractionData(updatedData);

    // Submit to server only if we have a valid institution ID
    if (institutionId) {
      try {
        trackInteraction.mutate({
          activityId: activity.id,
          userId: session.user.id,
          institutionId,
          data: updatedData
        }, {
          // Don't show errors to the user for analytics
          onError: (error) => {
            console.error('Failed to track activity interaction:', error);
          }
        });
      } catch (error) {
        console.error('Error in trackInteraction.mutate:', error);
        // Don't throw errors for analytics
      }
    }
  };

  // Helper function to sanitize data for JSON serialization
  const sanitizeForJSON = (obj: any): any => {
    // Track objects that have been processed to avoid circular references
    const seen = new WeakSet();

    // Inner recursive function
    const sanitize = (value: any): any => {
      // Handle null or undefined
      if (value === null || value === undefined) {
        return value;
      }

      // Handle primitive types
      if (typeof value !== 'object') {
        return value;
      }

      // Prevent circular references
      if (seen.has(value)) {
        return '[Circular Reference]';
      }

      // Add this object to the seen set
      seen.add(value);

      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }

      // Skip DOM nodes, window objects, and other non-serializable objects
      if (
        value === window ||
        value === document ||
        (typeof Node !== 'undefined' && value instanceof Node) ||
        (typeof Window !== 'undefined' && value instanceof Window) ||
        typeof value === 'function' ||
        // Handle other non-serializable objects
        (typeof value.toString === 'function' && value.toString().includes('[object '))
      ) {
        return null;
      }

      // Handle arrays
      if (Array.isArray(value)) {
        return value.map(item => sanitize(item));
      }

      // Handle regular objects
      try {
        const sanitized: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
          // Skip properties that start with underscore (often internal properties)
          if (key.startsWith('_')) {
            continue;
          }

          // Recursively sanitize nested objects
          sanitized[key] = sanitize(val);
        }
        return sanitized;
      } catch (error) {
        console.warn('Error sanitizing object:', error);
        return null;
      }
    };

    // Start the sanitization process
    return sanitize(obj);
  };

  // Handle completion with grading
  const handleComplete = (gradeData?: any) => {
    if (!session?.user?.id || !activity?.id || completed) return;

    // Sanitize the data to remove circular references
    const sanitizedInteractionData = sanitizeForJSON(interactionData);
    const sanitizedGradeData = gradeData ? sanitizeForJSON(gradeData) : {};

    const completionData = {
      ...sanitizedInteractionData,
      ...sanitizedGradeData, // Include any grading data passed from the activity
      completedAt: new Date().toISOString()
    };

    // Log the sanitized data for debugging
    console.log('Sanitized completion data:', completionData);

    setCompleted(true);

    // Function to handle successful completion
    const handleSuccessfulCompletion = () => {
      // Submit the activity for grading if it's gradable
      if (activity.isGradable) {
        submitActivityForGrading(completionData);
      } else {
        // For non-gradable activities, we still need to create a submission record
        // to mark it as completed in the database
        submitActivityForGrading({
          ...completionData,
          // Add a flag to indicate this is a non-gradable completion
          isNonGradableCompletion: true
        });

        toast({
          title: "Activity Completed",
          description: "Your progress has been recorded successfully.",
          variant: "success",
        });

        // For non-gradable activities, we still want to dispatch the activity-completed event
        if (typeof window !== 'undefined') {
          const completionEvent = new CustomEvent('activity-completed', {
            detail: {
              activityId: activity.id,
              studentId: session?.user?.id
            }
          });
          window.dispatchEvent(completionEvent);
        }

        if (onComplete) {
          onComplete(completionData);
        }
      }
    };

    // Submit completion to server only if we have a valid institution ID
    if (institutionId) {
      try {
        trackCompletion.mutate({
          activityId: activity.id,
          userId: session.user.id,
          institutionId,
          data: completionData
        }, {
          onSuccess: handleSuccessfulCompletion,
          onError: (error) => {
            console.error('Failed to track activity completion:', error);
            // Even if tracking fails, we still want to proceed with grading
            handleSuccessfulCompletion();
          }
        });
      } catch (error) {
        console.error('Error in trackCompletion.mutate:', error);
        // If the mutation throws an error, still proceed with grading
        handleSuccessfulCompletion();
      }
    } else {
      // If no institution ID, just proceed with the completion flow
      handleSuccessfulCompletion();
    }
  };

  // tRPC mutation for submitting activity
  const submitActivityMutation = api.activity.submitActivity.useMutation();

  // Define a type for the submission result to fix TypeScript errors
  type SubmissionResultType = {
    success: boolean;
    gradeId: string;
    score: number | null;
    maxScore: number | null;
    feedback: string;
    isGraded: boolean;
    // Add reward properties that might be in the result
    rewardPoints?: number;
    levelUp?: boolean;
    newLevel?: number | null;
    achievements?: any[];
  };

  // Submit the activity for grading
  const submitActivityForGrading = async (data: any) => {
    try {
      logger.debug('Submitting activity for grading:', {
        activityId: activity.id,
        dataKeys: Object.keys(data),
        hasAnswers: !!data.answers,
        answersSample: data.answers ? JSON.stringify(data.answers).substring(0, 100) : 'No answers'
      });

      // Prepare the answers to submit
      const answers = data.answers || data;
      const clientResult = data.result || null;

      // Get time spent from the TimeTrackingProvider if available
      let timeSpent = 0;
      try {
        // Check if we have a timeSpent property in the data
        if (data.timeSpent) {
          timeSpent = data.timeSpent;
        } else if (answers.timeSpent) {
          timeSpent = answers.timeSpent;
        } else if (clientResult?.timeSpent) {
          timeSpent = clientResult.timeSpent;
        }
      } catch (error) {
        console.error('Error getting time spent:', error);
      }

      // Sanitize the answers and client result to remove circular references
      const sanitizedAnswers = sanitizeForJSON(answers);
      const sanitizedClientResult = sanitizeForJSON(clientResult);

      // Add time spent to the content if available
      if (timeSpent > 0) {
        if (typeof sanitizedAnswers === 'object' && sanitizedAnswers !== null) {
          sanitizedAnswers.timeSpent = timeSpent;
        }
      }

      logger.debug('Sanitized answers being submitted:', sanitizedAnswers);

      // Submit the activity using tRPC
      const result = await submitActivityMutation.mutateAsync({
        activityId: activity.id,
        answers: sanitizedAnswers,
        clientResult: sanitizedClientResult,
        storeDetailedResults: true,
        priority: 5, // High priority for faster processing
        timeSpentMinutes: timeSpent > 0 ? timeSpent : undefined
      }) as SubmissionResultType; // Cast to our type

      // Show success message with score if available
      let successMessage = "Your activity has been submitted successfully.";
      if (result.score !== null && result.maxScore !== null) {
        successMessage = `Your activity has been graded. Score: ${result.score}/${result.maxScore}`;

        // Add points info if available
        const points = result.rewardPoints || 0;
        if (points > 0) {
          successMessage += ` (+${points} points)`;
        }
      }

      toast({
        title: "Activity Submitted",
        description: successMessage,
        variant: "success",
      });

      // Create a reward object from the result properties with safe defaults
      const rewardData = {
        points: result.rewardPoints || 0,
        levelUp: result.levelUp || false,
        newLevel: result.newLevel || null,
        achievements: result.achievements || []
      };

      // Notify parent components about rewards
      if (onRewardEarned) {
        onRewardEarned(rewardData);
      }

      // Dispatch a custom event that can be listened to anywhere in the app
      if (typeof window !== 'undefined') {
        const rewardEvent = new CustomEvent('reward-earned', {
          detail: {
            activityId: activity.id,
            studentId: session?.user?.id,
            rewardResult: rewardData
          }
        });
        window.dispatchEvent(rewardEvent);

        // Also dispatch activity-completed event for backward compatibility
        const completionEvent = new CustomEvent('activity-completed', {
          detail: {
            activityId: activity.id,
            studentId: session?.user?.id
          }
        });
        window.dispatchEvent(completionEvent);
      }

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete({
          ...data,
          gradeResult: result
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to submit activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "error",
      });
    }
  };

  // Prepare interaction props for render function
  const interactionProps: InteractionRenderProps = {
    onInteraction: handleInteraction,
    interactionData
  };

  return (
    <div className="activity-container">
      {/* Wrap children with the interaction context */}
      <div className="activity-content">
        {typeof children === 'function'
          ? children({
              ...interactionProps,
              onSubmit: (answers: any, result: any) => {
                console.log('ActivityInteractionWrapper received submission:', { answers, result });
                handleComplete({ answers, result });
              }
            })
          : children}
      </div>

      {/* Complete button (if activity is not already completed) */}
      {!completed && (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleComplete}
            disabled={completed}
          >
            Mark as Complete
          </Button>
        </div>
      )}

      {/* Completion state */}
      {completed && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-green-700 dark:text-green-300">
          This activity has been completed.
        </div>
      )}
    </div>
  );
}