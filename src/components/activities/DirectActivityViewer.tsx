'use client';

import { useEffect, useState, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/atoms/spinner';
import { Alert } from '@/components/ui/feedback/alert';
import { AlertTitle } from '@/components/ui/feedback/alert';
import { AlertDescription } from '@/components/ui/feedback/alert';
import { ActivityInteractionWrapper } from './ActivityInteractionWrapper';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/ui/feedback/toast';
import { AnimatedSubmitButton } from '@/features/activties';

// Direct imports from the activties module
import {
  MultipleChoiceViewer,
  TrueFalseViewer,
  MultipleResponseViewer,
  FillInTheBlanksViewer,
  MatchingViewer,
  SequenceViewer,
  DragAndDropViewer,
  DragTheWordsViewer,
  FlashCardsViewer,
  NumericViewer,
  QuizViewer,
  ReadingViewer,
  VideoViewer,
  BookViewer,
  // Offline support
  OfflineIndicator,
  useOfflineSupport,
  useOfflineAnalytics,
  ActivityStateProvider
} from '@/features/activties';

// Map of activity types to their viewer components
const ACTIVITY_VIEWERS: Record<string, any> = {
  'multiple-choice': MultipleChoiceViewer,
  'true-false': TrueFalseViewer,
  'multiple-response': MultipleResponseViewer,
  'fill-in-the-blanks': FillInTheBlanksViewer,
  'matching': MatchingViewer,
  'sequence': SequenceViewer,
  'drag-and-drop': DragAndDropViewer,
  'drag-the-words': DragTheWordsViewer,
  'flash-cards': FlashCardsViewer,
  'numeric': NumericViewer,
  'quiz': QuizViewer,
  'reading': ReadingViewer,
  'video': VideoViewer,
  'book': BookViewer
};

interface ActivityViewerProps {
  activity: any;
  mode?: 'preview' | 'student' | 'teacher';
  onInteraction?: (data: any) => void;
  onComplete?: (data: any) => void;
  disableAnalytics?: boolean;
  institutionId?: string;
  submitButtonProps?: {
    className?: string;
    priority?: number;
  };
}

interface InteractionRenderProps {
  onInteraction: (data: any) => void;
  interactionData: Record<string, any>;
}

export function DirectActivityViewer({
  activity,
  mode = 'student',
  onInteraction,
  onComplete,
  disableAnalytics = false,
  institutionId = '',
  submitButtonProps = {}
}: ActivityViewerProps) {
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);

  // Get user ID from session
  const userId = session?.user?.id || 'anonymous';

  // Set up offline support
  const { isOffline } = useOfflineSupport({
    activityId: activity?.id || 'unknown',
    userId,
    enabled: true,
    config: { autoSync: true },
    onStatusChange: (offline) => {
      if (offline) {
        toast({
          title: "You're offline",
          description: "You can still work on this activity. Your progress will be saved and synced when you reconnect.",
          variant: "warning",
        });
      } else {
        toast({
          title: "You're back online",
          description: "Your activity data will be synced automatically.",
          variant: "default",
        });
      }
    }
  });

  // Set up offline analytics
  useOfflineAnalytics({
    activityId: activity?.id || 'unknown',
    activityType: activity?.activityType || activity?.content?.activityType || 'unknown',
    enabled: !disableAnalytics
  });

  // Log the activity content for debugging
  console.log('DirectActivityViewer activity:', activity);
  console.log('DirectActivityViewer content:', activity?.content);
  console.log('DirectActivityViewer activityType:', activity?.content?.activityType);

  // Detect activity type
  const activityType = activity?.activityType || activity?.content?.activityType;
  console.log('Activity type:', activityType);

  // Get the viewer component directly from our map
  const ViewerComponent = activityType ? ACTIVITY_VIEWERS[activityType] : null;
  console.log('Has viewer component:', !!ViewerComponent);

  // Handle interaction within the component
  const handleInteraction = (data: any) => {
    if (onInteraction) {
      onInteraction(data);
    }
  };

  // Handle activity completion with grading data
  const handleComplete = (data: any) => {
    if (onComplete) {
      // If the data includes grading information, pass it along
      // This allows the parent component to display feedback and update the UI
      const result = {
        ...data,
        completedAt: new Date().toISOString(),
        activityId: activity.id,
        activityType: activityType,
        isOffline: isOffline // Include offline status in the result
      };

      // If offline, show a message that the submission will be synced later
      if (isOffline) {
        toast({
          title: "Saved offline",
          description: "Your activity has been saved and will be submitted when you're back online.",
          variant: "info",
        });
      }

      onComplete(result);
    }
  };

  // Safety check for required props
  useEffect(() => {
    if (activityType && !disableAnalytics && !institutionId) {
      console.warn('ActivityViewer: institutionId is required for analytics tracking');
    }
  }, [activityType, disableAnalytics, institutionId]);

  if (!activity) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Spinner size="md" />
        </CardContent>
      </Card>
    );
  }

  if (!activityType) {
    return (
      <Card>
        <CardContent className="p-4">
          <Alert className="border-info/50 text-info dark:border-info">
            <AlertTitle>Missing Activity Type</AlertTitle>
            <AlertDescription>
              This activity does not have a specified activity type.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!ViewerComponent) {
    return (
      <Card>
        <CardContent className="p-4">
          <Alert className="border-info/50 text-info dark:border-info">
            <AlertTitle>Unsupported Activity Type</AlertTitle>
            <AlertDescription>
              The activity type "{activityType}" does not have a viewer component.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Prepare the activity data for the viewer
  const activityData = activity.content || activity;

  // Wrap with analytics if enabled
  if (!disableAnalytics && institutionId && session?.user?.id) {
    return (
      <ActivityInteractionWrapper
        activity={activity}
        onComplete={onComplete}
        institutionId={institutionId}
      >
        {(props: InteractionRenderProps) => (
          <Card>
            <CardContent className="p-4">
              <ViewerComponent
                activity={activityData}
                mode={mode}
                onInteraction={(data: any) => {
                  props.onInteraction(data);
                  handleInteraction(data);
                }}
                onSubmit={(answers: any, result: any) => {
                  console.log('DirectActivityViewer (wrapped) received submission:', { answers, result });
                  handleComplete({ answers, result });
                }}
                submitButton={
                  <AnimatedSubmitButton
                    priority={submitButtonProps.priority || 5}
                    className={submitButtonProps.className}
                  />
                }
                studentId={session?.user?.id} // Pass student ID for question usage tracking
                classId={props.classId} // Pass class ID for question usage tracking
              />
            </CardContent>
          </Card>
        )}
      </ActivityInteractionWrapper>
    );
  }

  // If analytics disabled or missing required props, render without analytics wrapper
  return (
    <ActivityStateProvider
      activity={activityData}
      persistenceKey={`activity-${activity.id}-${userId}`}
      autoSave={true}
      offlineSupport={true}
    >
      <Card>
        <CardContent className="p-4">
          {/* Show offline indicator */}
          <OfflineIndicator
            position="top"
            variant="inline"
            showSyncStatus={true}
            className="mb-4"
          />

          <ViewerComponent
            activity={activityData}
            mode={mode}
            onInteraction={handleInteraction}
            onSubmit={(answers: any, result: any) => {
              console.log('DirectActivityViewer received submission:', { answers, result });
              handleComplete({ answers, result });
            }}
            submitButton={
              <AnimatedSubmitButton
                priority={submitButtonProps.priority || 5}
                className={submitButtonProps.className}
              />
            }
            studentId={session?.user?.id} // Pass student ID for question usage tracking
            classId={props.classId} // Pass class ID for question usage tracking
          />
        </CardContent>
      </Card>
    </ActivityStateProvider>
  );
}
