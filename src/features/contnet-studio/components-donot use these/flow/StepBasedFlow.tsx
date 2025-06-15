'use client';

/**
 * StepBasedFlow
 * 
 * A reusable component for managing step-based flows in the Content Studio.
 * Handles step navigation, progress tracking, and back/next navigation.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step<T extends string = string> {
  id: T;
  title: string;
  description?: string;
  component: React.ReactNode | ((props: StepComponentProps<T>) => React.ReactNode);
  isOptional?: boolean;
  validate?: () => boolean | Promise<boolean>;
}

export interface StepComponentProps<T extends string = string> {
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  currentStepId: T;
}

export interface StepBasedFlowProps<T extends string = string> {
  steps: Step<T>[];
  initialStepId?: T;
  onComplete?: () => void;
  onCancel?: () => void;
  onStepChange?: (stepId: T) => void;
  className?: string;
  progressBarClassName?: string;
  stepTitlesClassName?: string;
  contentClassName?: string;
  showStepTitles?: boolean;
  showProgressBar?: boolean;
  allowSkipToStep?: boolean;
}

export function StepBasedFlow<T extends string = string>({
  steps,
  initialStepId,
  onComplete,
  onCancel,
  onStepChange,
  className,
  progressBarClassName,
  stepTitlesClassName,
  contentClassName,
  showStepTitles = true,
  showProgressBar = true,
  allowSkipToStep = false,
}: StepBasedFlowProps<T>) {
  // Find the initial step index
  const initialStepIndex = initialStepId 
    ? steps.findIndex(step => step.id === initialStepId)
    : 0;
  
  // State for tracking the current step
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex >= 0 ? initialStepIndex : 0);
  const [isValidating, setIsValidating] = useState(false);
  const [previousStepId, setPreviousStepId] = useState<T | null>(null);
  
  // Get the current step
  const currentStep = steps[currentStepIndex];
  
  // Calculate progress percentage
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;
  
  // Group steps by category for the progress bar
  const stepGroups = steps.reduce((groups, step, index) => {
    // Extract category from step ID (e.g., "SUBJECT_SELECTION" -> "SELECTION")
    const category = String(step.id).split('_').pop() || '';
    
    if (!groups[category]) {
      groups[category] = [];
    }
    
    groups[category].push(index);
    return groups;
  }, {} as Record<string, number[]>);
  
  // Sort categories by their first occurrence
  const sortedCategories = Object.entries(stepGroups)
    .sort(([, a], [, b]) => a[0] - b[0])
    .map(([category]) => category);
  
  // Handle next button click
  const handleNext = useCallback(async () => {
    // If there's a validation function, run it
    if (currentStep.validate) {
      setIsValidating(true);
      try {
        const isValid = await currentStep.validate();
        if (!isValid) {
          setIsValidating(false);
          return;
        }
      } catch (error) {
        console.error('Step validation error:', error);
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }
    
    // If this is the last step, call onComplete
    if (currentStepIndex === steps.length - 1) {
      onComplete?.();
      return;
    }
    
    // Otherwise, move to the next step
    setPreviousStepId(currentStep.id);
    setCurrentStepIndex(prevIndex => prevIndex + 1);
  }, [currentStep, currentStepIndex, steps.length, onComplete]);
  
  // Handle back button click
  const handleBack = useCallback(() => {
    // If this is the first step, call onCancel
    if (currentStepIndex === 0) {
      onCancel?.();
      return;
    }
    
    // Otherwise, move to the previous step
    setPreviousStepId(currentStep.id);
    setCurrentStepIndex(prevIndex => prevIndex - 1);
  }, [currentStepIndex, currentStep.id, onCancel]);
  
  // Handle clicking on a step title to navigate directly to that step
  const handleStepClick = useCallback((index: number) => {
    if (!allowSkipToStep) return;
    
    setPreviousStepId(currentStep.id);
    setCurrentStepIndex(index);
  }, [allowSkipToStep, currentStep.id]);
  
  // Call onStepChange when the current step changes
  useEffect(() => {
    onStepChange?.(currentStep.id);
  }, [currentStep.id, onStepChange]);
  
  // Render the current step component
  const renderStepComponent = () => {
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;
    
    if (typeof currentStep.component === 'function') {
      return (currentStep.component as Function)({
        onNext: handleNext,
        onBack: handleBack,
        isFirstStep,
        isLastStep,
        currentStepId: currentStep.id,
      });
    }
    
    return currentStep.component;
  };
  
  return (
    <div className={cn("w-full", className)}>
      {/* Step titles */}
      {showStepTitles && (
        <div className={cn("flex justify-between text-sm mb-2", stepTitlesClassName)}>
          {sortedCategories.map((category) => (
            <span 
              key={category}
              className={cn(
                stepGroups[category].some(index => index === currentStepIndex) 
                  ? "font-bold text-primary" 
                  : "text-muted-foreground"
              )}
            >
              {category}
            </span>
          ))}
        </div>
      )}
      
      {/* Progress bar */}
      {showProgressBar && (
        <div 
          className={cn("w-full bg-muted h-2 rounded-full overflow-hidden mb-6", progressBarClassName)} 
          role="progressbar" 
          aria-valuenow={progressPercentage} 
          aria-valuemin={0} 
          aria-valuemax={100}
        >
          <div 
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      )}
      
      {/* Step content */}
      <div className={cn("bg-card rounded-lg border p-6", contentClassName)}>
        {renderStepComponent()}
        
        {/* Navigation buttons - only shown if not provided by the step component */}
        {typeof currentStep.component !== 'function' && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isValidating}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {currentStepIndex === 0 ? 'Cancel' : 'Back'}
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={isValidating}
            >
              {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
