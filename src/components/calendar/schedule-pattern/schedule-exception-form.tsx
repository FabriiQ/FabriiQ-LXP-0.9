'use client';

import React from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/atoms/button';
import { Calendar } from '@/components/ui/forms/calendar';
import { Input } from '@/components/ui/atoms/input';
import { Textarea } from '@/components/ui/forms/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/forms/form';

const scheduleExceptionFormSchema = z.object({
  exceptionDate: z.date({
    required_error: 'Exception date is required',
  }),
  reason: z.string().optional(),
  alternativeDate: z.date().optional(),
  alternativeStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
  alternativeEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
});

type ScheduleExceptionFormValues = z.infer<typeof scheduleExceptionFormSchema>;

interface ScheduleExceptionFormProps {
  initialData?: ScheduleExceptionFormValues;
  onSubmit: (data: ScheduleExceptionFormValues) => void;
  onCancel: () => void;
  schedulePattern: {
    startDate: Date;
    endDate?: Date;
    startTime: string;
    endTime: string;
  };
}

interface FormField<T extends FieldValues> {
  field: {
    value: T;
    onChange: (value: T) => void;
  };
}

export function ScheduleExceptionForm({
  initialData,
  onSubmit,
  onCancel,
  schedulePattern,
}: ScheduleExceptionFormProps) {
  const form = useForm<ScheduleExceptionFormValues>({
    resolver: zodResolver(scheduleExceptionFormSchema),
    defaultValues: initialData || {
      alternativeStart: schedulePattern.startTime,
      alternativeEnd: schedulePattern.endTime,
    },
  });

  const handleSubmit = async (data: ScheduleExceptionFormValues) => {
    // Validate time range if alternative times are provided
    if (data.alternativeStart && data.alternativeEnd) {
      const [startHour, startMinute] = data.alternativeStart.split(':').map(Number);
      const [endHour, endMinute] = data.alternativeEnd.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      if (startMinutes >= endMinutes) {
        form.setError('alternativeEnd', {
          type: 'manual',
          message: 'End time must be after start time',
        });
        return;
      }
    }

    // Validate date range if alternative date is provided
    if (data.alternativeDate) {
      if (schedulePattern.endDate && data.alternativeDate > schedulePattern.endDate) {
        form.setError('alternativeDate', {
          type: 'manual',
          message: 'Alternative date must be within the schedule pattern date range',
        });
        return;
      }

      if (data.alternativeDate < schedulePattern.startDate) {
        form.setError('alternativeDate', {
          type: 'manual',
          message: 'Alternative date must be within the schedule pattern date range',
        });
        return;
      }
    }

    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="exceptionDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exception Date</FormLabel>
              <FormControl>
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date: Date) =>
                    date < schedulePattern.startDate ||
                    (schedulePattern.endDate ? date > schedulePattern.endDate : false)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter reason for the exception" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="alternativeDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alternative Date (Optional)</FormLabel>
              <FormControl>
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date: Date) =>
                    date < schedulePattern.startDate ||
                    (schedulePattern.endDate ? date > schedulePattern.endDate : false)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="alternativeStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alternative Start Time (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="time"
                    placeholder="HH:MM"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alternativeEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alternative End Time (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="time"
                    placeholder="HH:MM"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'} Exception
          </Button>
        </div>
      </form>
    </Form>
  );
} 