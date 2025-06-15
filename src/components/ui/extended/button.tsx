'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button as CoreButton, buttonVariants } from '../core/button';

// Extended button variants that include role-specific styling
const extendedButtonVariants = cva(
  // Base styles - mobile-first approach with adequate touch target size
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Role-specific variants
        systemAdmin: "bg-[#1F504B] text-white hover:bg-[#1F504B]/90",
        campusAdmin: "bg-[#004EB2] text-white hover:bg-[#004EB2]/90",
        teacher: "bg-[#5A8A84] text-white hover:bg-[#5A8A84]/90",
        student: "bg-[#2F96F4] text-white hover:bg-[#2F96F4]/90",
        parent: "bg-[#6126AE] text-white hover:bg-[#6126AE]/90",
      },
      size: {
        // Ensure minimum 44x44px touch target for mobile
        default: "h-11 px-4 py-2 min-h-[44px] min-w-[44px]",
        sm: "h-9 rounded-md px-3 min-h-[36px]",
        lg: "h-12 rounded-md px-8 min-h-[48px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ExtendedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: string;
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * Extended Button component with additional features
 *
 * Features:
 * - Loading state with spinner
 * - Left and right icons
 * - Tooltip support
 * - Role-specific styling
 * - Minimum touch target size of 44x44px for better mobile usability
 *
 * @example
 * ```tsx
 * <ExtendedButton>Click me</ExtendedButton>
 * <ExtendedButton isLoading>Loading</ExtendedButton>
 * <ExtendedButton leftIcon={<Icon />}>With Icon</ExtendedButton>
 * <ExtendedButton role="teacher">Teacher Button</ExtendedButton>
 * ```
 */
const ExtendedButton = React.forwardRef<HTMLButtonElement, ExtendedButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    isLoading = false,
    leftIcon,
    rightIcon,
    tooltip,
    role,
    children,
    ...props
  }, ref) => {
    // If role is provided, use it as the variant
    const buttonVariant = role || variant;

    // Determine the content based on loading state and icons
    const content = (
      <>
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!isLoading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </>
    );

    // If tooltip is provided, wrap the button in a tooltip component
    // For now, we'll just use the title attribute
    const buttonProps = tooltip ? { title: tooltip, ...props } : props;

    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(extendedButtonVariants({ variant: buttonVariant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...buttonProps}
      >
        {content}
      </Comp>
    );
  }
);
ExtendedButton.displayName = "ExtendedButton";

// Also export a backward-compatible Button component
const Button = ExtendedButton;

export { ExtendedButton, Button, extendedButtonVariants };
