"use client";

import { Card } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/atoms/skeleton";

interface TeacherMetricsProps {
  teacherId: string;
}

interface TeacherMetricsData {
  classCount: number;
  studentCount: number;
  attendanceRate: number;
}

export default function TeacherMetrics({ teacherId }: TeacherMetricsProps) {
  const { data: metrics, isLoading } = api.analytics.getTeacherStats.useQuery({ teacherId });

  if (isLoading) {
    return <MetricsSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Classes</h3>
        <p className="text-2xl font-bold">{metrics?.classCount || 0}</p>
        <p className="text-xs text-gray-500 mt-1">Current term</p>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Students</h3>
        <p className="text-2xl font-bold">{metrics?.studentCount || 0}</p>
        <p className="text-xs text-gray-500 mt-1">Total enrolled</p>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500">Attendance Rate</h3>
        <p className="text-2xl font-bold">{metrics?.attendanceRate?.toFixed(1) || 0}%</p>
        <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
      </Card>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-20" />
        </Card>
      ))}
    </div>
  );
} 