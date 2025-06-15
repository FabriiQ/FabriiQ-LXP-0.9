'use client';

import { useEffect, useState, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/atoms/spinner';
import { Alert } from '@/components/ui/feedback/alert';
import { AlertTitle } from '@/components/ui/feedback/alert';
import { AlertDescription } from '@/components/ui/feedback/alert';
import { ActivityInteractionWrapper } from './ActivityInteractionWrapper';
import { useSession } from 'next-auth/react';
import * as ActivityComponents from '@/features/activties';
import { ActivityCompletionHandler } from '@/features/activties/components/reward-integration/ActivityCompletionHandler';

interface ActivityViewerProps {
  activity: any;
  mode?: 'preview' | 'student' | 'teacher';
  onInteraction?: (data: any) => void;
  onComplete?: (data: any) => void;
  disableAnalytics?: boolean;
  institutionId?: string;
}

interface InteractionRenderProps {
  onInteraction: (data: any) => void;
  interactionData: Record<string, any>;
}

export function ActivityViewer({
  activity,
  mode = 'student',
  onInteraction,
  onComplete,
  disableAnalytics = false,
  institutionId = ''
}: ActivityViewerProps) {
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);

  // Log the activity content for debugging
  console.log('ActivityViewer activity:', activity);
  console.log('ActivityViewer content:', activity?.content);
  console.log('ActivityViewer activityType:', activity?.content?.activityType);

  // Detect activity type
  const activityType = activity?.activityType || activity?.content?.activityType;
  console.log('Activity type:', activityType);

  // Determine if we have a viewer component for this activity type
  const componentName = activityType &&
    `${activityType.split('-').map((part: string, i: number) =>
      i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join('')}Viewer`;

  console.log('Looking for component:', componentName);
  console.log('Available components:', Object.keys(ActivityComponents));
  // Log the exact list of components for debugging
  console.log('Component list:', JSON.stringify(Object.keys(ActivityComponents)));

  const hasViewerComponent = activityType && componentName &&
    (ActivityComponents[componentName] !== undefined);

  console.log('Has viewer component:', hasViewerComponent);

  // Handle interaction within the component
  const handleInteraction = (data: any) => {
    if (onInteraction) {
      onInteraction(data);
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

  if (!hasViewerComponent) {
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

  // Get the appropriate viewer component from the new architecture
  // Component name was already calculated above
  const ViewerComponent = ActivityComponents[componentName as string];
  console.log('Using component:', componentName, ViewerComponent ? 'Found' : 'Not found');

  // Prepare the activity data for the viewer
  const activityData = activity.content || activity;

  // State for reward results
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Handle activity completion with rewards
  const handleActivityComplete = (data: any) => {
    // Store reward results if available
    if (data?.gradeResult?.rewardResult) {
      setRewardResult(data.gradeResult.rewardResult);
    }

    // Call the original onComplete handler
    if (onComplete) {
      onComplete(data);
    }
  };

  // Handle reward earned event
  const handleRewardEarned = (rewardData: any) => {
    // Update reward result state
    setRewardResult(rewardData);

    // Dispatch a dashboard update event
    if (typeof window !== 'undefined') {
      const dashboardUpdateEvent = new CustomEvent('dashboard-update-needed', {
        detail: { rewardData }
      });
      window.dispatchEvent(dashboardUpdateEvent);
    }
  };

  // Wrap with analytics if enabled
  if (!disableAnalytics && institutionId && session?.user?.id) {
    return (
      <ActivityCompletionHandler
        rewardResult={rewardResult}
        onComplete={onComplete}
      >
        <ActivityInteractionWrapper
          activity={activity}
          onComplete={handleActivityComplete}
          onRewardEarned={handleRewardEarned}
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
                />
              </CardContent>
            </Card>
          )}
        </ActivityInteractionWrapper>
      </ActivityCompletionHandler>
    );
  }

  // If analytics disabled or missing required props, render without analytics wrapper
  return (
    <Card>
      <CardContent className="p-4">
        <ViewerComponent
          activity={activityData}
          mode={mode}
          onInteraction={handleInteraction}
        />
      </CardContent>
    </Card>
  );
}