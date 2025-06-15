'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  Card as CoreCard,
  CardHeader as CoreCardHeader,
  CardTitle as CoreCardTitle,
  CardDescription as CoreCardDescription,
  CardContent as CoreCardContent,
  CardFooter as CoreCardFooter
} from '../core/card';

// Extended card variants
const extendedCardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "",
        outline: "bg-background shadow-none",
        filled: "bg-muted",
        elevated: "shadow-md",
        interactive: "hover:shadow-md transition-shadow cursor-pointer",
        // Role-specific variants
        systemAdmin: "border-[#1F504B]/20 bg-[#D8E3E0]/20",
        campusAdmin: "border-[#004EB2]/20 bg-[#E6F0FF]/20",
        teacher: "border-[#5A8A84]/20 bg-[#EDF3F2]/20",
        student: "border-[#2F96F4]/20 bg-[#EBF5FF]/20",
        parent: "border-[#6126AE]/20 bg-[#F3E6FF]/20",
        coordinator: "border-[#3B82F6]/20 bg-[#EFF6FF]/20",
      },
      size: {
        default: "",
        sm: "p-2",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ExtendedCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent' | 'coordinator';
  variant?: 'default' | 'outline' | 'filled' | 'elevated' | 'interactive' | 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent' | 'coordinator';
  size?: 'default' | 'sm' | 'lg';
}

/**
 * Extended Card component with additional variants and features
 *
 * Features:
 * - Additional variants (outline, filled, elevated, interactive)
 * - Role-specific styling
 * - Size variants
 * - Mobile-optimized with responsive padding
 *
 * @example
 * ```tsx
 * <ExtendedCard>Basic card</ExtendedCard>
 * <ExtendedCard variant="elevated">Elevated card</ExtendedCard>
 * <ExtendedCard variant="interactive">Interactive card</ExtendedCard>
 * <ExtendedCard role="teacher">Teacher card</ExtendedCard>
 * ```
 */
const ExtendedCard = React.forwardRef<HTMLDivElement, ExtendedCardProps>(
  ({ className, variant, size, role, ...props }, ref) => {
    // If role is provided, use it as the variant
    const cardVariant = role || variant;

    return (
      <CoreCard
        ref={ref}
        className={cn(extendedCardVariants({ variant: cardVariant, size, className }))}
        {...props}
      />
    );
  }
);
ExtendedCard.displayName = "ExtendedCard";

// Extended card header with additional features
const ExtendedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    actions?: React.ReactNode;
    compact?: boolean;
  }
>(({ className, actions, compact, ...props }, ref) => (
  <CoreCardHeader
    ref={ref}
    className={cn(
      compact ? "p-3 sm:p-4" : "p-4 sm:p-6",
      actions && "flex flex-row items-start justify-between",
      className
    )}
    {...props}
  >
    <div>{props.children}</div>
    {actions && <div className="ml-4 flex-shrink-0">{actions}</div>}
  </CoreCardHeader>
));
ExtendedCardHeader.displayName = "ExtendedCardHeader";

// Extended card with title, description, and content in a simplified API
interface SimpleCardProps extends Omit<ExtendedCardProps, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  compact?: boolean;
  variant?: 'default' | 'outline' | 'filled' | 'elevated' | 'interactive' | 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent' | 'coordinator';
}

/**
 * SimpleCard component for a more concise API
 *
 * @example
 * ```tsx
 * <SimpleCard
 *   title="Card Title"
 *   description="Card description"
 *   icon={<Icon />}
 *   actions={<Button>Action</Button>}
 *   footer={<div>Footer content</div>}
 * >
 *   Card content
 * </SimpleCard>
 * ```
 */
const SimpleCard = React.forwardRef<HTMLDivElement, SimpleCardProps>(
  ({
    className,
    title,
    description,
    icon,
    actions,
    footer,
    children,
    compact,
    ...props
  }, ref) => {
    return (
      <ExtendedCard ref={ref} className={className} {...props}>
        {(title || description || icon || actions) && (
          <ExtendedCardHeader compact={compact} actions={actions}>
            {icon && (
              <div className="mb-2 text-muted-foreground">
                {icon}
              </div>
            )}
            {title && <CoreCardTitle>{title}</CoreCardTitle>}
            {description && <CoreCardDescription>{description}</CoreCardDescription>}
          </ExtendedCardHeader>
        )}
        <CoreCardContent className={cn(compact ? "p-3 sm:p-4 pt-0" : "p-4 sm:p-6 pt-0")}>
          {children}
        </CoreCardContent>
        {footer && (
          <CoreCardFooter className={cn(compact ? "p-3 sm:p-4 pt-0" : "p-4 sm:p-6 pt-0")}>
            {footer}
          </CoreCardFooter>
        )}
      </ExtendedCard>
    );
  }
);
SimpleCard.displayName = "SimpleCard";

// Export all components
export {
  ExtendedCard,
  ExtendedCardHeader,
  CoreCardTitle as ExtendedCardTitle,
  CoreCardDescription as ExtendedCardDescription,
  CoreCardContent as ExtendedCardContent,
  CoreCardFooter as ExtendedCardFooter,
  SimpleCard,
  // Backward compatibility exports
  ExtendedCard as Card,
  ExtendedCardHeader as CardHeader,
  CoreCardTitle as CardTitle,
  CoreCardDescription as CardDescription,
  CoreCardContent as CardContent,
  CoreCardFooter as CardFooter,
};
