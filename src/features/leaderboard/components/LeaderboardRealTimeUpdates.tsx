'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { RefreshCw } from '@/components/ui/icons/custom-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface LeaderboardRealTimeUpdatesProps {
  lastUpdated?: Date;
  isLoading?: boolean;
  hasNewData?: boolean;
  onRefresh?: () => void;
  className?: string;
  showTooltip?: boolean;
  showRefreshButton?: boolean;
  refreshInterval?: number; // in milliseconds
}

/**
 * Component for displaying real-time update indicators for the leaderboard
 */
export function LeaderboardRealTimeUpdates({
  lastUpdated,
  isLoading = false,
  hasNewData = false,
  onRefresh,
  className,
  showTooltip = true,
  showRefreshButton = true,
  refreshInterval = 0, // 0 means no auto-refresh
}: LeaderboardRealTimeUpdatesProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Update time ago string
  useEffect(() => {
    if (!lastUpdated) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = now.getTime() - new Date(lastUpdated).getTime();

      if (diff < 60000) {
        setTimeAgo('just now');
      } else if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        setTimeAgo(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`);
      } else if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        setTimeAgo(`${hours} ${hours === 1 ? 'hour' : 'hours'} ago`);
      } else {
        const days = Math.floor(diff / 86400000);
        setTimeAgo(`${days} ${days === 1 ? 'day' : 'days'} ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Auto-refresh if interval is set
  useEffect(() => {
    if (refreshInterval <= 0 || !onRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh]);

  // Animate when new data is available
  useEffect(() => {
    if (hasNewData) {
      setIsAnimating(true);

      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [hasNewData]);

  // Animation variants
  const iconVariants = {
    initial: {
      rotate: 0,
      scale: 1
    },
    animate: {
      rotate: 360,
      scale: [1, 1.2, 1],
      transition: {
        rotate: { duration: 1, ease: "linear" },
        scale: { duration: 0.5, ease: "easeInOut" }
      }
    },
    loading: {
      rotate: 360,
      transition: {
        rotate: { duration: 1.5, ease: "linear", repeat: Infinity }
      }
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    if (isLoading) {
      return (
        <motion.div
          variants={iconVariants}
          animate="loading"
          className="text-blue-500"
        >
          <RefreshCw className="h-4 w-4" />
        </motion.div>
      );
    }

    if (hasNewData) {
      return (
        <motion.div
          variants={iconVariants}
          initial="initial"
          animate={isAnimating ? "animate" : "initial"}
          className="text-green-500"
        >
          <CheckCircle className="h-4 w-4" />
        </motion.div>
      );
    }

    return (
      <motion.div className="text-gray-400">
        <RefreshCw className="h-4 w-4" />
      </motion.div>
    );
  };

  // Format date for display
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {getStatusIcon()}
              {lastUpdated && <span>{timeAgo}</span>}
            </div>
          </TooltipTrigger>

          {showTooltip && lastUpdated && (
            <TooltipContent side="top" align="center">
              <div className="text-xs">
                <p>Last updated: {formatDateTime(lastUpdated)}</p>
                {refreshInterval > 0 && (
                  <p className="text-gray-400">
                    Auto-refreshes every {refreshInterval / 1000} seconds
                  </p>
                )}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {showRefreshButton && onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Refresh
        </Button>
      )}
    </div>
  );
}
