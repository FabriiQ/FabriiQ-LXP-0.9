'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Button } from '@/components/ui/atoms/button';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Badge } from '@/components/ui/atoms/badge';
import { Spinner } from '@/components/ui/atoms/spinner';
import { useToast } from '@/components/ui/feedback/toast';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import { Eye, Edit, BarChart, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ActivityPurpose } from '@/server/api/constants';

// Import the activity registry
import { ActivityRegistry, registerAllActivityTypes } from '@/features/activities/registry';
import { getActivityTypeId } from './utils/api-integration';
import { ActivityAnalyticsWrapper } from './ActivityAnalyticsWrapper';

interface ActivityViewerProps {
  activity: any;
  onEdit?: () => void;
  isTeacher: boolean;
}

// Skeleton component for loading state
const ActivityViewerSkeleton = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/4 mb-2" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] bg-gray-100 rounded-md flex items-center justify-center">
          <Spinner />
        </div>
      </CardContent>
    </Card>
  </div>
);

export function ActivityViewer({ activity, onEdit, isTeacher }: ActivityViewerProps) {
  const [activeTab, setActiveTab] = useState('preview');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistryInitialized, setIsRegistryInitialized] = useState(false);
  const { toast } = useToast();

  // Initialize the activity registry
  useEffect(() => {
    const initRegistry = async () => {
      try {
        await registerAllActivityTypes();
        setIsRegistryInitialized(true);
        console.log('Activity registry initialized successfully');
      } catch (error) {
        console.error('Failed to initialize activity registry:', error);
        toast({
          title: 'Error',
          description: 'Failed to load activity types',
          variant: 'error',
        });
      }
    };

    initRegistry();
  }, [toast]);

  // Extract activity type from content
  const activityTypeId = getActivityTypeId(activity);
  console.log('Activity Type ID:', activityTypeId);
  console.log('Activity Content:', activity.content);

  // Get activity type from registry
  const activityType = useMemo(() => {
    if (!activityTypeId || !isRegistryInitialized) return null;
    const type = ActivityRegistry.get(activityTypeId);
    console.log('Activity Type from Registry:', type);
    return type;
  }, [activityTypeId, isRegistryInitialized]);

  // Show loading state while registry is initializing
  if (!isRegistryInitialized) {
    return <ActivityViewerSkeleton />;
  }

  // Handle errors if activity type is not found
  if (!activityType && activityTypeId) {
    return (
      <Card className="p-6 bg-red-50 text-red-600">
        <h3 className="text-lg font-medium mb-2">Activity Type Not Found</h3>
        <p>The activity type "{activityTypeId}" could not be found in the registry.</p>
        <p className="mt-4">This may be because:</p>
        <ul className="list-disc list-inside mt-2">
          <li>The activity type is no longer supported</li>
          <li>There was an error loading the activity type</li>
          <li>The activity was created with a different version of the system</li>
        </ul>
        {onEdit && (
          <Button className="mt-4" onClick={onEdit}>
            Edit Activity
          </Button>
        )}
      </Card>
    );
  }

  // If no activity type ID is found, it might be an old format activity
  if (!activityTypeId) {
    return (
      <Card className="p-6 bg-yellow-50 text-yellow-600">
        <h3 className="text-lg font-medium mb-2">Legacy Activity Format</h3>
        <p>This activity was created using an older format and needs to be updated.</p>
        {onEdit && (
          <Button className="mt-4" onClick={onEdit}>
            Update Activity
          </Button>
        )}
      </Card>
    );
  }

  // Get viewer component
  const ViewerComponent = activityType?.components?.viewer;
  console.log('Viewer Component:', ViewerComponent);

  return (
    <div className="space-y-6">
      {/* Activity header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{activity.title}</CardTitle>
              <CardDescription>
                {activity.purpose} • {activity.duration} minutes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {activity.isGradable && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Gradable
                </Badge>
              )}
              {activity.content?.requiresTeacherReview && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Manual Grading
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            {activity.description}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            {activity.startDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Starts: {format(new Date(activity.startDate), 'PPP')}</span>
              </div>
            )}

            {activity.endDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Due: {format(new Date(activity.endDate), 'PPP')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity content */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList>
              <TabsTrigger value="preview" className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </TabsTrigger>

              {isTeacher && (
                <>
                  <TabsTrigger value="edit" className="flex items-center gap-1">
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </TabsTrigger>

                  <TabsTrigger value="analytics" className="flex items-center gap-1">
                    <BarChart className="h-4 w-4" />
                    <span>Analytics</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </CardHeader>

          <CardContent className="pt-4">
            <TabsContent value="preview" className="mt-0">
              {ViewerComponent ? (
                <Suspense fallback={<div className="p-4 text-center">Loading activity...</div>}>
                  <ErrorBoundary fallback={<div className="p-4 text-red-500">Failed to load activity viewer</div>}>
                    <div className="border rounded-md p-4">
                      <ViewerComponent
                        activity={{
                          ...activity,
                          // Ensure the activity has the correct structure for the viewer
                          questions: activity.content?.questions || [],
                          // Pass other properties that might be needed
                          ...activity.content,
                          // Ensure activityType is set
                          activityType: activityTypeId,
                          // Ensure id is set
                          id: activity.id
                        }}
                        mode={isTeacher ? 'teacher' : 'student'}
                      />
                    </div>
                  </ErrorBoundary>
                </Suspense>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No preview available for this activity type
                </div>
              )}
            </TabsContent>

            <TabsContent value="edit" className="mt-0">
              {onEdit && (
                <div className="text-center p-6">
                  <p className="mb-4">Edit this activity to modify its content and settings</p>
                  <Button onClick={onEdit}>
                    Edit Activity
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <Suspense fallback={<div className="p-4 text-center">Loading analytics...</div>}>
                <ErrorBoundary fallback={<div className="p-4 text-red-500">Failed to load analytics</div>}>
                  <ActivityAnalyticsWrapper
                    activityId={activity.id}
                    classId={activity.classId}
                  />
                </ErrorBoundary>
              </Suspense>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
