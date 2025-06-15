'use client';

import React from 'react';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  Award, 
  TrendingUp, 
  Clock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Progress } from '@/components/ui/progress';

interface ClassMetric {
  id: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  progress?: number;
}

interface ClassMetricsGridProps {
  metrics: ClassMetric[];
  isLoading?: boolean;
  className?: string;
}

/**
 * ClassMetricsGrid component for displaying class metrics in a responsive grid
 * 
 * Features:
 * - Responsive grid layout (1 column on mobile, 2 on tablet, 4 on desktop)
 * - Visual indicators for metrics (icons, colors, progress)
 * - Loading state with skeletons
 * - Trend indicators for changes
 */
export function ClassMetricsGrid({ 
  metrics, 
  isLoading = false,
  className 
}: ClassMetricsGridProps) {
  const { isMobile, isTablet } = useResponsive();
  
  // Determine grid columns based on screen size
  const getGridCols = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 4;
  };
  
  if (isLoading) {
    return (
      <div className={cn(
        "grid gap-4",
        `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`,
        className
      )}>
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-8 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className={cn(
      "grid gap-4",
      `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`,
      className
    )}>
      {metrics.map((metric) => (
        <Card key={metric.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-2xl mt-1">{metric.value}</CardTitle>
              </div>
              <div className={cn(
                "p-2 rounded-full",
                metric.color ? `bg-${metric.color}-100 text-${metric.color}-600` : "bg-muted text-muted-foreground"
              )}>
                {metric.icon}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {metric.change && (
              <div className="flex items-center text-sm">
                <span className={cn(
                  "mr-1",
                  metric.change.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {metric.change.isPositive ? (
                    <TrendingUp className="h-4 w-4 inline mr-1" />
                  ) : (
                    <TrendingUp className="h-4 w-4 inline mr-1 rotate-180" />
                  )}
                  {Math.abs(metric.change.value)}%
                </span>
                <span className="text-muted-foreground">vs. last month</span>
              </div>
            )}
            
            {metric.progress !== undefined && (
              <div className="mt-2">
                <Progress value={metric.progress} className="h-2" />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{metric.progress}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
