'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeftIcon } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { FacilityType, SystemStatus } from '@prisma/client';
import { TRPCClientError, TRPCClientErrorLike } from '@trpc/client';
import type { BuildProcedure } from '@trpc/server';

// Form schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  code: z.string().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
  type: z.nativeEnum(FacilityType, {
    required_error: 'Type is required',
  }),
  capacity: z.coerce.number().int().positive('Capacity must be a positive number'),
  resources: z.record(z.any()).optional(),
  status: z.nativeEnum(SystemStatus, {
    required_error: 'Status is required',
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface EditFacilityPageProps {
  params: {
    id: string;
    facilityId: string;
  };
}

export default function EditFacilityPage({ params }: EditFacilityPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch facility details
  const { data: facility, isLoading: isFacilityLoading } = api.facility.getFacility.useQuery({
    id: params.facilityId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: facility?.name || '',
      code: facility?.code || '',
      type: facility?.type || FacilityType.CLASSROOM,
      capacity: facility?.capacity || 0,
      resources: facility?.resources as Record<string, any> || {},
      status: facility?.status || SystemStatus.ACTIVE,
    },
  });

  // Update mutation
  const updateFacility = api.facility.updateFacility.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Facility updated successfully",
      });
      router.push(`/admin/system/campuses/${params.id}/facilities`);
    },
    onError: (error: TRPCClientErrorLike<any>) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred while updating the facility",
        variant: "error"
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await updateFacility.mutateAsync({
        id: params.facilityId,
        ...data,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFacilityLoading) {
    return <div className="flex items-center justify-center h-[50vh]">Loading...</div>;
  }

  if (!facility) {
    return <div className="flex items-center justify-center h-[50vh]">Facility not found</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Facility"
        description="Update facility details"
        action={
          <Link href={`/admin/system/campuses/${params.id}/facilities`}>
            <Button variant="outline">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Facility Details</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter facility name" disabled={isSubmitting} />
                    </FormControl>
                    <FormDescription>The full name of the facility</FormDescription>
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
                      <Input {...field} placeholder="Enter facility code" disabled={isSubmitting} />
                    </FormControl>
                    <FormDescription>A unique identifier for the facility</FormDescription>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select facility type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(FacilityType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>The type of facility determines its purpose and available features</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        placeholder="Enter capacity" 
                        disabled={isSubmitting}
                        min={0}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormDescription>Maximum number of people the facility can accommodate</FormDescription>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select facility status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(SystemStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Current operational status of the facility</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
} 
