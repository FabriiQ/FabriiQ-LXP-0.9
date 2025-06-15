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

const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  type: z.enum(['NATIONAL', 'RELIGIOUS', 'INSTITUTIONAL', 'ADMINISTRATIVE', 'WEATHER', 'OTHER']),
  affectsAll: z.boolean(),
  campusIds: z.array(z.string()).optional(),
});

type HolidayFormData = z.infer<typeof holidaySchema>;

interface HolidayFormProps {
  initialData?: Partial<HolidayFormData>;
  onSubmit: (data: HolidayFormData) => void;
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
  
  const form = useForm<HolidayFormData>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      ...initialData,
      affectsAll: initialData?.affectsAll ?? true,
    },
  });

  const affectsAll = form.watch('affectsAll');

  const holidayTypes = [
    { value: 'NATIONAL', label: 'National Holiday' },
    { value: 'RELIGIOUS', label: 'Religious Holiday' },
    { value: 'INSTITUTIONAL', label: 'Institutional Holiday' },
    { value: 'ADMINISTRATIVE', label: 'Administrative Holiday' },
    { value: 'WEATHER', label: 'Weather-related Holiday' },
    { value: 'OTHER', label: 'Other' },
  ];

  const campusOptions = campuses.map(campus => ({
    value: campus.id,
    label: campus.name,
  }));

  const handleFormSubmit = async (data: HolidayFormData) => {
    try {
      await onSubmit(data);
      toast({
        title: 'Success',
        description: `Holiday ${initialData ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create holiday',
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
              <FormLabel>Holiday Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter holiday name" {...field} />
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
                  placeholder="Enter holiday description"
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
              <FormLabel>Holiday Type</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select holiday type" />
                  </SelectTrigger>
                  <SelectContent>
                    {holidayTypes.map(type => (
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
          name="affectsAll"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="affectsAll"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <div className="space-y-1 leading-none">
                    <label
                      htmlFor="affectsAll"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      This holiday affects all campuses
                    </label>
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {!affectsAll && (
          <FormField
            control={form.control}
            name="campusIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Campuses</FormLabel>
                <FormControl>
                  <Select value={field.value?.[0] || ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campuses" />
                    </SelectTrigger>
                    <SelectContent>
                      {campusOptions.map(campus => (
                        <SelectItem key={campus.value} value={campus.value}>
                          {campus.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
            {form.formState.isSubmitting ? 'Saving...' : initialData ? 'Update Holiday' : 'Create Holiday'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 