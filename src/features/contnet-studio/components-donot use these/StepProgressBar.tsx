'use client';

/**
 * StepProgressBar Component
 * 
 * This component displays a progress bar for step-based flows,
 * showing the current step and allowing navigation between steps.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  title: string;
  isCompleted?: boolean;
  isActive?: boolean;
  isDisabled?: boolean;
}

interface StepProgressBarProps {
  steps: Step[];
  currentStepId: string;
  onStepChange?: (stepId: string) => void;
  className?: string;
}

export function StepProgressBar({
  steps,
  currentStepId,
  onStepChange,
  className = '',
}: StepProgressBarProps) {
  // Find the index of the current step
  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          // Determine if the step is completed, active, or upcoming
          const isCompleted = index < currentStepIndex || step.isCompleted;
          const isActive = step.id === currentStepId || step.isActive;
          const isDisabled = index > currentStepIndex || step.isDisabled;

          return (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <button
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    isCompleted ? 'bg-primary text-primary-foreground' : 
                    isActive ? 'bg-primary/20 text-primary border-2 border-primary' : 
                    'bg-muted text-muted-foreground',
                    isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  )}
                  onClick={() => !isDisabled && onStepChange?.(step.id)}
                  disabled={isDisabled}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    index + 1
                  )}
                </button>
                <span className={cn(
                  'text-xs mt-1',
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                )}>
                  {step.title}
                </span>
              </div>

              {/* Connector line (except after the last step) */}
              {index < steps.length - 1 && (
                <div className={cn(
                  'h-0.5 flex-1 mx-2',
                  index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
