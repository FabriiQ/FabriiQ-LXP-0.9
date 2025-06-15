'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/data-display/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/forms/select';
import { Textarea } from '@/components/ui/forms/textarea';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon } from 'lucide-react';
import { TermType, TermPeriod } from '@/server/api/constants';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/forms/form';

// Define the form schema using Zod
const termSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  termType: z.enum(['SEMESTER', 'TRIMESTER', 'QUARTER', 'THEME_BASED', 'CUSTOM'], {
    required_error: 'Term type is required',
  }),
  termPeriod: z.string({
    required_error: 'Term period is required',
  }),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  courseId: z.string().min(1, 'Course is required'),
});

type TermFormValues = z.infer<typeof termSchema>;

export default function EditTermPage({ params }: { params: { id: string; termId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [validPeriods, setValidPeriods] = useState<{ label: string; value: string }[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Fetch academic cycle details
  const { data: academicCycle, isLoading: isLoadingCycle } = api.academicCycle.getById.useQuery({
    id: params.id,
  });
  
  // Fetch term details
  const { data: term, isLoading: isLoadingTerm } = api.term.getById.useQuery({
    id: params.termId,
  });
  
  // Fetch courses for dropdown
  const { data: courses, isLoading: isLoadingCourses } = api.course.list.useQuery({
    status: 'ACTIVE',
  });
  
  // Initialize form with react-hook-form and zod validation
  const form = useForm<TermFormValues>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      termType: undefined,
      termPeriod: undefined,
      startDate: new Date(),
      endDate: new Date(),
      courseId: '',
    },
  });
  
  // Update form values when term data is loaded
  useEffect(() => {
    if (term && !isLoaded) {
      form.reset({
        code: term.code,
        name: term.name,
        description: term.description || '',
        termType: term.termType,
        termPeriod: term.termPeriod,
        startDate: new Date(term.startDate),
        endDate: new Date(term.endDate),
        courseId: term.courseId,
      });
      setIsLoaded(true);
    }
  }, [term, form, isLoaded]);
  
  // Update valid periods when term type changes
  useEffect(() => {
    const termType = form.watch('termType');
    if (!termType) return;
    
    // Define valid periods based on term type
    const periodsByType: Record<string, { label: string; value: string }[]> = {
      'SEMESTER': [
        { label: 'Fall', value: 'FALL' },
        { label: 'Spring', value: 'SPRING' },
        { label: 'Summer', value: 'SUMMER' },
        { label: 'Winter', value: 'WINTER' },
      ],
      'TRIMESTER': [
        { label: 'First Trimester', value: 'FIRST_TRIMESTER' },
        { label: 'Second Trimester', value: 'SECOND_TRIMESTER' },
        { label: 'Third Trimester', value: 'THIRD_TRIMESTER' },
      ],
      'QUARTER': [
        { label: 'First Quarter', value: 'FIRST_QUARTER' },
        { label: 'Second Quarter', value: 'SECOND_QUARTER' },
        { label: 'Third Quarter', value: 'THIRD_QUARTER' },
        { label: 'Fourth Quarter', value: 'FOURTH_QUARTER' },
      ],
      'THEME_BASED': [
        { label: 'Theme Unit', value: 'THEME_UNIT' },
      ],
      'CUSTOM': [
        { label: 'Fall', value: 'FALL' },
        { label: 'Spring', value: 'SPRING' },
        { label: 'Summer', value: 'SUMMER' },
        { label: 'Winter', value: 'WINTER' },
        { label: 'First Quarter', value: 'FIRST_QUARTER' },
        { label: 'Second Quarter', value: 'SECOND_QUARTER' },
        { label: 'Third Quarter', value: 'THIRD_QUARTER' },
        { label: 'Fourth Quarter', value: 'FOURTH_QUARTER' },
        { label: 'First Trimester', value: 'FIRST_TRIMESTER' },
        { label: 'Second Trimester', value: 'SECOND_TRIMESTER' },
        { label: 'Third Trimester', value: 'THIRD_TRIMESTER' },
        { label: 'Theme Unit', value: 'THEME_UNIT' },
      ],
    };
    
    setValidPeriods(periodsByType[termType] || []);
  }, [form.watch('termType')]);
  
  // Update term mutation
  const updateTermMutation = api.term.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Term updated successfully',
        variant: 'success',
      });
      router.push(`/admin/system/academic-cycles/${params.id}/terms`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update term',
        variant: 'error',
      });
    },
  });
  
  const onSubmit = (data: TermFormValues) => {
    // Validate dates
    if (data.startDate >= data.endDate) {
      form.setError('endDate', {
        type: 'manual',
        message: 'End date must be after start date',
      });
      return;
    }
    
    // Validate against academic cycle dates
    if (academicCycle) {
      const cycleStart = new Date(academicCycle.startDate);
      const cycleEnd = new Date(academicCycle.endDate);
      
      if (data.startDate < cycleStart || data.endDate > cycleEnd) {
        toast({
          title: 'Warning',
          description: 'Term dates should be within the academic cycle date range',
          variant: 'warning',
        });
      }
    }
    
    updateTermMutation.mutate({
      id: params.termId,
      code: data.code,
      name: data.name,
      description: data.description,
      termType: data.termType as TermType,
      termPeriod: data.termPeriod as TermPeriod,
      startDate: data.startDate,
      endDate: data.endDate,
      courseId: data.courseId,
    });
  };
  
  const isLoading = isLoadingCycle || isLoadingTerm || isLoadingCourses;
  
  if (isLoading && !isLoaded) {
    return (
      <PageLayout
        title="Edit Term"
        description="Loading..."
        breadcrumbs={[
          { label: 'Academic Cycles', href: '/admin/system/academic-cycles' },
          { label: 'Academic Cycle', href: `/admin/system/academic-cycles/${params.id}` },
          { label: 'Terms', href: `/admin/system/academic-cycles/${params.id}/terms` },
          { label: 'Term', href: `/admin/system/academic-cycles/${params.id}/terms/${params.termId}` },
          { label: 'Edit', href: '#' },
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
      title="Edit Term"
      description={`Edit term details for ${academicCycle?.name || ''}`}
      breadcrumbs={[
        { label: 'Academic Cycles', href: '/admin/system/academic-cycles' },
        { label: academicCycle?.name || 'Academic Cycle', href: `/admin/system/academic-cycles/${params.id}` },
        { label: 'Terms', href: `/admin/system/academic-cycles/${params.id}/terms` },
        { label: term?.name || 'Edit Term', href: '#' },
      ]}
      actions={
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/system/academic-cycles/${params.id}/terms`)}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Terms
        </Button>
      }
    >
      {isLoadingCycle || isLoadingTerm ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Term Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="termType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select term type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SEMESTER">Semester</SelectItem>
                            <SelectItem value="TRIMESTER">Trimester</SelectItem>
                            <SelectItem value="QUARTER">Quarter</SelectItem>
                            <SelectItem value="THEME_BASED">Theme Based</SelectItem>
                            <SelectItem value="CUSTOM">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="termPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term Period</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={validPeriods.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select term period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {validPeriods.map((period) => (
                              <SelectItem key={period.value} value={period.value}>
                                {period.label}
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
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                            minDate={academicCycle?.startDate ? new Date(academicCycle.startDate) : undefined}
                            maxDate={academicCycle?.endDate ? new Date(academicCycle.endDate) : undefined}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                            minDate={form.watch('startDate')}
                            maxDate={academicCycle?.endDate ? new Date(academicCycle.endDate) : undefined}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses?.courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.name}
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
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/admin/system/academic-cycles/${params.id}/terms`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateTermMutation.isLoading}
                  >
                    {updateTermMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
} 