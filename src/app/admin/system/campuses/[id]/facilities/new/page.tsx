'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/forms/select';
import { Textarea } from '@/components/ui/forms/textarea';
import { ArrowLeftIcon } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { FacilityType } from '@prisma/client';

// Form schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  code: z.string().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
  type: z.nativeEnum(FacilityType, {
    required_error: 'Type is required',
  }),
  capacity: z.coerce.number().int().positive('Capacity must be a positive number'),
  description: z.string().optional(),
  resources: z.record(z.any()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Add type for the field prop
interface FieldProps {
  field: {
    value: any;
    onChange: (value: any) => void;
  };
}

interface NewFacilityPageProps {
  params: {
    id: string;
  };
}

export default function NewFacilityPage({ params }: NewFacilityPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch campus details
  const { data: campus, isLoading: campusLoading } = api.campus.getById.useQuery({
    id: params.id,
  });

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      type: undefined,
      capacity: 30,
      description: '',
      resources: {},
    },
  });

  // Mutation for creating a facility
  const createFacility = api.facility.createFacility.useMutation({
    onSuccess: () => {
      toast({
        title: 'Facility created',
        description: 'The facility has been successfully created',
      });
      router.push(`/admin/system/campuses/${params.id}/facilities`);
      router.refresh();
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create facility',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    createFacility.mutate({
      ...values,
      campusId: params.id,
      resources: values.resources || {},
    });
  };

  // If data is loading, show loading state
  if (campusLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <PageHeader
            title="Add Facility"
            description="Loading campus details..."
          />
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // If no campus found, show error
  if (!campus) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <PageHeader
            title="Error"
            description="Campus not found"
          />
        </div>
        <div className="flex justify-center">
          <Button onClick={() => router.push('/admin/system/campuses')}>
            Return to Campuses
          </Button>
        </div>
      </div>
    );
  }

  // Facility type options
  const facilityTypeOptions = [
    { value: FacilityType.CLASSROOM, label: 'Classroom' },
    { value: FacilityType.LABORATORY, label: 'Laboratory' },
    { value: FacilityType.AUDITORIUM, label: 'Auditorium' },
    { value: FacilityType.LIBRARY, label: 'Library' },
    { value: FacilityType.WORKSHOP, label: 'Workshop' },
    { value: FacilityType.OTHER, label: 'Other' },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/system/campuses/${params.id}/facilities`}>
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Add Facility - ${campus.name}`}
          description={`Add a new facility to ${campus.code} campus`}
        />
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Facility Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }: { field: FieldProps['field'] }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Science Lab 1" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of the facility
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
                        <Input placeholder="SCI-LAB-1" {...field} />
                      </FormControl>
                      <FormDescription>
                        A unique code for the facility
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CLASSROOM">Classroom</SelectItem>
                          <SelectItem value="LABORATORY">Laboratory</SelectItem>
                          <SelectItem value="WORKSHOP">Workshop</SelectItem>
                          <SelectItem value="LIBRARY">Library</SelectItem>
                          <SelectItem value="AUDITORIUM">Auditorium</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The type of facility
                      </FormDescription>
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
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        Maximum number of people
                      </FormDescription>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter a description" {...field} />
                    </FormControl>
                    <FormDescription>
                      Additional details about the facility
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="px-0 pt-4">
                <div className="flex justify-between w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Facility"}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 
