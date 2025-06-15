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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/forms/checkbox';

const academicEventFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  type: z.enum(['REGISTRATION', 'ADD_DROP', 'WITHDRAWAL', 'EXAMINATION', 'GRADING', 'ORIENTATION', 'GRADUATION', 'OTHER'], {
    required_error: 'Type is required',
  }),
  academicCycleId: z.string().optional(),
  campusId: z.string().optional(),
  classIds: z.array(z.string()).optional(),
});

type AcademicEventFormValues = z.infer<typeof academicEventFormSchema>;

interface AcademicEventFormProps {
  initialData?: AcademicEventFormValues;
  onSubmit: (data: AcademicEventFormValues) => void;
  onCancel: () => void;
  academicCycles: Array<{ id: string; name: string }>;
  campuses: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string }>;
}

export function AcademicEventForm({
  initialData,
  onSubmit,
  onCancel,
  academicCycles,
  campuses,
  classes,
}: AcademicEventFormProps) {
  const form = useForm<AcademicEventFormValues>({
    resolver: zodResolver(academicEventFormSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      classIds: [],
    },
  });

  const handleSubmit = async (data: AcademicEventFormValues) => {
    if (data.startDate > data.endDate) {
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
          placeholder="Enter event name"
        />

        <FormField
          name="description"
          label="Description"
          type="text"
          placeholder="Enter event description"
        >
          <Textarea placeholder="Enter event description" />
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
            label="End Date"
            required
          >
            <Calendar
              mode="single"
              disabled={(date) => date < form.getValues('startDate')}
            />
          </FormField>
        </div>

        <FormField
          name="type"
          label="Type"
          required
        >
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="REGISTRATION">Registration</SelectItem>
              <SelectItem value="ADD_DROP">Add/Drop</SelectItem>
              <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
              <SelectItem value="EXAMINATION">Examination</SelectItem>
              <SelectItem value="GRADING">Grading</SelectItem>
              <SelectItem value="ORIENTATION">Orientation</SelectItem>
              <SelectItem value="GRADUATION">Graduation</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          name="academicCycleId"
          label="Academic Cycle"
        >
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select academic cycle" />
            </SelectTrigger>
            <SelectContent>
              {academicCycles.map((cycle) => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          name="campusId"
          label="Campus"
        >
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select campus" />
            </SelectTrigger>
            <SelectContent>
              {campuses.map((campus) => (
                <SelectItem key={campus.id} value={campus.id}>
                  {campus.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          name="classIds"
          label="Classes"
        >
          <ScrollArea className="h-[200px] border rounded-md p-4">
            {classes.map((classItem) => (
              <div key={classItem.id} className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id={classItem.id}
                  checked={form.watch('classIds')?.includes(classItem.id)}
                  onChange={(e) => {
                    const currentValue = form.getValues('classIds') || [];
                    const newValue = e.target.checked
                      ? [...currentValue, classItem.id]
                      : currentValue.filter((id) => id !== classItem.id);
                    form.setValue('classIds', newValue);
                  }}
                />
                <label htmlFor={classItem.id} className="text-sm">
                  {classItem.name}
                </label>
              </div>
            ))}
          </ScrollArea>
        </FormField>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'} Event
          </Button>
        </div>
      </form>
    </FormProvider>
  );
} 