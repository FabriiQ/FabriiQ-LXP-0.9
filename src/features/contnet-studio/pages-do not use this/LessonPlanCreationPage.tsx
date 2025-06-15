'use client';

/**
 * LessonPlanCreationPage
 *
 * This page handles the creation of lesson plans, with support for both
 * manual creation and AI-assisted generation.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Save, Loader2, CalendarIcon } from 'lucide-react';
import { ContentCreationFlow, CreationMethod, ManualCreationParams, AICreationParams } from '../components/ContentCreationFlow';
import { ContentType } from '../components/ContentCreationFlow';
import { useContentStudio } from '../contexts/ContentStudioContext';
import { ActivityPurpose } from '@/server/api/constants';
import { ActivityTypeBridgeProvider } from '../ActivityTypeBridge';
import { ClassSelector } from '../components/ClassSelector';
import { SubjectSelector } from '../components/SubjectSelector';
import { HierarchicalTopicSelector } from '../components/HierarchicalTopicSelector';
import { LearningObjectivesSelector } from '../components/LearningObjectivesSelector';
import { api } from '@/utils/api';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Define the steps in the lesson plan creation flow
enum LessonPlanCreationStep {
  CLASS_SELECTION = 'CLASS_SELECTION',
  SUBJECT_SELECTION = 'SUBJECT_SELECTION',
  TOPIC_SELECTION = 'TOPIC_SELECTION',
  LEARNING_OBJECTIVES_SELECTION = 'LEARNING_OBJECTIVES_SELECTION',
  CREATION_METHOD_SELECTION = 'CREATION_METHOD_SELECTION',
  MANUAL_CREATION = 'MANUAL_CREATION',
  AI_PARAMETERS = 'AI_PARAMETERS',
  AI_GENERATION = 'AI_GENERATION',
  AI_CONVERSATION = 'AI_CONVERSATION',
  PREVIEW = 'PREVIEW'
}

export function LessonPlanCreationPage() {
  const router = useRouter();
  const {
    contentType,
    setContentType,
    subjectId,
    selectedTopicIds,
    selectedLearningObjectiveIds,
    activityType,
    activityPurpose,
    classId
  } = useContentStudio();

  // Set content type if not already set
  if (!contentType) {
    setContentType(ContentType.LESSON_PLAN);
  }

  // Local state for the current step
  const [currentStep, setCurrentStep] = useState<LessonPlanCreationStep>(LessonPlanCreationStep.CLASS_SELECTION);

  // Track the previous step for back navigation from preview
  const [previousStep, setPreviousStep] = useState<LessonPlanCreationStep | null>(null);

  // Handle back button click
  const handleBack = () => {
    switch (currentStep) {
      case LessonPlanCreationStep.CLASS_SELECTION:
        // Go back to content studio
        router.push('/teacher/content-studio');
        break;
      case LessonPlanCreationStep.SUBJECT_SELECTION:
        setCurrentStep(LessonPlanCreationStep.CLASS_SELECTION);
        break;
      case LessonPlanCreationStep.TOPIC_SELECTION:
        setCurrentStep(LessonPlanCreationStep.SUBJECT_SELECTION);
        break;
      case LessonPlanCreationStep.LEARNING_OBJECTIVES_SELECTION:
        setCurrentStep(LessonPlanCreationStep.TOPIC_SELECTION);
        break;
      case LessonPlanCreationStep.CREATION_METHOD_SELECTION:
        setCurrentStep(LessonPlanCreationStep.LEARNING_OBJECTIVES_SELECTION);
        break;
      case LessonPlanCreationStep.MANUAL_CREATION:
        setCurrentStep(LessonPlanCreationStep.CREATION_METHOD_SELECTION);
        break;
      case LessonPlanCreationStep.AI_PARAMETERS:
        setCurrentStep(LessonPlanCreationStep.CREATION_METHOD_SELECTION);
        break;
      case LessonPlanCreationStep.AI_GENERATION:
        setCurrentStep(LessonPlanCreationStep.AI_PARAMETERS);
        break;
      case LessonPlanCreationStep.AI_CONVERSATION:
        setCurrentStep(LessonPlanCreationStep.AI_GENERATION);
        break;
      case LessonPlanCreationStep.PREVIEW:
        // Go back to the previous step
        if (previousStep) {
          setCurrentStep(previousStep);
        } else {
          // Default to creation method selection if no previous step is recorded
          setCurrentStep(LessonPlanCreationStep.CREATION_METHOD_SELECTION);
        }
        break;
      default:
        // Default to going back to content type selection
        router.push('/teacher/content-studio');
    }
  };

  // Define the form schema for lesson plan
  const lessonPlanFormSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    startDate: z.date(),
    endDate: z.date(),
    planType: z.enum(["WEEKLY", "MONTHLY"]),
    content: z.object({
      learningObjectives: z.array(z.string()),
      topics: z.array(z.string()),
      teachingMethods: z.array(z.string()).min(1, "At least one teaching method is required"),
      resources: z.array(z.object({
        type: z.string(),
        name: z.string(),
        description: z.string().optional(),
        url: z.string().optional()
      })).optional().default([]),
      activities: z.array(z.object({
        type: z.string(),
        name: z.string(),
        description: z.string().optional(),
        date: z.string().optional()
      })).optional().default([]),
      assessments: z.array(z.object({
        type: z.string(),
        name: z.string(),
        description: z.string().optional(),
        date: z.string().optional()
      })).optional().default([]),
      homework: z.array(z.object({
        description: z.string(),
        dueDate: z.string().optional()
      })).optional().default([]),
      notes: z.string().optional()
    })
  });

  // Define the form type
  type LessonPlanFormValues = z.infer<typeof lessonPlanFormSchema>;

  // Get the toast function
  const { toast } = useToast();

  // Get the session data
  const { data: session } = useSession();

  // Create the form
  const form = useForm<LessonPlanFormValues>({
    resolver: zodResolver(lessonPlanFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 1 week
      planType: "WEEKLY",
      content: {
        learningObjectives: selectedLearningObjectiveIds,
        topics: selectedTopicIds,
        teachingMethods: [],
        resources: [],
        activities: [],
        assessments: [],
        homework: [],
        notes: ""
      }
    }
  });

  // Get the create lesson plan mutation
  const createLessonPlan = api.lessonPlan.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Lesson plan created successfully",
        variant: "success"
      });

      // Navigate to the lesson plan view page
      router.push(`/teacher/lesson-plans/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lesson plan",
        variant: "error"
      });
    }
  });

  // Handle form submission
  const onSubmit = async (values: LessonPlanFormValues) => {
    // Get the teacher ID from the session
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a lesson plan",
        variant: "error"
      });
      return;
    }

    // Get the teacher profile
    const { data: userData } = await api.user.getById.useQuery(session.user.id);

    if (!userData?.teacherProfile?.id) {
      toast({
        title: "Error",
        description: "Teacher profile not found",
        variant: "error"
      });
      return;
    }

    // Create the lesson plan
    createLessonPlan.mutate({
      title: values.title,
      description: values.description,
      teacherId: userData.teacherProfile.id,
      classId: classId,
      subjectId: subjectId,
      startDate: values.startDate,
      endDate: values.endDate,
      planType: values.planType as any,
      content: values.content
    });
  };

  // Handle manual creation
  const handleManualCreation = (params: ManualCreationParams) => {
    console.log('Manual creation params:', params);

    // Save the current step for back navigation
    setPreviousStep(currentStep);

    // Move to the manual creation step
    setCurrentStep(LessonPlanCreationStep.MANUAL_CREATION);
  };

  // Handle AI-assisted creation
  const handleAICreation = (params: AICreationParams) => {
    console.log('AI creation params:', params);

    // Save the current step for back navigation
    setPreviousStep(currentStep);

    // Move to the AI parameters step
    setCurrentStep(LessonPlanCreationStep.AI_PARAMETERS);
  };

  // Handle preview
  const handlePreview = () => {
    // Save the current step for back navigation
    setPreviousStep(currentStep);

    // Move to the preview step
    setCurrentStep(LessonPlanCreationStep.PREVIEW);
  };

  // Handle class selection
  const handleClassSelect = (selectedClassId: string) => {
    // Update the class ID in the context
    useContentStudio().setClassId(selectedClassId);
    // Move to the next step
    setCurrentStep(LessonPlanCreationStep.SUBJECT_SELECTION);
  };

  // Handle subject selection
  const handleSubjectSelect = (selectedSubjectId: string) => {
    // Update the subject ID in the context
    useContentStudio().setSubjectId(selectedSubjectId);
    // Move to the next step
    setCurrentStep(LessonPlanCreationStep.TOPIC_SELECTION);
  };

  // Handle topic selection
  const handleTopicsChange = (topicIds: string[], customTopics: string[]) => {
    // Clear existing topics
    useContentStudio().clearTopicIds();

    // Add selected topics
    topicIds.forEach(id => {
      useContentStudio().addTopicId(id);
    });

    // Move to the next step if at least one topic is selected
    if (topicIds.length > 0 || customTopics.length > 0) {
      setCurrentStep(LessonPlanCreationStep.LEARNING_OBJECTIVES_SELECTION);
    }
  };

  // Handle learning objectives selection
  const handleObjectivesChange = (objectives: string[]) => {
    // Clear existing objectives
    useContentStudio().clearLearningObjectiveIds();

    // Add selected objectives
    objectives.forEach(objective => {
      useContentStudio().addLearningObjectiveId(objective);
    });

    // Move to the next step if at least one objective is selected
    if (objectives.length > 0) {
      setCurrentStep(LessonPlanCreationStep.CREATION_METHOD_SELECTION);
    }
  };

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case LessonPlanCreationStep.CLASS_SELECTION:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Class</h2>
            <p className="text-muted-foreground">Choose the class for which you want to create a lesson plan.</p>
            <div className="mt-4">
              <ClassSelector
                selectedClassId={classId}
                onClassSelect={handleClassSelect}
              />
            </div>
          </div>
        );
      case LessonPlanCreationStep.SUBJECT_SELECTION:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Subject</h2>
            <p className="text-muted-foreground">Choose the subject for your lesson plan.</p>
            <div className="mt-4">
              <SubjectSelector
                selectedSubjectId={subjectId}
                classId={classId}
                onSelect={handleSubjectSelect}
              />
            </div>
          </div>
        );
      case LessonPlanCreationStep.TOPIC_SELECTION:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Topics</h2>
            <p className="text-muted-foreground">Choose one or more topics to include in your lesson plan.</p>
            <div className="mt-4">
              <HierarchicalTopicSelector
                subjectId={subjectId}
                selectedTopicIds={selectedTopicIds}
                onTopicsChange={handleTopicsChange}
              />
            </div>
          </div>
        );
      case LessonPlanCreationStep.LEARNING_OBJECTIVES_SELECTION:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Learning Objectives</h2>
            <p className="text-muted-foreground">Choose learning objectives for your lesson plan.</p>
            <div className="mt-4">
              <LearningObjectivesSelector
                topicIds={selectedTopicIds}
                selectedObjectives={selectedLearningObjectiveIds}
                onObjectivesChange={handleObjectivesChange}
              />
            </div>
          </div>
        );
      case LessonPlanCreationStep.CREATION_METHOD_SELECTION:
        return (
          <ContentCreationFlow
            contentType={ContentType.LESSON_PLAN}
            activityType={activityType || undefined}
            activityPurpose={ActivityPurpose.LEARNING}
            subjectId={subjectId || undefined}
            topicIds={selectedTopicIds.length > 0 ? selectedTopicIds : undefined}
            classId={classId || undefined}
            onManualCreation={handleManualCreation}
            onAICreation={handleAICreation}
          />
        );
      case LessonPlanCreationStep.MANUAL_CREATION:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Create Lesson Plan</h2>
            <p className="text-muted-foreground">Fill in the details for your lesson plan.</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a description for your lesson plan"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                  format(field.value, "PPP")
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
                              initialFocus
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
                                  format(field.value, "PPP")
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
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="content.teachingMethods"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teaching Methods</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {[
                          "Lecture",
                          "Discussion",
                          "Group Work",
                          "Demonstration",
                          "Project-Based Learning",
                          "Inquiry-Based Learning",
                          "Flipped Classroom",
                          "Game-Based Learning",
                          "Role Play"
                        ].map((method) => (
                          <div key={method} className="flex items-center space-x-2">
                            <Checkbox
                              id={`method-${method}`}
                              checked={field.value.includes(method)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, method]);
                                } else {
                                  field.onChange(
                                    field.value.filter((value) => value !== method)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`method-${method}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {method}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content.notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes for your lesson plan"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    Back
                  </Button>

                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreview}
                    >
                      Preview
                    </Button>

                    <Button
                      type="submit"
                      disabled={createLessonPlan.isLoading}
                    >
                      {createLessonPlan.isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Lesson Plan
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        );
      case LessonPlanCreationStep.AI_PARAMETERS:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Configure AI Parameters</h2>
            <p className="text-muted-foreground">Customize how the AI generates your lesson plan.</p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-title">Lesson Plan Title</Label>
                <Input
                  id="ai-title"
                  placeholder="Enter a title for your lesson plan"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="ai-prompt">Prompt for AI</Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="Describe what you want in your lesson plan. Be specific about teaching methods, activities, and any special requirements."
                  className="mt-1 min-h-[150px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ai-plan-type">Plan Type</Label>
                  <Select defaultValue="WEEKLY">
                    <SelectTrigger id="ai-plan-type" className="mt-1">
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ai-teaching-style">Teaching Style</Label>
                  <Select defaultValue="balanced">
                    <SelectTrigger id="ai-teaching-style" className="mt-1">
                      <SelectValue placeholder="Select teaching style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="traditional">Traditional</SelectItem>
                      <SelectItem value="progressive">Progressive</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="inquiry">Inquiry-Based</SelectItem>
                      <SelectItem value="project">Project-Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                >
                  Back
                </Button>

                <Button
                  type="button"
                  onClick={() => setCurrentStep(LessonPlanCreationStep.AI_GENERATION)}
                >
                  Generate Lesson Plan
                </Button>
              </div>
            </div>
          </div>
        );
      case LessonPlanCreationStep.AI_GENERATION:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Generating Lesson Plan</h2>
            <p className="text-muted-foreground">Please wait while the AI generates your lesson plan...</p>

            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">This may take a few moments</p>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
              >
                Cancel
              </Button>
            </div>
          </div>
        );
      case LessonPlanCreationStep.AI_CONVERSATION:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">AI Generated Lesson Plan</h2>
            <p className="text-muted-foreground">Review and refine the generated lesson plan.</p>

            <div className="border rounded-md p-4 bg-muted/50">
              <h3 className="font-medium mb-2">Mathematics Weekly Lesson Plan</h3>
              <p className="text-sm text-muted-foreground mb-4">A comprehensive weekly lesson plan for teaching algebra concepts.</p>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Learning Objectives</h4>
                  <ul className="list-disc list-inside text-sm mt-1">
                    <li>Understand linear equations and their applications</li>
                    <li>Solve systems of equations using multiple methods</li>
                    <li>Apply algebraic concepts to real-world problems</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Teaching Methods</h4>
                  <ul className="list-disc list-inside text-sm mt-1">
                    <li>Direct instruction for core concepts</li>
                    <li>Group problem-solving activities</li>
                    <li>Individual practice with feedback</li>
                    <li>Real-world application projects</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Activities</h4>
                  <ul className="list-disc list-inside text-sm mt-1">
                    <li>Interactive whiteboard demonstration of equation solving</li>
                    <li>Group challenge: Systems of equations puzzle</li>
                    <li>Real-world application: Budget planning with equations</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-feedback">Feedback or Modifications</Label>
                <Textarea
                  id="ai-feedback"
                  placeholder="Provide feedback or request modifications to the generated lesson plan"
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
              >
                Back
              </Button>

              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                >
                  Preview
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    toast({
                      title: "Success",
                      description: "Lesson plan created successfully",
                      variant: "success"
                    });
                    router.push('/teacher/lesson-plans');
                  }}
                >
                  Save Lesson Plan
                </Button>
              </div>
            </div>
          </div>
        );
      case LessonPlanCreationStep.PREVIEW:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Preview Lesson Plan</h2>
            <p className="text-muted-foreground">Review your lesson plan before saving.</p>

            <div className="border rounded-md p-6 bg-card">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold">Mathematics Weekly Lesson Plan</h3>
                  <p className="text-muted-foreground">A comprehensive weekly lesson plan for teaching algebra concepts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Class</h4>
                    <p>Grade 10 Mathematics</p>
                  </div>

                  <div>
                    <h4 className="font-medium">Date Range</h4>
                    <p>May 1, 2023 - May 7, 2023</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium">Learning Objectives</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Understand linear equations and their applications</li>
                    <li>Solve systems of equations using multiple methods</li>
                    <li>Apply algebraic concepts to real-world problems</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">Teaching Methods</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Direct instruction for core concepts</li>
                    <li>Group problem-solving activities</li>
                    <li>Individual practice with feedback</li>
                    <li>Real-world application projects</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">Activities</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Interactive whiteboard demonstration of equation solving</li>
                    <li>Group challenge: Systems of equations puzzle</li>
                    <li>Real-world application: Budget planning with equations</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">Assessments</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Daily exit tickets on equation solving</li>
                    <li>Mid-week quiz on systems of equations</li>
                    <li>End-of-week project assessment</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">Resources</h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Textbook: Algebra Fundamentals, Chapter 5</li>
                    <li>Online practice problems from Khan Academy</li>
                    <li>Interactive equation solver software</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">Notes</h4>
                  <p className="mt-2">Focus on real-world applications to increase student engagement. Provide additional support for students struggling with systems of equations.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
              >
                Back
              </Button>

              <Button
                type="button"
                onClick={() => {
                  toast({
                    title: "Success",
                    description: "Lesson plan created successfully",
                    variant: "success"
                  });
                  router.push('/teacher/lesson-plans');
                }}
              >
                Save Lesson Plan
              </Button>
            </div>
          </div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <ActivityTypeBridgeProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="mr-2"
              onClick={handleBack}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Create Lesson Plan</h1>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className={
                [
                  LessonPlanCreationStep.CLASS_SELECTION,
                  LessonPlanCreationStep.SUBJECT_SELECTION,
                  LessonPlanCreationStep.TOPIC_SELECTION,
                  LessonPlanCreationStep.LEARNING_OBJECTIVES_SELECTION,
                  LessonPlanCreationStep.CREATION_METHOD_SELECTION
                ].includes(currentStep) ? 'font-bold text-primary' : ''
              }>Select</span>
              <span className={
                [
                  LessonPlanCreationStep.MANUAL_CREATION,
                  LessonPlanCreationStep.AI_PARAMETERS,
                  LessonPlanCreationStep.AI_GENERATION,
                  LessonPlanCreationStep.AI_CONVERSATION
                ].includes(currentStep) ? 'font-bold text-primary' : ''
              }>Create</span>
              <span className={currentStep === LessonPlanCreationStep.PREVIEW ? 'font-bold text-primary' : ''}>Preview</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden" role="progressbar">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{
                  width: `${(Object.values(LessonPlanCreationStep).indexOf(currentStep) + 1) /
                  Object.values(LessonPlanCreationStep).length * 100}%`
                }}
              ></div>
            </div>
          </div>

          {/* Current step content */}
          <div className="bg-card rounded-lg border p-6">
            {renderStep()}
          </div>
        </div>
      </div>
    </ActivityTypeBridgeProvider>
  );
}
