'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, Save } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditCoordinatorPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const coordinatorId = params?.id as string;
  
  // Fetch coordinator data
  const { data: coordinator, isLoading } = api.user.getById.useQuery(coordinatorId, {
    enabled: !!coordinatorId,
    refetchOnWindowFocus: false,
  });

  // Update coordinator mutation
  const updateCoordinator = api.user.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Coordinator updated successfully',
      });
      router.push(`/admin/campus/coordinators/${coordinatorId}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update coordinator',
      });
    },
  });

  // Initialize form with coordinator data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      department: '',
      phoneNumber: '',
    },
  });

  // Update form values when coordinator data is loaded
  useEffect(() => {
    if (coordinator) {
      form.reset({
        name: coordinator.name || '',
        email: coordinator.email || '',
        department: coordinator.coordinatorProfile?.department || '',
        phoneNumber: coordinator.phoneNumber || '',
      });
    }
  }, [coordinator, form]);

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (!coordinator) return;

    // Prepare data for update
    const updateData = {
      name: values.name,
      email: values.email,
      phoneNumber: values.phoneNumber,
      profileData: {
        ...coordinator.profileData,
      },
    };

    // Update coordinator profile if department changed
    if (coordinator.coordinatorProfile && values.department !== coordinator.coordinatorProfile.department) {
      // Use the coordinator profile update API
      api.user.updateCoordinatorProfile.mutate({
        userId: coordinatorId,
        department: values.department || '',
      }, {
        onSuccess: () => {
          // Now update the user data
          updateCoordinator.mutate({
            id: coordinatorId,
            data: updateData,
          });
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to update coordinator profile',
          });
        }
      });
    } else {
      // Just update the user data
      updateCoordinator.mutate({
        id: coordinatorId,
        data: updateData,
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!coordinator) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold">Coordinator not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Coordinator</h1>
          <p className="text-muted-foreground">Update coordinator information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coordinator Information</CardTitle>
          <CardDescription>Edit the coordinator's basic information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional contact number for the coordinator
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The department this coordinator belongs to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={updateCoordinator.isLoading}>
                  {updateCoordinator.isLoading ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
