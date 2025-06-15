'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: Array<{
    id: string;
    label: string;
  }>;
  currentStep: string;
  onChange?: (step: string) => void;
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  onChange,
  className,
}: StepperProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;
          const isClickable = onChange && (isCompleted || index === currentIndex + 1);

          return (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground bg-background text-muted-foreground',
                    isClickable ? 'cursor-pointer' : 'cursor-default'
                  )}
                  onClick={() => {
                    if (isClickable) {
                      onChange(step.id);
                    }
                  }}
                  disabled={!isClickable}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </button>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    isActive
                      ? 'text-foreground'
                      : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-[2px] flex-1 transition-colors',
                    index < currentIndex
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
