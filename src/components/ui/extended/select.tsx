'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle } from 'lucide-react';
import {
  Select as CoreSelect,
  SelectContent as CoreSelectContent,
  SelectGroup as CoreSelectGroup,
  SelectItem as CoreSelectItem,
  SelectLabel as CoreSelectLabel,
  SelectSeparator as CoreSelectSeparator,
  SelectTrigger as CoreSelectTrigger,
  SelectValue as CoreSelectValue,
} from '../core/select';

export interface ExtendedSelectProps {
  options?: { value: string; label: string; disabled?: boolean }[];
  groups?: { label: string; options: { value: string; label: string; disabled?: boolean }[] }[];
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  error?: boolean | string;
  success?: boolean;
  helperText?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent';
  leftIcon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Extended Select component with additional features
 * 
 * Features:
 * - Simplified API with options and groups
 * - Error and success states
 * - Helper text and label
 * - Role-specific styling
 * - Mobile-optimized with touch-friendly sizing
 * 
 * @example
 * ```tsx
 * <ExtendedSelect 
 *   options={[
 *     { value: "option1", label: "Option 1" },
 *     { value: "option2", label: "Option 2" }
 *   ]} 
 *   placeholder="Select an option" 
 * />
 * 
 * <ExtendedSelect 
 *   groups={[
 *     { 
 *       label: "Group 1", 
 *       options: [
 *         { value: "option1", label: "Option 1" },
 *         { value: "option2", label: "Option 2" }
 *       ]
 *     }
 *   ]} 
 *   error="Please select an option"
 * />
 * ```
 */
const ExtendedSelect = React.forwardRef<HTMLButtonElement, ExtendedSelectProps>(
  ({ 
    options, 
    groups, 
    placeholder, 
    value, 
    defaultValue, 
    onChange, 
    error, 
    success,
    helperText, 
    label, 
    required, 
    disabled, 
    className, 
    wrapperClassName,
    role,
    leftIcon,
    children,
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
      if (showError) return 'focus:ring-destructive';
      if (showSuccess) return 'focus:ring-green-500';
      if (role) {
        switch (role) {
          case 'systemAdmin': return 'focus:ring-[#1F504B]';
          case 'campusAdmin': return 'focus:ring-[#004EB2]';
          case 'teacher': return 'focus:ring-[#5A8A84]';
          case 'student': return 'focus:ring-[#2F96F4]';
          case 'parent': return 'focus:ring-[#6126AE]';
          default: return '';
        }
      }
      return '';
    };
    
    // Handle change event
    const handleValueChange = (newValue: string) => {
      if (onChange) {
        onChange(newValue);
      }
    };
    
    return (
      <div className={cn("space-y-1", wrapperClassName)}>
        {label && (
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-medium">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </label>
          </div>
        )}
        
        <CoreSelect
          value={value}
          defaultValue={defaultValue}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <CoreSelectTrigger 
            ref={ref}
            className={cn(
              showError && "border-destructive focus:ring-destructive",
              showSuccess && "border-green-500 focus:ring-green-500",
              getBorderColor(),
              getRingColor(),
              leftIcon && "pl-10",
              className
            )}
          >
            {leftIcon && (
              <div className="absolute left-3 flex h-full items-center text-muted-foreground">
                {leftIcon}
              </div>
            )}
            <CoreSelectValue placeholder={placeholder} />
            {(showError || showSuccess) && (
              <div className="absolute right-8 flex h-full items-center">
                {showError && <AlertCircle className="h-5 w-5 text-destructive" />}
                {showSuccess && <CheckCircle className="h-5 w-5 text-green-500" />}
              </div>
            )}
          </CoreSelectTrigger>
          
          <CoreSelectContent>
            {/* If children are provided, use them directly */}
            {children}
            
            {/* If options are provided, render them */}
            {!children && options && options.map((option) => (
              <CoreSelectItem 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </CoreSelectItem>
            ))}
            
            {/* If groups are provided, render them */}
            {!children && groups && groups.map((group, index) => (
              <React.Fragment key={group.label || index}>
                <CoreSelectGroup>
                  {group.label && <CoreSelectLabel>{group.label}</CoreSelectLabel>}
                  {group.options.map((option) => (
                    <CoreSelectItem 
                      key={option.value} 
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </CoreSelectItem>
                  ))}
                </CoreSelectGroup>
                {index < groups.length - 1 && <CoreSelectSeparator />}
              </React.Fragment>
            ))}
          </CoreSelectContent>
        </CoreSelect>
        
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
ExtendedSelect.displayName = "ExtendedSelect";

// Export all components for more granular usage
export {
  ExtendedSelect,
  CoreSelect as Select,
  CoreSelectContent as SelectContent,
  CoreSelectGroup as SelectGroup,
  CoreSelectItem as SelectItem,
  CoreSelectLabel as SelectLabel,
  CoreSelectSeparator as SelectSeparator,
  CoreSelectTrigger as SelectTrigger,
  CoreSelectValue as SelectValue,
};
