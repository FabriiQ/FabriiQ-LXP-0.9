'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { withTimeTracking } from '@/components/student/withTimeTracking';
import { TimeTrackingDisplay } from '@/components/student/TimeTrackingDisplay';
import { useTimeTracking } from '@/components/providers/TimeTrackingProvider';

interface ActivityWithTimeTrackingProps {
  activityId: string;
  title: string;
  content: React.ReactNode;
  onComplete?: () => void;
}

/**
 * Activity component that tracks time spent
 * This is a sample component to demonstrate how to use the time tracking hook
 */
function ActivityWithTimeTrackingBase({
  activityId,
  title,
  content,
  onComplete,
}: ActivityWithTimeTrackingProps) {
  const { isTracking } = useTimeTracking();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <TimeTrackingDisplay activityId={activityId} />
        </div>
      </CardHeader>

      <CardContent>
        {content}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {isTracking(activityId) ? 'Time tracking active' : 'Time tracking inactive'}
        </div>

        <Button onClick={onComplete}>Complete Activity</Button>
      </CardFooter>
    </Card>
  );
}

// Export the component with time tracking
export const ActivityWithTimeTracking = withTimeTracking(ActivityWithTimeTrackingBase);
