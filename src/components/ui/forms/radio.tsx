'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

// Types
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /**
   * Label for the radio button
   */
  label?: React.ReactNode;
  /**
   * Description text displayed below the label
   */
  description?: React.ReactNode;
  /**
   * Error message
   */
  error?: string;
  /**
   * Custom class for the container
   */
  containerClassName?: string;
  /**
   * Custom class for the radio button
   */
  radioClassName?: string;
  /**
   * Custom class for the label
   */
  labelClassName?: string;
  /**
   * Custom class for the description
   */
  descriptionClassName?: string;
}

export interface RadioGroupProps {
  /**
   * Name for the radio group
   */
  name: string;
  /**
   * Label for the radio group
   */
  label?: React.ReactNode;
  /**
   * Description text displayed below the label
   */
  description?: React.ReactNode;
  /**
   * Error message
   */
  error?: string;
  /**
   * Array of radio options
   */
  options: {
    value: string;
    label: React.ReactNode;
    description?: React.ReactNode;
    disabled?: boolean;
    icon?: React.ReactNode;
  }[];
  /**
   * Selected value
   */
  value?: string;
  /**
   * Called when selection changes
   */
  onChange?: (value: string) => void;
  /**
   * Whether the radio group is disabled
   */
  disabled?: boolean;
  /**
   * Whether the radio group is required
   */
  required?: boolean;
  /**
   * Layout direction
   * @default 'vertical'
   */
  direction?: 'horizontal' | 'vertical';
  /**
   * Custom class for the container
   */
  className?: string;
  /**
   * Custom class for the radio button
   */
  radioClassName?: string;
  /**
   * Custom class for the label
   */
  labelClassName?: string;
  /**
   * Custom class for the description
   */
  descriptionClassName?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({
    className,
    label,
    description,
    error,
    containerClassName,
    radioClassName,
    labelClassName,
    descriptionClassName,
    disabled,
    checked,
    onChange,
    ...props
  }, ref) => {
    return (
      <div className={cn("flex items-start", containerClassName)}>
        <div className="flex items-center h-5">
          <input
            type="radio"
            ref={ref}
            className="sr-only"
            disabled={disabled}
            checked={checked}
            onChange={onChange}
            {...props}
          />
          <div
            className={cn(
              "flex items-center justify-center w-5 h-5 rounded-full border",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              checked
                ? "border-primary"
                : "border-input",
              disabled && "opacity-50 cursor-not-allowed",
              error && "border-destructive",
              radioClassName
            )}
          >
            {checked && (
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
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

Radio.displayName = "Radio";

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  description,
  error,
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  direction = 'vertical',
  className,
  radioClassName,
  labelClassName,
  descriptionClassName,
}) => {
  // Handle change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Group label */}
      {label && (
        <div className="flex items-baseline justify-between">
          <div>
            <label className="text-sm font-medium">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </label>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Radio options */}
      <div
        className={cn(
          "space-y-3",
          direction === 'horizontal' && "sm:flex sm:flex-wrap sm:space-y-0 sm:space-x-6"
        )}
        role="radiogroup"
        aria-labelledby={label ? `${name}-label` : undefined}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            id={`${name}-${option.value}`}
            value={option.value}
            checked={value === option.value}
            onChange={handleChange}
            disabled={disabled || option.disabled}
            label={option.label}
            description={option.description}
            error={undefined}
            containerClassName={cn(
              direction === 'horizontal' && "sm:flex-none",
              radioClassName
            )}
            labelClassName={labelClassName}
            descriptionClassName={descriptionClassName}
          />
        ))}
      </div>
      
      {/* Error message */}
      {error && (
        <p className="text-destructive text-xs mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

RadioGroup.displayName = "RadioGroup";

export default Radio; 