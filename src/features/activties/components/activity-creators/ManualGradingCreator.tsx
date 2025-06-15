'use client';

/**
 * Manual Grading Activity Creator Component
 *
 * This component allows teachers to create manual grading activities
 * with Bloom's Taxonomy and rubric integration.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import { BloomsTaxonomySelector } from '@/features/bloom/components/taxonomy/BloomsTaxonomySelector';
import { ActionVerbSuggestions } from '@/features/bloom/components/taxonomy/ActionVerbSuggestions';
import { RubricSelector } from '@/features/bloom/components/rubrics/RubricSelector';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { ManualGradingActivity, createDefaultManualGradingActivity } from '../../models/manual-grading';

// Form schema for validation
const manualGradingFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel),
  rubricId: z.string().optional(),
  submissionInstructions: z.string().optional(),
  allowFileUpload: z.boolean().default(true),
  allowTextSubmission: z.boolean().default(true),
  allowLinkSubmission: z.boolean().default(false),
  maxFileSize: z.number().min(1).max(100).default(10),
  maxFiles: z.number().min(1).max(10).default(3),
  allowedFileTypes: z.array(z.string()).default(['pdf', 'docx', 'jpg', 'png']),
  gradingMethod: z.enum(['auto', 'manual']).default('manual'),
  gradingType: z.enum(['score', 'rubric']).default('score'),
  dueDate: z.date().optional(),
  showRubricToStudents: z.boolean().default(true),
});

type ManualGradingFormValues = z.infer<typeof manualGradingFormSchema>;

interface ManualGradingCreatorProps {
  initialActivity?: Partial<ManualGradingActivity>;
  onSave: (activity: ManualGradingActivity) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * ManualGradingCreator component
 */
