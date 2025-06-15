'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/atoms/button';
import { Calendar } from '@/components/ui/forms/calendar';
import { Input } from '@/components/ui/atoms/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { Textarea } from '@/components/ui/forms/textarea';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import FormField from '@/components/ui/forms/form-field';
import { Switch } from '@/components/ui/atoms/switch';
import { Checkbox } from '@/components/ui/forms/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const holidayFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  type: z.enum(['NATIONAL', 'RELIGIOUS', 'INSTITUTIONAL', 'ADMINISTRATIVE', 'WEATHER', 'OTHER'], {
    required_error: 'Type is required',
  }),
  affectsAll: z.boolean().default(true),
  campusIds: z.array(z.string()).optional(),
});

type HolidayFormValues = z.infer<typeof holidayFormSchema>;

interface HolidayFormProps {
  initialData?: HolidayFormValues;
  onSubmit: (data: HolidayFormValues) => void;
  onCancel: () => void;
  campuses: Array<{ id: string; name: string }>;
}

export function HolidayForm({
  initialData,
  onSubmit,
  onCancel,
  campuses,
}: HolidayFormProps) {
  const { toast } = useToast();
  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      affectsAll: true,
      campusIds: [],
    },
  });

  const handleSubmit = async (data: HolidayFormValues) => {
    try {
      if (data.startDate > data.endDate) {
        toast({
          title: 'Invalid date range',
          description: 'Start date must be before end date',
          variant: 'error',
        });
        return;
      }

      await onSubmit(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save holiday',
        variant: 'error',
      });
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          name="name"
          label="Name"
          required
          type="text"
          placeholder="Enter holiday name"
        />

        <FormField
          name="description"
          label="Description"
          placeholder="Enter holiday description"
        >
          <Textarea placeholder="Enter holiday description" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="startDate"
            label="Start Date"
            required
          >
            <Calendar
              mode="single"
              disabled={(date: Date) => date < new Date()}
            />
          </FormField>

          <FormField
            name="endDate"
            label="End Date"
            required
          >
            <Calendar
              mode="single"
              disabled={(date: Date) => date < form.getValues('startDate')}
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
              <SelectValue placeholder="Select holiday type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NATIONAL">National</SelectItem>
              <SelectItem value="RELIGIOUS">Religious</SelectItem>
              <SelectItem value="INSTITUTIONAL">Institutional</SelectItem>
              <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
              <SelectItem value="WEATHER">Weather</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          name="affectsAll"
          label="Affects all campuses"
        >
          <Switch />
        </FormField>

        {!form.watch('affectsAll') && (
          <FormField
            name="campusIds"
            label="Select Campuses"
          >
            <ScrollArea className="h-[200px] border rounded-md p-4">
              {campuses.map((campus) => (
                <div key={campus.id} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={campus.id}
                    checked={form.watch('campusIds')?.includes(campus.id)}
                    onChange={(e) => {
                      const currentValue = form.getValues('campusIds') || [];
                      const newValue = e.target.checked
                        ? [...currentValue, campus.id]
                        : currentValue.filter((id) => id !== campus.id);
                      form.setValue('campusIds', newValue);
                    }}
                  />
                  <label htmlFor={campus.id} className="text-sm">
                    {campus.name}
                  </label>
                </div>
              ))}
            </ScrollArea>
          </FormField>
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'} Holiday
          </Button>
        </div>
      </form>
    </FormProvider>
  );
} 