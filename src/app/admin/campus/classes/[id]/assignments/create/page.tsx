'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { Checkbox } from '@/components/ui/forms/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Calendar as CalendarIcon, Save } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { format } from 'date-fns';
import { api } from '@/trpc/react';
import { parseTRPCError } from "@/utils/trpc-error-handler";
import { TRPCClientError, TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@/server/api/root";

// Subject interface
interface SubjectData {
  id: string;
  name: string;
  code: string;
}

// Form schema for assignment creation
const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  instructions: z.string().optional(),
  type: z.enum(['QUIZ', 'ASSIGNMENT', 'PROJECT', 'HOMEWORK', 'OTHER', 'PRACTICE']),
  dueDate: z.date().optional().nullable(),
  maxScore: z.coerce.number().min(0).optional().nullable(),
  weight: z.coerce.number().min(0).max(100).optional().nullable(),
  allowLateSubmission: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  fileAttachments: z.array(z.string()).optional(),
  subjectId: z.string().min(1, { message: 'Subject is required' }),
});

type FormValues = z.infer<typeof formSchema>;

const assignmentTypes = [
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'HOMEWORK', label: 'Homework' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PRACTICE', label: 'Practice' },
];

export default function CreateAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  
  // Fetch class data using TRPC
  const { data: classData, error: classError } = api.class.getById.useQuery(
    { classId },
    {
      retry: 1,
      onError: (error: TRPCClientErrorLike<AppRouter>) => {
        const errorMessage = parseTRPCError(
          error,
          "Failed to load class data"
        );
        toast({
          title: "Error",
          description: errorMessage,
          variant: "error",
        });
      }
    }
  );

  // Fetch subjects for the course
  const { data: subjectsData, isLoading: isSubjectsLoading } = api.subject.list.useQuery(
    {
      courseId: classData?.courseCampus?.courseId || '',
      take: 100
    },
    {
      enabled: !!classData?.courseCampus?.courseId,
      onSuccess: (data) => {
        if (data?.items && data.items.length > 0) {
          setSubjects(data.items);
          
          // Set default subject if there's only one
          if (data.items.length === 1) {
            form.setValue('subjectId', data.items[0].id);
          }
        }
      },
      onError: (error: TRPCClientErrorLike<AppRouter>) => {
        toast({
          title: 'Error',
          description: 'Failed to load subjects',
          variant: 'error',
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching subjects:', error);
        }
      }
    }
  );
  
  // Set loading state based on both queries
  useEffect(() => {
    if (!isSubjectsLoading && classData) {
      setIsLoading(false);
    }
  }, [isSubjectsLoading, classData]);
  
  // Assignment creation mutation
  const createAssignmentMutation = api.assignment.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Assignment created successfully',
        variant: 'success',
      });
      router.push(`/admin/campus/classes/${classId}/assignments`);
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      const errorMessage = parseTRPCError(
        error,
        "Failed to create assignment"
      );
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
      
      // Log detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Assignment creation error:', error);
      }
    }
  });
  
  // Form initialization with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      type: 'ASSIGNMENT',
      dueDate: null,
      maxScore: 100,
      weight: 10,
      allowLateSubmission: false,
      isPublished: true,
      fileAttachments: [],
      subjectId: '',
    },
  });
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      await createAssignmentMutation.mutateAsync({
        classId,
        title: data.title,
        content: {
          description: data.description || '',
          allowLateSubmission: data.allowLateSubmission,
          weight: data.weight || 10,
          isPublished: data.isPublished
        },
        instructions: data.instructions || '',
        type: data.type,
        dueDate: data.dueDate || undefined,
        maxScore: data.maxScore || 100,
        subjectId: data.subjectId,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to create assignment";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
      
      // Log detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Assignment creation error:', error);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle loading error state
  if (classError) {
    return (
      <PageLayout
        title="Error"
        description="Failed to load class data"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Error', href: '#' },
        ]}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
              <p className="text-muted-foreground mb-6">
                {parseTRPCError(classError)}
              </p>
              <Button asChild>
                <Link href="/admin/campus/classes">Back to Classes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }
  
  if (isLoading && !classData) {
    return (
      <PageLayout
        title="Loading..."
        description="Loading class details"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Loading...', href: '#' },
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout
      title={`Create Assignment: ${classData?.name || ''}`}
      description="Create a new assignment for this class"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Assignments', href: `/admin/campus/classes/${classId}/assignments` },
        { label: 'Create', href: '#' },
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href={`/admin/campus/classes/${classId}/assignments`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
        </CardHeader>
        <CardContent>
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
                        <Input {...field} placeholder="Assignment Title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assignmentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Brief description of the assignment"
                        className="min-h-[100px]"
                      />
                    </FormControl>
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
                        {...field}
                        placeholder="Detailed instructions for students"
                        className="min-h-[150px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span className="text-muted-foreground">Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={(date) => {
                              field.onChange(date);
                              setIsDatePickerOpen(false);
                            }}
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
                  name="maxScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Score</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value?.toString() || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val ? Number(val) : null);
                          }}
                          placeholder="100"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value?.toString() || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val ? Number(val) : null);
                          }}
                          placeholder="10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex flex-col space-y-4">
                <FormField
                  control={form.control}
                  name="allowLateSubmission"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow Late Submission</FormLabel>
                        <FormDescription>
                          Students can submit after the due date
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Publish Assignment</FormLabel>
                        <FormDescription>
                          Make this assignment visible to students
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Assignment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageLayout>
  );
} 
