'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/forms/input';
import { Textarea } from '@/components/ui/forms/textarea';
import { Button } from '@/components/ui/atoms/button';
import { Switch } from '@/components/ui/forms/switch';
import { DatePicker } from '@/components/ui/forms/date-picker';
import { Spinner } from '@/components/ui/atoms/spinner';
import { useToast } from '@/components/ui/feedback/toast';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import { ActivityPurpose } from '@/server/api/constants';
import { api } from '@/trpc/react';

// Import the activity registry and API integration utilities
import { activityRegistry } from '@/features/activities/registry/ActivityTypeRegistry';
import { prepareActivityUpdateData, validateActivityData, getActivityTypeId } from './utils/api-integration';

// Define the form schema
const activityEditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  purpose: z.nativeEnum(ActivityPurpose),
  isGradable: z.boolean().default(false),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
});

type ActivityEditFormValues = z.infer<typeof activityEditSchema>;

interface ActivityEditorProps {
  activity: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ActivityEditor({ activity, onSuccess, onCancel }: ActivityEditorProps) {
  // State for loading status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Extract activity type from content
  const activityTypeId = getActivityTypeId(activity);

  // Get activity type from registry
  const activityType = useMemo(() => {
    if (!activityTypeId) return null;
    try {
      return activityRegistry.get(activityTypeId);
    } catch (err) {
      setError(`Failed to load activity type: ${activityTypeId}`);
      return null;
    }
  }, [activityTypeId]);

  // State for activity configuration
  const [config, setConfig] = useState(activity.content || {});

  // Update activity mutation
  const updateActivity = api.activity.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Activity updated',
        description: 'The activity has been updated successfully.',
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update activity',
        variant: 'error',
      });
      setIsLoading(false);
    },
  });

  // Determine if activity is gradable based on capabilities
  const isGradable = activityType?.capabilities?.isGradable || false;
  // For manual grading, we'll check if it has submission but not automatic grading
  const requiresTeacherReview = (activityType?.capabilities?.hasSubmission && !activityType?.capabilities?.hasRealTimeComponents) || activity.content?.requiresTeacherReview || false;

  // Form for common fields
  const form = useForm<ActivityEditFormValues>({
    resolver: zodResolver(activityEditSchema),
    defaultValues: {
      title: activity.title || '',
      description: activity.description || '',
      purpose: activity.purpose || ActivityPurpose.LEARNING,
      isGradable: activity.isGradable || false,
      maxScore: activity.maxScore || (isGradable ? 100 : undefined),
      passingScore: activity.passingScore || (isGradable ? 60 : undefined),
      startDate: activity.startDate ? new Date(activity.startDate) : undefined,
      endDate: activity.endDate ? new Date(activity.endDate) : undefined,
      duration: activity.duration || 30,
    }
  });

  // Watch form values for conditional rendering
  const watchIsGradable = form.watch('isGradable');

  // Handle form submission
  const onSubmit = async (data: ActivityEditFormValues) => {
    // Validate activity data
    const activityData = {
      id: activity.id,
      title: data.title,
      purpose: data.purpose,
      content: {
        activityType: activityTypeId,
        requiresTeacherReview,
        ...config
      },
      isGradable: data.isGradable,
      maxScore: data.maxScore,
      passingScore: data.passingScore,
      startDate: data.startDate,
      endDate: data.endDate,
      duration: data.duration,
      activityTypeId, // Add this for the prepareActivityUpdateData function
    };

    const validation = validateActivityData(activityData, activityTypeId || '');
    if (!validation.isValid) {
      toast({
        title: 'Validation Error',
        description: validation.errors?.join('\n') || 'Please check the form for errors',
        variant: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Prepare activity data for update
      const preparedData = prepareActivityUpdateData(activityData);

      // Update activity with prepared data
      await updateActivity.mutateAsync(preparedData);
    } catch (error) {
      console.error('Error updating activity:', error);
      setIsLoading(false);
    }
  };

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
        {onCancel && (
          <Button className="mt-4" onClick={onCancel}>
            Go Back
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
        <p>This activity was created using an older format and cannot be edited with the new system.</p>
        {onCancel && (
          <Button className="mt-4" onClick={onCancel}>
            Go Back
          </Button>
        )}
      </Card>
    );
  }

  // Get editor component
  const EditorComponent = activityType?.components?.editor;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Common fields */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Edit the basic details for this activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter activity title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter activity description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={(date) => field.onChange(date)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={(date) => field.onChange(date)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Grading options */}
        <Card>
          <CardHeader>
            <CardTitle>Grading Options</CardTitle>
            <CardDescription>Configure how this activity will be graded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="isGradable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Gradable Activity</FormLabel>
                    <FormDescription>
                      Enable grading for this activity
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchIsGradable && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="maxScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Score</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Score</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {requiresTeacherReview && (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-4 bg-yellow-50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Manual Grading Required</FormLabel>
                      <FormDescription>
                        This activity type requires teacher review and manual grading
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Activity-specific editor */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Configuration</CardTitle>
            <CardDescription>Configure the specific settings for this {activityType.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {EditorComponent ? (
              <Suspense fallback={<div className="p-4 text-center">Loading editor...</div>}>
                <ErrorBoundary fallback={<div className="p-4 text-red-500">Failed to load editor component</div>}>
                  <EditorComponent
                    config={config}
                    onChange={setConfig}
                  />
                </ErrorBoundary>
              </Suspense>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No editor available for this activity type
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form actions */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
