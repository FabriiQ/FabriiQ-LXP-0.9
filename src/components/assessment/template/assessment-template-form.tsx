import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select';
import { Textarea } from '@/components/ui/forms/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/data-display/card';
import { useToast } from '@/components/ui/feedback/toast';
import { RubricBuilder } from './rubric-builder';
import { Save, X } from 'lucide-react';
import { api } from '@/trpc/react';
import { SystemStatus } from '@/server/api/constants';

// Define the enums locally to match the API
const AssessmentCategory = {
  QUIZ: 'QUIZ',
  ASSIGNMENT: 'ASSIGNMENT',
  PROJECT: 'PROJECT',
  EXAM: 'EXAM',
  PRACTICAL: 'PRACTICAL',
  CLASS_ACTIVITY: 'CLASS_ACTIVITY',
} as const;

const GradingType = {
  AUTOMATIC: 'AUTOMATIC',
  MANUAL: 'MANUAL',
  HYBRID: 'HYBRID',
  POINTS: 'POINTS', // Add POINTS if it's used in the code
} as const;

const templateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  category: z.enum([
    AssessmentCategory.QUIZ,
    AssessmentCategory.ASSIGNMENT,
    AssessmentCategory.PROJECT,
    AssessmentCategory.EXAM,
    AssessmentCategory.PRACTICAL,
    AssessmentCategory.CLASS_ACTIVITY,
  ], {
    required_error: 'Category is required',
  }),
  description: z.string().min(1, 'Description is required'),
  maxScore: z.number().min(0, 'Maximum score must be positive'),
  weightage: z.number().min(0, 'Weightage must be positive').max(100, 'Weightage cannot exceed 100'),
  status: z.enum([
    SystemStatus.ACTIVE,
    SystemStatus.INACTIVE,
    SystemStatus.ARCHIVED,
    SystemStatus.DELETED,
    SystemStatus.ARCHIVED_CURRENT_YEAR,
    SystemStatus.ARCHIVED_PREVIOUS_YEAR,
    SystemStatus.ARCHIVED_HISTORICAL,
  ], {
    required_error: 'Status is required',
  }),
  subjectId: z.string().min(1, 'Subject is required'),
  gradingType: z.enum([
    GradingType.AUTOMATIC,
    GradingType.MANUAL,
    GradingType.HYBRID,
    GradingType.POINTS,
  ], {
    required_error: 'Grading type is required',
  }),
  rubric: z.array(z.object({
    criteria: z.string().min(1, 'Criteria is required'),
    weight: z.number().min(0).max(100),
    levels: z.array(z.object({
      score: z.number().min(0),
      description: z.string().min(1, 'Level description is required')
    }))
  }))
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface AssessmentTemplateFormProps {
  templateId?: string;
  onSubmit?: (data: TemplateFormData) => Promise<void>;
  isLoading?: boolean;
}

export function AssessmentTemplateForm({ 
  templateId,
  onSubmit: externalSubmit,
  isLoading = false
}: AssessmentTemplateFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  
  // Fetch subjects for dropdown
  const { data: subjects } = api.subject.list.useQuery({
    status: SystemStatus.ACTIVE,
  });

  // Fetch template data if editing
  const { data: template, isLoading: isLoadingTemplate } = api.assessment.getById.useQuery(
    { id: templateId as string },
    { enabled: !!templateId }
  );

  // Create mutation
  const createMutation = api.assessment.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Assessment template created successfully',
        variant: 'success',
      });
      router.push('/admin/system/assessments');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create template',
        variant: 'error',
      });
    },
  });

  // Update mutation
  const updateMutation = api.assessment.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Assessment template updated successfully',
        variant: 'success',
      });
      router.push('/admin/system/assessments');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update template',
        variant: 'error',
      });
    },
  });

  // Default values for the form
  const defaultValues = {
    title: '',
    category: AssessmentCategory.ASSIGNMENT,
    description: '',
    maxScore: 100,
    weightage: 10,
    status: SystemStatus.ACTIVE,
    subjectId: '',
    gradingType: GradingType.POINTS,
    rubric: []
  };

  // If we have template data, use it for the form
  const formValues = template ? {
    title: template.title || '',
    category: template.category || AssessmentCategory.ASSIGNMENT,
    description: template.description || '',
    maxScore: template.maxScore || 100,
    weightage: template.weightage || 10,
    status: template.status || SystemStatus.ACTIVE,
    subjectId: template.subjectId || '',
    gradingType: template.gradingType || GradingType.POINTS,
    rubric: Array.isArray(template.rubric) ? template.rubric : []
  } : defaultValues;

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: formValues,
  });

  const onSubmit = async (data: TemplateFormData) => {
    if (externalSubmit) {
      await externalSubmit(data);
    } else if (templateId) {
      updateMutation.mutate({
        id: templateId,
        data: {
          title: data.title,
          category: data.category,
          description: data.description,
          maxScore: data.maxScore,
          weightage: data.weightage,
          status: data.status,
          gradingType: data.gradingType,
          rubric: data.rubric as unknown as Record<string, unknown>
        }
      });
    } else {
      createMutation.mutate({
        title: data.title,
        category: data.category,
        description: data.description,
        maxScore: data.maxScore,
        weightage: data.weightage,
        status: data.status,
        subjectId: data.subjectId,
        gradingType: data.gradingType,
        rubric: data.rubric as unknown as Record<string, unknown>
      });
    }
  };

  if (templateId && isLoadingTemplate) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter template title" {...field} />
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
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(AssessmentCategory).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0) + category.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                      min={0} 
                      placeholder="Enter maximum score"
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
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
                      min={0} 
                      max={100}
                      placeholder="Enter weightage"
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter template description"
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(SystemStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.items?.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grading type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(GradingType).map((gradingType) => (
                          <SelectItem key={gradingType} value={gradingType}>
                            {gradingType.charAt(0) + gradingType.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Rubric</h3>
          <FormField
            control={form.control}
            name="rubric"
            render={({ field }) => (
              <RubricBuilder
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Card>

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/admin/system/assessments')}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || createMutation.isLoading || updateMutation.isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            {templateId ? 'Update' : 'Create'} Template
          </Button>
        </div>
      </form>
    </Form>
  );
} 