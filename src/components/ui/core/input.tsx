'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  helperText?: string;
}

/**
 * Input component with mobile-first design
 *
 * Features:
 * - 16px font size to prevent zoom on iOS
 * - Adequate touch target size
 * - Accessible focus states
 * - Support for all standard input attributes
 *
 * @example
 * ```tsx
 * <Input type="text" placeholder="Enter your name" />
 * <Input type="email" placeholder="Enter your email" required />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, helperText, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <input
          type={type}
          className={cn(
            // Mobile-first styles with 16px font size to prevent zoom on iOS
            "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            // Apply custom className if provided
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && (
          <p className="text-xs text-destructive">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
