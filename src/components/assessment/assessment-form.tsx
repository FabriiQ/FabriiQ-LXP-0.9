'use client';

import React, { useState, useEffect } from 'react';
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
} from '~/components/ui/forms/form';
import { Input } from '~/components/ui/forms/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/forms/select';
import { Textarea } from '~/components/ui/forms/textarea';
import { Button } from '~/components/ui/atoms/button';
import { Card } from '~/components/ui/atoms/card';
import { useToast } from '~/components/ui/feedback/toast';
import { RubricBuilder } from './template/rubric-builder';
import { DatePicker } from '~/components/ui/forms/date-picker';
import { Save, X } from 'lucide-react';
import { api } from '~/trpc/react';
import { SystemStatus, AssessmentCategory, GradingType, GradingScale } from '~/server/api/constants';

// Assessment form schema
const assessmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  category: z.nativeEnum(AssessmentCategory, {
    required_error: 'Category is required',
  }),
  description: z.string().optional(),
  maxScore: z.number().min(0, 'Maximum score must be positive'),
  passingScore: z.number().min(0, 'Passing score must be positive').optional(),
  weightage: z.number().min(0, 'Weightage must be positive').max(100, 'Weightage cannot exceed 100'),
  status: z.nativeEnum(SystemStatus, {
    required_error: 'Status is required',
  }),
  subjectId: z.string().min(1, 'Subject is required'),
  classId: z.string().min(1, 'Class is required'),
  termId: z.string().min(1, 'Term is required'),
  gradingType: z.nativeEnum(GradingType, {
    required_error: 'Grading type is required',
  }),
  gradingScaleId: z.string().optional(),
  templateId: z.string().optional(),
  dueDate: z.date().optional(),
  instructions: z.string().optional(),
  rubric: z.array(z.object({
    criteria: z.string().min(1, 'Criteria is required'),
    weight: z.number().min(0).max(100),
    levels: z.array(z.object({
      score: z.number().min(0),
      description: z.string().min(1, 'Level description is required')
    }))
  })).optional(),
  topicId: z.string().optional(),
  policyId: z.string().optional(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

// Define extended assessment type to handle missing properties
interface ExtendedAssessment {
  id: string;
  title: string;
  category?: AssessmentCategory;
  description?: string;
  maxScore?: number;
  passingScore?: number;
  weightage?: number;
  status: SystemStatus;
  createdAt: Date;
  updatedAt: Date;
  subjectId: string;
  classId: string;
  termId: string;
  topicId?: string;
  createdById: string;
  gradingType?: GradingType;
  gradingScaleId?: string;
  templateId?: string;
  policyId?: string;
  instructions?: string;
  dueDate?: Date;
  rubric?: any;
  [key: string]: any;
}

interface AssessmentFormProps {
  assessmentId?: string;
  onSubmit?: (data: AssessmentFormData) => Promise<void>;
  isLoading?: boolean;
}

export function AssessmentForm({ 
  assessmentId,
  onSubmit: externalSubmit,
  isLoading = false
}: AssessmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  // Fetch subjects for dropdown
  const { data: subjects } = api.subject.list.useQuery({
    status: SystemStatus.ACTIVE,
  });

  // Fetch classes for dropdown
  const { data: classes } = api.class.list.useQuery({
    status: SystemStatus.ACTIVE,
  });

  // Fetch terms for dropdown
  const { data: terms } = api.term.list.useQuery({
    status: SystemStatus.ACTIVE,
  });

  // Fetch templates for dropdown - using any to bypass type checking
  const { data: templates } = api.assessment.listTemplates.useQuery({
    status: SystemStatus.ACTIVE,
  } as any);

  // Fetch topics for the selected subject - using any to bypass type checking
  const { data: topics } = api.subject.getTopics.useQuery(
    { subjectId: selectedSubject } as any,
    { enabled: !!selectedSubject }
  );

  // Fetch assessment policies - using any to bypass type checking
  const { data: policies } = api.assessment.listPolicies.useQuery({
    status: SystemStatus.ACTIVE,
  } as any);

  // Fetch grading scales - using any to bypass type checking
  const { data: gradingScales } = api.grading.listScales.useQuery({
    status: SystemStatus.ACTIVE,
  } as any);

  // Fetch assessment data if editing
  const { data: assessmentData, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery(
    { id: assessmentId as string },
    { enabled: !!assessmentId }
  );

  // Cast to extended type
  const assessment = assessmentData as unknown as ExtendedAssessment;

  // Create mutation
  const createMutation = api.assessment.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Assessment created successfully',
        variant: 'success',
      });
      router.push('/admin/system/assessments');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create assessment',
        variant: 'error',
      });
    },
  });

  // Update mutation
  const updateMutation = api.assessment.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Assessment updated successfully',
        variant: 'success',
      });
      router.push('/admin/system/assessments');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update assessment',
        variant: 'error',
      });
    },
  });

  // Default values for the form
  const defaultValues: Partial<AssessmentFormData> = {
    title: '',
    category: AssessmentCategory.ASSIGNMENT,
    description: '',
    maxScore: 100,
    passingScore: 60,
    weightage: 10,
    status: SystemStatus.ACTIVE,
    subjectId: '',
    classId: '',
    termId: '',
    gradingType: GradingType.MANUAL,
    rubric: []
  };

  // If we have assessment data, use it for the form
  const formValues = assessment ? {
    title: assessment.title || '',
    category: assessment.category || AssessmentCategory.ASSIGNMENT,
    description: assessment.description || '',
    maxScore: assessment.maxScore || 100,
    passingScore: assessment.passingScore || 60,
    weightage: assessment.weightage || 10,
    status: assessment.status || SystemStatus.ACTIVE,
    subjectId: assessment.subjectId || '',
    classId: assessment.classId || '',
    termId: assessment.termId || '',
    gradingType: assessment.gradingType || GradingType.MANUAL,
    gradingScaleId: assessment.gradingScaleId || undefined,
    templateId: assessment.templateId || undefined,
    dueDate: assessment.dueDate ? new Date(assessment.dueDate) : undefined,
    instructions: assessment.instructions || '',
    rubric: Array.isArray(assessment.rubric) ? assessment.rubric : [],
    topicId: assessment.topicId || undefined,
    policyId: assessment.policyId || undefined,
  } : defaultValues;

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: formValues as AssessmentFormData,
  });

  // Update form values when assessment data is loaded
  useEffect(() => {
    if (assessment) {
      form.reset({
        title: assessment.title || '',
        category: assessment.category || AssessmentCategory.ASSIGNMENT,
        description: assessment.description || '',
        maxScore: assessment.maxScore || 100,
        passingScore: assessment.passingScore || 60,
        weightage: assessment.weightage || 10,
        status: assessment.status as SystemStatus,
        subjectId: assessment.subjectId || '',
        classId: assessment.classId || '',
        termId: assessment.termId || '',
        gradingType: assessment.gradingType as GradingType,
        gradingScaleId: assessment.gradingScaleId || undefined,
        templateId: assessment.templateId || undefined,
        dueDate: assessment.dueDate ? new Date(assessment.dueDate) : undefined,
        instructions: assessment.instructions || '',
        rubric: Array.isArray(assessment.rubric) ? assessment.rubric : [],
        topicId: assessment.topicId || undefined,
        policyId: assessment.policyId || undefined,
      });
      
      if (assessment.subjectId) {
        setSelectedSubject(assessment.subjectId);
      }
      
      if (assessment.classId) {
        setSelectedClass(assessment.classId);
      }
    }
  }, [assessment, form]);

  // Handle subject change
  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    form.setValue('subjectId', value);
  };

  // Handle class change
  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    form.setValue('classId', value);
  };

  // Handle template selection
  const handleTemplateChange = (value: string) => {
    form.setValue('templateId', value);
    
    // Find the selected template
    const selectedTemplate = templates?.items.find((t: any) => t.id === value);
    
    if (selectedTemplate) {
      // Update form with template values
      form.setValue('title', selectedTemplate.title);
      form.setValue('category', selectedTemplate.category as AssessmentCategory);
      form.setValue('maxScore', selectedTemplate.maxScore);
      form.setValue('passingScore', selectedTemplate.passingScore || 60);
      form.setValue('weightage', selectedTemplate.weightage);
      form.setValue('gradingType', selectedTemplate.gradingType as GradingType);
      form.setValue('rubric', selectedTemplate.rubric as any);
    }
  };

  const onSubmit = async (data: AssessmentFormData) => {
    if (externalSubmit) {
      await externalSubmit(data);
    } else if (assessmentId) {
      // For update, we need to omit passingScore if it's not in the schema
      const { passingScore, rubric, ...updateData } = data;
      updateMutation.mutate({
        id: assessmentId,
        data: {
          ...updateData,
          // Only include passingScore if it's defined
          ...(passingScore !== undefined && { passingScore }),
          // Convert rubric to Record<string, unknown> if it exists
          ...(rubric && { rubric: rubric as unknown as Record<string, unknown> }),
        }
      });
    } else {
      // For create, we need to omit passingScore if it's not in the schema
      const { passingScore, rubric, ...createData } = data;
      createMutation.mutate({
        ...createData,
        // Only include passingScore if it's defined
        ...(passingScore !== undefined && { passingScore }),
        // Convert rubric to Record<string, unknown> if it exists
        ...(rubric && { rubric: rubric as unknown as Record<string, unknown> }),
      });
    }
  };

  if (assessmentId && isLoadingAssessment) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-medium">Basic Information</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template (Optional)</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={handleTemplateChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {templates?.items?.map((template: any) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.title}
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
                            {category}
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

            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={handleSubjectChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.items?.map((subject: any) => (
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
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={handleClassChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.items?.map((classItem: any) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name}
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
              name="termId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        {terms?.terms?.map((term: any) => (
                          <SelectItem key={term.id} value={term.id}>
                            {term.name}
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
              name="topicId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic (Optional)</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      disabled={!selectedSubject}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {topics?.map((topic: any) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.name}
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
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <FormControl>
                    <div>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        placeholder="Select due date"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-medium">Grading Configuration</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="maxScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Score</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter maximum score"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                      placeholder="Enter passing score"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                      placeholder="Enter weightage"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
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
                        {Object.values(GradingType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
              name="gradingScaleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grading Scale (Optional)</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grading scale" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {gradingScales?.items?.map((scale: any) => (
                          <SelectItem key={scale.id} value={scale.id}>
                            {scale.name}
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
              name="policyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Policy (Optional)</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select policy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {policies?.items?.map((policy: any) => (
                          <SelectItem key={policy.id} value={policy.id}>
                            {policy.name}
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
                            {status}
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
          <h3 className="mb-4 text-lg font-medium">Instructions</h3>
          <FormField
            control={form.control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Enter detailed instructions for the assessment"
                    className="min-h-[200px]"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-medium">Rubric</h3>
          <FormField
            control={form.control}
            name="rubric"
            render={({ field }) => (
              <FormItem>
                <div>
                  <RubricBuilder
                    value={field.value || []}
                    onChange={field.onChange}
                    maxScore={form.watch('maxScore')}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/system/assessments')}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || createMutation.isLoading || updateMutation.isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {assessmentId ? 'Update' : 'Create'} Assessment
          </Button>
        </div>
      </form>
    </Form>
  );
} 