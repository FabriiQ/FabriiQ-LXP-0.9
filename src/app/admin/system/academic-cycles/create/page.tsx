'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/atoms/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/forms/date-picker';
import { Textarea } from '@/components/ui/forms/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { SystemStatus } from '@/server/api/constants';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/forms/form';
import { Switch } from '@/components/ui/forms/switch';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading';
import { AcademicCycleType } from '@/server/api/types/academic-calendar';

// Define the form schema
const academicCycleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  type: z.nativeEnum(AcademicCycleType, {
    errorMap: () => ({ message: 'Type is required' }),
  }),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  status: z.string().min(1, 'Status is required'),
  isDefault: z.boolean().default(false),
  description: z.string().optional(),
  institutionId: z.string().min(1, 'Institution is required'),
  createdBy: z.string().min(1, 'Creator is required'),
});

type AcademicCycleFormValues = z.infer<typeof academicCycleSchema>;

export default function CreateAcademicCyclePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isLoadingUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch institution data
  const { data: institution, isLoading: isLoadingInstitution } = api.institution.getById.useQuery(
    { id: user?.institutionId || '' },
    { enabled: !!user?.institutionId }
  );
  
  // Create academic cycle mutation
  const createAcademicCycle = api.academicCycle.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Academic cycle created successfully',
        variant: 'success',
      });
      router.push('/admin/system/academic-cycles');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create academic cycle',
        variant: 'error',
      });
      setIsSubmitting(false);
    },
  });
  
  // Initialize form
  const form = useForm<AcademicCycleFormValues>({
    resolver: zodResolver(academicCycleSchema),
    defaultValues: {
      name: '',
      code: '',
      type: AcademicCycleType.SEMESTER,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
      status: SystemStatus.ACTIVE,
      isDefault: false,
      description: '',
      institutionId: user?.institutionId || '',
      createdBy: user?.id || '',
    },
  });
  
  // Handle form submission
  const onSubmit = async (data: AcademicCycleFormValues) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User information is missing. Please try again.',
        variant: 'error',
      });
      return;
    }
    
    setIsSubmitting(true);
    createAcademicCycle.mutate({
      ...data,
      createdBy: user.id,
    });
  };
  
  if (isLoadingUser || isLoadingInstitution) {
    return <LoadingSpinner />;
  }
  
  if (!user || !institution) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader
          title="Create Academic Cycle"
          description="You need to be logged in with an institution to create an academic cycle"
        />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Create Academic Cycle"
        description="Add a new academic cycle to your institution"
      />
      
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., AY 2025 - 2026" />
                    </FormControl>
                    <FormDescription>
                      Academic year or cycle name, e.g., "AY 2025 - 2026" or "Fall 2025"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., AY2025-2026" />
                    </FormControl>
                    <FormDescription>
                      A unique code for this cycle, should match the name format (e.g., "AY2025-2026")
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cycle type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={AcademicCycleType.ANNUAL}>Annual</SelectItem>
                      <SelectItem value={AcademicCycleType.SEMESTER}>Semester</SelectItem>
                      <SelectItem value={AcademicCycleType.TRIMESTER}>Trimester</SelectItem>
                      <SelectItem value={AcademicCycleType.QUARTER}>Quarter</SelectItem>
                      <SelectItem value={AcademicCycleType.CUSTOM}>Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter a description for this academic cycle" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Default Cycle</FormLabel>
                    <FormDescription>
                      Set this as the default academic cycle for new enrollments
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Hidden fields */}
            <FormField
              control={form.control}
              name="institutionId"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="createdBy"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input {...field} type="hidden" value={user.id} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/system/academic-cycles')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Academic Cycle'}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
} 
