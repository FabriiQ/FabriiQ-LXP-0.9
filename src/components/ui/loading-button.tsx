'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  loadingIcon?: React.ReactNode;
}

/**
 * LoadingButton component with microinteractions
 * 
 * Features:
 * - Shows loading spinner when loading
 * - Disables button during loading
 * - Customizable loading text
 * - Smooth transitions
 * - Maintains button size during loading
 */
export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    children, 
    loading = false, 
    loadingText, 
    icon, 
    loadingIcon,
    disabled,
    className,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;
    
    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "relative transition-all duration-200 ease-in-out",
          loading && "cursor-not-allowed",
          className
        )}
        {...props}
      >
        <span className={cn(
          "flex items-center justify-center gap-2 transition-opacity duration-200",
          loading && "opacity-0"
        )}>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </span>
        
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center gap-2">
            {loadingIcon || <Loader2 className="h-4 w-4 animate-spin" />}
            {loadingText && (
              <span className="text-sm font-medium">
                {loadingText}
              </span>
            )}
          </span>
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

// Preset variants for common use cases
export const CreateButton = React.forwardRef<HTMLButtonElement, Omit<LoadingButtonProps, 'loadingText'>>(
  ({ loading, children, ...props }, ref) => (
    <LoadingButton
      ref={ref}
      loading={loading}
      loadingText={loading ? "Creating..." : undefined}
      {...props}
    >
      {children || "Create"}
    </LoadingButton>
  )
);

export const SaveButton = React.forwardRef<HTMLButtonElement, Omit<LoadingButtonProps, 'loadingText'>>(
  ({ loading, children, ...props }, ref) => (
    <LoadingButton
      ref={ref}
      loading={loading}
      loadingText={loading ? "Saving..." : undefined}
      {...props}
    >
      {children || "Save"}
    </LoadingButton>
  )
);

export const UpdateButton = React.forwardRef<HTMLButtonElement, Omit<LoadingButtonProps, 'loadingText'>>(
  ({ loading, children, ...props }, ref) => (
    <LoadingButton
      ref={ref}
      loading={loading}
      loadingText={loading ? "Updating..." : undefined}
      {...props}
    >
      {children || "Update"}
    </LoadingButton>
  )
);

export const DeleteButton = React.forwardRef<HTMLButtonElement, Omit<LoadingButtonProps, 'loadingText'>>(
  ({ loading, children, ...props }, ref) => (
    <LoadingButton
      ref={ref}
      loading={loading}
      loadingText={loading ? "Deleting..." : undefined}
      variant="destructive"
      {...props}
    >
      {children || "Delete"}
    </LoadingButton>
  )
);

export const SubmitButton = React.forwardRef<HTMLButtonElement, Omit<LoadingButtonProps, 'loadingText'>>(
  ({ loading, children, ...props }, ref) => (
    <LoadingButton
      ref={ref}
      loading={loading}
      loadingText={loading ? "Submitting..." : undefined}
      {...props}
    >
      {children || "Submit"}
    </LoadingButton>
  )
);

CreateButton.displayName = "CreateButton";
SaveButton.displayName = "SaveButton";
UpdateButton.displayName = "UpdateButton";
DeleteButton.displayName = "DeleteButton";
SubmitButton.displayName = "SubmitButton";
