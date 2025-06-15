'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressTrackerProps {
  totalQuestions: number;
  answeredQuestions: Set<number>;
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
}

export function ProgressTracker({
  totalQuestions,
  answeredQuestions,
  currentIndex,
  onSelectQuestion,
}: ProgressTrackerProps) {
  return (
    <div className="bg-white border rounded-md shadow-md p-2">
      <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
        {Array.from({ length: totalQuestions }).map((_, index) => {
          const isAnswered = answeredQuestions.has(index);
          const isCurrent = index === currentIndex;
          
          return (
            <button
              key={index}
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium",
                isAnswered ? "bg-green-100 text-green-800 border border-green-300" : "bg-gray-100 text-gray-800 border border-gray-300",
                isCurrent ? "ring-2 ring-blue-500" : "",
                "hover:bg-gray-200 transition-colors"
              )}
              onClick={() => onSelectQuestion(index)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
