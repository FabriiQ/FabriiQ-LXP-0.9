'use client';

import { format } from 'date-fns';
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
  CardTitle,
} from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Simple form schema with basic validation
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.nativeEnum(AssessmentCategory).default(AssessmentCategory.QUIZ),
  instructions: z.string().optional(),
  maxScore: z.coerce.number().min(1, 'Maximum score must be at least 1').default(100),
  passingScore: z.coerce.number().min(0, 'Passing score must be at least 0').default(50),
  weightage: z.coerce.number().min(0, 'Weightage must be at least 0').max(100, 'Weightage cannot exceed 100').default(0),
  dueDate: z.date().optional(),
  gradingType: z.nativeEnum(GradingType).default(GradingType.MANUAL),
  isPublished: z.boolean().default(false),
  allowLateSubmissions: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface AssessmentFormProps {
  classId: string;
  className?: string; // Class name for display purposes
  teacherId?: string;
  redirectPath: string;
}

export function AssessmentForm({ classId, className: _className, teacherId, redirectPath }: AssessmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Default form values
  const defaultValues: Partial<FormValues> = {
    title: '',
    description: '',
    category: AssessmentCategory.QUIZ,
    maxScore: 100,
    passingScore: 50,
    weightage: 0,
    gradingType: GradingType.MANUAL,
    isPublished: false,
    allowLateSubmissions: false,
  };

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // API mutations
  const createAssessment = api.assessment.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Assessment created successfully.',
        variant: 'success',
      });
      router.push(redirectPath);
    },
    onError: (error) => {
      console.error('Error creating assessment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create assessment.',
        variant: 'error',
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    console.log('Form submitted with values:', values);

    // Create payload for API
    const payload = {
      ...values,
      classId,
      createdById: teacherId,
    };

    console.log('Submitting payload:', payload);

    // Disable the form while submitting
    form.formState.isSubmitting = true;

    // Submit the assessment
    createAssessment.mutate(payload);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Basic Details */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
            <CardDescription>Enter the basic information for this assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter assessment description"
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
                      <SelectItem value={AssessmentCategory.QUIZ}>Quiz</SelectItem>
                      <SelectItem value={AssessmentCategory.ASSIGNMENT}>Assignment</SelectItem>
                      <SelectItem value={AssessmentCategory.PROJECT}>Project</SelectItem>
                      <SelectItem value={AssessmentCategory.EXAM}>Exam</SelectItem>
                      <SelectItem value={AssessmentCategory.PRACTICAL}>Practical</SelectItem>
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
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

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
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                        <SelectItem value={GradingType.MANUAL}>Manual</SelectItem>
                        <SelectItem value={GradingType.AUTOMATIC}>Automatic</SelectItem>
                        <SelectItem value={GradingType.HYBRID}>Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                            className={`w-full pl-3 text-left font-normal ${!field.value ? 'text-muted-foreground' : ''}`}
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
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(redirectPath)}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={createAssessment.isLoading}
          >
            {createAssessment.isLoading ? 'Creating...' : 'Create Assessment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
