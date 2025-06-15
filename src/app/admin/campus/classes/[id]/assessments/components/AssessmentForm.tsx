'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AssessmentCategory, GradingType } from '@/server/api/constants';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
  // CardFooter removed as it's not used
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { CalendarIcon, Plus as PlusIcon, Trash as TrashIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Simple form schema with basic validation
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  subjectId: z.string().min(1, 'Subject is required'),
  topicId: z.string().optional(),
  category: z.nativeEnum(AssessmentCategory).default(AssessmentCategory.QUIZ),
  instructions: z.string().optional(),
  maxScore: z.coerce.number().min(1, 'Maximum score must be at least 1').default(100),
  passingScore: z.coerce.number().min(0, 'Passing score must be at least 0').default(50),
  weightage: z.coerce.number().min(0, 'Weightage must be at least 0').max(100, 'Weightage cannot exceed 100').default(0),
  dueDate: z.date().optional(),
  gradingType: z.nativeEnum(GradingType).default(GradingType.MANUAL),
  isPublished: z.boolean().default(false),
  allowLateSubmissions: z.boolean().default(false),
  questions: z.array(
    z.object({
      text: z.string().min(1, 'Question text is required'),
      type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY', 'FILE_UPLOAD']).default('MULTIPLE_CHOICE'),
      options: z.array(
        z.object({
          text: z.string().min(1, 'Option text is required'),
          isCorrect: z.boolean().default(false),
        })
      ).optional().default([]),
      maxScore: z.coerce.number().min(1, 'Question score must be at least 1').default(10),
    })
  ).optional().default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface Subject {
  id: string;
  name: string;
  code?: string;
  topics?: { id: string; name: string }[];
}

interface AssessmentFormProps {
  classId: string;
  subjects: Subject[];
  assessment?: any;
  action: 'create' | 'edit';
}

export function AssessmentForm({ classId, subjects, assessment, action }: AssessmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<string>(assessment?.subjectId || '');

  console.log('AssessmentForm - Subjects:', subjects);
  console.log('AssessmentForm - ClassId:', classId);
  console.log('AssessmentForm - Action:', action);

  // Default form values
  const defaultValues: Partial<FormValues> = assessment
    ? {
        title: assessment.title,
        description: assessment.description || '',
        subjectId: assessment.subjectId,
        topicId: assessment.topicId,
        category: assessment.category as AssessmentCategory,
        instructions: assessment.instructions || '',
        maxScore: assessment.maxScore || 100,
        passingScore: assessment.passingScore || 0,
        weightage: assessment.weightage || 0,
        dueDate: assessment.dueDate ? new Date(assessment.dueDate) : undefined,
        // Remove gradingScale as it's causing issues
        gradingType: assessment.gradingType as GradingType || GradingType.MANUAL,
        isPublished: assessment.isPublished || false,
        allowLateSubmissions: assessment.allowLateSubmissions || false,
        questions: assessment.questions || [],
      }
    : {
        title: '',
        description: '',
        category: AssessmentCategory.QUIZ,
        subjectId: '',
        maxScore: 100,
        passingScore: 50,
        weightage: 0,
        gradingType: GradingType.MANUAL,
        isPublished: false,
        allowLateSubmissions: false,
        questions: [],
      };

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Create assessment mutation
  const createAssessment = api.assessment.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Assessment created',
        description: 'The assessment has been created successfully.',
        variant: 'success',
      });
      router.push(`/admin/campus/classes/${classId}/assessments`);
      router.refresh();
    },
    onError: (error) => {
      console.error('Error creating assessment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create assessment. Please try again.',
        variant: 'error',
      });
    },
  });

  // Update assessment mutation
  const updateAssessment = api.assessment.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Assessment updated',
        description: 'The assessment has been updated successfully.',
        variant: 'success',
      });
      router.push(`/admin/campus/classes/${classId}/assessments`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    },
  });

  // Simplified form submission handler
  function onSubmit(values: FormValues) {
    console.log('Form submission handler called with values:', values);

    // Basic validation for required fields
    if (!values.title || !values.subjectId) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in all required fields.',
        variant: 'error',
      });
      return;
    }

    if (action === 'create') {
      // Create a simple payload with only the necessary fields
      const payload = {
        title: values.title,
        description: values.description,
        subjectId: values.subjectId,
        classId,
        category: values.category,
        maxScore: values.maxScore,
        passingScore: values.passingScore,
        weightage: values.weightage,
        gradingType: values.gradingType,
        questions: values.questions,
        dueDate: values.dueDate,
        instructions: values.instructions,
        topicId: values.topicId
      };

      // Disable the form while submitting
      form.formState.isSubmitting = true;

      // Submit the assessment
      createAssessment.mutate(payload, {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Assessment created successfully.',
            variant: 'success',
          });
          router.push(`/admin/campus/classes/${classId}/assessments`);
        },
        onError: (error) => {
          console.error('Error creating assessment:', error);
          toast({
            title: 'Error',
            description: error.message || 'Failed to create assessment.',
            variant: 'error',
          });
          form.formState.isSubmitting = false;
        }
      });
    } else if (action === 'edit' && assessment) {
      updateAssessment.mutate({
        id: assessment.id,
        ...values,
      });
    }
  }

  // Add a question to the form
  function addQuestion() {
    const currentQuestions = form.getValues('questions') || [];
    form.setValue('questions', [
      ...currentQuestions,
      {
        text: '',
        type: 'MULTIPLE_CHOICE',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
        maxScore: 10,
      },
    ]);
  }

  // Remove a question from the form
  function removeQuestion(index: number) {
    const currentQuestions = form.getValues('questions') || [];
    form.setValue(
      'questions',
      currentQuestions.filter((_, i) => i !== index)
    );
  }

  // Add an option to a multiple choice question
  function addOption(questionIndex: number) {
    const currentQuestions = form.getValues('questions') || [];
    const currentOptions = currentQuestions[questionIndex]?.options || [];

    const updatedQuestions = [...currentQuestions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: [...currentOptions, { text: '', isCorrect: false }],
    };

    form.setValue('questions', updatedQuestions);
  }

  // Remove an option from a multiple choice question
  function removeOption(questionIndex: number, optionIndex: number) {
    const currentQuestions = form.getValues('questions') || [];
    const currentOptions = currentQuestions[questionIndex]?.options || [];

    if (currentOptions.length <= 2) {
      toast({
        title: 'Error',
        description: 'Multiple choice questions must have at least 2 options.',
        variant: 'error',
      });
      return;
    }

    const updatedQuestions = [...currentQuestions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: currentOptions.filter((_, i) => i !== optionIndex),
    };

    form.setValue('questions', updatedQuestions);
  }

  // Get available topics for selected subject
  const getTopicsForSubject = () => {
    const selectedSubjectObj = subjects.find(s => s.id === selectedSubject);
    return selectedSubjectObj?.topics || [];
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          console.log('Form submit event triggered');
          form.handleSubmit((values) => {
            console.log('Form handleSubmit callback triggered with values:', values);
            onSubmit(values);
          })(e);
        }}
        className="space-y-6 max-h-full overflow-visible"
      >
        {/* Basic Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter assessment title" {...field} />
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
                <FormLabel>Category*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a short description of this assessment"
                  className="min-h-20"
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
            name="subjectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject*</FormLabel>
                <Select
                  onValueChange={(value: string) => {
                    field.onChange(value);
                    setSelectedSubject(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.isArray(subjects) && subjects.length > 0 ? (
                      subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.code ? `${subject.code} - ${subject.name}` : subject.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-subjects" disabled>
                        No subjects available
                      </SelectItem>
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
                  disabled={!selectedSubject || getTopicsForSubject().length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedSubject
                          ? "Select a subject first"
                          : getTopicsForSubject().length === 0
                            ? "No topics available"
                            : "Select topic"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getTopicsForSubject().length > 0 ? (
                      getTopicsForSubject().map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-topics" disabled>
                        No topics available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter instructions for students"
                  className="min-h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Grading & Scoring */}
        <Card>
          <CardHeader>
            <CardTitle>Grading & Scoring</CardTitle>
            <CardDescription>Define how this assessment will be graded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Score*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                    <FormLabel>Passing Score*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                    <FormLabel>Weightage (%)*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Percentage weight in final grade
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="gradingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grading Type*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grading type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(GradingType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Removed gradingScale field as it's not needed */}
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
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
                        // initialFocus removed as it's deprecated
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When this assessment is due
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publish</FormLabel>
                    <FormDescription>
                      Make this assessment visible to students
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

            <FormField
              control={form.control}
              name="allowLateSubmissions"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Allow Late Submissions</FormLabel>
                    <FormDescription>
                      Allow students to submit after the due date
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
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>Add questions to your assessment</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {form.watch('questions')?.map((_, questionIndex) => (
                <Card key={questionIndex} className="relative">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => removeQuestion(questionIndex)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>

                  <CardHeader>
                    <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`questions.${questionIndex}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text*</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter your question" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`questions.${questionIndex}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Type*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select question type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                                <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                                <SelectItem value="ESSAY">Essay</SelectItem>
                                <SelectItem value="FILE_UPLOAD">File Upload</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`questions.${questionIndex}.maxScore`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Points*</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="10"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Multiple choice options */}
                    {form.watch(`questions.${questionIndex}.type`) === 'MULTIPLE_CHOICE' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <FormLabel>Answer Options*</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(questionIndex)}
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Add Option
                          </Button>
                        </div>

                        {form.watch(`questions.${questionIndex}.options`)?.map((_, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="flex items-center gap-2"
                          >
                            <FormField
                              control={form.control}
                              name={`questions.${questionIndex}.options.${optionIndex}.isCorrect`}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`questions.${questionIndex}.options.${optionIndex}.text`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder={`Option ${optionIndex + 1}`} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(questionIndex, optionIndex)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {(!form.watch('questions') || form.watch('questions')?.length === 0) && (
                <div className="text-center p-6 border rounded-lg border-dashed">
                  <p className="text-muted-foreground mb-2">No questions added yet</p>
                  <Button type="button" variant="secondary" onClick={addQuestion}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add First Question
                  </Button>
                </div>
              )}

              {/* Add Question button at the bottom */}
              {form.watch('questions')?.length > 0 && (
                <div className="flex justify-center mt-6">
                  <Button type="button" variant="secondary" onClick={addQuestion}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Another Question
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/campus/classes/${classId}/assessments`)}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={createAssessment.isLoading || updateAssessment.isLoading}
            onClick={() => {
              console.log('Submit button clicked');
              console.log('Form state:', form.formState);
              console.log('Form values:', form.getValues());
              console.log('Form errors:', form.formState.errors);
              console.log('Is form valid?', form.formState.isValid);
            }}
          >
            {createAssessment.isLoading || updateAssessment.isLoading
              ? 'Saving...'
              : action === 'create'
              ? 'Create Assessment'
              : 'Update Assessment'
            }
          </Button>

          {/* Debug button for development */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                console.log('Debug button clicked');
                console.log('Form values:', form.getValues());
                console.log('Form errors:', form.formState.errors);
              }}
            >
              Debug
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
