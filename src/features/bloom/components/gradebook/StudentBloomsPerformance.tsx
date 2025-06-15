'use client';

/**
 * Student Bloom's Performance Component
 * 
 * This component displays a student's performance across Bloom's Taxonomy
 * cognitive levels, including performance charts and mastery heatmaps.
 */

import { useState } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Alert, AlertDescription } from '@/components/ui/feedback/alert';
import { StudentBloomsPerformanceChart } from '@/features/bloom/components/analytics/StudentBloomsPerformanceChart';
import { MasteryHeatmap } from '@/features/bloom/components/analytics/MasteryHeatmap';
import { InterventionSuggestions } from '@/features/bloom/components/analytics/InterventionSuggestions';

// Define the props for the component
interface StudentBloomsPerformanceProps {
  studentId: string;
  classId: string;
}

/**
 * StudentBloomsPerformance Component
 */
export function StudentBloomsPerformance({
  studentId,
  classId
}: StudentBloomsPerformanceProps) {
  const [activeTab, setActiveTab] = useState<string>('performance');

  // Fetch student performance data
  const { data, isLoading, error } = api.bloomsAnalytics.getStudentPerformance.useQuery({
    studentId,
    classId
  });

  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-64" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading student performance data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Handle no data state
  if (!data) {
    return (
      <Alert>
        <AlertDescription>
          No performance data available for this student.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cognitive Level Performance</CardTitle>
        <CardDescription>
          Student performance across Bloom's Taxonomy levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="mastery">Topic Mastery</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <StudentBloomsPerformanceChart data={data.performanceByLevel} />
          </TabsContent>

          <TabsContent value="mastery">
            <MasteryHeatmap data={data.masteryByTopic} />
          </TabsContent>

          <TabsContent value="suggestions">
            <InterventionSuggestions 
              studentId={studentId}
              classId={classId}
              performanceData={data.performanceByLevel}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
