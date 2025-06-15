'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/utils/api';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { BookOpen, Users } from 'lucide-react';
import { WifiOff } from '@/components/ui/icons/custom-icons';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useResponsive } from '@/lib/hooks/use-responsive';

interface ClassPerformanceMetricsProps {
  teacherId?: string;
  timeframe: string;
  isOffline?: boolean;
}

export function ClassPerformanceMetrics({
  teacherId,
  timeframe,
  isOffline = false
}: ClassPerformanceMetricsProps) {
  const { isMobile } = useResponsive();
  const [cachedData, setCachedData] = useState<any>(null);

  // Use offline storage hook
  const {
    isOnline,
    getData: getOfflineAnalytics,
    saveData: saveOfflineAnalytics
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Fetch class performance data
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
          saveOfflineAnalytics('teacher-class-performance', teacherId, data, timeframe);
        }
      }
    }
  );

  // Load data from cache if offline
  useEffect(() => {
    if ((!isOnline || isOffline) && !data && teacherId) {
      const loadOfflineData = async () => {
        try {
          const cachedData = await getOfflineAnalytics('teacher-class-performance', teacherId, timeframe);
          if (cachedData) {
            console.log('Using cached class performance data');
            setCachedData(cachedData);
          }
        } catch (error) {
          console.error('Error loading offline class performance data:', error);
        }
      };

      loadOfflineData();
    }
  }, [isOnline, isOffline, data, teacherId, timeframe, getOfflineAnalytics]);

  // Use cached data when offline
  const rawData = data || cachedData;

  // Process raw data to create display data
  const displayData = rawData ? {
    // Create mock classes with performance data
    classesByPerformance: [
      { className: 'Class A', performance: 85 },
      { className: 'Class B', performance: 78 },
      { className: 'Class C', performance: 92 },
      { className: 'Class D', performance: 65 }
    ],
    // Calculate average performance
    averagePerformance: 80, // Mock average performance
    // Count total classes
    totalClasses: 4 // Mock total classes
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
        <p>No class performance data available for this teacher.</p>
      </div>
    );
  }

  // Show placeholder if no teacher selected
  if (!teacherId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Select a teacher to view class performance metrics</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = displayData?.classesByPerformance.map((item: any) => ({
    name: item.className,
    performance: item.performance
  }));

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
          <div className="text-2xl font-bold">{displayData?.averagePerformance || 0}%</div>
          <p className="text-sm text-muted-foreground">Avg. Performance</p>
        </div>
        <div>
          <div className="text-2xl font-bold">{displayData?.totalClasses || 0}</div>
          <p className="text-sm text-muted-foreground">Classes</p>
        </div>
      </div>

      <div className="h-[250px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: isMobile ? 50 : 100,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 50 : 100}
            />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="performance"
              name="Performance %"
              fill="#8884d8"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Class Performance</h3>
        <div className="space-y-2">
          {displayData?.classesByPerformance.map((item: any) => (
            <div key={item.className}>
              <div className="flex justify-between text-sm">
                <span>{item.className}</span>
                <span className="font-medium">{item.performance}%</span>
              </div>
              <Progress
                value={item.performance}
                className="h-2 mt-1"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
