'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Minus } from '@/components/ui/icons/reward-icons';
import { cn } from '@/lib/utils';

export interface LeaderboardRankChangeAnimationProps {
  rankChange?: number;
  isAnimating?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  showDirectionalIndicator?: boolean;
}

/**
 * Component for animating rank changes in the leaderboard
 */
export function LeaderboardRankChangeAnimation({
  rankChange,
  isAnimating = false,
  className,
  size = 'md',
  showValue = true,
  showDirectionalIndicator = true,
}: LeaderboardRankChangeAnimationProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Trigger animation when isAnimating changes to true
  useEffect(() => {
    if (isAnimating) {
      setShouldAnimate(true);

      // Reset animation state after animation completes
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Determine icon and color based on rank change
  const getIconAndColor = () => {
    if (!rankChange) return {
      icon: <Minus className={cn("text-gray-400", getIconSize())} />,
      color: 'text-gray-400',
      bgColor: 'bg-gray-100'
    };

    if (rankChange > 0) return {
      icon: <ArrowUp className={cn("text-green-500", getIconSize())} />,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    };

    return {
      icon: <ArrowDown className={cn("text-red-500", getIconSize())} />,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    };
  };

  // Get icon size based on size prop
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-5 w-5';
      default: return 'h-4 w-4';
    }
  };

  // Get text size based on size prop
  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-base';
      default: return 'text-sm';
    }
  };

  const { icon, color, bgColor } = getIconAndColor();
  const absRankChange = rankChange ? Math.abs(rankChange) : 0;

  // Animation variants
  const containerVariants = {
    initial: {
      scale: 1,
      opacity: 1
    },
    animate: {
      scale: [1, 1.2, 1],
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  };

  const valueVariants = {
    initial: {
      y: 0,
      opacity: 1
    },
    animate: {
      y: [0, -10, 0],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5",
        bgColor,
        className
      )}
      variants={containerVariants}
      initial="initial"
      animate={shouldAnimate ? "animate" : "initial"}
    >
      {showDirectionalIndicator && icon}

      {showValue && absRankChange > 0 && (
        <AnimatePresence mode="wait">
          <motion.span
            key={`rank-change-${absRankChange}`}
            className={cn(getTextSize(), color, "font-medium")}
            variants={valueVariants}
            initial="initial"
            animate={shouldAnimate ? "animate" : "initial"}
          >
            {absRankChange}
          </motion.span>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
