'use client';

import * as React from 'react';
import { DatePicker as ShadcnDatePicker } from '@/components/ui/date-picker';

// Types
type DatePickerType = 'single' | 'range';

interface DatePickerBaseProps {
  /**
   * Type of date picker
   * @default 'single'
   */
  type?: DatePickerType;
  /**
   * Label for the date picker
   */
  label?: string;
  /**
   * Helper text displayed below the input
   */
  helperText?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Whether the date picker is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Custom class for the container
   */
  className?: string;
  /**
   * Date format string
   * @default 'PP' (e.g., 'Apr 29, 2023')
   */
  dateFormat?: string;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Whether the date picker is required
   * @default false
   */
  required?: boolean;
  /**
   * Minimum selectable date
   */
  minDate?: Date;
  /**
   * Maximum selectable date
   */
  maxDate?: Date;
}

interface SingleDatePickerProps extends DatePickerBaseProps {
  type?: 'single';
  /**
   * Selected date
   */
  selected?: Date;
  /**
   * Called when date changes
   */
  onSelect?: (date?: Date) => void;
}

interface RangeDatePickerProps extends DatePickerBaseProps {
  type: 'range';
  /**
   * Selected date range
   */
  selected?: { from?: Date; to?: Date };
  /**
   * Called when date range changes
   */
  onSelect?: (range?: { from?: Date; to?: Date }) => void;
}

export type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

export function DatePicker(props: DatePickerProps) {
  const {
    type = 'single',
    label,
    helperText,
    error,
    disabled = false,
    className,
    dateFormat = 'PP',
    placeholder = 'Select date',
    required = false,
    minDate,
    maxDate,
  } = props;

  // For single date picker
  if (type === 'single' && 'selected' in props) {
    return (
      <ShadcnDatePicker
        value={props.selected}
        onChange={props.onSelect}
        label={label}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        error={error}
        helperText={helperText}
        required={required}
        fromDate={minDate}
        toDate={maxDate}
      />
    );
  }

  // For range date picker (fallback to single date picker for now)
  if (type === 'range' && 'selected' in props && props.selected) {
    return (
      <div className="space-y-4">
        <ShadcnDatePicker
          value={props.selected.from}
          onChange={(date) => {
            if (props.onSelect) {
              props.onSelect({
                from: date,
                to: props.selected?.to,
              });
            }
          }}
          label={`${label} (Start)`}
          placeholder={`${placeholder} (Start)`}
          disabled={disabled}
          className={className}
          error={error}
          helperText={helperText}
          required={required}
          fromDate={minDate}
          toDate={props.selected?.to || maxDate}
        />
        <ShadcnDatePicker
          value={props.selected.to}
          onChange={(date) => {
            if (props.onSelect) {
              props.onSelect({
                from: props.selected?.from,
                to: date,
              });
            }
          }}
          label={`${label} (End)`}
          placeholder={`${placeholder} (End)`}
          disabled={disabled}
          className={className}
          error={error}
          helperText={helperText}
          required={required}
          fromDate={props.selected?.from || minDate}
          toDate={maxDate}
        />
      </div>
    );
  }

  // Default fallback
  return (
    <ShadcnDatePicker
      value={undefined}
      onChange={props.type === 'single' && 'onSelect' in props ? props.onSelect : undefined}
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      error={error}
      helperText={helperText}
      required={required}
      fromDate={minDate}
      toDate={maxDate}
    />
  );
} 