import React, { useState } from 'react';
import { format, subDays, subMonths } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/core/button';
import { Calendar } from '@/components/ui/core/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/core/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/core/select';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateRangePreset {
  id: string;
  label: string;
  getValue: () => DateRange;
}

export interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: DateRangePreset[];
  maxDate?: Date;
  minDate?: Date;
  className?: string;
}

export function DateRangeSelector({
  value,
  onChange,
  presets,
  maxDate = new Date(),
  minDate,
  className = '',
}: DateRangeSelectorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Default presets if none provided
  const defaultPresets: DateRangePreset[] = [
    {
      id: 'today',
      label: 'Today',
      getValue: () => ({
        from: new Date(new Date().setHours(0, 0, 0, 0)),
        to: new Date(new Date().setHours(23, 59, 59, 999)),
      }),
    },
    {
      id: 'yesterday',
      label: 'Yesterday',
      getValue: () => ({
        from: new Date(subDays(new Date(), 1).setHours(0, 0, 0, 0)),
        to: new Date(subDays(new Date(), 1).setHours(23, 59, 59, 999)),
      }),
    },
    {
      id: 'last7days',
      label: 'Last 7 days',
      getValue: () => ({
        from: new Date(subDays(new Date(), 6).setHours(0, 0, 0, 0)),
        to: new Date(new Date().setHours(23, 59, 59, 999)),
      }),
    },
    {
      id: 'last30days',
      label: 'Last 30 days',
      getValue: () => ({
        from: new Date(subDays(new Date(), 29).setHours(0, 0, 0, 0)),
        to: new Date(new Date().setHours(23, 59, 59, 999)),
      }),
    },
    {
      id: 'thisMonth',
      label: 'This month',
      getValue: () => {
        const now = new Date();
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: new Date(new Date().setHours(23, 59, 59, 999)),
        };
      },
    },
    {
      id: 'lastMonth',
      label: 'Last month',
      getValue: () => {
        const now = new Date();
        const lastMonth = subMonths(now, 1);
        return {
          from: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          to: new Date(new Date(now.getFullYear(), now.getMonth(), 0).setHours(23, 59, 59, 999)),
        };
      },
    },
  ];

  const allPresets = presets || defaultPresets;

  // Handle preset selection
  const handlePresetChange = (presetId: string) => {
    const preset = allPresets.find((p) => p.id === presetId);
    if (preset) {
      const range = preset.getValue();
      onChange(range);
    }
  };

  // Format date range for display
  const formatDateRange = (range: DateRange) => {
    return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
  };

  // Find if current range matches a preset
  const findMatchingPreset = () => {
    return allPresets.find((preset) => {
      const presetRange = preset.getValue();
      return (
        format(presetRange.from, 'yyyy-MM-dd') === format(value.from, 'yyyy-MM-dd') &&
        format(presetRange.to, 'yyyy-MM-dd') === format(value.to, 'yyyy-MM-dd')
      );
    });
  };

  const matchingPreset = findMatchingPreset();

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <Select
        value={matchingPreset?.id || 'custom'}
        onValueChange={handlePresetChange}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {allPresets.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.label}
            </SelectItem>
          ))}
          {!matchingPreset && <SelectItem value="custom">Custom Range</SelectItem>}
        </SelectContent>
      </Select>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full sm:w-auto justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            defaultMonth={value.from}
            selected={value.from}
            onSelect={(date) => {
              if (date) {
                // For simplicity, just use the selected date for both from and to
                onChange({
                  from: new Date(new Date(date).setHours(0, 0, 0, 0)),
                  to: new Date(new Date(date).setHours(23, 59, 59, 999)),
                });
                setIsCalendarOpen(false);
              }
            }}
            disabled={(date) => {
              if (maxDate && date > maxDate) {
                return true;
              }
              if (minDate && date < minDate) {
                return true;
              }
              return false;
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
