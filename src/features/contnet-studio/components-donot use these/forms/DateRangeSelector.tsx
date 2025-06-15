'use client';

/**
 * DateRangeSelector
 * 
 * A reusable component for selecting date ranges.
 * Used primarily in lesson plan creation.
 */

import React from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define the schema for date range
const dateRangeSchema = z.object({
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
}).refine(data => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Define the form values type
export type DateRangeFormValues = z.infer<typeof dateRangeSchema>;

export interface DateRangeSelectorProps {
  onDateRangeChange: (dateRange: DateRangeFormValues) => void;
  defaultValues?: Partial<DateRangeFormValues>;
  className?: string;
  startDateLabel?: string;
  endDateLabel?: string;
  startDateDescription?: string;
  endDateDescription?: string;
}

export function DateRangeSelector({
  onDateRangeChange,
  defaultValues,
  className,
  startDateLabel = 'Start Date',
  endDateLabel = 'End Date',
  startDateDescription,
  endDateDescription,
}: DateRangeSelectorProps) {
  // Create form with default values
  const form = useForm<DateRangeFormValues>({
    resolver: zodResolver(dateRangeSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 1 week
      ...defaultValues,
    },
  });
  
  // Watch for changes and notify parent
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name && (name === 'startDate' || name === 'endDate')) {
        if (value.startDate && value.endDate) {
          onDateRangeChange({
            startDate: value.startDate,
            endDate: value.endDate,
          });
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, onDateRangeChange]);
  
  // Preset date ranges
  const presetRanges = [
    {
      label: 'This Week',
      getDates: () => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return { startDate: startOfWeek, endDate: endOfWeek };
      },
    },
    {
      label: 'Next Week',
      getDates: () => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 7);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return { startDate: startOfWeek, endDate: endOfWeek };
      },
    },
    {
      label: 'This Month',
      getDates: () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { startDate: startOfMonth, endDate: endOfMonth };
      },
    },
    {
      label: 'Next Month',
      getDates: () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        return { startDate: startOfMonth, endDate: endOfMonth };
      },
    },
  ];
  
  // Apply preset range
  const applyPresetRange = (preset: typeof presetRanges[number]) => {
    const { startDate, endDate } = preset.getDates();
    form.setValue('startDate', startDate);
    form.setValue('endDate', endDate);
    onDateRangeChange({ startDate, endDate });
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{startDateLabel}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {startDateDescription && (
                  <FormDescription>{startDateDescription}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{endDateLabel}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => date < form.getValues('startDate')}
                    />
                  </PopoverContent>
                </Popover>
                {endDateDescription && (
                  <FormDescription>{endDateDescription}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
      
      <div className="flex flex-wrap gap-2">
        {presetRanges.map((preset, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => applyPresetRange(preset)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
