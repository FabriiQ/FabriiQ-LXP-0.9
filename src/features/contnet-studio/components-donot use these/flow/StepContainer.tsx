'use client';

/**
 * StepContainer
 * 
 * A reusable container component for individual steps in a step-based flow.
 * Provides consistent styling and structure for step content.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  isNextDisabled?: boolean;
  isBackDisabled?: boolean;
  isLoading?: boolean;
  hideNavigation?: boolean;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  nextButtonProps?: React.ComponentProps<typeof Button>;
  backButtonProps?: React.ComponentProps<typeof Button>;
}

export function StepContainer({
  title,
  description,
  children,
  onNext,
  onBack,
  nextLabel = 'Next',
  backLabel = 'Back',
  isNextDisabled = false,
  isBackDisabled = false,
  isLoading = false,
  hideNavigation = false,
  className,
  contentClassName,
  headerClassName,
  footerClassName,
  nextButtonProps,
  backButtonProps,
}: StepContainerProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Step header */}
      <div className={cn("space-y-2", headerClassName)}>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      
      {/* Step content */}
      <div className={cn("space-y-4", contentClassName)}>
        {children}
      </div>
      
      {/* Step navigation */}
      {!hideNavigation && (
        <div className={cn("flex justify-between pt-4", footerClassName)}>
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isBackDisabled || isLoading}
            {...backButtonProps}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
          
          <Button
            onClick={onNext}
            disabled={isNextDisabled || isLoading}
            {...nextButtonProps}
          >
            {nextLabel}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
