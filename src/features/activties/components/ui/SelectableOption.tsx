'use client';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MultipleChoiceOption } from '../../models/multiple-choice';
import { useTheme } from '@/providers/theme-provider';

// Import icons from Lucide
import { Check, X } from 'lucide-react';

/**
 * Enhanced option selection with animations
 *
 * This component includes:
 * - Selection animations with touch support
 * - Visual feedback for correct/incorrect answers
 * - Feedback display with animations
 * - Accessibility features
 * - Brand color scheme alignment
 */
export const SelectableOption: React.FC<{
  option: MultipleChoiceOption;
  isSelected: boolean;
  isCorrect?: boolean;
  showCorrectness?: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}> = ({
  option,
  isSelected,
  isCorrect,
  showCorrectness = false,
  onClick,
  disabled = false,
  className
}) => {
  // Animation ref
  const optionRef = useRef<HTMLDivElement>(null);

  // State for hover and touch effects
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  // Reset touch state after delay
  useEffect(() => {
    if (isTouched) {
      const timer = setTimeout(() => {
        setIsTouched(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isTouched]);

  // Handle click with enhanced animation
  const handleClick = () => {
    if (disabled) return;

    // Play selection animation
    if (optionRef.current) {
      optionRef.current.classList.add('pulse-animation');
      setTimeout(() => {
        optionRef.current?.classList.remove('pulse-animation');
      }, 500);
    }

    // Set touch state for mobile feedback
    setIsTouched(true);
    onClick();
  };

  // Use the useTheme hook to get the current theme
  const { theme } = useTheme();

  return (
    <div
      ref={optionRef}
      data-theme={theme} // Add data-theme attribute to ensure theme is respected
      className={cn(
        "p-3 border rounded-lg mb-2 transition-all duration-200 cursor-pointer",
        {
          // Use brand colors instead of blue
          "border-primary-green bg-light-mint dark:bg-primary-green/20": isSelected && !showCorrectness,
          "border-green-500 bg-green-50 dark:bg-green-900/20": showCorrectness && isCorrect,
          "border-red-500 bg-red-50 dark:bg-red-900/20": showCorrectness && isSelected && !isCorrect,
          "border-gray-300 dark:border-gray-700": !isSelected && !showCorrectness && !isHovered && !isTouched,
          "border-medium-teal dark:border-medium-teal/70": !isSelected && !showCorrectness && (isHovered || isTouched),
          "opacity-60 cursor-not-allowed": disabled,
          "transform scale-[1.02] shadow-sm": (isHovered || isTouched) && !disabled && !isSelected,
          "animate-shake": isTouched && !isSelected, // Add shake animation for touch feedback
        },
        className,
        // Add pulse animation keyframes
        "pulse-animation:animate-[pulse_0.5s_ease-in-out]"
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsTouched(true)}
      role="radio"
      aria-checked={isSelected}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-center">
        <div
          data-theme={theme} // Add data-theme attribute to ensure theme is respected
          className={cn(
            "w-6 h-6 rounded-full border flex items-center justify-center mr-3 transition-all duration-200",
            {
              // Use brand colors instead of blue
              "border-primary-green bg-primary-green text-white": isSelected && !showCorrectness,
              "border-green-500 bg-green-500 text-white": showCorrectness && isCorrect,
              "border-red-500 bg-red-500 text-white": showCorrectness && isSelected && !isCorrect,
              "border-gray-300 dark:border-gray-600": !isSelected && !showCorrectness
            }
          )}
        >
          {isSelected && <Check className="w-4 h-4" />}
          {showCorrectness && isCorrect && <Check className="w-4 h-4" />}
          {showCorrectness && isSelected && !isCorrect && <X className="w-4 h-4" />}
        </div>

        <div className="flex-1">{option.text}</div>
      </div>

      {/* Feedback when shown - with enhanced animation */}
      {showCorrectness && isSelected && option.feedback && (
        <div
          data-theme={theme} // Add data-theme attribute to ensure theme is respected
          className="mt-2 p-2 rounded bg-light-mint dark:bg-primary-green/10 text-sm animate-fade-in"
        >
          {option.feedback}
        </div>
      )}
    </div>
  );
};

export default SelectableOption;
