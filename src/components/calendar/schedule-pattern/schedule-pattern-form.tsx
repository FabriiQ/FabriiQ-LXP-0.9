'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { Textarea } from '@/components/ui/forms/textarea';
import FormField from '@/components/ui/forms/form-field';
import { Checkbox } from '@/components/ui/forms/checkbox';

const schedulePatternFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  daysOfWeek: z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  recurrence: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM']),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date().optional(),
});

type SchedulePatternFormValues = z.infer<typeof schedulePatternFormSchema>;

interface SchedulePatternFormProps {
  initialData?: SchedulePatternFormValues;
  onSubmit: (data: SchedulePatternFormValues) => void;
  onCancel: () => void;
}

const daysOfWeek = [
  { value: 'MONDAY' as const, label: 'Monday' },
  { value: 'TUESDAY' as const, label: 'Tuesday' },
  { value: 'WEDNESDAY' as const, label: 'Wednesday' },
  { value: 'THURSDAY' as const, label: 'Thursday' },
  { value: 'FRIDAY' as const, label: 'Friday' },
  { value: 'SATURDAY' as const, label: 'Saturday' },
  { value: 'SUNDAY' as const, label: 'Sunday' },
] as const;

type DayOfWeek = typeof daysOfWeek[number]['value'];

export function SchedulePatternForm({
  initialData,
  onSubmit,
  onCancel,
}: SchedulePatternFormProps) {
  const form = useForm<SchedulePatternFormValues>({
    resolver: zodResolver(schedulePatternFormSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      daysOfWeek: [],
      startTime: '09:00',
      endTime: '17:00',
      recurrence: 'WEEKLY',
    },
  });

  const handleSubmit = async (data: SchedulePatternFormValues) => {
    // Validate time range
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes >= endMinutes) {
      form.setError('endTime', {
        type: 'manual',
        message: 'End time must be after start time',
      });
      return;
    }

    // Validate date range if end date is provided
    if (data.endDate && data.startDate > data.endDate) {
      form.setError('endDate', {
        type: 'manual',
        message: 'End date must be after start date',
      });
      return;
    }

    await onSubmit(data);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          name="name"
          label="Name"
          required
          type="text"
          placeholder="Enter pattern name"
        />

        <FormField
          name="description"
          label="Description"
          type="text"
          placeholder="Enter pattern description"
        >
          <Textarea placeholder="Enter pattern description" />
        </FormField>

        <FormField
          name="daysOfWeek"
          label="Days of Week"
          required
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {daysOfWeek.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={day.value}
                  checked={form.watch('daysOfWeek')?.includes(day.value)}
                  onChange={(e) => {
                    const currentValue = form.getValues('daysOfWeek') || [];
                    const newValue = e.target.checked
                      ? [...currentValue, day.value]
                      : currentValue.filter((value) => value !== day.value);
                    form.setValue('daysOfWeek', newValue as DayOfWeek[]);
                  }}
                />
                <label htmlFor={day.value} className="text-sm">
                  {day.label}
                </label>
              </div>
            ))}
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="startTime"
            label="Start Time"
            required
            type="time"
            placeholder="HH:MM"
          />

          <FormField
            name="endTime"
            label="End Time"
            required
            type="time"
            placeholder="HH:MM"
          />
        </div>

        <FormField
          name="recurrence"
          label="Recurrence"
          required
        >
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select recurrence pattern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="startDate"
            label="Start Date"
            required
          >
            <Calendar
              mode="single"
              disabled={(date) => date < new Date()}
            />
          </FormField>

          <FormField
            name="endDate"
            label="End Date (Optional)"
          >
            <Calendar
              mode="single"
              disabled={(date) => date < form.getValues('startDate')}
            />
          </FormField>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'} Pattern
          </Button>
        </div>
      </form>
    </FormProvider>
  );
} 