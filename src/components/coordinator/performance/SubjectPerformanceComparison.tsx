'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/utils/api';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { WifiOff, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';
import { useResponsive } from '@/lib/hooks/use-responsive';

interface SubjectPerformanceComparisonProps {
  teacherId?: string;
  timeframe: string;
  isOffline?: boolean;
}

export function SubjectPerformanceComparison({
  teacherId,
  timeframe,
  isOffline = false
}: SubjectPerformanceComparisonProps) {
  const { isMobile } = useResponsive();
  const [cachedData, setCachedData] = useState<any>(null);
  
  // Use offline storage hook
  const { 
    isOnline,
    getData: getOfflineAnalytics,
    saveData: saveOfflineAnalytics
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);
  
  // Fetch subject performance data
  const { 
    data, 
    isLoading 
  } = api.analytics.getTeacherSubjectPerformance.useQuery(
    {
      teacherId: teacherId || '',
      timeframe: timeframe as any
    },
    {
      enabled: !!teacherId && isOnline,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (data && teacherId) {
          // Cache data for offline use
          saveOfflineAnalytics('teacher-subject-performance', teacherId, data, timeframe);
        }
      }
    }
  );
  
  // Load data from cache if offline
  useEffect(() => {
    if ((!isOnline || isOffline) && !data && teacherId) {
      const loadOfflineData = async () => {
        try {
          const cachedData = await getOfflineAnalytics('teacher-subject-performance', teacherId, timeframe);
          if (cachedData) {
            console.log('Using cached subject performance data');
            setCachedData(cachedData);
          }
        } catch (error) {
          console.error('Error loading offline subject performance data:', error);
        }
      };
      
      loadOfflineData();
    }
  }, [isOnline, isOffline, data, teacherId, timeframe, getOfflineAnalytics]);
  
  // Use cached data when offline
  const displayData = data || cachedData;
  
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
        <p>No subject performance data available for this teacher.</p>
      </div>
    );
  }
  
  // Show placeholder if no teacher selected
  if (!teacherId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Select a teacher to view subject performance metrics</p>
      </div>
    );
  }
  
  // Format data for chart
  const chartData = displayData?.subjectPerformance.map((item: any) => ({
    subject: item.subject,
    performance: item.performance,
    average: item.average
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
          <div className="text-2xl font-bold">{displayData?.bestSubject || 'N/A'}</div>
          <p className="text-sm text-muted-foreground">Best Subject</p>
        </div>
        <div>
          <div className="text-2xl font-bold">{displayData?.totalSubjects || 0}</div>
          <p className="text-sm text-muted-foreground">Subjects</p>
        </div>
      </div>
      
      <div className="h-[250px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar 
              name="Teacher Performance" 
              dataKey="performance" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.6} 
            />
            <Radar 
              name="School Average" 
              dataKey="average" 
              stroke="#82ca9d" 
              fill="#82ca9d" 
              fillOpacity={0.6} 
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Subject Performance</h3>
        <div className="space-y-2">
          {displayData?.subjectPerformance.map((item: any) => (
            <div key={item.subject}>
              <div className="flex justify-between text-sm">
                <span>{item.subject}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Avg: {item.average}%</span>
                  <span className="font-medium">{item.performance}%</span>
                </div>
              </div>
              <div className="relative mt-1">
                <Progress 
                  value={item.average} 
                  className="h-2 bg-muted/30" 
                />
                <Progress 
                  value={item.performance} 
                  className="h-2 absolute top-0 left-0" 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
