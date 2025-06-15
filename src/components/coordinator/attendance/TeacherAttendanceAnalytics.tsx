'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Users,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

// Import chart components
import { BarChart as BarChartComponent } from "@/components/ui/charts/BarChart";
import { PieChart as PieChartComponent } from "@/components/ui/charts/PieChart";
import { LineChart } from "@/components/ui/charts/LineChart";

interface TeacherAttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  checkInTime?: string;
  checkOutTime?: string;
  duration?: number;
  reason?: string;
}

interface TeacherAttendanceStats {
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  totalDays: number;
  attendanceRate: number;
  punctualityRate: number;
  averageCheckInTime: string;
  averageCheckOutTime: string;
  averageDuration: number;
  trend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
}

interface TeacherAttendanceAnalyticsProps {
  teacherId: string;
  campusId?: string;
  programId?: string;
  isLoading?: boolean;
  attendanceRecords?: TeacherAttendanceRecord[];
  attendanceStats?: TeacherAttendanceStats;
  onDateRangeChange?: (range: { from: Date; to: Date }) => void;
  onExport?: () => void;
}

export function TeacherAttendanceAnalytics({
  teacherId,
  campusId,
  programId,
  isLoading = false,
  attendanceRecords = [],
  attendanceStats,
  onDateRangeChange,
  onExport
}: TeacherAttendanceAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'term' | 'year'>('30days');
  const { toast } = useToast();

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    setDateRange(value as any);

    const today = new Date();
    let fromDate = new Date();

    switch(value) {
      case '7days':
        fromDate.setDate(today.getDate() - 7);
        break;
      case '30days':
        fromDate.setDate(today.getDate() - 30);
        break;
      case '90days':
        fromDate.setDate(today.getDate() - 90);
        break;
      case 'term':
        // Assuming a term is roughly 4 months
        fromDate.setMonth(today.getMonth() - 4);
        break;
      case 'year':
        fromDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    if (onDateRangeChange) {
      onDateRangeChange({ from: fromDate, to: today });
    }
  };

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      toast({
        title: "Export initiated",
        description: "Your attendance data export is being prepared.",
      });
    }
  };

  // Prepare chart data
  const getStatusDistributionData = () => {
    if (!attendanceStats) return [];

    return [
      { name: 'Present', value: attendanceStats.presentCount, color: '#22c55e' },
      { name: 'Late', value: attendanceStats.lateCount, color: '#eab308' },
      { name: 'Absent', value: attendanceStats.absentCount, color: '#ef4444' },
      { name: 'Excused', value: attendanceStats.excusedCount, color: '#94a3b8' }
    ];
  };

  const getWeekdayDistributionData = () => {
    // Calculate attendance by weekday
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
    const weekdayPresent = [0, 0, 0, 0, 0, 0, 0];

    attendanceRecords.forEach(record => {
      const date = new Date(record.date);
      const weekday = date.getDay();
      weekdayCounts[weekday]++;

      if (record.status === 'PRESENT') {
        weekdayPresent[weekday]++;
      }
    });

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return weekdays.map((day, index) => ({
      name: day,
      total: weekdayCounts[index],
      present: weekdayPresent[index],
      rate: weekdayCounts[index] > 0
        ? (weekdayPresent[index] / weekdayCounts[index]) * 100
        : 0
    }));
  };

  const getMonthlyTrendData = () => {
    // Group records by month and calculate attendance rate
    const monthlyData: Record<string, { total: number; present: number }> = {};

    attendanceRecords.forEach(record => {
      const date = new Date(record.date);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { total: 0, present: 0 };
      }

      monthlyData[monthYear].total++;
      if (record.status === 'PRESENT') {
        monthlyData[monthYear].present++;
      }
    });

    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .map(([monthYear, data]) => {
        const [year, month] = monthYear.split('-').map(Number);
        return {
          name: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          value: data.total > 0 ? (data.present / data.total) * 100 : 0
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.name);
        const dateB = new Date(b.name);
        return dateA.getTime() - dateB.getTime();
      });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Teacher Attendance Analytics</h2>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="term">Current Term</SelectItem>
              <SelectItem value="year">Last 12 months</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{attendanceStats?.attendanceRate.toFixed(1)}%</p>
              </div>
              <div className={`flex items-center ${
                attendanceStats?.trend === 'improving' ? 'text-green-500' :
                attendanceStats?.trend === 'declining' ? 'text-red-500' :
                'text-gray-500'
              }`}>
                {attendanceStats?.trend === 'improving' ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : attendanceStats?.trend === 'declining' ? (
                  <ArrowDownRight className="h-4 w-4" />
                ) : null}
                <span className="text-xs ml-1">
                  {attendanceStats?.trendPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <Progress
              value={attendanceStats?.attendanceRate}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Punctuality Rate</p>
                <p className="text-2xl font-bold">{attendanceStats?.punctualityRate.toFixed(1)}%</p>
              </div>
            </div>
            <Progress
              value={attendanceStats?.punctualityRate}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Check-in Time</p>
              <p className="text-2xl font-bold">{attendanceStats?.averageCheckInTime}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Duration</p>
              <p className="text-2xl font-bold">
                {Math.floor(attendanceStats?.averageDuration || 0)}h {Math.round(((attendanceStats?.averageDuration || 0) % 1) * 60)}m
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different analytics views */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Distribution</CardTitle>
                <CardDescription>Breakdown of attendance status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <PieChartComponent data={getStatusDistributionData()} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
                <CardDescription>Attendance rate over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <LineChart
                  data={getMonthlyTrendData()}
                  xAxisKey="name"
                  lines={[
                    { dataKey: "value", name: "Attendance Rate", color: "#22c55e" }
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
