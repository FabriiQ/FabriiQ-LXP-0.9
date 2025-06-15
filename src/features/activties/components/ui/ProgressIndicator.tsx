'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Progress indicator with animation
 * 
 * This component includes:
 * - Linear and circular progress variants
 * - Smooth animations
 * - Customizable appearance
 * - Accessibility features
 */
export const ProgressIndicator: React.FC<{
  current: number;
  total: number;
  variant?: 'linear' | 'circular';
  className?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}> = ({ 
  current, 
  total, 
  variant = 'linear',
  className,
  showPercentage = true,
  color = 'blue'
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
  
  // Color classes
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };
  
  const selectedColor = colorClasses[color];
  
  if (variant === 'circular') {
    // SVG circular progress
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - percentage / 100);
    
    return (
      <div className={cn("relative", className)} role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            className="text-gray-200 dark:text-gray-700"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          {/* Progress circle with animation */}
          <circle
            className={cn(selectedColor, "transition-all duration-500 ease-in-out")}
            strokeWidth="8"
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
          />
          {showPercentage && (
            <text
              x="50"
              y="55"
              className="text-xs font-medium text-gray-800 dark:text-gray-200"
              textAnchor="middle"
            >
              {percentage}%
            </text>
          )}
        </svg>
      </div>
    );
  }
  
  // Linear progress bar
  return (
    <div className={cn("w-full", className)}>
      <div 
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        role="progressbar" 
        aria-valuenow={percentage} 
        aria-valuemin={0} 
        aria-valuemax={100}
      >
        <div 
          className={cn(selectedColor, "h-full transition-all duration-500 ease-in-out")}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 text-right">
          {current} of {total} ({percentage}%)
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
