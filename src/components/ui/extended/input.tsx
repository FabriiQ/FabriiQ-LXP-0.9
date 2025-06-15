'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input as CoreInput } from '../core/input';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface ExtendedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean | string;
  success?: boolean;
  helperText?: string;
  wrapperClassName?: string;
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent';
}

/**
 * Extended Input component with additional features
 * 
 * Features:
 * - Left and right icons
 * - Error and success states
 * - Helper text
 * - Role-specific styling
 * - Mobile-optimized with 16px font size
 * 
 * @example
 * ```tsx
 * <ExtendedInput placeholder="Enter your name" />
 * <ExtendedInput leftIcon={<UserIcon />} placeholder="Username" />
 * <ExtendedInput error="This field is required" helperText="Enter your email address" />
 * <ExtendedInput success helperText="Email is valid" />
 * <ExtendedInput role="teacher" placeholder="Teacher input" />
 * ```
 */
const ExtendedInput = React.forwardRef<HTMLInputElement, ExtendedInputProps>(
  ({ 
    className, 
    type, 
    leftIcon, 
    rightIcon, 
    error, 
    success,
    helperText, 
    wrapperClassName,
    role,
    ...props 
  }, ref) => {
    // Determine if we should show error or success state
    const showError = !!error;
    const showSuccess = !!success && !showError;
    
    // Determine the border color based on state and role
    const getBorderColor = () => {
      if (showError) return 'border-destructive';
      if (showSuccess) return 'border-green-500';
      if (role) {
        switch (role) {
          case 'systemAdmin': return 'focus-within:border-[#1F504B]';
          case 'campusAdmin': return 'focus-within:border-[#004EB2]';
          case 'teacher': return 'focus-within:border-[#5A8A84]';
          case 'student': return 'focus-within:border-[#2F96F4]';
          case 'parent': return 'focus-within:border-[#6126AE]';
          default: return '';
        }
      }
      return '';
    };
    
    // Determine the ring color based on state and role
    const getRingColor = () => {
      if (showError) return 'focus-within:ring-destructive';
      if (showSuccess) return 'focus-within:ring-green-500';
      if (role) {
        switch (role) {
          case 'systemAdmin': return 'focus-within:ring-[#1F504B]';
          case 'campusAdmin': return 'focus-within:ring-[#004EB2]';
          case 'teacher': return 'focus-within:ring-[#5A8A84]';
          case 'student': return 'focus-within:ring-[#2F96F4]';
          case 'parent': return 'focus-within:ring-[#6126AE]';
          default: return '';
        }
      }
      return '';
    };
    
    return (
      <div className={cn("space-y-1", wrapperClassName)}>
        <div 
          className={cn(
            "relative flex items-center rounded-md border border-input bg-background ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            showError && "border-destructive focus-within:ring-destructive",
            showSuccess && "border-green-500 focus-within:ring-green-500",
            getBorderColor(),
            getRingColor()
          )}
        >
          {leftIcon && (
            <div className="absolute left-3 flex h-full items-center text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <CoreInput
            type={type}
            className={cn(
              "border-0 bg-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          
          {(rightIcon || showError || showSuccess) && (
            <div className="absolute right-3 flex h-full items-center">
              {showError && <AlertCircle className="h-5 w-5 text-destructive" />}
              {showSuccess && <CheckCircle className="h-5 w-5 text-green-500" />}
              {!showError && !showSuccess && rightIcon}
            </div>
          )}
        </div>
        
        {(helperText || (typeof error === 'string' && error)) && (
          <p 
            className={cn(
              "text-sm",
              showError ? "text-destructive" : "text-muted-foreground",
              showSuccess && "text-green-500"
            )}
          >
            {showError && typeof error === 'string' ? error : helperText}
          </p>
        )}
      </div>
    );
  }
);
ExtendedInput.displayName = "ExtendedInput";

// Also export a backward-compatible Input component
const Input = ExtendedInput;

export { ExtendedInput, Input };
