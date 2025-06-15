'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { BloomsTaxonomySelector } from '@/features/bloom/components/taxonomy/BloomsTaxonomySelector';
import { BloomsTaxonomyDistribution } from '@/features/bloom/components/taxonomy/BloomsTaxonomyDistribution';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { AssessmentCategory, GradingType } from '@/server/api/constants';
import { useToast } from '@/components/ui/use-toast';

// Form schema
const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().optional(),
  instructions: z.string().optional(),
  subjectId: z.string().min(1, { message: 'Subject is required' }),
  category: z.nativeEnum(AssessmentCategory),
  gradingType: z.nativeEnum(GradingType),
  maxScore: z.number().min(1).max(1000),
  passingScore: z.number().min(0).max(1000).optional(),
  weightage: z.number().min(0).max(100).optional(),
  dueDate: z.date().optional(),
  lessonPlanId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssessmentFormProps {
  classId: string;
  subjects: any[];
  assessment?: any;
  onSuccess?: (assessmentId: string) => void;
}

export function AssessmentForm({
  classId,
  subjects,
  assessment,
  onSuccess
}: AssessmentFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [selectedBloomsLevel, setSelectedBloomsLevel] = useState<BloomsTaxonomyLevel | null>(
    assessment?.bloomsLevel || null
  );
  const [bloomsDistribution, setBloomsDistribution] = useState<Record<BloomsTaxonomyLevel, number>>(
    assessment?.bloomsDistribution || {
      [BloomsTaxonomyLevel.REMEMBER]: 20,
      [BloomsTaxonomyLevel.UNDERSTAND]: 20,
      [BloomsTaxonomyLevel.APPLY]: 20,
      [BloomsTaxonomyLevel.ANALYZE]: 20,
      [BloomsTaxonomyLevel.EVALUATE]: 10,
      [BloomsTaxonomyLevel.CREATE]: 10,
    }
  );
  const [selectedLessonPlanId, setSelectedLessonPlanId] = useState<string | null>(
    assessment?.lessonPlanId || null
  );

  // Fetch lesson plans for the class
  const { data: lessonPlans } = api.lessonPlan.getByClass.useQuery(
    { classId },
    { enabled: !!classId }
  );

  // Fetch lesson plan details when a lesson plan is selected
  const { data: lessonPlanDetails } = api.lessonPlan.getById.useQuery(
    selectedLessonPlanId!,
    { enabled: !!selectedLessonPlanId }
  );

  // Initialize form with default values or assessment data if editing
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: assessment ? {
      title: assessment.title,
      description: assessment.description || '',
      instructions: assessment.instructions || '',
      subjectId: assessment.subjectId,
      category: assessment.category || AssessmentCategory.ASSIGNMENT,
      gradingType: assessment.gradingType || GradingType.MANUAL,
      maxScore: assessment.maxScore || 100,
      passingScore: assessment.passingScore || 60,
      weightage: assessment.weightage || 0,
      dueDate: assessment.dueDate ? new Date(assessment.dueDate) : undefined,
      lessonPlanId: assessment.lessonPlanId || '',
    } : {
      title: '',
      description: '',
      instructions: '',
      subjectId: '',
      category: AssessmentCategory.ASSIGNMENT,
      gradingType: GradingType.MANUAL,
      maxScore: 100,
      passingScore: 60,
      weightage: 0,
      dueDate: undefined,
      lessonPlanId: '',
    }
  });

  // Update form when lesson plan is selected
  useEffect(() => {
    if (lessonPlanDetails?.bloomsDistribution) {
      // Update the Bloom's distribution
      setBloomsDistribution(lessonPlanDetails.bloomsDistribution as Record<BloomsTaxonomyLevel, number>);

      // Find the highest level in the distribution
      const highestLevel = Object.entries(lessonPlanDetails.bloomsDistribution)
        .reduce((highest, [level, value]) => {
          const currentValue = highest.value || 0;
          return value > currentValue ? { level: level as BloomsTaxonomyLevel, value } : highest;
        }, { level: null as BloomsTaxonomyLevel | null, value: 0 });

      // Set the selected Bloom's level to the highest level in the distribution
      if (highestLevel.level) {
        setSelectedBloomsLevel(highestLevel.level);
      }

      // Update the form's lessonPlanId field
      form.setValue('lessonPlanId', selectedLessonPlanId || '');
    }
  }, [lessonPlanDetails, form, selectedLessonPlanId]);

  // Create assessment mutation
  const createAssessment = api.assessment.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Assessment created successfully',
        variant: 'success',
      });
      if (onSuccess) {
        onSuccess(data.id);
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
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Assessment updated successfully',
        variant: 'success',
      });
      if (onSuccess) {
        onSuccess(data.id);
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
    // Convert string date to Date object if needed
    const dueDateValue = values.dueDate instanceof Date
      ? values.dueDate
      : values.dueDate
        ? new Date(values.dueDate)
        : undefined;

    const assessmentData = {
      ...values,
      dueDate: dueDateValue,
      classId,
      bloomsLevel: selectedBloomsLevel,
      bloomsDistribution,
      status: 'ACTIVE', // Explicitly set status to ACTIVE
    };

    if (assessment) {
      updateAssessment.mutate({
        id: assessment.id,
        ...assessmentData,
      });
    } else {
      createAssessment.mutate(assessmentData);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="details">Basic Details</TabsTrigger>
            <TabsTrigger value="taxonomy">Bloom's Taxonomy</TabsTrigger>
            <TabsTrigger value="grading">Grading</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input
                      type="date"
                      {...field}
                      value={field.value instanceof Date
                        ? field.value.toISOString().split('T')[0]
                        : ''
                      }
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        field.onChange(date);
                      }}
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lessonPlanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Plan</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedLessonPlanId(value || null);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a lesson plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {lessonPlans?.lessonPlans?.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecting a lesson plan will automatically set the Bloom's level
                      based on the lesson plan's cognitive distribution.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="taxonomy" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Bloom's Taxonomy Level</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select the primary cognitive level for this assessment
                  </p>
                  <BloomsTaxonomySelector
                    value={selectedBloomsLevel}
                    onChange={setSelectedBloomsLevel}
                    showDescription
                  />
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-2">Cognitive Level Distribution</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adjust the distribution of questions across cognitive levels
                  </p>

                  {selectedLessonPlanId && lessonPlanDetails && (
                    <div className="mb-4 p-4 bg-muted rounded-md">
                      <h4 className="text-sm font-medium mb-2">Distribution from Lesson Plan</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        This distribution is from the selected lesson plan: {lessonPlanDetails.title}
                      </p>
                      <BloomsTaxonomyDistribution
                        distribution={bloomsDistribution}
                        onChange={setBloomsDistribution}
                        readOnly={false}
                      />
                    </div>
                  )}

                  {!selectedLessonPlanId && (
                    <BloomsTaxonomyDistribution
                      distribution={bloomsDistribution}
                      onChange={setBloomsDistribution}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grading" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gradingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grading Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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

              <FormField
                control={form.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Score *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Score</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum score required to pass
                    </FormDescription>
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
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (activeTab === 'details') {
                setActiveTab('taxonomy');
              } else if (activeTab === 'taxonomy') {
                setActiveTab('grading');
              }
            }}
            disabled={activeTab === 'grading'}
          >
            Next
          </Button>
          <Button
            type="submit"
            disabled={createAssessment.isLoading || updateAssessment.isLoading}
          >
            {assessment ? 'Update' : 'Create'} Assessment
          </Button>
        </div>
      </form>
    </Form>
  );
}
