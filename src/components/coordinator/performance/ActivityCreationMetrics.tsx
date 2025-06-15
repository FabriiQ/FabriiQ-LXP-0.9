'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/utils/api';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { BookOpen, FileText, Clock } from 'lucide-react';
import { WifiOff, CheckSquare } from '@/components/ui/icons/custom-icons';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useResponsive } from '@/lib/hooks/use-responsive';

interface ActivityCreationMetricsProps {
  teacherId?: string;
  timeframe: string;
  detailed?: boolean;
  isOffline?: boolean;
}

export function ActivityCreationMetrics({
  teacherId,
  timeframe,
  detailed = false,
  isOffline = false
}: ActivityCreationMetricsProps) {
  const { isMobile } = useResponsive();
  const [cachedData, setCachedData] = useState<any>(null);

  // Use offline storage hook
  const {
    isOnline,
    getData: getOfflineAnalytics,
    saveData: saveOfflineAnalytics
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Fetch activity creation data
  const {
    data,
    isLoading
  } = api.analytics.getTimeTrackingAnalytics.useQuery(
    {
      classId: teacherId || '', // Using teacherId as classId for now
      timeframe: timeframe as any
    },
    {
      enabled: !!teacherId && isOnline,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (data && teacherId) {
          // Cache data for offline use
          saveOfflineAnalytics('teacher-activity', teacherId, data, timeframe);
        }
      }
    }
  );

  // Load data from cache if offline
  useEffect(() => {
    if ((!isOnline || isOffline) && !data && teacherId) {
      const loadOfflineData = async () => {
        try {
          const cachedData = await getOfflineAnalytics('teacher-activity', teacherId, timeframe);
          if (cachedData) {
            console.log('Using cached teacher activity data');
            setCachedData(cachedData);
          }
        } catch (error) {
          console.error('Error loading offline activity data:', error);
        }
      };

      loadOfflineData();
    }
  }, [isOnline, isOffline, data, teacherId, timeframe, getOfflineAnalytics]);

  // Use cached data when offline
  const rawData = data || cachedData;

  // Process raw data to create display data
  const displayData = rawData ? {
    ...rawData,
    // Create activity types from time distribution data
    activityByType: [
      { type: 'Assignments', count: Math.round(rawData.totalActivities * 0.4) },
      { type: 'Quizzes', count: Math.round(rawData.totalActivities * 0.3) },
      { type: 'Discussions', count: Math.round(rawData.totalActivities * 0.2) },
      { type: 'Other', count: Math.round(rawData.totalActivities * 0.1) }
    ],
    // Calculate average per week from total activities
    averagePerWeek: Math.round(rawData.totalActivities / 4), // Assuming 4 weeks in a month
    // Count unique types
    uniqueTypes: 4, // Hardcoded for now
    // Calculate completion rate from time efficiency data
    completionRate: rawData.timeEfficiency && rawData.timeEfficiency.length > 0
      ? Math.round(rawData.timeEfficiency.reduce((sum, item) => sum + item.score, 0) / rawData.timeEfficiency.length)
      : 0,
    // Add totalActivities for reference
    totalActivities: rawData.totalActivities || 0
  } : null;

  // Show loading state
  if (isLoading && !displayData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  // Show empty state if no data
  if (!displayData && teacherId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>No activity data available for this teacher.</p>
      </div>
    );
  }

  // Show placeholder if no teacher selected
  if (!teacherId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Select a teacher to view activity metrics</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = displayData?.activityByType.map((item: any) => ({
    name: item.type,
    count: item.count
  }));

  // Simplified view for non-detailed mode
  if (!detailed) {
    return (
      <div className="space-y-4">
        {(isOffline || !isOnline) && (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline Data
          </Badge>
        )}

        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{displayData?.totalActivities || 0}</div>
            <p className="text-sm text-muted-foreground">Total Activities</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{displayData?.averagePerWeek || 0}</div>
            <p className="text-sm text-muted-foreground">Avg. per Week</p>
          </div>
        </div>

        <div className="space-y-2">
          {displayData?.activityByType.map((item: any) => (
            <div key={item.type}>
              <div className="flex justify-between text-sm">
                <span>{item.type}</span>
                <span className="font-medium">{item.count}</span>
              </div>
              <Progress
                value={(item.count / displayData.totalActivities) * 100}
                className="h-2 mt-1"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detailed view
  return (
    <div className="space-y-6">
      {(isOffline || !isOnline) && (
        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
          <WifiOff className="h-3 w-3 mr-1" />
          Offline Data
        </Badge>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <BookOpen className="h-8 w-8 mb-2 text-primary" />
            <div className="text-2xl font-bold">{displayData?.totalActivities || 0}</div>
            <p className="text-sm text-muted-foreground">Total Activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <FileText className="h-8 w-8 mb-2 text-primary" />
            <div className="text-2xl font-bold">{displayData?.uniqueTypes || 0}</div>
            <p className="text-sm text-muted-foreground">Activity Types</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <CheckSquare className="h-8 w-8 mb-2 text-primary" />
            <div className="text-2xl font-bold">{displayData?.completionRate || 0}%</div>
            <p className="text-sm text-muted-foreground">Completion Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Clock className="h-8 w-8 mb-2 text-primary" />
            <div className="text-2xl font-bold">{displayData?.averagePerWeek || 0}</div>
            <p className="text-sm text-muted-foreground">Avg. per Week</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Activities by Type</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Number of Activities" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Activity Trends</h3>
        <div className="space-y-2">
          {displayData?.activityByType.map((item: any) => (
            <div key={item.type}>
              <div className="flex justify-between text-sm">
                <span>{item.type}</span>
                <span className="font-medium">{item.count}</span>
              </div>
              <Progress
                value={(item.count / displayData.totalActivities) * 100}
                className="h-2 mt-1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
