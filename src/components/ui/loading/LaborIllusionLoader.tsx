'use client';

import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { useChronoception } from '@/hooks/useChronoception';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingStep {
  label: string;
  duration: number; // in seconds
  weight: number; // relative weight for progress calculation
}

interface LaborIllusionLoaderProps {
  isLoading: boolean;
  steps?: LoadingStep[];
  onComplete?: () => void;
  className?: string;
  showTimeRemaining?: boolean;
  totalEstimatedTime?: number; // in seconds
}

/**
 * Component that shows a loading sequence with labor illusion
 * Shows detailed steps being completed to create the perception of valuable work being done
 */
export function LaborIllusionLoader({
  isLoading,
  steps = defaultLoadingSteps,
  onComplete,
  className = '',
  showTimeRemaining = true,
  totalEstimatedTime,
}: LaborIllusionLoaderProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  // Calculate total estimated time if not provided
  const calculatedTotalTime = totalEstimatedTime ||
    steps.reduce((total, step) => total + step.duration, 0);

  // Use chronoception for time remaining display
  const { formattedTime, progress, isRunning } = useChronoception({
    actualTimeSeconds: calculatedTotalTime,
    autoStart: isLoading,
    onComplete,
  });

  // Handle step progression
  useEffect(() => {
    if (!isLoading || currentStepIndex >= steps.length) return;

    const currentStep = steps[currentStepIndex];
    const timer = setTimeout(() => {
      // Mark current step as completed
      setCompletedSteps(prev => [...prev, currentStepIndex]);

      // Move to next step
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      }
    }, currentStep.duration * 1000);

    return () => clearTimeout(timer);
  }, [isLoading, currentStepIndex, steps]);

  // Update overall progress based on completed steps
  useEffect(() => {
    if (!isLoading) return;

    // Calculate total weight
    const totalWeight = steps.reduce((total, step) => total + step.weight, 0);

    // Calculate completed weight
    const completedWeight = completedSteps.reduce(
      (total, stepIndex) => total + steps[stepIndex].weight,
      0
    );

    // Add partial progress for current step
    let currentStepProgress = 0;
    if (currentStepIndex < steps.length && !completedSteps.includes(currentStepIndex)) {
      const currentStep = steps[currentStepIndex];
      const stepProgress = progress / 100; // 0-1 range
      currentStepProgress = currentStep.weight * stepProgress;
    }

    // Calculate overall progress (0-100)
    const newProgress = ((completedWeight + currentStepProgress) / totalWeight) * 100;
    setOverallProgress(newProgress);
  }, [isLoading, completedSteps, currentStepIndex, progress, steps]);

  if (!isLoading) return null;

  return (
    <div className={className}>
      <div className="space-y-4">
        <Progress value={overallProgress} className="h-2 bg-muted" />

        {showTimeRemaining && isRunning && (
          <p className="text-xs text-foreground/70 text-right">
            Estimated time remaining: {formattedTime}
          </p>
        )}

        <div className="space-y-2">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = currentStepIndex === index;

            return (
              <div key={index} className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded-full flex items-center justify-center
                  ${isCompleted ? 'bg-primary text-primary-foreground' : isCurrent ? 'bg-primary/20 text-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {isCompleted && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-inherit"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>

                <div className="flex-1">
                  <p className={`text-sm ${isCompleted ? 'text-muted-foreground line-through' :
                    isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                </div>

                {isCurrent && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-shrink-0"
                    >
                      <div className="h-3 w-3 rounded-full bg-primary text-primary-foreground animate-pulse"></div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Default loading steps for activities
const defaultLoadingSteps: LoadingStep[] = [
  { label: 'Loading activity data...', duration: 1.5, weight: 10 },
  { label: 'Preparing interactive elements...', duration: 2, weight: 20 },
  { label: 'Loading media resources...', duration: 3, weight: 30 },
  { label: 'Initializing activity state...', duration: 1, weight: 15 },
  { label: 'Setting up progress tracking...', duration: 1.5, weight: 15 },
  { label: 'Finalizing and optimizing...', duration: 1, weight: 10 },
];
