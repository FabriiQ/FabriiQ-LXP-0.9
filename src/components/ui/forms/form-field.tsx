'use client';

import React, { useState } from 'react';
import { useFormContext, Controller, ControllerRenderProps, FieldValues } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/atoms/input';

// Types
interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  helperClassName?: string;
  showSuccessIcon?: boolean;
  children?: React.ReactNode;
}

// Form Field Component
export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  helperText,
  required = false,
  disabled = false,
  className,
  inputClassName,
  labelClassName,
  errorClassName,
  helperClassName,
  showSuccessIcon = false,
  children,
}: FormFieldProps) {
  const { control, formState } = useFormContext();
  const { errors } = formState;
  const [isFocused, setIsFocused] = useState(false);

  // Error animation variants
  const errorVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto' },
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <div className="flex justify-between items-center">
        <label
          htmlFor={name}
          className={cn(
            "text-sm font-medium",
            errors[name] ? "text-destructive" : "text-foreground",
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        
        {/* Helper Text */}
        {helperText && (
          <span className={cn("text-xs text-muted-foreground", helperClassName)}>
            {helperText}
          </span>
        )}
      </div>

      {/* Input Field */}
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const hasError = !!errors[name];
          const isValid = !hasError && field.value && showSuccessIcon;

          return (
            <div className="relative">
              {children ? (
                // Use children if provided (for custom inputs)
                <div
                  className={cn(
                    "relative",
                    hasError && "has-error",
                    isValid && "is-valid"
                  )}
                >
                  {React.cloneElement(children as React.ReactElement, {
                    id: name,
                    ...field,
                    disabled,
                    onFocus: () => {
                      setIsFocused(true);
                      // Handle onFocus safely
                      const customField = field as unknown as { onFocus?: () => void };
                      if (customField.onFocus) customField.onFocus();
                    },
                    onBlur: () => {
                      setIsFocused(false);
                      field.onBlur();
                    },
                  })}
                </div>
              ) : (
                // Default input
                <div className="relative">
                  <Input
                    id={name}
                    type={type}
                    placeholder={placeholder}
                    className={cn(
                      hasError && "border-destructive focus-visible:ring-destructive",
                      isValid && "border-green-500 focus-visible:ring-green-500",
                      inputClassName
                    )}
                    disabled={disabled}
                    {...field}
                    onFocus={() => {
                      setIsFocused(true);
                      // Handle onFocus safely
                      const customField = field as unknown as { onFocus?: () => void };
                      if (customField.onFocus) customField.onFocus();
                    }}
                    onBlur={() => {
                      setIsFocused(false);
                      field.onBlur();
                    }}
                  />
                  
                  {/* Status Icons */}
                  {(hasError || isValid) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      {hasError ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : isValid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              <AnimatePresence>
                {errors[name] && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={errorVariants}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p
                      className={cn(
                        "text-xs text-destructive mt-1 animate-in fade-in-50",
                        errorClassName
                      )}
                    >
                      {errors[name]?.message as string}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }}
      />
    </div>
  );
}

export default FormField; 