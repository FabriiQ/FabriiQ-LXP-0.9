'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award } from 'lucide-react';
import { Trophy } from '@/components/ui/icons/trophy-medal';
import { Star, Target } from '@/components/ui/icons/reward-icons';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface PersonalBestType {
  type: 'rank' | 'points' | 'academic' | 'achievement';
  value: number | string;
  previousValue?: number | string;
  date: Date;
}

export interface LeaderboardPersonalBestIndicatorProps {
  personalBests?: PersonalBestType[];
  isNewBest?: boolean;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Component for displaying personal best indicators in the leaderboard
 */
export function LeaderboardPersonalBestIndicator({
  personalBests = [],
  isNewBest = false,
  className,
  showTooltip = true,
  size = 'md',
}: LeaderboardPersonalBestIndicatorProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when isNewBest changes to true
  useEffect(() => {
    if (isNewBest) {
      setIsAnimating(true);

      // Reset animation state after animation completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isNewBest]);

  // Get icon based on personal best type
  const getIcon = (type: PersonalBestType['type']) => {
    switch (type) {
      case 'rank':
        return <Trophy className={getIconSize()} />;
      case 'points':
        return <Star className={getIconSize()} />;
      case 'academic':
        return <Target className={getIconSize()} />;
      case 'achievement':
        return <Award className={getIconSize()} />;
      default:
        return <Trophy className={getIconSize()} />;
    }
  };

  // Get icon size based on size prop
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-5 w-5';
      default: return 'h-4 w-4';
    }
  };

  // Get container size based on size prop
  const getContainerSize = () => {
    switch (size) {
      case 'sm': return 'h-5 w-5';
      case 'lg': return 'h-8 w-8';
      default: return 'h-6 w-6';
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  // Animation variants
  const containerVariants = {
    initial: {
      scale: 1,
      rotate: 0
    },
    animate: {
      scale: [1, 1.2, 1],
      rotate: [0, 15, -15, 0],
      transition: {
        duration: 1,
        ease: "easeInOut"
      }
    }
  };

  // If no personal bests, don't render anything
  if (personalBests.length === 0) return null;

  // Get the most recent personal best
  const mostRecentBest = [...personalBests].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              "flex items-center justify-center rounded-full bg-yellow-100",
              getContainerSize(),
              className
            )}
            variants={containerVariants}
            initial="initial"
            animate={isAnimating ? "animate" : "initial"}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`pb-${mostRecentBest.type}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="text-yellow-600"
              >
                {getIcon(mostRecentBest.type)}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </TooltipTrigger>

        {showTooltip && (
          <TooltipContent side="top" align="center">
            <div className="space-y-2 max-w-xs">
              <h4 className="font-bold text-sm">Personal Bests</h4>
              <div className="space-y-1">
                {personalBests.map((pb, index) => (
                  <div key={`${pb.type}-${index}`} className="flex items-center gap-2 text-xs">
                    <div className="text-yellow-600">
                      {getIcon(pb.type)}
                    </div>
                    <div>
                      <span className="font-medium">
                        {pb.type === 'rank' ? `Rank ${pb.value}` :
                         pb.type === 'points' ? `${pb.value} points` :
                         pb.type === 'academic' ? `${pb.value}% score` :
                         `${pb.value} achievements`}
                      </span>
                      <span className="text-gray-500 ml-1">
                        ({formatDate(pb.date)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
