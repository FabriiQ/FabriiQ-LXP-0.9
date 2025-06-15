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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/forms/form';

// Define the form schema
const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  description: z.string().optional(),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }).optional(),
  type: z.string().min(1, 'Holiday type is required'),
  status: z.string().min(1, 'Status is required'),
  isRecurring: z.boolean().default(false),
});

type HolidayFormValues = z.infer<typeof holidaySchema>;

export default function CreateHolidayPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Initialize the form
  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: new Date(),
      type: 'PUBLIC',
      status: SystemStatus.ACTIVE,
      isRecurring: false,
    },
  });
  
  // Mock submission function (replace with actual API call when available)
  const onSubmit = async (data: HolidayFormValues) => {
    try {
      // Simulate API call
      console.log('Submitting holiday data:', data);
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Holiday created successfully',
        variant: 'success',
      });
      
      // Navigate back to calendar page
      router.push('/admin/system/calendar');
    } catch (error) {
      console.error('Error creating holiday:', error);
      toast({
        title: 'Error',
        description: 'Failed to create holiday',
        variant: 'error',
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Create Holiday"
        description="Add a new holiday to the academic calendar"
      />
      
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Holiday Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter holiday name" />
                  </FormControl>
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
                    <FormLabel>End Date (Optional)</FormLabel>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holiday Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select holiday type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public Holiday</SelectItem>
                        <SelectItem value="ACADEMIC">Academic Holiday</SelectItem>
                        <SelectItem value="RELIGIOUS">Religious Holiday</SelectItem>
                        <SelectItem value="INSTITUTIONAL">Institutional Holiday</SelectItem>
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
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SystemStatus.ACTIVE}>Active</SelectItem>
                        <SelectItem value={SystemStatus.INACTIVE}>Inactive</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Textarea {...field} placeholder="Enter holiday description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Recurring Holiday</FormLabel>
                    <p className="text-sm text-gray-500">
                      This holiday repeats every year on the same date
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/system/calendar')}
              >
                Cancel
              </Button>
              <Button type="submit">Create Holiday</Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
} 