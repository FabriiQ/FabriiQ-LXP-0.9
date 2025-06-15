'use client';

import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

// Types
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /**
   * Label for the checkbox
   */
  label?: React.ReactNode;
  /**
   * Description text displayed below the label
   */
  description?: React.ReactNode;
  /**
   * Whether the checkbox is in an indeterminate state
   */
  indeterminate?: boolean;
  /**
   * Error message
   */
  error?: string;
  /**
   * Custom class for the container
   */
  containerClassName?: string;
  /**
   * Custom class for the checkbox
   */
  checkboxClassName?: string;
  /**
   * Custom class for the label
   */
  labelClassName?: string;
  /**
   * Custom class for the description
   */
  descriptionClassName?: string;
  /**
   * Callback when the checkbox is checked or unchecked
   */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /**
   * Alternative callback for React Hook Form compatibility
   */
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({
    className,
    label,
    description,
    indeterminate = false,
    error,
    containerClassName,
    checkboxClassName,
    labelClassName,
    descriptionClassName,
    disabled,
    checked,
    onChange,
    onCheckedChange,
    ...props
  }, ref) => {
    // Create a local ref
    const internalRef = React.useRef<HTMLInputElement>(null);
    
    // Update indeterminate state when it changes
    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);
    
    // Forward the ref
    React.useImperativeHandle(ref, () => internalRef.current as HTMLInputElement);
    
    // Handle both onChange and onCheckedChange
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };
    
    return (
      <div className={cn("flex items-start", containerClassName)}>
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            ref={internalRef}
            className="sr-only"
            disabled={disabled}
            checked={checked}
            onChange={handleChange}
            {...props}
          />
          <div
            className={cn(
              "flex items-center justify-center w-5 h-5 rounded border",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              checked || indeterminate
                ? "bg-primary border-primary text-primary-foreground"
                : "border-input",
              disabled && "opacity-50 cursor-not-allowed",
              error && "border-destructive",
              checkboxClassName
            )}
            onClick={() => {
              if (!disabled && internalRef.current) {
                internalRef.current.click();
              }
            }}
          >
            {checked && !indeterminate && (
              <Check className="h-3.5 w-3.5 text-current" />
            )}
            {indeterminate && (
              <Minus className="h-3.5 w-3.5 text-current" />
            )}
          </div>
        </div>
        
        {(label || description) && (
          <div className="ml-3 text-sm">
            {label && (
              <label
                htmlFor={props.id}
                className={cn(
                  "font-medium",
                  disabled && "opacity-50 cursor-not-allowed",
                  labelClassName
                )}
                onClick={() => {
                  if (!disabled && internalRef.current) {
                    internalRef.current.click();
                  }
                }}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={cn("text-muted-foreground mt-1", descriptionClassName)}>
                {description}
              </p>
            )}
            {error && (
              <p className="text-destructive mt-1 text-xs">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox; 