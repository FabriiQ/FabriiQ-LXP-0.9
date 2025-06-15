'use client';

import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface Step {
  id: string;
  label: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export function FormStepper({ steps, currentStep, onStepClick }: FormStepperProps) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = currentStep === index;
          const isCompleted = currentStep > index;
          
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <button
                type="button"
                onClick={() => onStepClick(index)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  isActive 
                    ? "border-primary bg-primary text-white" 
                    : isCompleted 
                      ? "border-primary bg-primary text-white" 
                      : "border-gray-300 bg-white text-gray-400"
                )}
                disabled={!isCompleted && !isActive}
              >
                {isCompleted ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              <span 
                className={cn(
                  "mt-2 text-xs font-medium",
                  isActive 
                    ? "text-primary" 
                    : isCompleted 
                      ? "text-primary" 
                      : "text-gray-500"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Progress bar */}
      <div className="absolute top-5 left-0 right-0 h-[2px] bg-gray-200 -z-0">
        <div 
          className="h-full bg-primary transition-all"
          style={{ 
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
