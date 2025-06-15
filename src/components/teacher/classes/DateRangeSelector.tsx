'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface DateRangeSelectorProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

/**
 * DateRangeSelector component for selecting a date range
 * 
 * Features:
 * - Date range picker with calendar
 * - Preset options (Today, This Week, This Month, etc.)
 * - Clear selection option
 * - Accessible design
 */
export function DateRangeSelector({
  dateRange,
  onDateRangeChange,
  align = 'start',
  className,
}: DateRangeSelectorProps) {
  const [open, setOpen] = useState(false);

  // Format the date range for display
  const formatDateRange = (range: DateRange | undefined) => {
    if (!range) {
      return 'Select dates';
    }

    if (range.from && !range.to) {
      return format(range.from, 'PPP');
    }

    if (range.from && range.to) {
      if (format(range.from, 'LLL dd, y') === format(range.to, 'LLL dd, y')) {
        return format(range.from, 'PPP');
      }
      return `${format(range.from, 'LLL dd, y')} - ${format(range.to, 'LLL dd, y')}`;
    }

    return 'Select dates';
  };

  // Preset date ranges
  const presets = [
    {
      name: 'Today',
      getValue: () => {
        const today = new Date();
        return { from: today, to: today };
      },
    },
    {
      name: 'Yesterday',
      getValue: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return { from: yesterday, to: yesterday };
      },
    },
    {
      name: 'This Week',
      getValue: () => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { from: startOfWeek, to: today };
      },
    },
    {
      name: 'Last Week',
      getValue: () => {
        const today = new Date();
        const endOfLastWeek = new Date(today);
        endOfLastWeek.setDate(today.getDate() - today.getDay() - 1);
        const startOfLastWeek = new Date(endOfLastWeek);
        startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
        return { from: startOfLastWeek, to: endOfLastWeek };
      },
    },
    {
      name: 'This Month',
      getValue: () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from: startOfMonth, to: today };
      },
    },
    {
      name: 'Last Month',
      getValue: () => {
        const today = new Date();
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        return { from: startOfLastMonth, to: endOfLastMonth };
      },
    },
  ];

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(dateRange)}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex flex-col sm:flex-row">
            <div className="border-r p-2 sm:w-48">
              <div className="flex flex-col gap-1 py-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="ghost"
                    className="justify-start font-normal"
                    onClick={() => {
                      onDateRangeChange(preset.getValue());
                      setOpen(false);
                    }}
                  >
                    {preset.name}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="justify-start font-normal text-muted-foreground"
                  onClick={() => {
                    onDateRangeChange(undefined);
                    setOpen(false);
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
            <div className="p-2">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={1}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
