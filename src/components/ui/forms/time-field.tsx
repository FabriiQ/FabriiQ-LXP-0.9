'use client';

import { Input } from './input';
import { forwardRef } from 'react';

interface TimeFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TimeField = forwardRef<HTMLInputElement, TimeFieldProps>(
  ({ error, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="time"
        className={error ? 'border-destructive' : ''}
        {...props}
      />
    );
  }
);

TimeField.displayName = 'TimeField';