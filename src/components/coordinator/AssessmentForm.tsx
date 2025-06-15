'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AssessmentCategory, GradingType } from '@/server/api/constants';

// Define the form schema
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  classId: z.string().min(1, 'Class is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  topicId: z.string().optional(),
  category: z.nativeEnum(AssessmentCategory),
  instructions: z.string().optional(),
  maxScore: z.coerce.number().min(0, 'Max score must be positive').default(100),
  passingScore: z.coerce.number().min(0, 'Passing score must be positive').default(60),
  weightage: z.coerce.number().min(0, 'Weightage must be positive').max(100, 'Weightage cannot exceed 100').default(0),
  dueDate: z.date().optional(),
  gradingType: z.nativeEnum(GradingType).default(GradingType.MANUAL),
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

interface AssessmentFormProps {
  classes: {
    id: string;
    name: string;
    code: string;
  }[];
  subjects: {
    id: string;
    name: string;
    code: string;
  }[];
  onSuccess?: () => void;
  onClassChange?: (classId: string) => void;
  initialData?: Partial<FormValues> & { id?: string };
  isEditing?: boolean;
}

export function AssessmentForm({
  classes,
  subjects,
  onSuccess,
  onClassChange,
  initialData,
  isEditing = false,
}: AssessmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialData?.subjectId || '');

  // Debug subjects
  console.log('AssessmentForm received subjects:', subjects);

  // Initialize form with default values or initial data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      classId: initialData?.classId || '',
      subjectId: initialData?.subjectId || '',
      topicId: initialData?.topicId || '',
      category: initialData?.category || AssessmentCategory.ASSIGNMENT,
      instructions: initialData?.instructions || '',
      maxScore: initialData?.maxScore || 100,
      passingScore: initialData?.passingScore || 60,
      weightage: initialData?.weightage || 0,
      dueDate: initialData?.dueDate,
      gradingType: initialData?.gradingType || GradingType.MANUAL,
      allowLateSubmissions: initialData?.allowLateSubmissions || false,
      questions: initialData?.questions || [],
    },
  });

  // Fetch topics for selected subject
  const { data: topics } = api.subjectTopic.list.useQuery(
    { subjectId: selectedSubjectId },
    { enabled: !!selectedSubjectId }
  );

  // Create assessment mutation
  const createAssessment = api.assessment.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Assessment created successfully',
        variant: 'success',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/coordinator/assessments');
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create assessment',
        variant: 'error',
      });
    },
  });

  // Update assessment mutation
  const updateAssessment = api.assessment.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Assessment updated successfully',
        variant: 'success',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/coordinator/assessments');
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update assessment',
        variant: 'error',
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (isEditing && initialData?.id) {
      updateAssessment.mutate({
        id: initialData.id,
        ...values,
      });
    } else {
      createAssessment.mutate(values);
    }
  };

  // Handle subject change to update topics
  const handleSubjectChange = (value: string) => {
    setSelectedSubjectId(value);
    form.setValue('subjectId', value);
    form.setValue('topicId', ''); // Reset topic when subject changes
  };

  // Add a new question
  const addQuestion = () => {
    const currentQuestions = form.getValues('questions') || [];
    form.setValue('questions', [
      ...currentQuestions,
      {
        text: '',
        type: 'MULTIPLE_CHOICE',
        options: [{ text: '', isCorrect: false }],
        maxScore: 10,
      },
    ]);
  };

  // Remove a question
  const removeQuestion = (index: number) => {
    const currentQuestions = form.getValues('questions') || [];
    form.setValue(
      'questions',
      currentQuestions.filter((_, i) => i !== index)
    );
  };

  // Add an option to a multiple choice question
  const addOption = (questionIndex: number) => {
    const currentQuestions = form.getValues('questions') || [];
    const currentOptions = currentQuestions[questionIndex]?.options || [];

    const updatedQuestions = [...currentQuestions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: [...currentOptions, { text: '', isCorrect: false }],
    };

    form.setValue('questions', updatedQuestions);
  };

  // Remove an option from a multiple choice question
  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentQuestions = form.getValues('questions') || [];
    const currentOptions = currentQuestions[questionIndex]?.options || [];

    const updatedQuestions = [...currentQuestions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: currentOptions.filter((_, i) => i !== optionIndex),
    };

    form.setValue('questions', updatedQuestions);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
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
                      placeholder="Enter assessment description"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        console.log('Class changed to:', value);
                        field.onChange(value);
                        // Reset subject when class changes
                        form.setValue('subjectId', '');
                        setSelectedSubjectId('');
                        // Notify parent component about class change
                        if (onClassChange) {
                          onClassChange(value);
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} ({cls.code})
                          </SelectItem>
                        ))}
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
                      onValueChange={(value) => {
                        console.log('Subject changed to:', value);
                        field.onChange(value);
                        handleSubjectChange(value);
                      }}
                      defaultValue={field.value}
                      disabled={!form.getValues('classId')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(subjects) && subjects.length > 0 ? (
                          subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name} ({subject.code})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No subjects available for this class
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedSubjectId && topics?.data && topics.data.length > 0 && (
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
                          <SelectValue placeholder="Select a topic (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {topics.data.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
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
                      <SelectItem value={AssessmentCategory.QUIZ}>Quiz</SelectItem>
                      <SelectItem value={AssessmentCategory.ASSIGNMENT}>Assignment</SelectItem>
                      <SelectItem value={AssessmentCategory.PROJECT}>Project</SelectItem>
                      <SelectItem value={AssessmentCategory.EXAM}>Exam</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter instructions for students"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Score</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Contribution to final grade
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
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
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
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
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grading type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={GradingType.MANUAL}>Manual</SelectItem>
                        <SelectItem value={GradingType.AUTOMATIC}>Automatic</SelectItem>
                        <SelectItem value={GradingType.HYBRID}>Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="allowLateSubmissions"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Allow Late Submissions</FormLabel>
                    <FormDescription>
                      Students can submit after the due date
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Questions</CardTitle>
            <Button type="button" onClick={addQuestion} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {form.watch('questions')?.map((question, questionIndex) => (
              <div key={questionIndex} className="border rounded-md p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">Question {questionIndex + 1}</h3>
                  <Button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name={`questions.${questionIndex}.text`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter question text"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`questions.${questionIndex}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Type</FormLabel>
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
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch(`questions.${questionIndex}.type`) === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel>Options</FormLabel>
                      <Button
                        type="button"
                        onClick={() => addOption(questionIndex)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>

                    {form.watch(`questions.${questionIndex}.options`)?.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-start space-x-2">
                        <FormField
                          control={form.control}
                          name={`questions.${questionIndex}.options.${optionIndex}.isCorrect`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
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
                                <Input
                                  placeholder="Enter option text"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="button"
                          onClick={() => removeOption(questionIndex, optionIndex)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {form.watch('questions')?.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No questions added yet. Click "Add Question" to create questions.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/coordinator/assessments')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createAssessment.isLoading || updateAssessment.isLoading}>
            {isEditing ? 'Update Assessment' : 'Create Assessment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
