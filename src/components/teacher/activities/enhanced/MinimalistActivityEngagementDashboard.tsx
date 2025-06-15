'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { api } from '@/trpc/react';
import { ChevronRight, BarChart, Clock, Users } from 'lucide-react';

interface MinimalistActivityEngagementDashboardProps {
  classId: string;
  limit?: number;
}

/**
 * MinimalistActivityEngagementDashboard
 *
 * A minimalist dashboard showing activity engagement metrics with psychological principles applied:
 * - Social Proof: Shows popularity metrics to encourage engagement with top activities
 * - Goal Gradient Effect: Visual progress bars showing proximity to completion
 * - Effort Heuristic: Visualizes the relationship between effort and outcomes
 */
export function MinimalistActivityEngagementDashboard({
  classId,
  limit = 5
}: MinimalistActivityEngagementDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('attempts');

  // Fetch class activities analytics
  const { data: analyticsData, isLoading } = api.activities.getClassActivitiesAnalytics.useQuery(
    {
      classId,
      includeTimeTracking: true
    },
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Process data for visualization
  const processedData = useMemo(() => {
    if (!analyticsData || !analyticsData.activities) {
      return {
        topByAttempts: [],
        topByCompletion: [],
        topByTimeSpent: [],
        studentCount: 0,
        attemptCount: 0
      };
    }

    // Sort activities by different metrics
    const sortedByAttempts = [...analyticsData.activities]
      .sort((a, b) => (b.totalAttempts || 0) - (a.totalAttempts || 0))
      .slice(0, limit)
      .map(activity => ({
        id: activity.activityId,
        title: activity.title || `Activity ${activity.activityId.slice(0, 4)}`,
        attemptRate: activity.uniqueUsers ?
          Math.round((activity.uniqueUsers / (analyticsData.totalStudents || 1)) * 100) : 0,
        totalAttempts: activity.totalAttempts || 0
      }));

    const sortedByCompletion = [...analyticsData.activities]
      .sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0))
      .slice(0, limit)
      .map(activity => ({
        id: activity.activityId,
        title: activity.title || `Activity ${activity.activityId.slice(0, 4)}`,
        completionRate: Math.round(activity.completionRate || 0),
        totalCompletions: Math.round((activity.completionRate || 0) * (activity.uniqueUsers || 0) / 100) || 0
      }));

    const sortedByTimeSpent = [...analyticsData.activities]
      .sort((a, b) => (b.averageTimeSpent || 0) - (a.averageTimeSpent || 0))
      .slice(0, limit)
      .map(activity => ({
        id: activity.activityId,
        title: activity.title || `Activity ${activity.activityId.slice(0, 4)}`,
        averageTimeSpent: activity.averageTimeSpent || 0,
        totalTimeSpent: (activity.averageTimeSpent || 0) * (activity.uniqueUsers || 0)
      }));

    return {
      topByAttempts: sortedByAttempts,
      topByCompletion: sortedByCompletion,
      topByTimeSpent: sortedByTimeSpent,
      studentCount: analyticsData.totalStudents || 0,
      attemptCount: analyticsData.totalAttempts || 0
    };
  }, [analyticsData, limit]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Activity Engagement</CardTitle>
        <CardDescription className="text-xs">
          Student interaction with top activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Minimalist tabs with subtle indicators */}
        <Tabs defaultValue="attempts" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="attempts" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Attempts
            </TabsTrigger>
            <TabsTrigger value="completion" className="text-xs">
              <BarChart className="h-3 w-3 mr-1" />
              Completion
            </TabsTrigger>
            <TabsTrigger value="time" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attempts">
            <div className="mt-2">
              {processedData.topByAttempts.length > 0 ? (
                <div className="space-y-2">
                  {processedData.topByAttempts.map((activity, index) => (
                    <ActivityMetricBar
                      key={activity.id}
                      title={activity.title}
                      value={activity.attemptRate}
                      maxValue={100}
                      label={`${activity.attemptRate}%`}
                      highlight={index === 0} // Von Restorff Effect - highlight the most attempted
                      color="#E2F0F9"
                      highlightColor="#A8D1F9"
                    />
                  ))}
                  <div className="mt-1 text-xs text-right text-muted-foreground">
                    Based on {processedData.studentCount} students
                  </div>
                </div>
              ) : (
                <EmptyState message="No activity attempt data available" />
              )}
            </div>
          </TabsContent>

          <TabsContent value="completion">
            <div className="mt-2">
              {processedData.topByCompletion.length > 0 ? (
                <div className="space-y-2">
                  {processedData.topByCompletion.map((activity, index) => (
                    <ActivityMetricBar
                      key={activity.id}
                      title={activity.title}
                      value={activity.completionRate}
                      maxValue={100}
                      label={`${activity.completionRate}%`}
                      highlight={index === 0}
                      color="#E2F9EC"
                      highlightColor="#A8F9D1"
                    />
                  ))}
                  <div className="mt-1 text-xs text-right text-muted-foreground">
                    Based on {processedData.attemptCount} attempts
                  </div>
                </div>
              ) : (
                <EmptyState message="No activity completion data available" />
              )}
            </div>
          </TabsContent>

          <TabsContent value="time">
            <div className="mt-2">
              {processedData.topByTimeSpent.length > 0 ? (
                <div className="space-y-2">
                  {processedData.topByTimeSpent.map((activity, index) => (
                    <ActivityMetricBar
                      key={activity.id}
                      title={activity.title}
                      value={activity.averageTimeSpent / 60} // Convert to minutes
                      maxValue={Math.max(...processedData.topByTimeSpent.map(a => a.averageTimeSpent / 60))}
                      label={`${Math.round(activity.averageTimeSpent / 60)}m`}
                      highlight={index === 0}
                      color="#F9F0E2"
                      highlightColor="#F9D1A8"
                    />
                  ))}
                  <div className="mt-1 text-xs text-right text-muted-foreground">
                    Average time per student
                  </div>
                </div>
              ) : (
                <EmptyState message="No time tracking data available" />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Activity Metric Bar component
interface ActivityMetricBarProps {
  title: string;
  value: number;
  maxValue: number;
  label: string;
  highlight?: boolean;
  color?: string;
  highlightColor?: string;
}

function ActivityMetricBar({
  title,
  value,
  maxValue,
  label,
  highlight = false,
  color = "#E2F0F9",
  highlightColor = "#A8D1F9"
}: ActivityMetricBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium truncate max-w-[70%]" title={title}>{title}</span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-in-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: highlight ? highlightColor : color
          }}
        />
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
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
        <Skeleton className="h-8 w-full mb-4" />
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
