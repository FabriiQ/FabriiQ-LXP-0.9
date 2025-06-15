'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { RichTextDisplay } from './RichTextDisplay';

// Import icons
import { LightBulbIcon } from '@heroicons/react/24/outline';

/**
 * Interactive hint system
 *
 * This component includes:
 * - Toggle animation for showing/hiding hints
 * - Visual styling for hints
 * - Accessibility features
 */
export const QuestionHint: React.FC<{
  hint: string;
  className?: string;
  onHintShow?: () => void;
}> = ({ hint, className, onHintShow }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Don't render anything if there's no hint
  if (!hint) return null;

  return (
    <div className={cn("mt-2", className)}>
      <button
        className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
        onClick={() => {
          const newVisibility = !isVisible;
          setIsVisible(newVisibility);

          // Call the onHintShow callback if provided and hint is being shown
          if (newVisibility && onHintShow) {
            onHintShow();
          }
        }}
        aria-expanded={isVisible}
        aria-controls="hint-content"
      >
        <LightBulbIcon className="w-4 h-4" />
        {isVisible ? 'Hide hint' : 'Show hint'}
      </button>

      <div
        id="hint-content"
        className={cn(
          "mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm",
          "transition-all duration-300 ease-in-out overflow-hidden",
          {
            "max-h-0 opacity-0 mt-0 p-0 border-transparent": !isVisible,
            "max-h-40 opacity-100": isVisible,
          }
        )}
        aria-hidden={!isVisible}
      >
        <div className="text-yellow-800 dark:text-yellow-300">
          <RichTextDisplay content={hint} />
        </div>
      </div>
    </div>
  );
};

export default QuestionHint;
