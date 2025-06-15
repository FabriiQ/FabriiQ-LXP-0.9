'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/atoms/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/forms/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { SystemStatus } from '@/server/api/constants';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/forms/form';
import { Checkbox } from '@/components/ui/forms/checkbox';
import { PlusIcon, TrashIcon } from 'lucide-react';

// Define the form schema
const patternSchema = z.object({
  name: z.string().min(1, 'Pattern name is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Pattern type is required'),
  status: z.string().min(1, 'Status is required'),
  days: z.array(z.string()).min(1, 'At least one day must be selected'),
  periods: z.array(z.object({
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    label: z.string().optional(),
  })).min(1, 'At least one period must be defined'),
});

type PatternFormValues = z.infer<typeof patternSchema>;

export default function CreatePatternPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Initialize the form
  const form = useForm<PatternFormValues>({
    resolver: zodResolver(patternSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'WEEKLY',
      status: SystemStatus.ACTIVE,
      days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      periods: [
        { startTime: '08:00', endTime: '09:30', label: 'Period 1' },
        { startTime: '09:45', endTime: '11:15', label: 'Period 2' },
        { startTime: '11:30', endTime: '13:00', label: 'Period 3' },
      ],
    },
  });
  
  // Days of the week options
  const daysOfWeek = [
    { value: 'MONDAY', label: 'Monday' },
    { value: 'TUESDAY', label: 'Tuesday' },
    { value: 'WEDNESDAY', label: 'Wednesday' },
    { value: 'THURSDAY', label: 'Thursday' },
    { value: 'FRIDAY', label: 'Friday' },
    { value: 'SATURDAY', label: 'Saturday' },
    { value: 'SUNDAY', label: 'Sunday' },
  ];
  
  // Add a new period
  const addPeriod = () => {
    const periods = form.getValues('periods');
    form.setValue('periods', [
      ...periods,
      { startTime: '', endTime: '', label: `Period ${periods.length + 1}` }
    ]);
  };
  
  // Remove a period
  const removePeriod = (index: number) => {
    const periods = form.getValues('periods');
    form.setValue('periods', periods.filter((_, i) => i !== index));
  };
  
  // Mock submission function (replace with actual API call when available)
  const onSubmit = async (data: PatternFormValues) => {
    try {
      // Simulate API call
      console.log('Submitting pattern data:', data);
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Schedule pattern created successfully',
        variant: 'success',
      });
      
      // Navigate back to calendar page
      router.push('/admin/system/calendar');
    } catch (error) {
      console.error('Error creating pattern:', error);
      toast({
        title: 'Error',
        description: 'Failed to create schedule pattern',
        variant: 'error',
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Create Schedule Pattern"
        description="Define a new schedule pattern for classes and activities"
      />
      
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pattern Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter pattern name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pattern Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pattern type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="BIWEEKLY">Bi-Weekly</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
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
                    <Textarea {...field} placeholder="Enter pattern description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="days"
              render={() => (
                <FormItem>
                  <FormLabel>Days of the Week</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {daysOfWeek.map((day) => (
                      <FormField
                        key={day.value}
                        control={form.control}
                        name="days"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={day.value}
                              className="flex flex-row items-center space-x-2 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day.value)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    return checked
                                      ? field.onChange([...currentValue, day.value])
                                      : field.onChange(
                                          currentValue.filter((value) => value !== day.value)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {day.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <FormLabel>Time Periods</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPeriod}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Period
                </Button>
              </div>
              
              {form.getValues('periods').map((_, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border rounded-md">
                  <FormField
                    control={form.control}
                    name={`periods.${index}.label`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Label</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Period label" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`periods.${index}.startTime`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-end gap-2">
                    <FormField
                      control={form.control}
                      name={`periods.${index}.endTime`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="mb-2"
                      onClick={() => removePeriod(index)}
                      disabled={form.getValues('periods').length <= 1}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <FormMessage>{form.formState.errors.periods?.message}</FormMessage>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/system/calendar')}
              >
                Cancel
              </Button>
              <Button type="submit">Create Pattern</Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
} 