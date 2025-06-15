'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/data-display/card';
import { Progress } from '@/components/ui/progress';
import { api } from '@/utils/api';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
import { LineChart } from '@/components/ui/charts/LineChart';

interface TeacherPerformanceTabProps {
  teacherId: string;
}

export function TeacherPerformanceTab({ teacherId }: TeacherPerformanceTabProps) {
  // Fetch teacher performance data
  const { data: performanceData, isLoading } = api.analytics.getTeacherStats.useQuery(
    { teacherId },
    {
      refetchOnWindowFocus: false,
    }
  );

  if (isLoading) {
    return <PerformanceSkeleton />;
  }

  // Prepare chart data
  const attendanceData = [
    { month: 'Jan', rate: 92 },
    { month: 'Feb', rate: 95 },
    { month: 'Mar', rate: 88 },
    { month: 'Apr', rate: 91 },
    { month: 'May', rate: 94 },
    { month: 'Jun', rate: 97 },
  ];

  const gradingTimelinessData = [
    { assessment: 'Quiz 1', days: 1.2 },
    { assessment: 'Assignment 1', days: 2.5 },
    { assessment: 'Midterm', days: 3.8 },
    { assessment: 'Quiz 2', days: 1.0 },
    { assessment: 'Assignment 2', days: 2.2 },
  ];

  const studentPerformanceData = [
    { class: 'Math 101', avgGrade: 85 },
    { class: 'Science 202', avgGrade: 78 },
    { class: 'History 303', avgGrade: 82 },
    { class: 'English 404', avgGrade: 88 },
  ];

  return (
    <div className="space-y-6">
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData?.attendanceRate || 95}%</div>
            <Progress value={performanceData?.attendanceRate || 95} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Average teacher attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Grading Timeliness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData?.gradingTimeliness || 2.1} days</div>
            <Progress value={80} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Average time to grade assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Student Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData?.studentPerformance || 83}%</div>
            <Progress value={performanceData?.studentPerformance || 83} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Average student grades in teacher's classes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>Monthly attendance rate</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <LineChart
              data={attendanceData}
              xAxisKey="month"
              lines={[
                { dataKey: "rate", name: "Attendance Rate (%)", color: "#3b82f6" }
              ]}
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grading Timeliness</CardTitle>
            <CardDescription>Days to grade by assessment</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <BarChart
              data={gradingTimelinessData}
              xAxisKey="assessment"
              bars={[
                { dataKey: "days", name: "Days to Grade", color: "#10b981" }
              ]}
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Performance by Class</CardTitle>
          <CardDescription>Average student grades in each class</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <BarChart
            data={studentPerformanceData}
            xAxisKey="class"
            bars={[
              { dataKey: "avgGrade", name: "Average Grade (%)", color: "#6366f1" }
            ]}
            height={300}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-2 w-full mb-1" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-1" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent className="h-[300px]">
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-[250px] w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-60 mb-1" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="h-[300px]">
          <div className="flex items-center justify-center h-full">
            <Skeleton className="h-[250px] w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
