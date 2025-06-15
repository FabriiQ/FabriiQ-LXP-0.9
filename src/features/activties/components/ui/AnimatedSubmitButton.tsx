'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ActivityButton from './ActivityButton';

export interface AnimatedSubmitButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  submitted?: boolean;
  className?: string;
  children?: React.ReactNode;
  priority?: number;
}

/**
 * Enhanced submit button with animations for activity submission
 *
 * Features:
 * - Loading animation with pulse effect
 * - Success animation with checkmark
 * - Ripple effect on click
 * - Disabled state styling
 * - Micro-interactions on hover and press
 */
export const AnimatedSubmitButton: React.FC<AnimatedSubmitButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  submitted = false,
  className,
  children = 'Submit'
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle click with animation
  const handleClick = () => {
    if (disabled || loading || submitted) return;

    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      if (onClick) onClick();
    }, 300);
  };

  // Determine the icon to show
  const getIcon = () => {
    if (loading) return 'loader';
    if (submitted) return 'check-circle';
    return 'chevron-right';
  };

  return (
    <div className="relative">
      {/* Animated background glow on hover */}
      {!disabled && !loading && !submitted && (
        <motion.div
          className="absolute inset-0 bg-primary-green/20 rounded-md blur-md"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isAnimating ? 0.6 : 0,
            scale: isAnimating ? 1.2 : 0.8
          }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Main button with ActivityButton for consistent styling */}
      <ActivityButton
        onClick={handleClick}
        disabled={disabled}
        loading={loading}
        variant="primary"
        icon={getIcon()}
        className={cn(
          "relative transition-all duration-300",
          {
            "bg-green-600 hover:bg-green-700": submitted,
            "animate-pulse": loading,
            "scale-105": isAnimating,
          },
          className
        )}
        ariaLabel="Submit activity"
      >
        {submitted ? "Submitted" : children}
      </ActivityButton>

      {/* Success animation overlay */}
      {submitted && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
        >
          <motion.div
            className="absolute inset-0 bg-green-500/20 rounded-md blur-lg"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.7, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default AnimatedSubmitButton;
