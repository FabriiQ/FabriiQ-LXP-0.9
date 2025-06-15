# Teacher Performance Dashboard Component Specification

## Overview

The `TeacherPerformanceDashboard` component will provide coordinators with comprehensive analytics on teacher performance, including metrics related to attendance, feedback, student engagement, and rewards. The component will be mobile-first, support offline functionality, and implement UX psychology principles for an intuitive user experience.

## Component Structure

```
src/
└── components/
    └── coordinator/
        └── performance/
            ├── TeacherPerformanceDashboard.tsx
            ├── TeacherPerformanceCard.tsx
            ├── TeacherMetricsChart.tsx
            ├── TeacherRewardsHistory.tsx
            ├── TeacherEngagementMetrics.tsx
            └── skeletons/
                ├── TeacherPerformanceDashboardSkeleton.tsx
                ├── TeacherPerformanceCardSkeleton.tsx
                └── TeacherMetricsChartSkeleton.tsx
```

## Main Component: TeacherPerformanceDashboard

### Props

```typescript
interface TeacherPerformanceDashboardProps {
  campusId: string;
  programId?: string;
  classId?: string;
  teacherId?: string;
  timeframe?: 'week' | 'month' | 'term' | 'year';
  onTeacherSelect?: (teacherId: string) => void;
}
```

### Features

1. **Filtering and Selection**
   - Filter by program, class, or individual teacher
   - Select timeframe for metrics (week, month, term, year)
   - Sort by different performance indicators

2. **Performance Metrics**
   - Attendance rate
   - Feedback response time
   - Student engagement metrics
   - Assessment completion rate
   - Points awarded to students

3. **Comparative Analytics**
   - Compare teachers within same program/class
   - Show performance trends over time
   - Highlight top performers

4. **Rewards Integration**
   - Display points awarded by teachers
   - Show teacher rewards and achievements
   - Provide interface to award points to teachers

5. **Offline Support**
   - Cache teacher performance data
   - Allow viewing metrics offline
   - Queue actions for sync when online

## UX Psychology Principles Applied

1. **Cognitive Load Reduction**
   - Progressive disclosure of complex metrics
   - Chunking of information into logical groups
   - Visual hierarchy to guide attention

2. **Motivation and Engagement**
   - Goal Gradient Effect: Show progress toward targets
   - Recognition: Highlight achievements and improvements
   - Social Proof: Show comparative performance

3. **Decision Making**
   - Framing: Present metrics in positive context
   - Anchoring: Provide benchmarks for comparison
   - Default Bias: Set helpful default views

4. **Visual Processing**
   - Picture Superiority Effect: Use charts and visualizations
   - Pattern Recognition: Consistent layout and color coding
   - Gestalt Principles: Group related information

## Component Implementation

### TeacherPerformanceDashboard.tsx

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { api } from '@/trpc/react';
import { TeacherPerformanceCard } from './TeacherPerformanceCard';
import { TeacherMetricsChart } from './TeacherMetricsChart';
import { TeacherRewardsHistory } from './TeacherRewardsHistory';
import { TeacherEngagementMetrics } from './TeacherEngagementMetrics';
import { TeacherPerformanceDashboardSkeleton } from './skeletons/TeacherPerformanceDashboardSkeleton';
import { useOfflineStorage } from '@/features/coordinator/offline/hooks/use-offline-storage';
import { Award, BarChart, Calendar, Clock, Users } from 'lucide-react';

export function TeacherPerformanceDashboard({
  campusId,
  programId,
  classId,
  teacherId,
  timeframe = 'month',
  onTeacherSelect
}: TeacherPerformanceDashboardProps) {
  // State for filters and selections
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [selectedMetric, setSelectedMetric] = useState('overall');
  const [selectedTeacherId, setSelectedTeacherId] = useState(teacherId);
  
  // Responsive hooks
  const { isMobile } = useResponsive();
  
  // Fetch teacher performance data
  const { 
    data: performanceData, 
    isLoading: isLoadingPerformance 
  } = api.analytics.getTeacherPerformance.useQuery(
    {
      campusId,
      programId,
      classId,
      teacherId: selectedTeacherId,
      timeframe: selectedTimeframe as any
    },
    {
      enabled: navigator.onLine,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (data) {
          // Cache data for offline use
          saveTeacherPerformanceData(campusId, data, selectedTimeframe);
        }
      }
    }
  );
  
  // Offline storage hook
  const { 
    getData: getOfflinePerformanceData,
    saveData: saveTeacherPerformanceData,
    isOnline
  } = useOfflineStorage('teacherPerformance');
  
  // Load data from cache if offline
  useEffect(() => {
    if (!navigator.onLine && !performanceData) {
      const loadOfflineData = async () => {
        const cachedData = await getOfflinePerformanceData(campusId, selectedTimeframe);
        if (cachedData) {
          // Use cached data
          console.log('Using cached teacher performance data');
        }
      };
      
      loadOfflineData();
    }
  }, [navigator.onLine, performanceData, campusId, selectedTimeframe]);
  
  // Handle teacher selection
  const handleTeacherSelect = (id: string) => {
    setSelectedTeacherId(id);
    if (onTeacherSelect) {
      onTeacherSelect(id);
    }
  };
  
  // Show loading state
  if (isLoadingPerformance) {
    return <TeacherPerformanceDashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Teacher Performance</h2>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select
            value={selectedTimeframe}
            onValueChange={setSelectedTimeframe}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="term">This Term</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          {!isMobile && (
            <Button 
              variant="outline" 
              size="sm"
              disabled={!isOnline}
              onClick={() => {
                // Refresh data
              }}
            >
              Refresh
            </Button>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Teacher performance cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceData?.teachers.map(teacher => (
              <TeacherPerformanceCard
                key={teacher.id}
                teacher={teacher}
                onSelect={() => handleTeacherSelect(teacher.id)}
                isSelected={selectedTeacherId === teacher.id}
              />
            ))}
          </div>
          
          {/* Selected teacher metrics */}
          {selectedTeacherId && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Detailed metrics for selected teacher
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeacherMetricsChart
                  teacherId={selectedTeacherId}
                  timeframe={selectedTimeframe}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Other tabs implementation... */}
      </Tabs>
    </div>
  );
}
```

## Skeleton Implementation

```tsx
// src/components/coordinator/performance/skeletons/TeacherPerformanceDashboardSkeleton.tsx

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TeacherPerformanceDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-full sm:w-[180px]" />
          <Skeleton className="h-10 w-24 hidden sm:block" />
        </div>
      </div>
      
      {/* Tabs skeleton */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Teacher cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                    
                    <div className="flex justify-between mt-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```
