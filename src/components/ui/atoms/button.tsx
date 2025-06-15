/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Please use @/components/ui/core/button or @/components/ui/extended/button instead.
 */

'use client';

import * as React from 'react';
import { Button as CoreButton, ButtonProps as CoreButtonProps, buttonVariants } from '@/components/ui/core/button';

// Re-export the ButtonProps interface with variant and size props
export interface ButtonProps extends CoreButtonProps {
  isLoading?: boolean;
}

/**
 * Button component that wraps the core Button component
 * This is a compatibility layer for existing code that uses the atoms/button component
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ isLoading, children, disabled, ...props }, ref) => {
    return (
      <CoreButton
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {children}
          </div>
        ) : (
          children
        )}
      </CoreButton>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
