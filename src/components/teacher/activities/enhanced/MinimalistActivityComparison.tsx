'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { BarChart, Clock, Award, ChevronRight } from 'lucide-react';

interface MinimalistActivityComparisonProps {
  classId: string;
  limit?: number;
}

/**
 * MinimalistActivityComparison
 *
 * A minimalist component for comparing key metrics across activities with psychological principles applied:
 * - Miller's Law: Limit comparison to 7±2 items for optimal comprehension
 * - Contrast Principle: Use minimal visual elements to highlight meaningful differences
 * - Picture Superiority Effect: Visual encoding is remembered better than text
 */
export function MinimalistActivityComparison({
  classId,
  limit = 3
}: MinimalistActivityComparisonProps) {
  const [comparisonPreset, setComparisonPreset] = useState<string>('recent');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  // Fetch class activities analytics
  const { data: analyticsData, isLoading } = api.activities.getClassActivitiesAnalytics.useQuery(
    {
      classId,
      includeTimeTracking: true
    },
    {
      refetchOnWindowFocus: false,
      retry: 1,
      onSuccess: (data: any) => {
        if (data?.activities && data.activities.length > 0 && selectedActivities.length === 0) {
          // Auto-select activities based on preset
          const activities = [...data.activities];
          let presetActivities: string[] = [];

          switch (comparisonPreset) {
            case 'recent':
              // Sort by most recent
              activities.sort((a, b) => {
                const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return dateB - dateA;
              });
              presetActivities = activities.slice(0, limit).map(a => a.activityId);
              break;
            case 'popular':
              // Sort by most attempted
              activities.sort((a, b) => (b.totalAttempts || 0) - (a.totalAttempts || 0));
              presetActivities = activities.slice(0, limit).map(a => a.activityId);
              break;
            case 'time-intensive':
              // Sort by most time spent
              activities.sort((a, b) => (b.averageTimeSpent || 0) - (a.averageTimeSpent || 0));
              presetActivities = activities.slice(0, limit).map(a => a.activityId);
              break;
            default:
              presetActivities = activities.slice(0, limit).map(a => a.activityId);
          }

          setSelectedActivities(presetActivities);
        }
      }
    }
  );

  // Toggle activity selection
  const toggleActivitySelection = (activityId: string) => {
    setSelectedActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId);
      } else {
        // Limit to max activities (Miller's Law)
        const newSelection = [...prev, activityId];
        return newSelection.slice(0, limit);
      }
    });
  };

  // Process data for visualization
  const processedData = useMemo(() => {
    if (!analyticsData || !analyticsData.activities) {
      return {
        recentActivities: [],
        selectedActivitiesData: []
      };
    }

    // Get recent activities for selection
    const recentActivities = [...analyticsData.activities]
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6)
      .map(activity => ({
        id: activity.activityId,
        title: activity.title || `Activity ${activity.activityId.slice(0, 4)}`
      }));

    // Get data for selected activities
    const selectedActivitiesData = selectedActivities
      .map(activityId => {
        const activity = analyticsData.activities.find(a => a.activityId === activityId);
        if (!activity) return null;

        return {
          id: activity.activityId,
          title: activity.title || `Activity ${activity.activityId.slice(0, 4)}`,
          timeSpent: activity.averageTimeSpent || 0,
          completionRate: Math.round(activity.completionRate || 0),
          averageScore: Math.round(activity.averageScore || 0)
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        title: string;
        timeSpent: number;
        completionRate: number;
        averageScore: number;
      }>;

    return {
      recentActivities,
      selectedActivitiesData
    };
  }, [analyticsData, selectedActivities]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Activity Comparison</CardTitle>
        <CardDescription className="text-xs">
          Compare essential metrics across activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Simplified activity selection with presets */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Compare Activities</Label>
            <Select
              value={comparisonPreset}
              onValueChange={(value) => {
                setComparisonPreset(value);
                setSelectedActivities([]); // Reset selection to trigger auto-select
              }}
            >
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="time-intensive">Most Time-Intensive</SelectItem>
                <SelectItem value="custom">Custom Selection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Only show custom selection if custom preset is selected */}
          {comparisonPreset === 'custom' && (
            <div className="flex flex-wrap gap-2 mt-2">
              {processedData.recentActivities.map(activity => (
                <div
                  key={activity.id}
                  className="inline-block cursor-pointer"
                  onClick={() => toggleActivitySelection(activity.id)}
                >
                  <Badge
                    variant={selectedActivities.includes(activity.id) ? "default" : "outline"}
                    className="text-xs py-0 h-6"
                  >
                    {activity.title}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Minimalist comparison visualization */}
          {processedData.selectedActivitiesData.length > 0 ? (
            <div className="mt-4">
              <MinimalistComparisonGrid
                activities={processedData.selectedActivitiesData}
                metrics={[
                  { key: 'timeSpent', label: 'Time', icon: <Clock className="h-3 w-3" />, format: (v) => `${Math.round(v/60)}m` },
                  { key: 'completionRate', label: 'Completion', icon: <BarChart className="h-3 w-3" />, format: (v) => `${v}%` },
                  { key: 'averageScore', label: 'Score', icon: <Award className="h-3 w-3" />, format: (v) => `${v}%` }
                ]}
                colorScale={['#E2F0F9', '#E2F9EC', '#F9F0E2']}
              />
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">No activities selected for comparison</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Minimalist Comparison Grid component
interface MinimalistComparisonGridProps {
  activities: Array<{
    id: string;
    title: string;
    [key: string]: any;
  }>;
  metrics: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    format: (value: number) => string;
  }>;
  colorScale?: string[];
}

function MinimalistComparisonGrid({
  activities,
  metrics,
  colorScale = ['#E2F0F9', '#E2F9EC', '#F9F0E2']
}: MinimalistComparisonGridProps) {
  // Find min and max values for each metric to calculate relative sizes
  const ranges = metrics.reduce((acc, metric) => {
    const values = activities.map(a => a[metric.key]);
    return {
      ...acc,
      [metric.key]: {
        min: Math.min(...values),
        max: Math.max(...values)
      }
    };
  }, {} as Record<string, { min: number; max: number }>);

  return (
    <div className="space-y-4">
      {/* Activity titles */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-xs font-medium text-muted-foreground">Activity</div>
        {activities.map((activity, index) => (
          <div key={activity.id} className="text-xs font-medium truncate" title={activity.title}>
            {activity.title}
          </div>
        ))}
      </div>

      {/* Metrics rows */}
      {metrics.map((metric, metricIndex) => (
        <div key={metric.key} className="grid grid-cols-4 gap-2">
          <div className="text-xs font-medium text-muted-foreground flex items-center">
            {metric.icon && <span className="mr-1">{metric.icon}</span>}
            {metric.label}
          </div>

          {activities.map((activity, activityIndex) => {
            const value = activity[metric.key];
            const range = ranges[metric.key];
            const percentage = range.max === range.min
              ? 100
              : ((value - range.min) / (range.max - range.min)) * 100;

            // Determine if this is the highest value (for highlighting)
            const isHighest = value === range.max && activities.length > 1;

            return (
              <div key={`${activity.id}-${metric.key}`} className="relative">
                <div
                  className="h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all duration-300"
                  style={{
                    backgroundColor: isHighest
                      ? colorScale[metricIndex % colorScale.length]
                      : `${colorScale[metricIndex % colorScale.length]}50`,
                    width: `${Math.max(30, percentage)}%`,
                    minWidth: '30px'
                  }}
                >
                  {metric.format(value)}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-60 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="grid grid-cols-4 gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-8 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
