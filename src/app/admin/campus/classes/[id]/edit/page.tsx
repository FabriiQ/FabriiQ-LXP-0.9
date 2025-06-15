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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { prisma } from '@/server/db';
import { Facility, SystemStatus } from '@prisma/client';
import { api } from '@/utils/api';

// Form schema for class editing
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  minCapacity: z.coerce.number().int().min(1, 'Minimum capacity must be at least 1'),
  maxCapacity: z.coerce.number().int().min(1, 'Maximum capacity must be greater than minimum'),
  facilityId: z.string().nullable(),
  status: z.nativeEnum(SystemStatus),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditClassPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;

  const [isLoading, setIsLoading] = useState(false);

  // Use tRPC queries with correct types
  const { data: classData } = api.class.getById.useQuery({
    classId,
    include: {
      students: false,
      teachers: false,
      classTeacher: {
        include: {
          user: true
        }
      }
    }
  });

  // Update facility query to use the correct procedure
  const { data: facilities } = api.facility.getFacilities.useQuery({
    campusId: classData?.campusId ?? '',
    status: SystemStatus.ACTIVE
  }, {
    enabled: !!classData?.campusId
  });

  // Update mutation with correct types
  const updateClass = api.class.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Class updated successfully',
        variant: 'success',
      });
      router.push(`/admin/campus/classes/${classId}`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update class',
        variant: 'error',
      });
    },
  });

  // Form initialization with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      minCapacity: 1,
      maxCapacity: 30,
      facilityId: null,
      status: SystemStatus.ACTIVE,
    },
  });

  // Set form values when data is loaded
  useEffect(() => {
    if (classData) {
      form.reset({
        name: classData.name,
        code: classData.code,
        minCapacity: classData.minCapacity,
        maxCapacity: classData.maxCapacity,
        facilityId: classData.facilityId || null,
        status: classData.status,
      });
    }
  }, [classData, form]);

  const onSubmit = async (data: FormValues) => {
    updateClass.mutate({
      id: classId,
      name: data.name,
      status: data.status,
      minCapacity: data.minCapacity,
      maxCapacity: data.maxCapacity,
      facilityId: data.facilityId || undefined // Convert null to undefined
    });
  };

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
      title={`Edit Class: ${classData?.name || ''}`}
      description="Modify class details"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Edit', href: '#' },
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href={`/admin/campus/classes/${classId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Class
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Edit Class Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="minCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="facilityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a facility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {facilities?.map((facility) => (
                            <SelectItem key={facility.id} value={facility.id}>
                              {facility.name} ({facility.code})
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(SystemStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/campus/classes/${classId}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
