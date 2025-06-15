'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/data-display/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/forms/date-picker';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/forms/form';

// Define the form schema using Zod
const academicCycleSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['ANNUAL', 'SEMESTER', 'TRIMESTER', 'QUARTER', 'CUSTOM'], {
    required_error: 'Type is required',
  }),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
});

type AcademicCycleFormValues = z.infer<typeof academicCycleSchema>;

export default function EditAcademicCyclePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Fetch academic cycle details
  const { data: academicCycle, isLoading } = api.academicCycle.getById.useQuery({
    id: params.id,
  });
  
  // Initialize form with react-hook-form and zod validation
  const form = useForm<AcademicCycleFormValues>({
    resolver: zodResolver(academicCycleSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      type: 'ANNUAL',
      startDate: new Date(),
      endDate: new Date(),
    },
  });
  
  // Update form values when data is loaded
  useEffect(() => {
    if (academicCycle && !isLoaded) {
      form.reset({
        code: academicCycle.code,
        name: academicCycle.name,
        description: academicCycle.description || '',
        type: academicCycle.type as any,
        startDate: new Date(academicCycle.startDate),
        endDate: new Date(academicCycle.endDate),
      });
      setIsLoaded(true);
    }
  }, [academicCycle, form, isLoaded]);
  
  // Update academic cycle mutation
  const updateAcademicCycleMutation = api.academicCycle.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Academic cycle updated successfully',
        variant: 'success',
      });
      router.push('/admin/system/academic-cycles');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update academic cycle',
        variant: 'error',
      });
    },
  });
  
  const onSubmit = (data: AcademicCycleFormValues) => {
    // Validate dates
    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      form.setError('endDate', {
        type: 'manual',
        message: 'End date must be after start date',
      });
      return;
    }
    
    updateAcademicCycleMutation.mutate({
      id: params.id,
      ...data,
    });
  };
  
  return (
    <PageLayout
      title="Edit Academic Cycle"
      description="Update academic cycle details"
      breadcrumbs={[
        { label: 'Academic Cycles', href: '/admin/system/academic-cycles' },
        { label: academicCycle?.name || 'Edit', href: `/admin/system/academic-cycles/${params.id}` },
        { label: 'Edit', href: '#' },
      ]}
      actions={
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/system/academic-cycles/${params.id}`)}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Details
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Academic Cycle Details</CardTitle>
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ANNUAL">Annual</SelectItem>
                            <SelectItem value="SEMESTER">Semester</SelectItem>
                            <SelectItem value="TRIMESTER">Trimester</SelectItem>
                            <SelectItem value="QUARTER">Quarter</SelectItem>
                            <SelectItem value="CUSTOM">Custom</SelectItem>
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
                            selected={field.value}
                            onSelect={field.onChange}
                            placeholder="Select start date"
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
                            selected={field.value}
                            onSelect={field.onChange}
                            placeholder="Select end date"
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
                    onClick={() => router.push(`/admin/system/academic-cycles/${params.id}`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateAcademicCycleMutation.isLoading}
                  >
                    {updateAcademicCycleMutation.isLoading ? 'Saving...' : 'Save Changes'}
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