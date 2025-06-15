'use client';

import React, { useState } from 'react';
import { useFormContext, Controller, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExtendedInput } from '../extended/input';
import { Label } from '@/components/ui/atoms/label';

// Types
export interface FormFieldProps<TFormValues extends FieldValues> {
  name: Path<TFormValues>;
  label?: string;
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
  rules?: Omit<RegisterOptions<TFormValues, Path<TFormValues>>, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent';
  children?: React.ReactNode;
}

/**
 * FormField component that integrates with react-hook-form
 * 
 * Features:
 * - Integration with react-hook-form
 * - Validation support with error messages
 * - Label, helper text, and icons
 * - Animation for error messages
 * - Role-specific styling
 * - Mobile-optimized with responsive design
 * 
 * @example
 * ```tsx
 * <FormProvider {...methods}>
 *   <FormField 
 *     name="email" 
 *     label="Email Address" 
 *     type="email" 
 *     required 
 *     rules={{ 
 *       pattern: { 
 *         value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
 *         message: "Invalid email address" 
 *       } 
 *     }}
 *   />
 * </FormProvider>
 * ```
 */
export function FormField<TFormValues extends FieldValues>({
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
  rules,
  leftIcon,
  rightIcon,
  role,
  children,
}: FormFieldProps<TFormValues>) {
  const { control, formState } = useFormContext<TFormValues>();
  const { errors } = formState;
  const [isFocused, setIsFocused] = useState(false);

  // Error animation variants
  const errorVariants = {
    hidden: { opacity: 0, y: -10, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto' },
  };

  // If children are provided, render them with Controller
  if (children) {
    return (
      <Controller
        control={control}
        name={name}
        rules={{ required: required ? 'This field is required' : false, ...rules }}
        render={({ field, fieldState }) => (
          <div className={cn("space-y-2", className)}>
            {label && (
              <Label 
                htmlFor={name} 
                className={cn(
                  "text-sm font-medium",
                  fieldState.error && "text-destructive",
                  labelClassName
                )}
              >
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </Label>
            )}
            
            {React.cloneElement(children as React.ReactElement, {
              id: name,
              ...field,
              disabled,
              error: fieldState.error?.message,
              success: showSuccessIcon && !fieldState.error && field.value,
              onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
                setIsFocused(true);
                if ((children as React.ReactElement).props.onFocus) {
                  (children as React.ReactElement).props.onFocus(e);
                }
              },
              onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                field.onBlur();
                setIsFocused(false);
                if ((children as React.ReactElement).props.onBlur) {
                  (children as React.ReactElement).props.onBlur(e);
                }
              },
            })}
            
            <AnimatePresence>
              {(fieldState.error || (!fieldState.error && helperText && !isFocused)) && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={errorVariants}
                  transition={{ duration: 0.2 }}
                >
                  <p 
                    className={cn(
                      "text-sm mt-1",
                      fieldState.error ? "text-destructive" : "text-muted-foreground",
                      errorClassName
                    )}
                  >
                    {fieldState.error ? fieldState.error.message : helperText}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      />
    );
  }

  // Default rendering with ExtendedInput
  return (
    <Controller
      control={control}
      name={name}
      rules={{ required: required ? 'This field is required' : false, ...rules }}
      render={({ field, fieldState }) => (
        <div className={cn("space-y-2", className)}>
          {label && (
            <Label 
              htmlFor={name} 
              className={cn(
                "text-sm font-medium",
                fieldState.error && "text-destructive",
                labelClassName
              )}
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          
          <ExtendedInput
            {...field}
            id={name}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            error={fieldState.error?.message}
            success={showSuccessIcon && !fieldState.error && field.value}
            helperText={helperText}
            className={inputClassName}
            leftIcon={leftIcon}
            rightIcon={rightIcon}
            role={role}
            onFocus={(e) => {
              setIsFocused(true);
              if (field.onFocus) {
                field.onFocus(e);
              }
            }}
            onBlur={(e) => {
              field.onBlur();
              setIsFocused(false);
              if (field.onBlur) {
                field.onBlur(e);
              }
            }}
          />
          
          <AnimatePresence>
            {(fieldState.error || (!fieldState.error && helperText && !isFocused)) && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={errorVariants}
                transition={{ duration: 0.2 }}
              >
                <p 
                  className={cn(
                    "text-sm mt-1",
                    fieldState.error ? "text-destructive" : "text-muted-foreground",
                    errorClassName
                  )}
                >
                  {fieldState.error ? fieldState.error.message : helperText}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    />
  );
}
