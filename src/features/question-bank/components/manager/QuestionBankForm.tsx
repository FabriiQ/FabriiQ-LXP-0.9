'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { QuestionBank } from '../../models/types';

// Form schema creator function to handle conditional validation
const createFormSchema = (isCampusManager: boolean) => z.object({
  name: z.string().min(3, {
    message: 'Name must be at least 3 characters.',
  }).max(100, {
    message: 'Name must be at most 100 characters.',
  }),
  description: z.string().max(500, {
    message: 'Description must be at most 500 characters.',
  }).optional(),
  institutionId: isCampusManager
    ? z.string().optional()
    : z.string().min(1, { message: 'Institution is required.' }),
  courseId: z.string().optional(),
  subjectId: z.string().optional(),
});

interface QuestionBankFormProps {
  questionBank?: QuestionBank;
  onSuccess?: (questionBank: QuestionBank) => void;
  onCancel?: () => void;
  className?: string;
  isCampusManager?: boolean;
}

/**
 * Question Bank Form Component
 *
 * This component provides a form for creating and editing question banks.
 */
export const QuestionBankForm: React.FC<QuestionBankFormProps> = ({
  questionBank,
  onSuccess,
  onCancel,
  className = '',
  isCampusManager = false,
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!questionBank;

  // Get current user's institution
  const { data: userInstitution } = api.user.getCurrentUserInstitution.useQuery();

  // Get user's primary campus
  const { data: userData } = api.user.getCurrentUser.useQuery();
  const primaryCampusId = userData?.primaryCampusId;

  // Get courses for the campus
  const { data: courses, isLoading: isLoadingCourses } = api.course.getByCampus.useQuery({
    campusId: primaryCampusId || '',
    status: 'ACTIVE'
  }, {
    enabled: !!primaryCampusId && isCampusManager
  });

  // Get subjects based on selected course
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const { data: subjects, isLoading: isLoadingSubjects } = api.subject.list.useQuery({
    courseId: selectedCourseId,
    status: 'ACTIVE'
  }, {
    enabled: !!selectedCourseId && isCampusManager
  });

  // Create question bank mutation
  const createQuestionBankMutation = api.questionBank.createQuestionBank.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Question bank created successfully.',
      });
      if (onSuccess) {
        onSuccess(data);
      } else {
        router.push(`/admin/academic/question-bank/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create question bank: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update question bank mutation
  const updateQuestionBankMutation = api.questionBank.updateQuestionBank.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Question bank updated successfully.',
      });
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update question bank: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Create the form schema based on context
  const formSchema = createFormSchema(isCampusManager);

  // Set up form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: questionBank?.name || '',
      description: questionBank?.description || '',
      institutionId: questionBank?.institutionId || userInstitution?.id || '',
      courseId: questionBank?.courseId || '',
      subjectId: questionBank?.subjectId || '',
    },
  });

  // Update selectedCourseId when form value changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'courseId' && value.courseId) {
        setSelectedCourseId(value.courseId as string);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isEditing) {
      updateQuestionBankMutation.mutate({
        id: questionBank.id,
        name: values.name,
        description: values.description || undefined,
      });
    } else {
      // If in campus manager context and institutionId is not provided,
      // use the user's institution ID
      const institutionId = isCampusManager
        ? (userInstitution?.id || values.institutionId)
        : values.institutionId;

      createQuestionBankMutation.mutate({
        name: values.name,
        description: values.description || undefined,
        institutionId: institutionId!,
        courseId: values.courseId,
        subjectId: values.subjectId,
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Question Bank' : 'Create Question Bank'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update the details of your question bank'
            : 'Create a new question bank to organize your questions'}
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter question bank name"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for your question bank.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a description (optional)"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of the question bank's purpose or contents.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Institution Field (hidden for editing or campus manager) */}
            {!isEditing && !isCampusManager && (
              <FormField
                control={form.control}
                name="institutionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution</FormLabel>
                    <FormControl>
                      <Input
                        type="hidden"
                        {...field}
                        value={userInstitution?.id || ''}
                      />
                    </FormControl>
                    <div className="p-2 border rounded-md bg-muted">
                      {userInstitution?.name || 'Loading institution...'}
                    </div>
                    <FormDescription>
                      The institution this question bank belongs to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Hidden Institution Field for campus manager */}
            {!isEditing && isCampusManager && (
              <Input
                type="hidden"
                name="institutionId"
                value={userInstitution?.id || ''}
              />
            )}

            {/* Course Selection Field (only for campus manager) */}
            {!isEditing && isCampusManager && (
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingCourses ? (
                            <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                          ) : courses && courses.length > 0 ? (
                            courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.name} ({course.code})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No courses available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Select the course this question bank is associated with.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Subject Selection Field (only for campus manager and when course is selected) */}
            {!isEditing && isCampusManager && selectedCourseId && (
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingSubjects ? (
                            <SelectItem value="loading" disabled>Loading subjects...</SelectItem>
                          ) : subjects && subjects.length > 0 ? (
                            subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name} ({subject.code})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No subjects available for this course</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Select the subject this question bank is associated with.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={
                createQuestionBankMutation.isLoading ||
                updateQuestionBankMutation.isLoading
              }
            >
              {isEditing ? 'Update' : 'Create'} Question Bank
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default QuestionBankForm;
