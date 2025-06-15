'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/forms/select';
import { DatePicker } from '@/components/ui/forms/date-picker';
import { Textarea } from '@/components/ui/forms/textarea';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/molecules/form';
import { Checkbox } from '@/components/ui/checkbox';

const academicEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  type: z.enum(['REGISTRATION', 'ADD_DROP', 'WITHDRAWAL', 'EXAMINATION', 'GRADING', 'ORIENTATION', 'GRADUATION', 'OTHER']),
  academicPeriodId: z.string().optional(),
  campusId: z.string().optional(),
  notifyStudents: z.boolean().default(false),
  notifyTeachers: z.boolean().default(false),
});

type AcademicEventFormData = z.infer<typeof academicEventSchema>;

interface AcademicEventFormProps {
  initialData?: Partial<AcademicEventFormData>;
  onSubmit: (data: AcademicEventFormData) => void;
  onCancel: () => void;
  campuses: Array<{ id: string; name: string }>;
  academicPeriods: Array<{ id: string; name: string }>;
}

export function AcademicEventForm({
  initialData,
  onSubmit,
  onCancel,
  campuses,
  academicPeriods,
}: AcademicEventFormProps) {
  const { toast } = useToast();
  
  const form = useForm<AcademicEventFormData>({
    resolver: zodResolver(academicEventSchema),
    defaultValues: {
      ...initialData,
      notifyStudents: initialData?.notifyStudents ?? false,
      notifyTeachers: initialData?.notifyTeachers ?? false,
    },
  });

  const eventTypes = [
    { value: 'REGISTRATION', label: 'Registration Period' },
    { value: 'ADD_DROP', label: 'Add/Drop Period' },
    { value: 'WITHDRAWAL', label: 'Withdrawal Period' },
    { value: 'EXAMINATION', label: 'Examination Period' },
    { value: 'GRADING', label: 'Grading Period' },
    { value: 'ORIENTATION', label: 'Orientation' },
    { value: 'GRADUATION', label: 'Graduation' },
    { value: 'OTHER', label: 'Other' },
  ];

  const campusOptions = campuses.map(campus => ({
    value: campus.id,
    label: campus.name,
  }));

  const academicPeriodOptions = academicPeriods.map(period => ({
    value: period.id,
    label: period.name,
  }));

  const handleFormSubmit = async (data: AcademicEventFormData) => {
    try {
      await onSubmit(data);
      toast({
        title: 'Success',
        description: `Academic event ${initialData ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create academic event',
        variant: 'error',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter event name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter event description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
                    minDate={form.watch('startDate')}
                  />
                </FormControl>
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
              <FormLabel>Event Type</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="academicPeriodId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Academic Period</FormLabel>
              <FormControl>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic period" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicPeriodOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="campusId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campus</FormLabel>
              <FormControl>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {campusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notifyStudents"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifyStudents"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <div className="space-y-1 leading-none">
                    <label
                      htmlFor="notifyStudents"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Notify Students
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications to students about this event
                    </p>
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notifyTeachers"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifyTeachers"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <div className="space-y-1 leading-none">
                    <label
                      htmlFor="notifyTeachers"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Notify Teachers
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications to teachers about this event
                    </p>
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Saving...' : initialData ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 