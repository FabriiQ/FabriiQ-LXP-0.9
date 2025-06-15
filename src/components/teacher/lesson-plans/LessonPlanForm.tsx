'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/trpc/react';
import { LessonPlanType } from '@/server/api/schemas/lesson-plan.schema';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { HierarchicalTopicSelector } from './HierarchicalTopicSelector';
import { LearningObjectivesSuggester } from './LearningObjectivesSuggester';

import { BloomsDistributionChart } from '@/features/bloom/components/taxonomy/BloomsDistributionChart';
import { BloomsTaxonomyLevel, BloomsDistribution } from '@/features/bloom/types';
import { DEFAULT_BLOOMS_DISTRIBUTION } from '@/features/bloom/constants/bloom-levels';
import { ActivityLearningOutcomeSelector } from './ActivityLearningOutcomeSelector';

// Form schema
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  classId: z.string().min(1, 'Class is required'),
  subjectId: z.string().optional(),
  planType: z.nativeEnum(LessonPlanType),
  startDate: z.date(),
  endDate: z.date(),
  content: z.object({
    learningObjectives: z.array(z.string()).min(1, 'At least one learning objective is required'),
    topics: z.array(z.string()).min(1, 'At least one topic is required'),
    teachingMethods: z.array(z.string()).min(1, 'At least one teaching method is required'),
    bloomsDistribution: z.record(z.number()).optional(),
    learningOutcomeIds: z.array(z.string()).min(0),
    resources: z.array(z.object({
      type: z.string(),
      name: z.string(),
      description: z.string().optional(),
      url: z.string().optional(),
    })),
    activities: z.array(z.object({
      type: z.string(),
      name: z.string(),
      description: z.string().optional(),
      date: z.string().optional(),
      bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional(),
      id: z.string().optional(),
      learningOutcomeIds: z.array(z.string()).optional(),
      learningObjectives: z.array(z.string()).optional(),
    })),
    assessments: z.array(z.object({
      type: z.string(),
      name: z.string(),
      description: z.string().optional(),
      date: z.string().optional(),
      bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional(),
      id: z.string().optional(),
      learningOutcomeIds: z.array(z.string()).optional(),
      learningObjectives: z.array(z.string()).optional(),
    })),
    homework: z.array(z.object({
      description: z.string(),
      dueDate: z.string().optional(),
    })),
    notes: z.string().optional(),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface LessonPlanFormProps {
  initialData?: any;
  isEdit?: boolean;
  teacherId?: string;
  classId?: string;
  subjects?: any[];
}

export default function LessonPlanForm({ initialData, isEdit = false, teacherId, classId, subjects }: LessonPlanFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [bloomsDistribution, setBloomsDistribution] = useState<BloomsDistribution>(DEFAULT_BLOOMS_DISTRIBUTION);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [currentActivityIndex, setCurrentActivityIndex] = useState<number>(-1);
  const [distributionAnalysis, setDistributionAnalysis] = useState<any>(null);
  const [learningOutcomes, setLearningOutcomes] = useState<any[]>([]);

  // Use the provided classId directly
  const [selectedClassId] = useState<string>(initialData?.classId || classId || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialData?.subjectId || '');

  // Fetch subjects for the class
  const { data: subjectsData, isLoading: subjectsLoading } = api.class.getSubjects.useQuery(
    { classId: selectedClassId },
    {
      enabled: !!selectedClassId,
      staleTime: 60000 // Cache for 1 minute
    }
  );

  // Use either the provided subjects or the fetched subjects
  const availableSubjects = subjects?.length ? subjects : subjectsData;

  // Create mutation
  const createMutation = api.lessonPlan.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Lesson plan created successfully',
      });
      // Store the created lesson plan ID for potential submission
      if (data && data.id) {
        form.setValue('id', data.id);
      }
      router.push(classId ? `/teacher/classes/${classId}/lesson-plans` : '/teacher/lesson-plans');
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    },
  });

  // Update mutation
  const updateMutation = api.lessonPlan.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lesson plan updated successfully',
      });
      router.push(classId ? `/teacher/classes/${classId}/lesson-plans` : '/teacher/lesson-plans');
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    },
  });

  // Submit mutation
  const submitMutation = api.lessonPlan.submit.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lesson plan submitted for review',
      });
      router.push(classId ? `/teacher/classes/${classId}/lesson-plans` : '/teacher/lesson-plans');
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    },
  });

  // Default form values
  const defaultValues: Partial<FormValues> = initialData
    ? {
        ...initialData,
        startDate: new Date(initialData.startDate),
        endDate: new Date(initialData.endDate),
      }
    : {
        title: '',
        description: '',
        planType: LessonPlanType.WEEKLY,
        classId: classId || '',
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        content: {
          learningObjectives: [''],
          topics: [''],
          teachingMethods: [''],
          bloomsDistribution: DEFAULT_BLOOMS_DISTRIBUTION,
          learningOutcomeIds: [],
          resources: [],
          activities: [],
          assessments: [],
          homework: [],
          notes: '',
        },
      };

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      classId: selectedClassId, // Ensure classId is set correctly
    },
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);

    // Process the form values to ensure proper typing
    const processedValues = {
      ...values,
      content: {
        ...values.content,
        activities: values.content.activities.map(activity => ({
          ...activity,
          bloomsLevel: activity.bloomsLevel as BloomsTaxonomyLevel,
          id: activity.id || undefined
        })),
        assessments: values.content.assessments.map(assessment => ({
          ...assessment,
          bloomsLevel: assessment.bloomsLevel as BloomsTaxonomyLevel,
          id: assessment.id || undefined
        }))
      }
    };

    if (isEdit && initialData?.id) {
      // Use type assertion to handle the complex nested types
      updateMutation.mutate({
        id: initialData.id,
        ...processedValues,
      } as any);
    } else {
      // Use type assertion to handle the complex nested types
      createMutation.mutate({
        ...processedValues,
        teacherId: teacherId || '',
      } as any);
    }
  };

  // Initialize form data from initialData if editing - only run once
  useEffect(() => {
    if (isEdit && initialData) {
      // Extract topic IDs and custom topics from initialData
      if (initialData.content?.topics) {
        // Try to identify which topics are from the database (IDs) and which are custom (strings)
        const topicIds: string[] = [];
        const customTopicsList: string[] = [];

        initialData.content.topics.forEach((topic: string) => {
          // If it looks like a CUID, treat it as a topic ID, otherwise as a custom topic
          if (topic.length > 20 && /^[a-z0-9]+$/.test(topic)) {
            topicIds.push(topic);
          } else {
            customTopicsList.push(topic);
          }
        });

        setSelectedTopicIds(topicIds);
        setCustomTopics(customTopicsList);
      }

      // Set selected subject ID
      if (initialData.subjectId) {
        setSelectedSubjectId(initialData.subjectId);
      }

      // Set Bloom's distribution if available
      if (initialData.content?.bloomsDistribution) {
        setBloomsDistribution(initialData.content.bloomsDistribution);
      }

      // Initialize activities and assessments with empty arrays for learning outcomes and objectives if not present
      if (initialData.content?.activities) {
        initialData.content.activities.forEach((activity: any, index: number) => {
          if (!activity.learningOutcomeIds) {
            form.setValue(`content.activities.${index}.learningOutcomeIds`, []);
          }
          if (!activity.learningObjectives) {
            form.setValue(`content.activities.${index}.learningObjectives`, []);
          }
        });
      }

      if (initialData.content?.assessments) {
        initialData.content.assessments.forEach((assessment: any, index: number) => {
          if (!assessment.learningOutcomeIds) {
            form.setValue(`content.assessments.${index}.learningOutcomeIds`, []);
          }
          if (!assessment.learningObjectives) {
            form.setValue(`content.assessments.${index}.learningObjectives`, []);
          }
        });
      }

      // Analyze distribution if activities or assessments exist
      if (
        (initialData.content?.activities && initialData.content.activities.length > 0) ||
        (initialData.content?.assessments && initialData.content.assessments.length > 0)
      ) {
        setTimeout(() => {
          analyzeDistribution();
        }, 500);
      }
    } else {
      // Initialize with empty arrays for new lesson plans
      form.setValue('content.learningOutcomeIds', []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set default subject if available (separate effect to avoid dependency issues)
  useEffect(() => {
    if (!isEdit && !selectedSubjectId && availableSubjects?.length) {
      // If not editing and we have subjects available, select the first one by default
      const firstSubject = availableSubjects[0];
      if (firstSubject?.id) {
        setSelectedSubjectId(firstSubject.id);
        form.setValue('subjectId', firstSubject.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSubjects]);

  // Analyze distribution when activities or assessments change
  useEffect(() => {
    const activities = form.watch('content.activities');
    const assessments = form.watch('content.assessments');

    if ((activities && activities.length > 0) || (assessments && assessments.length > 0)) {
      analyzeDistribution();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch('content.activities'), form.watch('content.assessments')]);

  // Handle subject change
  const handleSubjectChange = (value: string) => {
    setSelectedSubjectId(value);
    form.setValue('subjectId', value);
    setSelectedTopicIds([]);
  };

  // Handle topics change
  const handleTopicsChange = (topicIds: string[], customTopicsList: string[]) => {
    // Check if the topic IDs have actually changed to avoid unnecessary re-renders
    const topicIdsChanged =
      selectedTopicIds.length !== topicIds.length ||
      topicIds.some((id, idx) => selectedTopicIds[idx] !== id);

    const customTopicsChanged =
      customTopics.length !== customTopicsList.length ||
      customTopicsList.some((topic, idx) => customTopics[idx] !== topic);

    // Only update state if something actually changed
    if (topicIdsChanged) {
      setSelectedTopicIds(topicIds);
    }

    if (customTopicsChanged) {
      setCustomTopics(customTopicsList);
    }

    // Only update form if either collection changed
    if (topicIdsChanged || customTopicsChanged) {
      // Combine topic IDs and custom topics for form submission
      const allTopics = [...topicIds, ...customTopicsList];

      // Get current form values without triggering re-renders
      const currentTopics = form.getValues('content.topics');

      // Deep comparison to avoid unnecessary form updates
      const topicsChanged =
        !currentTopics ||
        currentTopics.length !== allTopics.length ||
        allTopics.some((topic, idx) => currentTopics[idx] !== topic);

      if (topicsChanged) {
        form.setValue('content.topics', allTopics, { shouldDirty: true });
      }
    }
  };

  // Handle learning objectives change
  const handleLearningObjectivesChange = (objectives: string[]) => {
    // Get current objectives without triggering re-renders
    const currentObjectives = form.getValues('content.learningObjectives');

    // Only update if the objectives have actually changed
    const objectivesChanged =
      !currentObjectives ||
      currentObjectives.length !== objectives.length ||
      objectives.some((obj, idx) => currentObjectives[idx] !== obj);

    if (objectivesChanged) {
      form.setValue('content.learningObjectives', objectives, { shouldDirty: true });
    }
  };

  // Handle Bloom's distribution change
  const handleBloomsDistributionChange = (distribution: BloomsDistribution) => {
    setBloomsDistribution(distribution);
    form.setValue('content.bloomsDistribution', distribution as any, { shouldDirty: true });

    // Analyze the current content with the new distribution
    analyzeDistribution();
  };

  // Get the analyze distribution query
  const analyzeDistributionQuery = api.lessonPlan.analyzeBloomsDistribution.useQuery(
    { content: form.getValues('content') as any },
    {
      enabled: false,
      onSuccess: (data: any) => {
        setDistributionAnalysis(data);
      }
    }
  );

  // Analyze the current distribution
  const analyzeDistribution = () => {
    try {
      const content = form.getValues('content');

      // Only analyze if we have activities or assessments
      if (
        (content.activities && content.activities.length > 0) ||
        (content.assessments && content.assessments.length > 0)
      ) {
        // Process the content to ensure proper typing
        const processedContent = {
          ...content,
          activities: content.activities.map(activity => ({
            ...activity,
            bloomsLevel: activity.bloomsLevel as BloomsTaxonomyLevel
          })),
          assessments: content.assessments.map(assessment => ({
            ...assessment,
            bloomsLevel: assessment.bloomsLevel as BloomsTaxonomyLevel
          }))
        };

        // Update the query data
        analyzeDistributionQuery.refetch();
      } else {
        setDistributionAnalysis(null);
      }
    } catch (error) {
      console.error('Error analyzing Bloom\'s distribution:', error);
    }
  };

  // Add/remove array items
  const addArrayItem = (fieldName: string, defaultValue: any) => {
    const currentValues = form.getValues(fieldName as any) as any[];
    form.setValue(fieldName as any, [...currentValues, defaultValue]);
  };

  const removeArrayItem = (fieldName: string, index: number) => {
    const currentValues = form.getValues(fieldName as any) as any[];
    form.setValue(
      fieldName as any,
      currentValues.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          {isEdit ? 'Edit Lesson Plan' : 'Create New Lesson Plan'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEdit
            ? 'Update your lesson plan details'
            : 'Create a new weekly or monthly lesson plan'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter lesson plan title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="planType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LessonPlanType.WEEKLY}>Weekly</SelectItem>
                        <SelectItem value={LessonPlanType.MONTHLY}>Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose whether this is a weekly or monthly lesson plan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

{/* Class ID is already provided from the URL, so we don't need a dropdown */}
              <input type="hidden" name="classId" value={selectedClassId} />

              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select
                      onValueChange={(value) => handleSubjectChange(value)}
                      value={selectedSubjectId || field.value}
                      disabled={subjectsLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjectsLoading ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                            <span>Loading subjects...</span>
                          </div>
                        ) : availableSubjects && availableSubjects.length > 0 ? (
                          availableSubjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-muted-foreground">No subjects available for this class</p>
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a subject to see available topics
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a description for this lesson plan"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* Topics */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Topics</h2>
            <FormField
              control={form.control}
              name="content.topics"
              render={() => (
                <FormItem>
                  <FormControl>
                    <HierarchicalTopicSelector
                      subjectId={selectedSubjectId}
                      selectedTopicIds={selectedTopicIds}
                      customTopics={customTopics}
                      onTopicsChange={handleTopicsChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Select topics from the subject or add custom topics
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>



          {/* Bloom's Taxonomy Distribution */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Bloom's Taxonomy Distribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium mb-3">Target Distribution</h3>
                <FormField
                  control={form.control}
                  name="content.bloomsDistribution"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <div className="h-64">
                          <BloomsDistributionChart
                            distribution={bloomsDistribution}
                            onChange={handleBloomsDistributionChange}
                            editable={true}
                            showLabels={true}
                            showPercentages={true}
                            variant="horizontal-bar"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Adjust the target distribution of cognitive levels for this lesson plan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {distributionAnalysis && (
                <div>
                  <h3 className="text-md font-medium mb-3">Cognitive Balance Analysis</h3>
                  <div className="h-64">
                    <BloomsDistributionChart
                      distribution={distributionAnalysis.actualDistribution}
                      editable={false}
                      showLabels={true}
                      showPercentages={true}
                      variant="horizontal-bar"
                    />
                  </div>

                  {distributionAnalysis.recommendations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                      <ul className="text-sm space-y-1 list-disc pl-5">
                        {distributionAnalysis.recommendations.map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Teaching Methods */}
          <Card className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">Teaching Methods</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('content.teachingMethods', '')}
              >
                Add Method
              </Button>
            </div>

            {form.watch('content.teachingMethods')?.map((method: string, index: number) => (
              <div key={index} className="flex gap-2 mb-2">
                <FormField
                  control={form.control}
                  name={`content.teachingMethods.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={`Teaching method ${index + 1}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeArrayItem('content.teachingMethods', index)}
                  disabled={form.watch('content.teachingMethods').length <= 1}
                >
                  Remove
                </Button>
              </div>
            ))}
          </Card>

          {/* Activities */}
          <Card className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">Activities</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('content.activities', {
                  type: '',
                  name: '',
                  description: '',
                  date: '',
                  bloomsLevel: BloomsTaxonomyLevel.APPLY,
                  id: '',
                  learningOutcomeIds: [],
                  learningObjectives: []
                })}
              >
                Add Activity
              </Button>
            </div>

            {form.watch('content.activities')?.map((activity: any, index: number) => (
              <div key={index} className="mb-6 p-4 border rounded-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name={`content.activities.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Activity name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`content.activities.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Type (e.g., Group Work, Discussion)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name={`content.activities.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Activity description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name={`content.activities.${index}.date`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`content.activities.${index}.bloomsLevel`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bloom's Taxonomy Level</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Reset learning outcomes when taxonomy level changes
                              form.setValue(`content.activities.${index}.learningOutcomeIds`, [], { shouldDirty: true });
                            }}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select cognitive level" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(BloomsTaxonomyLevel).map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level.charAt(0) + level.slice(1).toLowerCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Select the cognitive level this activity targets
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentActivityIndex(index);
                      setActivityDialogOpen(true);
                    }}
                    className="w-full"
                    disabled={!form.watch(`content.activities.${index}.bloomsLevel`)}
                  >
                    Manage Learning Objectives
                  </Button>

                  {!form.watch(`content.activities.${index}.bloomsLevel`) && (
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      Select a Bloom's Taxonomy level first to manage learning objectives
                    </p>
                  )}

                  {/* Show selected learning outcomes and objectives if any */}
                  {(form.watch(`content.activities.${index}.learningOutcomeIds`)?.length > 0 ||
                    form.watch(`content.activities.${index}.learningObjectives`)?.length > 0) && (
                    <div className="mt-2 p-2 border rounded-md bg-muted/20">
                      {form.watch(`content.activities.${index}.learningOutcomeIds`)?.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium">Selected Learning Outcomes:</p>
                          <ul className="text-xs list-disc pl-4 mt-1">
                            {form.watch(`content.activities.${index}.learningOutcomeIds`)?.map((outcomeId, i) => {
                              // Find the learning outcome from the dialog data
                              const outcome = learningOutcomes?.find(o => o.id === outcomeId);
                              return (
                                <li key={i}>{outcome?.statement || `Learning Outcome ${i+1}`}</li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      {form.watch(`content.activities.${index}.learningObjectives`)?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium">Learning Objectives:</p>
                          <ul className="text-xs list-disc pl-4 mt-1">
                            {form.watch(`content.activities.${index}.learningObjectives`)?.map((objective, i) => (
                              <li key={i}>{objective}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeArrayItem('content.activities', index)}
                  >
                    Remove Activity
                  </Button>
                </div>
              </div>
            ))}

            {form.watch('content.activities')?.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No activities added yet. Click "Add Activity" to create one.
              </p>
            )}
          </Card>

          {/* Assessments */}
          <Card className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">Assessments</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('content.assessments', {
                  type: '',
                  name: '',
                  description: '',
                  date: '',
                  bloomsLevel: BloomsTaxonomyLevel.EVALUATE,
                  id: '',
                  learningOutcomeIds: [],
                  learningObjectives: []
                })}
              >
                Add Assessment
              </Button>
            </div>

            {form.watch('content.assessments')?.map((assessment: any, index: number) => (
              <div key={index} className="mb-6 p-4 border rounded-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name={`content.assessments.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assessment Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Assessment name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`content.assessments.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assessment Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Type (e.g., Quiz, Test, Project)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name={`content.assessments.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Assessment description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name={`content.assessments.${index}.learningObjectives`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assessment Methods</FormLabel>
                        <div className="space-y-2">
                          {field.value?.map((method, methodIndex) => (
                            <div key={methodIndex} className="flex items-center space-x-2">
                              <Input
                                value={method}
                                onChange={(e) => {
                                  const newMethods = [...field.value];
                                  newMethods[methodIndex] = e.target.value;
                                  field.onChange(newMethods);
                                }}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const newMethods = field.value.filter((_, i) => i !== methodIndex);
                                  field.onChange(newMethods);
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="Add assessment method"
                              value={form.watch(`content.assessments.${index}.newMethod`) || ''}
                              onChange={(e) => form.setValue(`content.assessments.${index}.newMethod`, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newMethod = form.watch(`content.assessments.${index}.newMethod`);
                                if (newMethod?.trim()) {
                                  const currentMethods = field.value || [];
                                  field.onChange([...currentMethods, newMethod.trim()]);
                                  form.setValue(`content.assessments.${index}.newMethod`, '');
                                }
                              }}
                              disabled={!form.watch(`content.assessments.${index}.newMethod`)?.trim()}
                            >
                              Add Method
                            </Button>
                          </div>
                        </div>
                        <FormDescription>
                          Add methods used to assess student learning
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name={`content.assessments.${index}.date`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`content.assessments.${index}.bloomsLevel`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bloom's Taxonomy Level</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select cognitive level" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(BloomsTaxonomyLevel).map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level.charAt(0) + level.slice(1).toLowerCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Select the cognitive level this assessment targets
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeArrayItem('content.assessments', index)}
                  >
                    Remove Assessment
                  </Button>
                </div>
              </div>
            ))}

            {form.watch('content.assessments')?.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No assessments added yet. Click "Add Assessment" to create one.
              </p>
            )}
          </Card>

          {/* Notes */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Additional Notes</h2>
            <FormField
              control={form.control}
              name="content.notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes or comments about this lesson plan"
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => router.push(classId ? `/teacher/classes/${classId}/lesson-plans` : '/teacher/lesson-plans')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Lesson Plan' : 'Save as Draft'}
            </Button>
            {!isEdit && (
              <Button
                type="button"
                disabled={isSubmitting || !form.formState.isValid}
                variant="default"
                className="w-full sm:w-auto"
                onClick={async () => {
                  // First save the lesson plan as draft
                  const isValid = await form.trigger();
                  if (!isValid) {
                    toast({
                      title: 'Validation Error',
                      description: 'Please fix the form errors before submitting',
                      variant: 'error',
                    });
                    return;
                  }

                  setIsSubmitting(true);

                  // Process the form values
                  const values = form.getValues();
                  const processedValues = {
                    ...values,
                    content: {
                      ...values.content,
                      activities: values.content.activities.map(activity => ({
                        ...activity,
                        bloomsLevel: activity.bloomsLevel as BloomsTaxonomyLevel,
                        id: activity.id || undefined
                      })),
                      assessments: values.content.assessments.map(assessment => ({
                        ...assessment,
                        bloomsLevel: assessment.bloomsLevel as BloomsTaxonomyLevel,
                        id: assessment.id || undefined
                      }))
                    }
                  };

                  // Create the lesson plan
                  createMutation.mutate({
                    ...processedValues,
                    teacherId: teacherId || '',
                  } as any, {
                    onSuccess: (data) => {
                      // Submit the created lesson plan
                      if (data && data.id) {
                        submitMutation.mutate({ id: data.id });
                      }
                    }
                  });
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Save & Submit for Review'
                )}
              </Button>
            )}
            {isEdit && initialData?.id && (initialData?.status === 'DRAFT' || initialData?.status === 'REJECTED') && (
              <Button
                type="button"
                disabled={isSubmitting || !form.formState.isValid}
                variant="default"
                className="w-full sm:w-auto"
                onClick={async () => {
                  // First validate the form
                  const isValid = await form.trigger();
                  if (!isValid) {
                    toast({
                      title: 'Validation Error',
                      description: 'Please fix the form errors before submitting',
                      variant: 'error',
                    });
                    return;
                  }

                  setIsSubmitting(true);

                  // Process the form values
                  const values = form.getValues();
                  const processedValues = {
                    ...values,
                    content: {
                      ...values.content,
                      activities: values.content.activities.map(activity => ({
                        ...activity,
                        bloomsLevel: activity.bloomsLevel as BloomsTaxonomyLevel,
                        id: activity.id || undefined
                      })),
                      assessments: values.content.assessments.map(assessment => ({
                        ...assessment,
                        bloomsLevel: assessment.bloomsLevel as BloomsTaxonomyLevel,
                        id: assessment.id || undefined
                      }))
                    }
                  };

                  // Update the lesson plan
                  updateMutation.mutate({
                    id: initialData.id,
                    ...processedValues,
                  } as any, {
                    onSuccess: () => {
                      // Submit the updated lesson plan
                      submitMutation.mutate({ id: initialData.id });
                    }
                  });
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit for Review'
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>

      {/* Activity Learning Outcomes Dialog */}
      {currentActivityIndex !== -1 && (
        <ActivityLearningOutcomeSelector
          isOpen={activityDialogOpen}
          onClose={() => setActivityDialogOpen(false)}
          topicIds={selectedTopicIds}
          subjectId={selectedSubjectId}
          selectedOutcomeIds={form.watch(`content.activities.${currentActivityIndex}.learningOutcomeIds`) || []}
          onSelect={(outcomeIds) => {
            form.setValue(`content.activities.${currentActivityIndex}.learningOutcomeIds`, outcomeIds, { shouldDirty: true });

            // Update the learningOutcomes state with the selected outcomes for display
            if (outcomeIds.length > 0) {
              const selectedOutcomes = learningOutcomes.filter(outcome => outcomeIds.includes(outcome.id));
              setLearningOutcomes(selectedOutcomes);
            }
          }}
          onAddObjective={(objective) => {
            const currentObjectives = form.watch(`content.activities.${currentActivityIndex}.learningObjectives`) || [];
            form.setValue(
              `content.activities.${currentActivityIndex}.learningObjectives`,
              [...currentObjectives, objective],
              { shouldDirty: true }
            );
          }}
          bloomsLevel={form.watch(`content.activities.${currentActivityIndex}.bloomsLevel`)}
        />
      )}


    </div>
  );
}
