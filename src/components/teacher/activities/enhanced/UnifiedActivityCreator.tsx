'use client';

import React, { useState, useMemo, useEffect } from 'react';
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

// Import the API integration utilities
import { ActivityContent } from '@/features/activities';
import { prepareActivityCreateData, validateActivityData } from './utils/api-integration';
import { isMarkdownFile } from '@/features/activities/utils/documentation';

// Define ActivityTypeDefinition interface to replace the old one
interface ActivityTypeDefinition<T> {
  id: string;
  name: string;
  description: string;
  category: string;
  schema: any;
  defaultValue: T;
  capabilities: {
    isGradable: boolean;
    hasSubmission: boolean;
    hasInteraction: boolean;
    hasRealTimeComponents: boolean;
  };
  components: {
    editor: React.ComponentType<any> | null;
    viewer: React.ComponentType<any> | null;
  };
  icon: string;
  version: string;
}

// Define the form schema
const activityCommonFieldsSchema = z.object({
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

type ActivityFormValues = z.infer<typeof activityCommonFieldsSchema>;

interface UnifiedActivityCreatorProps {
  activityTypeId: string;
  classId: string;
  subjectId?: string;
  topicId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UnifiedActivityCreator({
  activityTypeId,
  classId,
  subjectId,
  topicId, // Used in the initial state setup
  onSuccess,
  onCancel
}: UnifiedActivityCreatorProps) {
  // State for loading status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // State to track if we're loading activity type
  const [isLoadingActivityType, setIsLoadingActivityType] = useState(false);

  // Create a default activity type definition
  const activityType = useMemo<ActivityTypeDefinition<any> | null>(() => {
    try {
      console.log(`UnifiedActivityCreator: Creating activity type for ${activityTypeId}`);

      // Create a default activity type definition
      return {
        id: activityTypeId,
        name: activityTypeId.charAt(0).toUpperCase() + activityTypeId.slice(1).replace(/-/g, ' '),
        description: `${activityTypeId} activity`,
        category: ActivityPurpose.LEARNING,
        schema: { parse: () => ({}) } as any,
        defaultValue: {},
        capabilities: {
          isGradable: true,
          hasSubmission: true,
          hasInteraction: true,
          hasRealTimeComponents: false
        },
        components: {
          editor: null as any,
          viewer: null as any
        },
        icon: 'activity',
        version: '1.0.0'
      } as ActivityTypeDefinition<any>;
    } catch (err) {
      console.error('Failed to create activity type:', err);
      setError('Failed to create activity type');
      return null;
    }
  }, [activityTypeId]);

  // Effect to dynamically import the activity type editor
  useEffect(() => {
    const loadActivityType = async () => {
      // Skip if we already have a complete activity type with editor
      if (activityType?.components?.editor) {
        return;
      }

      setIsLoadingActivityType(true);
      console.log(`Attempting to dynamically import activity editor: ${activityTypeId}`);

      try {
        // Try to import the editor directly from the components directory
        const editorModule = await import(`@/features/activities/components/${activityTypeId}/${activityTypeId.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')}Editor`).catch(e => {
          console.warn(`Failed to import editor from components/${activityTypeId}:`, e);
          return null;
        });

        if (editorModule?.default) {
          console.log(`Successfully loaded editor for ${activityTypeId} from components directory`);
          // Update the activity type with the editor component
          activityType.components.editor = editorModule.default;
        } else {
          console.warn(`Editor for ${activityTypeId} not found in components directory`);
        }
      } catch (error) {
        console.error(`Error importing editor for ${activityTypeId}:`, error);
      } finally {
        setIsLoadingActivityType(false);
      }
    };

    loadActivityType();
  }, [activityTypeId, activityType?.components?.editor]);

  // Create activity mutation
  const createActivity = api.activity.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Activity created',
        description: 'The activity has been created successfully.',
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create activity',
        variant: 'error',
      });
      setIsLoading(false);
    },
  });

  // State for activity configuration
  const [config, setConfig] = useState(activityType?.defaultValue || {});

  // Determine if activity is gradable based on capabilities
  const isGradable = activityType?.capabilities?.isGradable || false;
  // For manual grading, we'll check if it has submission but not automatic grading
  const hasSubmission = activityType?.capabilities?.hasSubmission || false;
  const hasRealTimeComponents = activityType?.capabilities?.hasRealTimeComponents || false;
  const requiresTeacherReview = hasSubmission && !hasRealTimeComponents || false;

  // Get subjects for the class
  const { data: subjects, isLoading: isLoadingSubjects } = api.class.getSubjectsForClass.useQuery({
    classId,
  }, {
    enabled: !!classId,
  });

  // Get topics for the selected subject
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjectId || '');
  const [selectedTopicId, setSelectedTopicId] = useState(topicId || '');
  const { data: topics, isLoading: isLoadingTopics } = api.subject.getTopics.useQuery({
    subjectId: selectedSubjectId,
  }, {
    enabled: !!selectedSubjectId,
  });

  // Form for common fields
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityCommonFieldsSchema),
    defaultValues: {
      title: '',
      description: '',
      purpose: activityType?.category as ActivityPurpose,
      isGradable,
      requiresTeacherReview,
      maxScore: isGradable ? 100 : undefined,
      passingScore: isGradable ? 60 : undefined,
      startDate: undefined,
      endDate: undefined,
      duration: 30, // Default duration in minutes
    }
  });

  // Update the selected subject ID when the form value changes
  useEffect(() => {
    if (subjectId) {
      setSelectedSubjectId(subjectId);
    }

    // Note: topicId is used in the select element's initial value
    // but we don't need to track it in state since it's handled by the DOM
  }, [subjectId]);

  // Watch form values for conditional rendering
  const watchIsGradable = form.watch('isGradable');

  // Handle form submission
  const onSubmit = async (data: ActivityFormValues) => {
    if (!selectedSubjectId) {
      toast({
        title: 'Warning',
        description: 'Please select a subject for this activity.',
        variant: 'warning',
      });
      return;
    }

    // Use the selectedTopicId from state
    const topicIdToUse = selectedTopicId || undefined;

    // Validate activity data
    const activityData = {
      title: data.title,
      purpose: data.purpose,
      subjectId: selectedSubjectId,
      topicId: topicIdToUse,
      classId,
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
      activityTypeId, // Add this for the prepareActivityCreateData function
    };

    console.log('Submitting activity data:', activityData);

    const validation = validateActivityData(activityData, activityTypeId);
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

      // Prepare activity data for creation
      const preparedData = prepareActivityCreateData(activityData);

      // Create activity with prepared data
      await createActivity.mutateAsync(preparedData);
    } catch (error) {
      console.error('Error creating activity:', error);
      setIsLoading(false);
    }
  };

  // Handle error state
  if (error || !activityType) {
    return (
      <div className="p-4 border rounded-md bg-red-50 text-red-500">
        <h3 className="text-lg font-medium mb-2">Error Loading Activity Type</h3>
        <p className="mb-4">{error || `Activity type with ID ${activityTypeId} not found`}</p>
        <p className="mb-4">This could be because the activity registry hasn't been properly initialized or the activity type doesn't exist.</p>
        <Button className="mt-2" onClick={onCancel}>Go Back</Button>
      </div>
    );
  }

  // Get editor component
  const EditorComponent = activityType?.components?.editor;

  // Try to get the editor component from the features/activities directory
  const [editorComponent, setEditorComponent] = useState<React.ComponentType<any> | null>(null);

  // Effect to load the editor component if it's not available
  useEffect(() => {
    const loadEditorComponent = async () => {
      // Skip if we already have an editor component
      if (EditorComponent || editorComponent) {
        return;
      }

      try {
        // Skip if the activity type is a markdown file
        if (isMarkdownFile(activityTypeId)) {
          console.warn(`Cannot load editor for markdown file: ${activityTypeId}`);
          return;
        }

        // Try to import the editor component directly from the components directory
        const editorModule = await import(`@/features/activities/components/${activityTypeId}/${activityTypeId.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')}Editor`).catch(e => {
          console.warn(`Failed to import editor from components/${activityTypeId}:`, e);
          return null;
        });

        if (editorModule?.default) {
          console.log(`Successfully loaded editor component for ${activityTypeId} from components directory`);
          setEditorComponent(() => editorModule.default);
          return;
        }

        console.warn(`Could not find editor component for ${activityTypeId}`);
      } catch (error) {
        console.error(`Error loading editor component for ${activityTypeId}:`, error);
      }
    };

    loadEditorComponent();
  }, [activityTypeId, EditorComponent, editorComponent]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Common fields */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for this activity</CardDescription>
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

            {/* Subject selection */}
            <div className="space-y-4">
              <div className="font-medium">Subject and Topic</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>Subject</FormLabel>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    disabled={isLoadingSubjects || subjects?.length === 0}
                  >
                    {!selectedSubjectId && <option value="">Select a subject</option>}
                    {subjects?.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingSubjects && <div className="text-sm text-muted-foreground mt-1">Loading subjects...</div>}
                  {!isLoadingSubjects && subjects?.length === 0 && (
                    <div className="text-sm text-red-500 mt-1">No subjects available for this class</div>
                  )}
                </div>

                <div>
                  <FormLabel>Topic (Optional)</FormLabel>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    disabled={isLoadingTopics || !selectedSubjectId || topics?.length === 0}
                  >
                    <option value="">Select a topic (optional)</option>
                    {topics?.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                  {isLoadingTopics && <div className="text-sm text-muted-foreground mt-1">Loading topics...</div>}
                  {!isLoadingTopics && selectedSubjectId && topics?.length === 0 && (
                    <div className="text-sm text-muted-foreground mt-1">No topics available for this subject</div>
                  )}
                </div>
              </div>
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
            <Suspense fallback={<div className="p-4 text-center">Loading editor...</div>}>
              <ErrorBoundary fallback={<div className="p-4 text-red-500">Failed to load editor component</div>}>
                {isLoadingActivityType ? (
                  <div className="p-4 text-center">
                    <Spinner className="h-8 w-8 mx-auto mb-4" />
                    <p>Loading activity editor...</p>
                  </div>
                ) : EditorComponent ? (
                  <EditorComponent
                    config={config}
                    onChange={setConfig}
                  />
                ) : editorComponent ? (
                  <div className="border p-4 rounded-md">
                    {React.createElement(editorComponent, {
                      config,
                      onChange: setConfig,
                      activityType: activityTypeId
                    })}
                  </div>
                ) : (
                  <div className="p-4 border rounded-md bg-yellow-50">
                    <h3 className="text-lg font-medium mb-2">Editor Not Available</h3>
                    <p>The editor component for this activity type ({activityTypeId}) is not available.</p>
                    <p className="mt-2">This may be because:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>The activity type is still in development</li>
                      <li>There was an error loading the editor component</li>
                      <li>The activity type doesn't have an editor component</li>
                    </ul>
                    <p className="mt-4">You can still create this activity with basic settings.</p>
                  </div>
                )}
              </ErrorBoundary>
            </Suspense>
          </CardContent>
        </Card>

        {/* Debug information (only visible in development) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
              <CardDescription className="text-xs">This section is only visible in development mode</CardDescription>
            </CardHeader>
            <CardContent className="text-xs font-mono">
              <div className="space-y-2">
                <div><strong>Activity Type ID:</strong> {activityTypeId}</div>
                <div><strong>Editor Component (Registry):</strong> {EditorComponent ? 'Available' : 'Not Available'}</div>
                <div><strong>Editor Component (Dynamic):</strong> {editorComponent ? 'Available' : 'Not Available'}</div>
                <div><strong>Loading Activity Type:</strong> {isLoadingActivityType ? 'Yes' : 'No'}</div>
                <div><strong>Selected Subject ID:</strong> {selectedSubjectId || 'None'}</div>
                <div><strong>Config:</strong> <pre className="whitespace-pre-wrap">{JSON.stringify(config, null, 2)}</pre></div>
                <div className="mt-4">
                  <strong>Import Paths Tried:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li><code>@/features/activities/components/{activityTypeId}/{activityTypeId.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')}Editor</code></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form actions */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Creating...
              </>
            ) : (
              'Create Activity'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
