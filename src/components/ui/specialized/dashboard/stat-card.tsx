'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { SimpleCard } from '@/components/ui/extended/card';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { ArrowUp, ArrowDown, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

// Stat card variants
const statCardVariants = cva(
  "overflow-hidden",
  {
    variants: {
      variant: {
        default: "",
        outline: "border-2",
        filled: "bg-muted",
      },
      size: {
        default: "",
        sm: "p-2",
        lg: "p-6",
      },
      trend: {
        up: "border-green-500",
        down: "border-red-500",
        neutral: "border-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      trend: "neutral",
    },
  }
);

export interface StatCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  percentChange?: number;
  icon?: React.ReactNode;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent';
  showTrendIcon?: boolean;
  showTrendArrow?: boolean;
  trendLabel?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  compact?: boolean;
  variant?: 'default' | 'outline' | 'filled';
  size?: 'default' | 'sm' | 'lg';
  trend?: 'up' | 'down' | 'neutral';
}

/**
 * StatCard component for displaying dashboard metrics
 *
 * Features:
 * - Multiple variants (default, outline, filled)
 * - Trend indicators (up, down, neutral)
 * - Loading state with skeleton
 * - Role-specific styling
 * - Compact mode for mobile
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Total Users"
 *   value={1234}
 *   previousValue={1000}
 *   percentChange={23.4}
 *   icon={<Users />}
 *   role="teacher"
 *   showTrendIcon
 * />
 * ```
 */
export function StatCard({
  title,
  value,
  previousValue,
  percentChange,
  icon,
  description,
  footer,
  className,
  variant,
  size,
  trend,
  isLoading = false,
  role,
  showTrendIcon = false,
  showTrendArrow = true,
  trendLabel,
  valuePrefix = '',
  valueSuffix = '',
  compact = false,
}: StatCardProps) {
  // Determine trend if not explicitly provided
  const determineTrend = () => {
    if (trend) return trend;
    if (percentChange === undefined || percentChange === 0) return 'neutral';
    return percentChange > 0 ? 'up' : 'down';
  };

  const currentTrend = determineTrend();

  // Get trend color
  const getTrendColor = () => {
    if (currentTrend === 'up') return 'text-green-500';
    if (currentTrend === 'down') return 'text-red-500';
    return 'text-gray-500';
  };

  // Get trend icon
  const getTrendIcon = () => {
    if (!showTrendIcon) return null;

    if (currentTrend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (currentTrend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <ArrowRight className="h-4 w-4 text-gray-500" />;
  };

  // Get trend arrow
  const getTrendArrow = () => {
    if (!showTrendArrow) return null;

    if (currentTrend === 'up') return <ArrowUp className="h-3 w-3 text-green-500" />;
    if (currentTrend === 'down') return <ArrowDown className="h-3 w-3 text-red-500" />;
    return <ArrowRight className="h-3 w-3 text-gray-500" />;
  };

  // Format percent change
  const formatPercentChange = () => {
    if (percentChange === undefined) return null;

    const formattedValue = Math.abs(percentChange).toFixed(1);
    return `${percentChange >= 0 ? '+' : '-'}${formattedValue}%`;
  };

  // If loading, show skeleton
  if (isLoading) {
    return (
      <SimpleCard
        className={cn(statCardVariants({ variant, size, trend: currentTrend }), className)}
        role={role}
        compact={compact}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          {icon && (
            <Skeleton className="h-10 w-10 rounded-full" />
          )}
        </div>
      </SimpleCard>
    );
  }

  return (
    <SimpleCard
      className={cn(statCardVariants({ variant, size, trend: currentTrend }), className)}
      role={role}
      compact={compact}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold">
              {valuePrefix}{value}{valueSuffix}
            </p>
            {percentChange !== undefined && (
              <span className={cn("ml-2 text-xs font-medium flex items-center", getTrendColor())}>
                {getTrendArrow()}
                <span className="ml-0.5">{formatPercentChange()}</span>
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
          {trendLabel && (
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              {getTrendIcon()}
              <span className="ml-1">{trendLabel}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-full bg-background p-2 shadow-sm">
            {icon}
          </div>
        )}
      </div>
      {footer && (
        <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </SimpleCard>
  );
}
