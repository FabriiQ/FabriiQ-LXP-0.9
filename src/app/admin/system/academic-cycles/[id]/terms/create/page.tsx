'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/data-display/card';
import { Input } from '@/components/ui/input';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon } from 'lucide-react';

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

// Define course type for type safety
interface Course {
  id: string;
  code: string;
  name: string;
}

export default function CreateTermPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [validPeriods, setValidPeriods] = useState<{ label: string; value: string }[]>([]);
  
  // Mock data for academic cycle
  const academicCycle = {
    id: params.id,
    code: 'AY-2023-24',
    name: 'Academic Year 2023-2024',
    type: 'ANNUAL',
    startDate: new Date('2023-08-01'),
    endDate: new Date('2024-07-31'),
    status: 'ACTIVE',
    description: 'This is the academic year 2023-2024',
    duration: 12,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    createdBy: 'admin',
    updatedBy: 'admin',
    institutionId: '1',
  };
  
  // Mock data for courses
  const courses: Course[] = [
    {
      id: '1',
      code: 'CS-101',
      name: 'Introduction to Computer Science',
    },
    {
      id: '2',
      code: 'MATH-101',
      name: 'Calculus I',
    },
    {
      id: '3',
      code: 'ENG-101',
      name: 'English Composition',
    },
  ];
  
  const isLoadingCycle = false;
  const isLoadingCourses = false;
  
  // Initialize form with react-hook-form and zod validation
  const form = useForm<TermFormValues>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      termType: undefined,
      termPeriod: '',
      startDate: undefined,
      endDate: undefined,
      courseId: '',
    },
  });
  
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
    
    // Reset period if it's not valid for the selected type
    const currentPeriod = form.watch('termPeriod');
    const isValidPeriod = periodsByType[termType]?.some(p => p.value === currentPeriod);
    if (currentPeriod && !isValidPeriod) {
      form.setValue('termPeriod', '');
    }
  }, [form.watch('termType')]);
  
  // Mock create term mutation
  const createTerm = {
    mutate: (data: TermFormValues & { academicCycleId: string }) => {
      toast({
        title: 'Success',
        description: 'Term created successfully',
        variant: 'success',
      });
      router.push(`/admin/system/academic-cycles/${params.id}/terms`);
    },
    isLoading: false,
  };
  
  const onSubmit = (data: TermFormValues) => {
    // Validate dates
    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      form.setError('endDate', {
        type: 'manual',
        message: 'End date must be after start date',
      });
      return;
    }
    
    // Validate academic cycle dates
    if (academicCycle) {
      if (data.startDate < academicCycle.startDate) {
        form.setError('startDate', {
          type: 'manual',
          message: 'Start date cannot be before academic cycle start date',
        });
        return;
      }
      
      if (data.endDate > academicCycle.endDate) {
        form.setError('endDate', {
          type: 'manual',
          message: 'End date cannot be after academic cycle end date',
        });
        return;
      }
    }
    
    createTerm.mutate({
      ...data,
      academicCycleId: params.id,
    });
  };
  
  if (isLoadingCycle) {
    return (
      <PageLayout
        title="Create Term"
        description="Loading..."
        breadcrumbs={[
          { label: 'Academic Cycles', href: '/admin/system/academic-cycles' },
          { label: 'Loading...', href: `/admin/system/academic-cycles/${params.id}` },
          { label: 'Terms', href: `/admin/system/academic-cycles/${params.id}/terms` },
          { label: 'Create', href: '#' },
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
      title="Create Term"
      description={`Create a new term for ${academicCycle?.name || 'academic cycle'}`}
      breadcrumbs={[
        { label: 'Academic Cycles', href: '/admin/system/academic-cycles' },
        { label: academicCycle?.name || 'Academic Cycle', href: `/admin/system/academic-cycles/${params.id}` },
        { label: 'Terms', href: `/admin/system/academic-cycles/${params.id}/terms` },
        { label: 'Create', href: '#' },
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
      <Card>
        <CardHeader>
          <CardTitle>Term Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Code <span className="text-red-500">*</span>
                </label>
                <Input
                  id="code"
                  placeholder="e.g., FALL-2023"
                  {...form.register('code')}
                />
                {form.formState.errors.code && (
                  <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="e.g., Fall Semester 2023"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="termType" className="text-sm font-medium">
                  Term Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="termType"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.watch('termType')}
                  onChange={(e) => form.setValue('termType', e.target.value as any)}
                >
                  <option value="">Select term type</option>
                  <option value="SEMESTER">Semester</option>
                  <option value="TRIMESTER">Trimester</option>
                  <option value="QUARTER">Quarter</option>
                  <option value="THEME_BASED">Theme Based</option>
                  <option value="CUSTOM">Custom</option>
                </select>
                {form.formState.errors.termType && (
                  <p className="text-sm text-red-500">{form.formState.errors.termType.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="termPeriod" className="text-sm font-medium">
                  Term Period <span className="text-red-500">*</span>
                </label>
                <select
                  id="termPeriod"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.watch('termPeriod')}
                  onChange={(e) => form.setValue('termPeriod', e.target.value)}
                  disabled={!form.watch('termType') || validPeriods.length === 0}
                >
                  <option value="">Select term period</option>
                  {validPeriods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
                {form.formState.errors.termPeriod && (
                  <p className="text-sm text-red-500">{form.formState.errors.termPeriod.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="startDate" className="text-sm font-medium">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.watch('startDate') ? form.watch('startDate').toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    form.setValue('startDate', date as any);
                  }}
                />
                {form.formState.errors.startDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.startDate.message}</p>
                )}
                {academicCycle && (
                  <p className="text-xs text-gray-500">
                    Must be between {new Date(academicCycle.startDate).toLocaleDateString()} and {new Date(academicCycle.endDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="endDate" className="text-sm font-medium">
                  End Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.watch('endDate') ? form.watch('endDate').toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    form.setValue('endDate', date as any);
                  }}
                />
                {form.formState.errors.endDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.endDate.message}</p>
                )}
                {academicCycle && (
                  <p className="text-xs text-gray-500">
                    Must be between start date and {new Date(academicCycle.endDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="courseId" className="text-sm font-medium">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  id="courseId"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.watch('courseId')}
                  onChange={(e) => form.setValue('courseId', e.target.value)}
                  disabled={isLoadingCourses}
                >
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.courseId && (
                  <p className="text-sm text-red-500">{form.formState.errors.courseId.message}</p>
                )}
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter a description for this term"
                  {...form.register('description')}
                ></textarea>
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                )}
              </div>
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
                disabled={createTerm.isLoading}
              >
                {createTerm.isLoading ? 'Creating...' : 'Create Term'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
} 
