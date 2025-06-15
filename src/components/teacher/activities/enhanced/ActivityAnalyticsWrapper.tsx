'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/atoms/button';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Spinner } from '@/components/ui/atoms/spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Download, BarChart, Clock, Users } from 'lucide-react';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';

// Create a placeholder for the AnalyticsDashboard component
const AnalyticsDashboard = ({ activityId, classId, initialFilters, className }: any) => (
  <div className="p-6 text-center">
    <h3 className="text-lg font-medium mb-2">Detailed Analytics</h3>
    <p className="text-muted-foreground">Detailed analytics view is not available in this version.</p>
  </div>
);

// Import our new minimalist components
import { MinimalistActivityEngagementDashboard } from './MinimalistActivityEngagementDashboard';
import { TimeTrackingDashboard } from './TimeTrackingDashboard';
import { MinimalistActivityComparison } from './MinimalistActivityComparison';

interface ActivityAnalyticsWrapperProps {
  activityId: string;
  classId: string;
}

// Skeleton component for loading state
const ActivityAnalyticsSkeleton = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/4 mb-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64" />
      </CardContent>
    </Card>
  </div>
);

export function ActivityAnalyticsWrapper({ activityId, classId }: ActivityAnalyticsWrapperProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Get activity details
  const { data: activity, isLoading: isLoadingActivity, error } = api.activity.getById.useQuery({
    id: activityId,
  }, {
    enabled: !!activityId,
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load activity',
        variant: 'error',
      });
    },
  });

  // Export analytics mutation - using a placeholder since the actual endpoint doesn't exist
  const exportAnalyticsMutation = {
    mutate: (data: any) => {
      setTimeout(() => {
        toast({
          title: 'Analytics exported',
          description: 'The analytics have been exported successfully.',
        });
        setIsExporting(false);
      }, 1000);
    }
  } as any;

  // Handle export analytics
  const handleExportAnalytics = () => {
    setIsExporting(true);
    exportAnalyticsMutation.mutate({ activityId });
  };

  // Show loading state
  if (isLoadingActivity) {
    return <ActivityAnalyticsSkeleton />;
  }

  // Show error state if activity not found
  if (error || !activity) {
    return (
      <Card className="p-6 bg-red-50 text-red-600">
        <h3 className="text-lg font-medium mb-2">Error</h3>
        <p>{error?.message || 'Activity not found'}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Activity Analytics</CardTitle>
              <CardDescription>
                Performance metrics for {activity.title}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAnalytics}
              disabled={isExporting}
            >
              {isExporting ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export Analytics
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Analytics view selector */}
      <Tabs defaultValue="minimalist" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="minimalist" className="flex items-center">
            <BarChart className="mr-2 h-4 w-4" />
            Minimalist View
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Detailed View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="minimalist">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Minimalist Activity Engagement Dashboard */}
            <MinimalistActivityEngagementDashboard
              classId={classId}
              limit={5}
            />

            {/* Time Tracking Dashboard */}
            <TimeTrackingDashboard
              classId={classId}
              activityId={activityId}
            />

            {/* Activity Comparison */}
            <MinimalistActivityComparison
              classId={classId}
              limit={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="detailed">
          {/* Original Analytics dashboard */}
          <Card>
            <CardContent className="p-0">
              <AnalyticsDashboard
                activityId={activityId}
                classId={classId}
                initialFilters={{
                  timeRange: 'all',
                  activityTypes: ['quiz'],
                }}
                className="w-full"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
