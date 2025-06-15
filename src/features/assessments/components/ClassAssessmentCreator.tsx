'use client';

/**
 * Class Assessment Creator Component
 *
 * This component allows teachers to create class assessments
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Save, Loader2, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

// Assessment categories
enum AssessmentCategory {
  QUIZ = 'QUIZ',
  TEST = 'TEST',
  EXAM = 'EXAM',
  ASSIGNMENT = 'ASSIGNMENT',
  PROJECT = 'PROJECT'
}
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';

// Form schema for validation
const assessmentFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
  category: z.nativeEnum(AssessmentCategory),
  subjectId: z.string().min(1, 'Subject is required'),
  topicId: z.string().optional(),
  classId: z.string().min(1, 'Class is required'),
  termId: z.string().min(1, 'Term is required'),
  maxScore: z.number().min(1).default(100),
  passingScore: z.number().min(1).default(60),
  weightage: z.number().min(1).default(10),
  rubricId: z.string().optional(),
  dueDate: z.date().optional(),
  showRubricToStudents: z.boolean().default(true),
  bloomsDistribution: z.record(z.nativeEnum(BloomsTaxonomyLevel), z.number()).optional(),
});

type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

interface ClassAssessmentCreatorProps {
  initialValues?: Partial<AssessmentFormValues>;
  onSave: (values: AssessmentFormValues) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

/**
 * ClassAssessmentCreator component
 */
export function ClassAssessmentCreator({
  initialValues,
  onSave,
  onCancel,
  className = '',
}: ClassAssessmentCreatorProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for demonstration
  const subjects = [
    { id: 'subject-1', name: 'Mathematics' },
    { id: 'subject-2', name: 'Science' },
    { id: 'subject-3', name: 'English' },
  ];
  const subjectsLoading = false;

  // Mock topics
  const topics = [
    { id: 'topic-1', name: 'Algebra' },
    { id: 'topic-2', name: 'Geometry' },
    { id: 'topic-3', name: 'Calculus' },
  ];
  const topicsLoading = false;

  // Mock classes
  const classes = [
    { id: 'class-1', name: 'Class 10A' },
    { id: 'class-2', name: 'Class 10B' },
    { id: 'class-3', name: 'Class 11A' },
  ];
  const classesLoading = false;

  // Mock terms
  const terms = [
    { id: 'term-1', name: 'Term 1' },
    { id: 'term-2', name: 'Term 2' },
    { id: 'term-3', name: 'Term 3' },
  ];
  const termsLoading = false;

  // Initialize form with schema validation
  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      title: initialValues?.title || '',
      description: initialValues?.description || '',
      instructions: initialValues?.instructions || '',
      category: initialValues?.category || AssessmentCategory.TEST,
      subjectId: initialValues?.subjectId || '',
      topicId: initialValues?.topicId || '',
      classId: initialValues?.classId || '',
      termId: initialValues?.termId || '',
      maxScore: initialValues?.maxScore || 100,
      passingScore: initialValues?.passingScore || 60,
      weightage: initialValues?.weightage || 10,
      rubricId: initialValues?.rubricId || '',
      dueDate: initialValues?.dueDate,
      showRubricToStudents: initialValues?.showRubricToStudents ?? true,
      bloomsDistribution: initialValues?.bloomsDistribution || {
        [BloomsTaxonomyLevel.REMEMBER]: 20,
        [BloomsTaxonomyLevel.UNDERSTAND]: 30,
        [BloomsTaxonomyLevel.APPLY]: 30,
        [BloomsTaxonomyLevel.ANALYZE]: 20,
        [BloomsTaxonomyLevel.EVALUATE]: 0,
        [BloomsTaxonomyLevel.CREATE]: 0,
      },
    },
  });

  // Watch for subject changes to update topics
  const watchedSubjectId = form.watch('subjectId');

  // Handle form submission
  const onSubmit = async (values: AssessmentFormValues) => {
    setIsSubmitting(true);

    try {
      await onSave(values);

      toast({
        title: 'Assessment created',
        description: 'The assessment has been created successfully',
      });
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast({
        title: 'Error creating assessment',
        description: 'There was an error creating the assessment. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Bloom's distribution change
  const handleDistributionChange = (distribution: Record<BloomsTaxonomyLevel, number>) => {
    form.setValue('bloomsDistribution', distribution);
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>Create Class Assessment</CardTitle>
        <CardDescription>
          Create an assessment with Bloom's Taxonomy and rubric integration
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
                    <FormLabel>Assessment Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter assessment title" {...field} />
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
                        placeholder="Describe the purpose of this assessment"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assessment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(AssessmentCategory).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Class, Subject, Topic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classesLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          classes?.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="termId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {termsLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          terms?.map((term) => (
                            <SelectItem key={term.id} value={term.id}>
                              {term.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjectsLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          subjects?.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topicId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No specific topic</SelectItem>
                        {topicsLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          topics?.map((topic) => (
                            <SelectItem key={topic.id} value={topic.id}>
                              {topic.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Grading Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <FormField
                control={form.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Score</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
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
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Score</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={form.watch('maxScore')}
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
                name="weightage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weightage (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Contribution to overall grade
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bloom's Taxonomy Integration */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Bloom's Taxonomy Distribution</h3>

              <div className="p-4 border rounded-md bg-muted">
                <div className="flex items-center mb-2">
                  <BarChart className="h-5 w-5 mr-2 text-primary" />
                  <h4 className="font-medium">Bloom's Taxonomy Distribution</h4>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-2">
                    {Object.values(BloomsTaxonomyLevel).map((level) => (
                      <div key={level} className="flex flex-col items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                          <div
                            className="bg-primary rounded-full h-2.5"
                            style={{ width: `${form.watch('bloomsDistribution')?.[level] || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{level.substring(0, 3)}</span>
                        <span className="text-xs font-medium">{form.watch('bloomsDistribution')?.[level] || 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4 pt-4 border-t">
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed instructions for students"
                        className="min-h-[150px]"
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

            {/* Due Date */}
            <div className="space-y-4 pt-4 border-t">
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
                      Set a due date for this assessment
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
                    Create Assessment
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