export function ManualGradingCreator({
  initialActivity,
  onSave,
  onCancel,
  className = '',
}: ManualGradingCreatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with default values or provided initial activity
  const defaultActivity = createDefaultManualGradingActivity();
  const mergedActivity = { ...defaultActivity, ...initialActivity };

  // Initialize form with schema validation
  const form = useForm<ManualGradingFormValues>({
    resolver: zodResolver(manualGradingFormSchema),
    defaultValues: {
      title: mergedActivity.title,
      description: mergedActivity.description || '',
      instructions: mergedActivity.instructions || '',
      bloomsLevel: mergedActivity.bloomsLevel || BloomsTaxonomyLevel.APPLY,
      rubricId: mergedActivity.rubricId,
      submissionInstructions: mergedActivity.submissionInstructions || '',
      allowFileUpload: mergedActivity.settings?.allowFileUpload ?? true,
      allowTextSubmission: mergedActivity.settings?.allowTextSubmission ?? true,
      allowLinkSubmission: mergedActivity.settings?.allowLinkSubmission ?? false,
      maxFileSize: mergedActivity.settings?.maxFileSize ?? 10,
      gradingMethod: mergedActivity.settings?.gradingMethod as 'auto' | 'manual' || 'manual',
      gradingType: mergedActivity.settings?.gradingType as 'score' | 'rubric' || 'score',
      maxFiles: mergedActivity.settings?.maxFiles ?? 3,
      allowedFileTypes: mergedActivity.settings?.allowedFileTypes ?? ['pdf', 'docx', 'jpg', 'png'],
      dueDate: mergedActivity.settings?.dueDate,
      showRubricToStudents: mergedActivity.settings?.showRubricToStudents ?? true,
    },
  });

  // Handle form submission
  const onSubmit = (values: ManualGradingFormValues) => {
    setIsSubmitting(true);

    try {
      // Create activity object from form values
      const activity: ManualGradingActivity = {
        id: mergedActivity.id,
        title: values.title,
        activityType: 'manual-grading',
        description: values.description,
        instructions: values.instructions,
        bloomsLevel: values.bloomsLevel,
        rubricId: values.gradingType === 'rubric' ? values.rubricId : undefined,
        submissionInstructions: values.submissionInstructions,
        isGradable: true,
        maxScore: 100, // Default max score
        settings: {
          allowFileUpload: values.allowFileUpload,
          allowTextSubmission: values.allowTextSubmission,
          allowLinkSubmission: values.allowLinkSubmission,
          maxFileSize: values.maxFileSize,
          maxFiles: values.maxFiles,
          allowedFileTypes: values.allowedFileTypes,
          dueDate: values.dueDate,
          showRubricToStudents: values.showRubricToStudents,
          gradingMethod: values.gradingMethod,
          gradingType: values.gradingType,
        },
        metadata: {
          difficulty: 'medium',
          estimatedTime: 30,
          version: mergedActivity.metadata?.version || '1.0.0',
        },
        createdAt: mergedActivity.createdAt || new Date(),
        updatedAt: new Date(),
      };

      // Call the onSave callback with the activity
      onSave(activity);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle action verb selection
  const handleVerbSelect = (verb: string) => {
    const currentInstructions = form.getValues('instructions');
    form.setValue('instructions', `${currentInstructions} ${verb} `);
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>Create Manual Grading Activity</CardTitle>
        <CardDescription>
          Create an activity that requires manual grading with Bloom's Taxonomy and rubrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Title</FormLabel>
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
                        placeholder="Describe the purpose of this activity"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Grading Configuration */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Grading Configuration</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gradingMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grading Method</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grading method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Automatic Grading</SelectItem>
                          <SelectItem value="manual">Manual Grading</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === 'auto'
                          ? 'Automatic grading will be applied when students submit their work'
                          : 'You will need to manually grade student submissions'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gradingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grading Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grading type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="score">Score-based</SelectItem>
                          <SelectItem value="rubric">Rubric-based</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === 'score'
                          ? 'Grade using a simple score out of the maximum points'
                          : 'Grade using a detailed rubric with multiple criteria'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('gradingType') === 'rubric' && (
                <FormField
                  control={form.control}
                  name="rubricId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rubric</FormLabel>
                      <RubricSelector
                        value={field.value}
                        onChange={field.onChange}
                        className="w-full"
                      />
                      <FormDescription>
                        Select a rubric to use for grading this activity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="showRubricToStudents"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Show rubric to students
                      </FormLabel>
                      <FormDescription>
                        If checked, students will be able to see the rubric before submitting
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Bloom's Taxonomy Integration */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Bloom's Taxonomy Integration</h3>

              <FormField
                control={form.control}
                name="bloomsLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cognitive Level</FormLabel>
                    <FormControl>
                      <BloomsTaxonomySelector
                        value={field.value}
                        onChange={field.onChange}
                        variant="buttons"
                        showDescription={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-4">
                <FormLabel>Action Verb Suggestions</FormLabel>
                <ActionVerbSuggestions
                  bloomsLevel={form.watch('bloomsLevel')}
                  onSelect={handleVerbSelect}
                  count={8}
                  showExamples={true}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4 pt-4 border-t">
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed instructions for students"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use action verbs aligned with the selected Bloom's level
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="submissionInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submission Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide instructions for how students should submit their work"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Rubric Selection */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Rubric Integration</h3>

              <FormField
                control={form.control}
                name="rubricId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Rubric</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a rubric" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No rubric</SelectItem>
                          <SelectItem value="rubric-1">Basic Rubric</SelectItem>
                          <SelectItem value="rubric-2">Detailed Rubric</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showRubricToStudents"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Show Rubric to Students</FormLabel>
                      <FormDescription>
                        Students will be able to see the rubric before submitting
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
            </div>

            {/* Submission Settings */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Submission Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="allowFileUpload"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Allow File Upload
                        </FormLabel>
                        <FormDescription>
                          Students can upload files
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowTextSubmission"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Allow Text Submission
                        </FormLabel>
                        <FormDescription>
                          Students can submit text responses
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowLinkSubmission"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Allow Link Submission
                        </FormLabel>
                        <FormDescription>
                          Students can submit links to external resources
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('allowFileUpload') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="maxFileSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max File Size (MB)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxFiles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Number of Files</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}

                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Set a due date for this activity
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Activity
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
